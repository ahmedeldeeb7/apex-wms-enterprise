import BaseRepository from './BaseRepository.js';
import userRepository from './UserRepository.js';

class OrderRepository extends BaseRepository {
  constructor() {
    super('Orders');
  }

  async getOrders(status = '') {
    let query = `
      SELECT o.OrderID, o.OrderDate, o.Status, c.FullName, c.City, c.Address,
             (SELECT COUNT(*) FROM OrderItems WHERE OrderID = o.OrderID) as ItemsCount
      FROM Orders o
      INNER JOIN Customers c ON o.CustomerID = c.CustomerID
    `;
    const params = {};
    if (status) {
      query += ' WHERE o.Status = @status';
      params.status = status;
    }
    query += ' ORDER BY o.OrderDate DESC';

    const res = await this.db.query(query, params);
    return res.recordset;
  }

  async getOrderDetails(orderId) {
    const orderQuery = `
      SELECT o.OrderID, o.OrderDate, o.Status, c.FullName, c.Phone, c.Address, c.City
      FROM Orders o
      INNER JOIN Customers c ON o.CustomerID = c.CustomerID
      WHERE o.OrderID = @orderId
    `;
    const itemsQuery = `
      SELECT oi.OrderItemID, oi.ProductID, oi.Quantity, p.ProductName, p.SKU, p.Category,
             (SELECT COUNT(*) FROM ProductUnits WHERE ProductID = oi.ProductID AND Status = 'Stored') as AvailableInStock
      FROM OrderItems oi
      INNER JOIN Products p ON oi.ProductID = p.ProductID
      WHERE oi.OrderID = @orderId
    `;

    const orderRes = await this.db.query(orderQuery, { orderId });
    const itemsRes = await this.db.query(itemsQuery, { orderId });

    return {
      order: orderRes.recordset[0] || null,
      items: itemsRes.recordset
    };
  }

  // TRANSACTION: Auto-allocate UIDs using FIFO (stored earliest first) and generate picker checklist
  async startPicking(orderId, operatorUsername) {
    return await this.db.executeTransaction(async (request) => {
      request.input('OrderID', orderId);
      
      // 1. Double check order state
      const orderRes = await request.query('SELECT Status FROM Orders WHERE OrderID = @OrderID');
      const order = orderRes.recordset[0];
      if (!order) {
        throw new Error(`Order #${orderId} not found in database records`);
      }
      if (order.Status !== 'Pending') {
        throw new Error(`Order #${orderId} has already initialized picking cycle (Current Status: ${order.Status})`);
      }

      // 2. Fetch order items
      const itemsRes = await request.query('SELECT ProductID, Quantity FROM OrderItems WHERE OrderID = @OrderID');
      const items = itemsRes.recordset;
      
      const pickingList = [];

      // 3. FIFO Match available stock unit UIDs
      for (const item of items) {
        request.input(`ProductID_${item.ProductID}`, item.ProductID);
        request.input(`Quantity_${item.ProductID}`, item.Quantity);
        
        const stockQuery = `
          SELECT TOP (@Quantity_${item.ProductID}) pu.UID, pu.SerialNumber, pu.LocationID,
                 wl.Zone, wl.Aisle, wl.Rack, wl.Shelf, wl.Bin
          FROM ProductUnits pu
          INNER JOIN WarehouseLocations wl ON pu.LocationID = wl.LocationID
          WHERE pu.ProductID = @ProductID_${item.ProductID} AND pu.Status = 'Stored'
          ORDER BY pu.ReceivedDate ASC
        `;
        const stockRes = await request.query(stockQuery);
        const stockUnits = stockRes.recordset;

        if (stockUnits.length < item.Quantity) {
          throw new Error(`Insufficient stock for Product ID ${item.ProductID} (Required: ${item.Quantity}, Stored: ${stockUnits.length})`);
        }

        pickingList.push(...stockUnits);
      }

      // 4. Update Order status to 'Picking'
      await request.query('UPDATE Orders SET Status = \'Picking\' WHERE OrderID = @OrderID');

      // 5. Audit Log
      await userRepository.logAudit(
        operatorUsername,
        'Start Picking',
        orderId.toString(),
        'Order',
        `Generated interactive picking checklist with ${pickingList.length} stock items`
      );

      return pickingList;
    });
  }

