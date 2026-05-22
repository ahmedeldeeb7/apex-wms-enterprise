import express from 'express';
import outboundService from '../services/OutboundService.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import dbInstance from '../config/db.js';

const router = express.Router();

// @route   GET api/network/batches
router.get('/batches', authenticateToken, authorizeRoles('Admin', 'Network'), async (req, res, next) => {
  try {
    const data = await outboundService.getShippingBatches();
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// @route   GET api/network/stats
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const deliveredCount = await dbInstance.query("SELECT COUNT(*) as Count FROM Orders WHERE Status = 'Delivered'");
    const shippedCount = await dbInstance.query("SELECT COUNT(*) as Count FROM Orders WHERE Status = 'Shipped'");
    const totalCount = await dbInstance.query("SELECT COUNT(*) as Count FROM Orders");

    const cityDist = await dbInstance.query(`
      SELECT TOP 5 c.City, COUNT(o.OrderID) as Count
      FROM Orders o
      INNER JOIN Customers c ON o.CustomerID = c.CustomerID
      GROUP BY c.City
      ORDER BY Count DESC
    `);

    return res.json({
      success: true,
      delivered: deliveredCount.recordset[0].Count,
      shipped: shippedCount.recordset[0].Count,
      total: totalCount.recordset[0].Count,
      cityDistribution: cityDist.recordset
    });
  } catch (err) {
    next(err);
  }
});

export default router;
