import express from 'express';
import { poolPromise, mssql } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logOperation } from '../middleware/logging.js';

const router = express.Router();

// Get active IO reference from global app state
const getIO = (req) => req.app.get('io');

// @route   GET api/inbound/shipments
// @desc    Get active inbound shipments with supplier company names
router.get('/shipments', authenticateToken, authorizeRoles('Admin', 'Inbound'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT s.*, sup.CompanyName, sup.ContactName
      FROM InboundShipments s
      LEFT JOIN Suppliers sup ON s.SupplierID = sup.SupplierID
      ORDER BY s.ArrivalDate DESC
    `);
    return res.json({ success: true, shipments: result.recordset });
  } catch (err) {
    console.error('Error fetching shipments:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching shipments' });
  }
});

// @route   POST api/inbound/shipments
// @desc    Register a new incoming shipment
router.post('/shipments', authenticateToken, authorizeRoles('Admin', 'Inbound'), async (req, res) => {
  const { supplierId, arrivalDate, status } = req.body;

  if (!supplierId) {
    return res.status(400).json({ success: false, message: 'Supplier is required' });
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
        SELECT SCOPE_IDENTITY() as ShipmentID;
      `);

    const newShipmentId = result.recordset[0].ShipmentID;

    // Log the operation
    await logOperation(req.user.Username, 'Create Shipment', `Shipment ID ${newShipmentId}`, 'InboundShipments');

    // Notify other clients in real-time
    const io = getIO(req);
    if (io) {
      io.emit('shipment:new', { ShipmentID: newShipmentId, SupplierID: supplierId, Status: status || 'Pending' });
    }

    return res.status(201).json({ success: true, message: 'Shipment registered successfully', shipmentId: newShipmentId });
  } catch (err) {
    console.error('Error creating shipment:', err.message);
    return res.status(500).json({ success: false, message: 'Server error creating shipment' });
  }
});

// @route   GET api/inbound/suppliers
// @desc    Get suppliers directory
router.get('/suppliers', authenticateToken, authorizeRoles('Admin', 'Inbound'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Suppliers ORDER BY CompanyName');
    return res.json({ success: true, suppliers: result.recordset });
  } catch (err) {
    console.error('Error fetching suppliers:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching suppliers' });
  }
});

// @route   POST api/inbound/suppliers
// @desc    Add a new supplier
router.post('/suppliers', authenticateToken, authorizeRoles('Admin', 'Inbound'), async (req, res) => {
  const { companyName, contactName, phone, address } = req.body;

  if (!companyName) {
    return res.status(400).json({ success: false, message: 'Company Name is required' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('CompanyName', mssql.VarChar(255), companyName)
      .input('ContactName', mssql.VarChar(255), contactName)
      .input('Phone', mssql.VarChar(50), phone)
      .input('Address', mssql.VarChar(255), address)
      .query(`
        INSERT INTO Suppliers (CompanyName, ContactName, Phone, Address)
        VALUES (@CompanyName, @ContactName, @Phone, @Address)
      `);

    await logOperation(req.user.Username, 'Create Supplier', companyName, 'Suppliers');

    return res.status(201).json({ success: true, message: 'Supplier registered successfully' });
  } catch (err) {
    console.error('Error adding supplier:', err.message);
    return res.status(500).json({ success: false, message: 'Server error adding supplier' });
  }
});

// @route   GET api/inbound/products
// @desc    Get list of products
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Products ORDER BY ProductName');
    return res.json({ success: true, products: result.recordset });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
});

// @route   POST api/inbound/products
// @desc    Create/register a new product and generate SKU automatically if not provided
router.post('/products', authenticateToken, authorizeRoles('Admin', 'Inbound'), async (req, res) => {
  const { productName, category, weight, dimensions, sku } = req.body;

  if (!productName) {
    return res.status(400).json({ success: false, message: 'Product Name is required' });
  }

  try {
    const pool = await poolPromise;

    // Generate SKU automatically if not supplied
    let generatedSKU = sku;
    if (!sku) {
      const catPrefix = (category || 'GEN').substring(0, 3).toUpperCase();
      const prodPrefix = productName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
      const rand = Math.floor(1000 + Math.random() * 9000);
      generatedSKU = `${catPrefix}-${prodPrefix}-${rand}`;
    }

    // Verify SKU uniqueness
    const skuCheck = await pool.request()
      .input('SKU', mssql.VarChar(50), generatedSKU)
      .query('SELECT ProductID FROM Products WHERE SKU = @SKU');

    if (skuCheck.recordset.length > 0) {
      return res.status(400).json({ success: false, message: `SKU '${generatedSKU}' already exists.` });
    }

    await pool.request()
      .input('SKU', mssql.VarChar(50), generatedSKU)
      .input('ProductName', mssql.VarChar(255), productName)
      .input('Category', mssql.VarChar(100), category || 'General')
      .input('Weight', mssql.Decimal(10, 2), weight || 0.0)
      .input('Dimensions', mssql.VarChar(100), dimensions || '')
      .query(`
        INSERT INTO Products (SKU, ProductName, Category, Weight, Dimensions, CreatedAt)
        VALUES (@SKU, @ProductName, @Category, @Weight, @Dimensions, GETDATE())
      `);

    await logOperation(req.user.Username, 'Create Product', productName, 'Products');

    return res.status(201).json({ success: true, message: 'Product registered successfully', sku: generatedSKU });
  } catch (err) {
    console.error('Error creating product:', err.message);
    return res.status(500).json({ success: false, message: 'Server error creating product' });
  }
});

