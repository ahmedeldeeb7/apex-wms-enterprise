import express from 'express';
import { poolPromise } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/reports/top-products
// @desc    Get top selling products from vw_TopProducts or raw aggregate fallback
router.get('/top-products', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Attempt to pull from vw_TopProducts view first
    let result;
    try {
      result = await pool.request().query('SELECT TOP 15 * FROM vw_TopProducts ORDER BY OrdersCount DESC');
    } catch (e) {
      console.warn('vw_TopProducts view failed, falling back to raw query aggregation...');
      result = await pool.request().query(`
        SELECT TOP 15 p.ProductName, COUNT(DISTINCT oi.OrderID) as OrdersCount, SUM(oi.Quantity) as TotalQtySold
        FROM OrderItems oi
        INNER JOIN Products p ON oi.ProductID = p.ProductID
        GROUP BY p.ProductName
        ORDER BY TotalQtySold DESC
      `);
    }
    
    return res.json({ success: true, topProducts: result.recordset });
  } catch (err) {
    console.error('Error fetching top products report:', err.message);
    return res.status(500).json({ success: false, message: 'Server error compiling top products analytical report' });
  }
});

// @route   GET api/reports/top-customers
// @desc    Get high-volume customers with total items and orders
router.get('/top-customers', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 15 
        c.FullName, 
        c.City,
        COUNT(DISTINCT o.OrderID) as TotalOrders,
        SUM(oi.Quantity) as TotalItemsPurchased
      FROM Orders o
      INNER JOIN Customers c ON o.CustomerID = c.CustomerID
      INNER JOIN OrderItems oi ON o.OrderID = oi.OrderID
      GROUP BY c.CustomerID, c.FullName, c.City
      ORDER BY TotalOrders DESC
    `);
    
    return res.json({ success: true, topCustomers: result.recordset });
  } catch (err) {
    console.error('Error fetching top customers report:', err.message);
    return res.status(500).json({ success: false, message: 'Server error compiling customer volume report' });
  }
});

// @route   GET api/reports/warehouse-performance
// @desc    Get warehouse loads and fill rates metrics
router.get('/warehouse-performance', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        w.WarehouseName,
        COUNT(wl.LocationID) as TotalLocations,
        SUM(wl.Capacity) as TotalCapacity,
        SUM(wl.CurrentLoad) as TotalLoad,
        CAST(SUM(wl.CurrentLoad) * 100.0 / NULLIF(SUM(wl.Capacity), 0) AS DECIMAL(5,2)) as FillRate,
        (
          SELECT COUNT(*) 
          FROM WarehouseLocations 
          WHERE WarehouseID = w.WarehouseID AND CurrentLoad >= Capacity
        ) as FullLocationsCount
      FROM Warehouses w
      LEFT JOIN WarehouseLocations wl ON w.WarehouseID = wl.WarehouseID
      GROUP BY w.WarehouseID, w.WarehouseName
    `);
    
    return res.json({ success: true, performance: result.recordset });
  } catch (err) {
    console.error('Error fetching warehouse performance:', err.message);
    return res.status(500).json({ success: false, message: 'Server error compiling warehouse capacity metrics' });
  }
});

// @route   GET api/reports/employee-activity
// @desc    Get user employee operations summaries
router.get('/employee-activity', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        Username,
        COUNT(*) as TotalActions,
        SUM(CASE WHEN Operation LIKE 'Receive%' THEN 1 ELSE 0 END) as ItemsReceived,
        SUM(CASE WHEN Operation LIKE 'Transfer%' THEN 1 ELSE 0 END) as ItemsTransferred,
        SUM(CASE WHEN Operation LIKE 'Start Picking%' OR Operation LIKE 'Complete Picking%' THEN 1 ELSE 0 END) as PicksProcessed,
        SUM(CASE WHEN Operation LIKE 'Pack%' THEN 1 ELSE 0 END) as PacksProcessed,
        MAX(OperationDate) as LastActiveTime
      FROM AuditLogs
      GROUP BY Username
      ORDER BY TotalActions DESC
    `);
    
    return res.json({ success: true, activity: result.recordset });
  } catch (err) {
    console.error('Error fetching employee activity:', err.message);
    return res.status(500).json({ success: false, message: 'Server error compiling employee audit reports' });
  }
});

export default router;
