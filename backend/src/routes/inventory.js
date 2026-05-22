import express from 'express';
import inventoryController from '../controllers/InventoryController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateBody, transferSchema, bulkTransferSchema } from '../middleware/validation.js';

const router = express.Router();

// @route   GET api/inventory/locations
router.get('/locations', authenticateToken, inventoryController.getLocations);

// @route   GET api/inventory/heatmap
router.get('/heatmap', authenticateToken, inventoryController.getHeatmap);

// @route   GET api/inventory/units
router.get('/units', authenticateToken, inventoryController.getUnits);

// @route   POST api/inventory/transfer
router.post(
  '/transfer',
  authenticateToken,
  authorizeRoles('Admin', 'Inventory'),
  validateBody(transferSchema),
  inventoryController.transfer
);

// @route   POST api/inventory/bulk-transfer
router.post(
  '/bulk-transfer',
  authenticateToken,
  authorizeRoles('Admin', 'Inventory'),
  validateBody(bulkTransferSchema),
  inventoryController.bulkTransfer
);

// @route   GET api/inventory/timeline/:uid
router.get('/timeline/:uid', authenticateToken, inventoryController.getTimeline);

export default router;
