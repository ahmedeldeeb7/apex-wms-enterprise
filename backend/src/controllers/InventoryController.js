import inventoryRepository from '../repositories/InventoryRepository.js';
import warehouseService from '../services/WarehouseService.js';

class InventoryController {
  async getLocations(req, res, next) {
    try {
      const locations = await inventoryRepository.getLocations();
      return res.json({ success: true, locations });
    } catch (err) {
      next(err);
    }
  }

  async getHeatmap(req, res, next) {
    try {
      const heatmap = await inventoryRepository.getLocationsHeatmap();
      return res.json({ success: true, capacityByZone: heatmap });
    } catch (err) {
      next(err);
    }
  }

  async getUnits(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || '';
      const category = req.query.category || '';
      const status = req.query.status || '';
      const zone = req.query.zone || '';

      const { units, total } = await inventoryRepository.getUnitsPaginated({
        page,
        limit,
        search,
        category,
        status,
        zone
      });

      // Fetch distinct categories and zones for filtering in UI
      const allLocs = await inventoryRepository.getLocations();
      const distinctZones = [...new Set(allLocs.map(l => l.Zone))].filter(Boolean);

      return res.json({
        success: true,
        units,
        categories: ['Electronics', 'Home Appliances', 'Office Supplies', 'Apparel'],
        zones: distinctZones,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async transfer(req, res, next) {
    try {
      const { uid, newLocationId } = req.body;
      if (!uid || !newLocationId) {
        return res.status(400).json({ success: false, message: 'Item UID and destination slot LocationID are required' });
      }

      const operator = req.user.username;
      const result = await inventoryRepository.transferItem(
        parseInt(uid, 10),
        parseInt(newLocationId, 10),
        operator
      );

      // Trigger socket broadcast on movement
      const io = req.app.get('io');
      if (io) {
        io.emit('inventory:movement', {
          UID: uid,
          ToLocation: result.destinationLabel,
          message: `Stock item UID ${uid} relocated to Zone ${result.destinationLabel} by operator ${operator}`
        });
      }

      return res.json({ success: true, message: 'Item relocated successfully', result });
    } catch (err) {
      next(err);
    }
  }

  async bulkTransfer(req, res, next) {
    try {
      const { uids, newLocationId } = req.body;
      if (!uids || !Array.isArray(uids) || uids.length === 0 || !newLocationId) {
        return res.status(400).json({ success: false, message: 'List of UIDs and target LocationID are required' });
      }

      const operator = req.user.username;
      const result = await warehouseService.bulkTransfer(
        uids.map(id => parseInt(id, 10)),
        parseInt(newLocationId, 10),
        operator
      );

      // Trigger socket broadcast on bulk movements
      const io = req.app.get('io');
      if (io) {
        io.emit('inventory:movement', {
          ToLocation: result.destinationLabel,
          message: `Bulk batch transfer of ${result.transferredCount} stock units consolidated into Zone ${result.destinationLabel}`
        });
      }

      return res.json({ success: true, message: 'Bulk batch transfer completed successfully', result });
    } catch (err) {
      next(err);
    }
  }

  async getTimeline(req, res, next) {
    try {
      const { uid } = req.params;
      const timeline = await inventoryRepository.getTimelineHistory(parseInt(uid, 10));
      return res.json({ success: true, timeline });
    } catch (err) {
      next(err);
    }
  }
}

export default new InventoryController();
export { InventoryController };