// @route   POST api/inbound/receive
// @desc    Receive a product unit, generate unique UID, and place in a location (TRANSACTIONAL)
router.post('/receive', authenticateToken, authorizeRoles('Admin', 'Inbound'), async (req, res) => {
  const { productId, serialNumber, locationId } = req.body;

  if (!productId || !locationId) {
    return res.status(400).json({ success: false, message: 'Product ID and target Location ID are required' });
  }

  // Create an explicit connection for transaction
  const pool = await poolPromise;
  const transaction = new mssql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Check Location Capacity
    const locResult = await transaction.request()
      .input('LocationID', mssql.Int, locationId)
      .query('SELECT Capacity, CurrentLoad, Zone, Aisle, Rack, Shelf, Bin FROM WarehouseLocations WHERE LocationID = @LocationID');

    if (locResult.recordset.length === 0) {
      throw new Error('Target location does not exist');
    }

    const location = locResult.recordset[0];
    if (location.CurrentLoad >= location.Capacity) {
      throw new Error(`Location is full. Capacity: ${location.Capacity}, CurrentLoad: ${location.CurrentLoad}`);
    }

    // 2. Generate incremental UID
    const uidResult = await transaction.request()
      .query('SELECT ISNULL(MAX(UID), 100000000000) + 1 AS NewUID FROM ProductUnits');
    
    const newUID = uidResult.recordset[0].NewUID;

    // 3. Insert Product Unit
    await transaction.request()
      .input('UID', mssql.BigInt, newUID)
      .input('ProductID', mssql.Int, productId)
      .input('SerialNumber', mssql.VarChar(255), serialNumber || `SN-${newUID}`)
      .input('Status', mssql.VarChar(50), 'Stored')
      .input('LocationID', mssql.Int, locationId)
      .query(`
        INSERT INTO ProductUnits (UID, ProductID, SerialNumber, Status, LocationID, ReceivedDate)
        VALUES (@UID, @ProductID, @SerialNumber, @Status, @LocationID, GETDATE())
      `);

    // 4. Update Current Load of location
    await transaction.request()
      .input('LocationID', mssql.Int, locationId)
      .query('UPDATE WarehouseLocations SET CurrentLoad = CurrentLoad + 1 WHERE LocationID = @LocationID');

    // 5. Log Inventory Movement
    await transaction.request()
      .input('UID', mssql.BigInt, newUID)
      .input('ToLocation', mssql.Int, locationId)
      .query(`
        INSERT INTO InventoryMovements (UID, FromLocation, ToLocation, MovementType, MovementDate)
        VALUES (@UID, NULL, @ToLocation, 'Inbound', GETDATE())
      `);

    // Commit Transaction
    await transaction.commit();

    // 6. Log Operation audit
    await logOperation(req.user.Username, 'Receive Item', `UID ${newUID} stored at Location ${locationId}`, 'ProductUnits');

    // 7. Push Live Alerts and Stats in Real-time via Socket.IO
    const io = getIO(req);
    if (io) {
      // Broadcast movement
      io.emit('inventory:movement', {
        UID: newUID,
        FromLocation: null,
        ToLocation: locationId,
        MovementType: 'Inbound',
        locationName: `Zone ${location.Zone} - Aisle ${location.Aisle} - Rack ${location.Rack} - Shelf ${location.Shelf} - Bin ${location.Bin}`
      });

      // Capacity warnings alerts
      if (location.CurrentLoad + 1 >= location.Capacity) {
        io.emit('capacity:warning', {
          LocationID: locationId,
          Zone: location.Zone,
          Aisle: location.Aisle,
          CurrentLoad: location.CurrentLoad + 1,
          Capacity: location.Capacity,
          message: `Location ${location.Zone}-${location.Aisle}-${location.Rack}-${location.Shelf}-${location.Bin} is now FULL!`
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Product unit received and stored successfully',
      UID: newUID,
      location: `${location.Zone}-${location.Aisle}-${location.Rack}-${location.Shelf}-${location.Bin}`
    });

  } catch (err) {
    // Rollback transaction in case of failure
    if (transaction.isOpen) {
      await transaction.rollback();
    }
    console.error('Receiving transaction failed:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Receiving transaction failed' });
  }
});

export default router;
