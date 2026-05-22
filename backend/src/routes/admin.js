import express from 'express';
import { poolPromise, mssql } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logOperation } from '../middleware/logging.js';

const router = express.Router();

// @route   GET api/admin/stats
// @desc    Get global dashboard stats (Admin/Dashboard)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;

    // 1. Core KPIs
    const kpisResult = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Orders) as TotalOrders,
        (SELECT COUNT(*) FROM Products) as TotalProducts,
        (SELECT COUNT(*) FROM ProductUnits) as TotalUnits,
        (SELECT COUNT(*) FROM ProductUnits WHERE Status = 'Stored') as StoredUnits,
        (SELECT COUNT(*) FROM WarehouseLocations) as TotalLocations
    `);

    // 2. Capacity by Zone
    const capacityResult = await pool.request().query(`
      SELECT 
        Zone, 
        SUM(Capacity) as TotalCapacity, 
        SUM(CurrentLoad) as TotalLoad,
        CAST(SUM(CurrentLoad) * 100.0 / NULLIF(SUM(Capacity), 0) AS DECIMAL(5,2)) as FillRate
      FROM WarehouseLocations
      GROUP BY Zone
      ORDER BY Zone
    `);

    // 3. Orders status distribution
    const ordersStatusResult = await pool.request().query(`
      SELECT Status, COUNT(*) as Count
      FROM Orders
      GROUP BY Status
    `);

    // 4. Warehouse load summaries
    const warehouseResult = await pool.request().query(`
      SELECT 
        w.WarehouseName, 
        COUNT(wl.LocationID) as LocationsCount,
        SUM(wl.Capacity) as TotalCapacity,
        SUM(wl.CurrentLoad) as TotalLoad
      FROM Warehouses w
      LEFT JOIN WarehouseLocations wl ON w.WarehouseID = wl.WarehouseID
      GROUP BY w.WarehouseID, w.WarehouseName
    `);

    // 5. Recent operations
    const recentOpsResult = await pool.request().query(`
      SELECT TOP 10 
        al.AuditID, 
        al.Username, 
        al.Operation, 
        al.ObjectName, 
        al.ObjectType, 
        al.OperationDate,
        d.DepartmentName as Department
      FROM AuditLogs al
      LEFT JOIN Users u ON al.Username = u.Username
      LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
      ORDER BY al.OperationDate DESC
    `);

    // 6. Recent logins
    const recentLoginsResult = await pool.request().query(`
      SELECT TOP 10 LoginID, Username, LoginTime
      FROM LoginAudit
      ORDER BY LoginTime DESC
    `);

    // 7. Dynamic Monthly Order Count (last 6 months)
    const monthlyOrdersResult = await pool.request().query(`
      SELECT 
        FORMAT(OrderDate, 'yyyy-MM') as MonthName, 
        COUNT(*) as OrdersCount
      FROM Orders
      WHERE OrderDate >= DATEADD(month, -6, GETDATE())
      GROUP BY FORMAT(OrderDate, 'yyyy-MM')
      ORDER BY MonthName
    `);

    return res.json({
      success: true,
      kpis: kpisResult.recordset[0],
      capacityByZone: capacityResult.recordset,
      ordersStatus: ordersStatusResult.recordset,
      warehouses: warehouseResult.recordset,
      recentOperations: recentOpsResult.recordset,
      recentLogins: recentLoginsResult.recordset,
      monthlyOrders: monthlyOrdersResult.recordset
    });

  } catch (err) {
    console.error('Error fetching admin stats:', err.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving system diagnostics' });
  }
});

// @route   GET api/admin/audit-logs
// @desc    Get paginated audit logs (Admin only)
router.get('/audit-logs', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;
    const countResult = await pool.request().query('SELECT COUNT(*) as Total FROM AuditLogs');
    const total = countResult.recordset[0].Total;

    const logsResult = await pool.request()
      .input('Offset', page === 1 ? 0 : offset)
      .input('Limit', limit)
      .query(`
        SELECT 
          al.AuditID, 
          al.Username, 
          al.Operation, 
          al.ObjectName, 
          al.ObjectType, 
          al.OperationDate,
          d.DepartmentName as Department
        FROM AuditLogs al
        LEFT JOIN Users u ON al.Username = u.Username
        LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
        ORDER BY al.OperationDate DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
      `);

    return res.json({
      success: true,
      data: logsResult.recordset,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving audit logs' });
  }
});

// @route   GET api/admin/users
// @desc    Get all employees with their roles and departments (Admin only)
router.get('/users', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT u.UserID, u.Username, u.IsActive, u.CreatedAt, 
             r.RoleName as Role, d.DepartmentName as Department
      FROM Users u
      LEFT JOIN Roles r ON u.RoleID = r.RoleID
      LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
      ORDER BY u.Username
    `);
    return res.json({ success: true, users: result.recordset });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT api/admin/users/:id/toggle
// @desc    Toggle the IsActive status of an employee account (Admin only)
router.put('/users/:id/toggle', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const pool = await poolPromise;
    
    // 1. Fetch current status
    const userRes = await pool.request()
      .input('UserID', mssql.Int, userId)
      .query('SELECT Username, IsActive FROM Users WHERE UserID = @UserID');
      
    if (userRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }
    
    const user = userRes.recordset[0];
    const newStatus = user.IsActive ? 0 : 1;
    
    // 2. Toggle active bit in DB
    await pool.request()
      .input('UserID', mssql.Int, userId)
      .input('IsActive', mssql.Bit, newStatus)
      .query('UPDATE Users SET IsActive = @IsActive WHERE UserID = @UserID');
      
    // 3. Log Audit
    const op = newStatus ? 'Unlock Operator' : 'Lock Operator';
    await logOperation(req.user.Username, op, user.Username, 'Users');
    
    // 4. Socket Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('user:toggle', { username: user.Username, active: newStatus });
    }
    
    return res.json({ success: true, message: `User account ${user.Username} updated successfully` });
  } catch (err) {
    console.error('Error toggling user active state:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
