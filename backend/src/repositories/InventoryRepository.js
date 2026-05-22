import BaseRepository from './BaseRepository.js';
import userRepository from './UserRepository.js';

class InventoryRepository extends BaseRepository {
  constructor() {
    super('ProductUnits');
  }

  async getLocations() {
    const res = await this.db.query('SELECT * FROM WarehouseLocations');
    return res.recordset;
  }

  async getLocationsHeatmap() {
    const query = `
      SELECT Zone, SUM(Capacity) as TotalCapacity, SUM(CurrentLoad) as TotalLoad
      FROM WarehouseLocations
      GROUP BY Zone
    `;
    const res = await this.db.query(query);
    return res.recordset;
  }

  async getUnitsPaginated({ page = 1, limit = 10, search = '', category = '', status = '', zone = '' }) {
    const offset = (page - 1) * limit;
    let whereClauses = [];
    const params = { limit, offset };

    if (search) {
      whereClauses.push('(pu.UID LIKE @search OR pu.SerialNumber LIKE @search OR p.ProductName LIKE @search OR p.SKU LIKE @search)');
      params.search = `%${search}%`;
    }
    if (category) {
      whereClauses.push('p.Category = @category');
      params.category = category;
    }
    if (status) {
      whereClauses.push('pu.Status = @status');
      params.status = status;
    }
    if (zone) {
      whereClauses.push('wl.Zone = @zone');
      params.zone = zone;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ProductUnits pu
      INNER JOIN Products p ON pu.ProductID = p.ProductID
      LEFT JOIN WarehouseLocations wl ON pu.LocationID = wl.LocationID
      ${whereString}
    `;

    const dataQuery = `
      SELECT pu.UID, pu.SerialNumber, pu.Status, pu.ReceivedDate, pu.LocationID,
             p.ProductName, p.SKU, p.Category, p.Weight, p.Dimensions,
             wl.Zone, wl.Aisle, wl.Rack, wl.Shelf, wl.Bin
      FROM ProductUnits pu
      INNER JOIN Products p ON pu.ProductID = p.ProductID
      LEFT JOIN WarehouseLocations wl ON pu.LocationID = wl.LocationID
      ${whereString}
      ORDER BY pu.ReceivedDate DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const countRes = await this.db.query(countQuery, params);
    const dataRes = await this.db.query(dataQuery, params);

    return {
      units: dataRes.recordset,
      total: countRes.recordset[0].total
    };
  }

  async getTimelineHistory(uid) {
    const query = `
      SELECT im.*, 
             fl.Zone as FromZone, fl.Aisle as FromAisle, fl.Rack as FromRack, fl.Shelf as FromShelf, fl.Bin as FromBin,
             tl.Zone as ToZone, tl.Aisle as ToAisle, tl.Rack as ToRack, tl.Shelf as ToShelf, tl.Bin as ToBin
      FROM InventoryMovements im
      LEFT JOIN WarehouseLocations fl ON im.FromLocation = fl.LocationID
      LEFT JOIN WarehouseLocations tl ON im.ToLocation = tl.LocationID
      WHERE im.UID = @uid
      ORDER BY im.MovementDate DESC
    `;
    const res = await this.db.query(query, { uid });
    return res.recordset;
  }

  // TRANSACTION: Transfer location of single stock unit safely
  async transferItem(uid, newLocationId, operatorUsername) {
    return await this.db.executeTransaction(async (request) => {
      // 1. Fetch current unit state
      request.input('UID', uid);
      const unitRes = await request.query('SELECT LocationID, Status FROM ProductUnits WHERE UID = @UID');
      const unit = unitRes.recordset[0];
      if (!unit) {
        throw new Error(`Inventory stock unit UID ${uid} not found in repository`);
      }

      const oldLocationId = unit.LocationID;
      if (oldLocationId === newLocationId) {
        throw new Error(`Item UID ${uid} is already allocated in target location slot`);
      }

      // 2. Fetch destination location capacity constraints
      request.input('NewLocationID', newLocationId);
      const locRes = await request.query('SELECT Capacity, CurrentLoad, Zone, Aisle, Rack, Shelf, Bin FROM WarehouseLocations WHERE LocationID = @NewLocationID');
      const dest = locRes.recordset[0];
      if (!dest) {
        throw new Error(`Destination shelf slot LocationID ${newLocationId} does not exist`);
      }
      if (dest.CurrentLoad >= dest.Capacity) {
        throw new Error(`Destination shelf slot reached maximum capacity (${dest.CurrentLoad}/${dest.Capacity})`);
      }

      // 3. Perform Relocate updates on locations capacities
      if (oldLocationId) {
        request.input('OldLocationID', oldLocationId);
        await request.query('UPDATE WarehouseLocations SET CurrentLoad = CurrentLoad - 1 WHERE LocationID = @OldLocationID');
      }
      await request.query('UPDATE WarehouseLocations SET CurrentLoad = CurrentLoad + 1 WHERE LocationID = @NewLocationID');

      // 4. Update Product Unit location pointer
      await request.query('UPDATE ProductUnits SET LocationID = @NewLocationID, Status = \'Stored\' WHERE UID = @UID');

      // 5. Append inventory movement logs
      request.input('FromLocation', oldLocationId || null);
      request.input('ToLocation', newLocationId);
      request.input('MovementType', 'Transfer');
      await request.query(`
        INSERT INTO InventoryMovements (UID, FromLocation, ToLocation, MovementType, MovementDate)
        VALUES (@UID, @FromLocation, @ToLocation, @MovementType, GETDATE())
      `);

      // 6. Log transaction audit
      await userRepository.logAudit(
        operatorUsername,
        'Item Relocate',
        uid.toString(),
        'ProductUnit',
        `Moved stock from Slot #${oldLocationId || 'N/A'} to Slot #${newLocationId} (${dest.Zone}-${dest.Aisle}-${dest.Rack}-${dest.Shelf}-${dest.Bin})`
      );

      return {
        uid,
        fromLocation: oldLocationId,
        toLocation: newLocationId,
        destinationLabel: `${dest.Zone}-${dest.Aisle}-${dest.Rack}-${dest.Shelf}-${dest.Bin}`
      };
    });
  }

  // TRANSACTION: Allocate and receive single stock item safely
  async receiveItem(productId, serialNumber, locationId, operatorUsername) {
    return await this.db.executeTransaction(async (request) => {
      // 1. Double check location capacities
      request.input('LocationID', locationId);
      const locRes = await request.query('SELECT Capacity, CurrentLoad, Zone, Aisle, Rack, Shelf, Bin FROM WarehouseLocations WHERE LocationID = @LocationID');
      const loc = locRes.recordset[0];
      if (!loc) {
        throw new Error(`Target location slot ${locationId} does not exist`);
      }
      if (loc.CurrentLoad >= loc.Capacity) {
        throw new Error(`Target shelf slot has reached capacity limits (${loc.CurrentLoad}/${loc.Capacity})`);
      }

      // 2. Safely generate incrementing UID inside transaction
      const maxUidRes = await request.query('SELECT ISNULL(MAX(UID), 100000000000) + 1 AS NewUID FROM ProductUnits');
      const newUid = maxUidRes.recordset[0].NewUID;

      // 3. Create unique serial number if empty
      const sn = serialNumber || `SN-${newUid}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Create Product Unit row
      request.input('NewUID', newUid);
      request.input('ProductID', productId);
      request.input('SerialNumber', sn);
      request.input('Status', 'Stored');
      await request.query(`
        INSERT INTO ProductUnits (UID, ProductID, SerialNumber, Status, LocationID, ReceivedDate)
        VALUES (@NewUID, @ProductID, @SerialNumber, @Status, @LocationID, GETDATE())
      `);

      // 5. Increment Warehouse Location Current Load
      await request.query('UPDATE WarehouseLocations SET CurrentLoad = CurrentLoad + 1 WHERE LocationID = @LocationID');

      // 6. Record Inventory Movements
      request.input('FromLocation', null);
      request.input('ToLocation', locationId);
      request.input('MovementType', 'Inbound');
      await request.query(`
        INSERT INTO InventoryMovements (UID, FromLocation, ToLocation, MovementType, MovementDate)
        VALUES (@NewUID, @FromLocation, @ToLocation, @MovementType, GETDATE())
      `);

      // 7. Log transaction audit
      await userRepository.logAudit(
        operatorUsername,
        'Receive Item',
        newUid.toString(),
        'ProductUnit',
        `Allocated new item UID ${newUid} to Slot #${locationId} (${loc.Zone}-${loc.Aisle}-${loc.Rack}-${loc.Shelf}-${loc.Bin})`
      );

      return {
        UID: newUid,
        SerialNumber: sn,
        location: `${loc.Zone}-${loc.Aisle}-${loc.Rack}-${loc.Shelf}-${loc.Bin}`
      };
    });
  }
}

export default new InventoryRepository();
export { InventoryRepository };