  // TRANSACTION: Complete Pick task
  async completePicking(orderId, pickedUIDs, operatorUsername) {
    return await this.db.executeTransaction(async (request) => {
      request.input('OrderID', orderId);

      // 1. Verify Status
      const orderRes = await request.query('SELECT Status FROM Orders WHERE OrderID = @OrderID');
      const order = orderRes.recordset[0];
      if (!order || order.Status !== 'Picking') {
        throw new Error(`Order #${orderId} is not in picking cycle`);
      }

      // 2. Unlink units shelf locations, decrement loads, update statuses to 'Picked'
      for (const uid of pickedUIDs) {
        const uidKey = `UID_${uid}`;
        request.input(uidKey, uid);
        
        // Fetch current Location
        const unitRes = await request.query(`SELECT LocationID FROM ProductUnits WHERE UID = @${uidKey}`);
        const unit = unitRes.recordset[0];
        if (unit && unit.LocationID) {
          const locKey = `Loc_${uid}`;
          request.input(locKey, unit.LocationID);
          // Decrement load
          await request.query(`UPDATE WarehouseLocations SET CurrentLoad = CurrentLoad - 1 WHERE LocationID = @${locKey}`);
        }

        // Relocate to Picked/Staged status
        await request.query(`UPDATE ProductUnits SET LocationID = NULL, Status = 'Picked' WHERE UID = @${uidKey}`);

        // Record movement
        if (unit && unit.LocationID) {
          const locKey = `Loc_${uid}`;
          await request.query(`
            INSERT INTO InventoryMovements (UID, FromLocation, ToLocation, MovementType, MovementDate)
            VALUES (@${uidKey}, @${locKey}, NULL, 'Pick', GETDATE())
          `);
        } else {
          await request.query(`
            INSERT INTO InventoryMovements (UID, FromLocation, ToLocation, MovementType, MovementDate)
            VALUES (@${uidKey}, NULL, NULL, 'Pick', GETDATE())
          `);
        }
      }

      // 3. Progress Order Status
      await request.query('UPDATE Orders SET Status = \'Packing\' WHERE OrderID = @OrderID');

      // 4. Audit Log
      await userRepository.logAudit(
        operatorUsername,
        'Complete Picking',
        orderId.toString(),
        'Order',
        `Picked ${pickedUIDs.length} items from slots, unlinked shelf coordinates`
      );

      return true;
    });
  }

  // TRANSACTION: Seal and Pack Order
  async packOrder(orderId, packedUIDs, operatorUsername) {
    return await this.db.executeTransaction(async (request) => {
      request.input('OrderID', orderId);

      // 1. Verify Status
      const orderRes = await request.query('SELECT Status FROM Orders WHERE OrderID = @OrderID');
      const order = orderRes.recordset[0];
      if (!order || order.Status !== 'Packing') {
        throw new Error(`Order #${orderId} is not staged at packing workstation`);
      }

      // 2. Change items status from Picked to Packed
      for (const uid of packedUIDs) {
        const uidKey = `UID_${uid}`;
        request.input(uidKey, uid);
        await request.query(`UPDATE ProductUnits SET Status = 'Packed' WHERE UID = @${uidKey}`);
      }

      // 3. Progress Order Status to Packed
      await request.query('UPDATE Orders SET Status = \'Packed\' WHERE OrderID = @OrderID');

      // 4. Audit Log
      await userRepository.logAudit(
        operatorUsername,
        'Complete Packing',
        orderId.toString(),
        'Order',
        `Staged ${packedUIDs.length} items for courier transit dispatch`
      );

      return true;
    });
  }

  // TRANSACTION: Dispatch Route vehicle
  async shipOrder(orderId, trackingUIDs, operatorUsername) {
    return await this.db.executeTransaction(async (request) => {
      request.input('OrderID', orderId);

      // 1. Verify Status
      const orderRes = await request.query('SELECT Status FROM Orders WHERE OrderID = @OrderID');
      const order = orderRes.recordset[0];
      if (!order || order.Status !== 'Packed') {
        throw new Error(`Order #${orderId} is not staged at route shipping bay`);
      }

      // 2. Change items status to Shipped
      for (const uid of trackingUIDs) {
        const uidKey = `UID_${uid}`;
        request.input(uidKey, uid);
        await request.query(`UPDATE ProductUnits SET Status = 'Shipped' WHERE UID = @${uidKey}`);
      }

      // 3. Progress Order to Shipped
      await request.query('UPDATE Orders SET Status = \'Shipped\' WHERE OrderID = @OrderID');

      // 4. Audit Log
      await userRepository.logAudit(
        operatorUsername,
        'Dispatch Shipment',
        orderId.toString(),
        'Order',
        `Dispatched courier tracking cargo details for ${trackingUIDs.length} items`
      );

      return true;
    });
  }
}

export default new OrderRepository();
export { OrderRepository };
