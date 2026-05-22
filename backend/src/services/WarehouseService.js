import inventoryRepository from '../repositories/InventoryRepository.js';
import userRepository from '../repositories/UserRepository.js';
import dbInstance from '../config/db.js';

class WarehouseService {
  async getOccupancyDetails() {
    const locations = await inventoryRepository.getLocations();
    
    // Find critical capacity alerts
    const alerts = locations
      .filter(loc => loc.Capacity > 0 && (loc.CurrentLoad / loc.Capacity) >= 0.85)
      .map(loc => ({
        locationId: loc.LocationID,
        label: `${loc.Zone}-${loc.Aisle}-${loc.Rack}-${loc.Shelf}-${loc.Bin}`,
        load: loc.CurrentLoad,
        capacity: loc.Capacity,
        fillRate: Math.round((loc.CurrentLoad * 100) / loc.Capacity),
        severity: loc.CurrentLoad >= loc.Capacity ? 'Critical' : 'Warning'
      }));

    return {
      locationsCount: locations.length,
      alertsCount: alerts.length,
      alerts
    };
  }

  // TRANSACTION: Execute Bulk stock transfers safely inside isolated database context
  async bulkTransfer(uids, newLocationId, operatorUsername) {
    if (!Array.isArray(uids) || uids.length === 0) {
      throw new Error('Invalid items list for bulk transfer operations');
    }

    return await dbInstance.executeTransaction(async (request) => {
      // 1. Fetch target Location details
      request.input('TargetLocID', newLocationId);
      const locRes = await request.query('SELECT Capacity, CurrentLoad, Zone, Aisle, Rack, Shelf, Bin FROM WarehouseLocations WHERE LocationID = @TargetLocID');
      const dest = locRes.recordset[0];
      if (!dest) {
        throw new Error(`Target location slot LocationID ${newLocationId} does not exist`);
      }

      const requestedSlots = uids.length;
      const availableSlots = dest.Capacity - dest.CurrentLoad;

      if (availableSlots < requestedSlots) {
        throw new Error(`Destination slot capacity exceeded (Required: ${requestedSlots}, Available: ${availableSlots})`);
      }

      const results = [];

      // 2. Loop through each UID to update location loads and details
      for (const uid of uids) {
        const uidKey = `UID_${uid}`;
        request.input(uidKey, uid);
        
        // Fetch current Location ID
        const unitRes = await request.query(`SELECT LocationID FROM ProductUnits WHERE UID = @${uidKey}`);
        const unit = unitRes.recordset[0];
        if (!unit) {
          throw new Error(`Stock unit UID ${uid} not found in inventory records`);
        }

        const oldLocationId = unit.LocationID;
        if (oldLocationId === newLocationId) {
          continue; // Skip if already there
        }

        // Decrement source shelf load
        if (oldLocationId) {
          const oldLocKey = `OldLoc_${uid}`;
          request.input(oldLocKey, oldLocationId);
          await request.query(`UPDATE WarehouseLocations SET CurrentLoad = CurrentLoad - 1 WHERE LocationID = @${oldLocKey}`);
        }

        // Increment target shelf load
        await request.query('UPDATE WarehouseLocations SET CurrentLoad = CurrentLoad + 1 WHERE LocationID = @TargetLocID');

        // Relocate
        await request.query(`UPDATE ProductUnits SET LocationID = @TargetLocID, Status = 'Stored' WHERE UID = @${uidKey}`);

        // Track movement log
        const fromLocKey = `FromLoc_${uid}`;
        request.input(fromLocKey, oldLocationId || null);
        await request.query(`
          INSERT INTO InventoryMovements (UID, FromLocation, ToLocation, MovementType, MovementDate)
          VALUES (@${uidKey}, @${fromLocKey}, @TargetLocID, 'Transfer', GETDATE())
        `);

        results.push({ uid, from: oldLocationId, to: newLocationId });
      }

      // 3. Log audit
      await userRepository.logAudit(
        operatorUsername,
        'Bulk Transfer',
        newLocationId.toString(),
        'WarehouseLocation',
        `Moved consolidated batch of ${results.length} items to Slot #${newLocationId}`
      );

      return {
        transferredCount: results.length,
        destinationLabel: `${dest.Zone}-${dest.Aisle}-${dest.Rack}-${dest.Shelf}-${dest.Bin}`,
        transfers: results
      };
    });
  }
}

export default new WarehouseService();
export { WarehouseService };
