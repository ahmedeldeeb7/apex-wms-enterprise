import express from 'express';
import outboundController from '../controllers/OutboundController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/outbound/orders
router.get('/orders', authenticateToken, outboundController.getOrders);

// @route   GET api/outbound/orders/:orderId
router.get('/orders/:orderId', authenticateToken, outboundController.getOrderDetails);

// @route   POST api/outbound/orders/:orderId/start-picking
router.post(
  '/orders/:orderId/start-picking',
  authenticateToken,
  authorizeRoles('Admin', 'Outbound'),
  outboundController.startPicking
);

// @route   POST api/outbound/orders/:orderId/complete-picking
router.post(
  '/orders/:orderId/complete-picking',
  authenticateToken,
  authorizeRoles('Admin', 'Outbound'),
  outboundController.completePicking
);

// @route   POST api/outbound/orders/:orderId/validate-scan
router.post(
  '/orders/:orderId/validate-scan',
  authenticateToken,
  authorizeRoles('Admin', 'Outbound'),
  outboundController.validateScan
);

// @route   POST api/outbound/orders/:orderId/pack
router.post(
  '/orders/:orderId/pack',
  authenticateToken,
  authorizeRoles('Admin', 'Outbound'),
  outboundController.packOrder
);

// @route   POST api/outbound/orders/:orderId/ship
router.post(
  '/orders/:orderId/ship',
  authenticateToken,
  authorizeRoles('Admin', 'Outbound'),
  outboundController.shipOrder
);

export default router;
