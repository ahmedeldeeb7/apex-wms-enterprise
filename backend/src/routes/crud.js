import express from 'express';
import { poolPromise, mssql } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logOperation } from '../middleware/logging.js';

const router = express.Router();

// Helper to broadcast Socket.IO events
const getIO = (req) => req.app.get('io');

// ==========================================
// 1. PRODUCTS CRUD
// ==========================================

// GET all products
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Products ORDER BY ProductName');
    res.json({ success: true, products: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST register product
router.post('/products', authenticateToken, authorizeRoles('Admin', 'Inbound'), async (req, res) => {
  const { productName, category, weight, dimensions, sku } = req.body;
  if (!productName) {
    return res.status(400).json({ success: false, message: 'Product Name is required' });
  }

  try {
    const pool = await poolPromise;
    let finalSKU = sku;
    if (!sku) {
      const cat = (category || 'GEN').substring(0, 3).toUpperCase();
      const name = productName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
      finalSKU = `${cat}-${name}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const check = await pool.request()
      .input('SKU', mssql.VarChar(50), finalSKU)
      .query('SELECT ProductID FROM Products WHERE SKU = @SKU');

    if (check.recordset.length > 0) {
      return res.status(400).json({ success: false, message: `SKU '${finalSKU}' is already registered` });
    }

    await pool.request()
      .input('SKU', mssql.VarChar(50), finalSKU)
      .input('ProductName', mssql.VarChar(255), productName)
      .input('Category', mssql.VarChar(100), category || 'General')
      .input('Weight', mssql.Decimal(10, 2), weight || 0.0)
      .input('Dimensions', mssql.VarChar(100), dimensions || '')
      .query(`
        INSERT INTO Products (SKU, ProductName, Category, Weight, Dimensions, CreatedAt)
        VALUES (@SKU, @ProductName, @Category, @Weight, @Dimensions, GETDATE())
      `);

    await logOperation(req.user.Username, 'Create Product', productName, 'Products');

    // Broadcast Socket update
    const io = getIO(req);
    if (io) {
      io.emit('product:new', { SKU: finalSKU, ProductName: productName });
    }

    res.status(201).json({ success: true, message: 'Product created successfully', sku: finalSKU });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE product safely
router.delete('/products/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  try {
    const pool = await poolPromise;

    // Integrity check 1: Active order items
    const ordersCheck = await pool.request()
      .input('ProductID', mssql.Int, productId)
      .query('SELECT TOP 1 OrderItemID FROM OrderItems WHERE ProductID = @ProductID');

    if (ordersCheck.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete product with active customer orders' });
    }

    // Integrity check 2: Existing stock units
    const unitsCheck = await pool.request()
      .input('ProductID', mssql.Int, productId)
      .query('SELECT TOP 1 UID FROM ProductUnits WHERE ProductID = @ProductID');

    if (unitsCheck.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete product containing physical units in warehouse' });
    }

    await pool.request()
      .input('ProductID', mssql.Int, productId)
      .query('DELETE FROM Products WHERE ProductID = @ProductID');

    await logOperation(req.user.Username, 'Delete Product', `Product ID ${productId}`, 'Products');

    res.json({ success: true, message: 'Product deleted safely from registry' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. CUSTOMERS CRUD
// ==========================================

// GET all customers
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Customers ORDER BY FullName');
    res.json({ success: true, customers: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST register customer
router.post('/customers', authenticateToken, async (req, res) => {
  const { fullName, phone, address, city } = req.body;
  if (!fullName) {
    return res.status(400).json({ success: false, message: 'Customer name is required' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('FullName', mssql.VarChar(255), fullName)
      .input('Phone', mssql.VarChar(50), phone || '')
      .input('Address', mssql.VarChar(255), address || '')
      .input('City', mssql.VarChar(100), city || '')
      .query(`
        INSERT INTO Customers (FullName, Phone, Address, City)
        VALUES (@FullName, @Phone, @Address, @City)
      `);

    await logOperation(req.user.Username, 'Create Customer', fullName, 'Customers');
    res.status(201).json({ success: true, message: 'Customer registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. SHIPMENTS CRUD
// ==========================================

// GET shipments (handled in inbound router but listed here for CRUD consistency)
router.get('/shipments', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM InboundShipments ORDER BY ArrivalDate DESC');
    res.json({ success: true, shipments: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create shipment
router.post('/shipments', authenticateToken, authorizeRoles('Admin', 'Inbound'), async (req, res) => {
  const { supplierId, arrivalDate, status } = req.body;
  if (!supplierId) {
    return res.status(400).json({ success: false, message: 'SupplierID is required' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('SupplierID', mssql.Int, supplierId)
      .input('ArrivalDate', mssql.DateTime, arrivalDate ? new Date(arrivalDate) : new Date())
      .input('Status', mssql.VarChar(50), status || 'Pending')
      .query(`
        INSERT INTO InboundShipments (SupplierID, ArrivalDate, Status)
        VALUES (@SupplierID, @ArrivalDate, @Status);
        SELECT SCOPE_IDENTITY() as id;
      `);

    const newId = result.recordset[0].id;
    await logOperation(req.user.Username, 'Create Shipment', `Shipment ID ${newId}`, 'InboundShipments');

    const io = getIO(req);
    if (io) {
      io.emit('shipment:new', { ShipmentID: newId, SupplierID: supplierId, Status: status });
    }

    res.status(201).json({ success: true, message: 'Shipment created successfully', shipmentId: newId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update shipment status
router.put('/shipments/:id', authenticateToken, authorizeRoles('Admin', 'Inbound'), async (req, res) => {
  const { status } = req.body;
  const shipmentId = parseInt(req.params.id, 10);

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Status', mssql.VarChar(50), status)
      .input('ShipmentID', mssql.Int, shipmentId)
      .query('UPDATE InboundShipments SET Status = @Status WHERE ShipmentID = @ShipmentID');

    await logOperation(req.user.Username, 'Update Shipment Status', `Shipment ID ${shipmentId} -> ${status}`, 'InboundShipments');

    res.json({ success: true, message: 'Shipment status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. ORDERS CRUD
// ==========================================

// POST Create customer orders transactionally
router.post('/orders', authenticateToken, async (req, res) => {
  const { customerId, items } = req.body; // items: [{ productId, quantity }]
  if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Customer ID and items array are required' });
  }

  const pool = await poolPromise;
  const transaction = new mssql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Insert order record
    const orderRes = await transaction.request()
      .input('CustomerID', mssql.Int, customerId)
      .query(`
        INSERT INTO Orders (CustomerID, OrderDate, Status)
        VALUES (@CustomerID, GETDATE(), 'Pending');
        SELECT SCOPE_IDENTITY() as OrderID;
      `);
    const orderId = orderRes.recordset[0].OrderID;

    // 2. Insert order items
    for (const item of items) {
      await transaction.request()
        .input('OrderID', mssql.Int, orderId)
        .input('ProductID', mssql.Int, item.productId)
        .input('Quantity', mssql.Int, item.quantity)
        .query(`
          INSERT INTO OrderItems (OrderID, ProductID, Quantity)
          VALUES (@OrderID, @ProductID, @Quantity)
        `);
    }

    await transaction.commit();
    await logOperation(req.user.Username, 'Create Order', `Order ID ${orderId}`, 'Orders');

    const io = getIO(req);
    if (io) {
      io.emit('order:new', { OrderID: orderId, CustomerID: customerId });
    }

    res.status(201).json({ success: true, message: 'Order created successfully', orderId });
  } catch (err) {
    if (transaction.isOpen) {
      await transaction.rollback();
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update order status
router.put('/orders/:id', authenticateToken, authorizeRoles('Admin', 'Outbound'), async (req, res) => {
  const { status } = req.body;
  const orderId = parseInt(req.params.id, 10);

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Status', mssql.VarChar(50), status)
      .input('OrderID', mssql.Int, orderId)
      .query('UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID');

    await logOperation(req.user.Username, 'Update Order Status', `Order ID ${orderId} -> ${status}`, 'Orders');

    const io = getIO(req);
    if (io) {
      io.emit('order:update', { OrderID: orderId, Status: status });
    }

    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. WAREHOUSES & LOCATIONS CRUD
// ==========================================

// POST create new warehouse location
router.post('/locations', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  const { warehouseId, zone, aisle, rack, shelf, bin, capacity } = req.body;
  if (!warehouseId || !zone || !aisle || !rack || !shelf || !bin || !capacity) {
    return res.status(400).json({ success: false, message: 'All structural shelf parameters are required' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('WarehouseID', mssql.Int, warehouseId)
      .input('Zone', mssql.VarChar(10), zone)
      .input('Aisle', mssql.VarChar(10), aisle)
      .input('Rack', mssql.VarChar(10), rack)
      .input('Shelf', mssql.VarChar(10), shelf)
      .input('Bin', mssql.VarChar(10), bin)
      .input('Capacity', mssql.Int, capacity)
      .query(`
        INSERT INTO WarehouseLocations (WarehouseID, Zone, Aisle, Rack, Shelf, Bin, Capacity, CurrentLoad)
        VALUES (@WarehouseID, @Zone, @Aisle, @Rack, @Shelf, @Bin, @Capacity, 0)
      `);

    const label = `${zone}-${aisle}-${rack}-${shelf}-${bin}`;
    await logOperation(req.user.Username, 'Create Slot', label, 'WarehouseLocations');

    const io = getIO(req);
    if (io) {
      io.emit('location:new', { label });
    }

    res.status(201).json({ success: true, message: `Warehouse slot ${label} created successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE warehouse location safely
router.delete('/locations/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  const locationId = parseInt(req.params.id, 10);
  try {
    const pool = await poolPromise;

    // Check load integrity
    const loadCheck = await pool.request()
      .input('LocationID', mssql.Int, locationId)
      .query('SELECT CurrentLoad FROM WarehouseLocations WHERE LocationID = @LocationID');

    if (loadCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (loadCheck.recordset[0].CurrentLoad > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete location containing active physical inventory units' });
    }

    await pool.request()
      .input('LocationID', mssql.Int, locationId)
      .query('DELETE FROM WarehouseLocations WHERE LocationID = @LocationID');

    await logOperation(req.user.Username, 'Delete Location', `Location ID ${locationId}`, 'WarehouseLocations');

    res.json({ success: true, message: 'Warehouse location deleted safely' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. OPERATORS/USERS CRUD
// ==========================================

// POST register employee user
router.post('/users', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  const { username, password, roleId, departmentId } = req.body;
  if (!username || !password || !roleId || !departmentId) {
    return res.status(400).json({ success: false, message: 'Username, password, role, and department are required' });
  }

  try {
    const pool = await poolPromise;
    // Note: In real life, bcrypt hash, but here we can write directly or reuse our hashing auth
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex'); // High integrity sha256 default

    await pool.request()
      .input('Username', mssql.VarChar(50), username)
      .input('PasswordHash', mssql.VarChar(255), hash)
      .input('RoleID', mssql.Int, roleId)
      .input('DepartmentID', mssql.Int, departmentId)
      .query(`
        INSERT INTO Users (Username, PasswordHash, RoleID, DepartmentID, IsActive, CreatedAt)
        VALUES (@Username, @PasswordHash, @RoleID, @DepartmentID, 1, GETDATE())
      `);

    await logOperation(req.user.Username, 'Add Employee', username, 'Users');

    res.status(201).json({ success: true, message: 'Employee user registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
export { router as crudRouter };
