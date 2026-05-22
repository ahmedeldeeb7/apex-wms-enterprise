import orderRepository from '../repositories/OrderRepository.js';
import dbInstance from '../config/db.js';

class OutboundService {
  async getShippingBatches() {
    // 1. Fetch all orders that are Packed or Shipped
    const orders = await orderRepository.getOrders();
    const packedOrders = orders.filter(o => o.Status === 'Packed' || o.Status === 'Shipped');

    // 2. Group by destination City
    const cityGroups = packedOrders.reduce((acc, order) => {
      const city = order.City || 'Cairo';
      if (!acc[city]) acc[city] = [];
      acc[city].push(order);
      return acc;
    }, {});

    // Distance metrics mapping from fulfillment center Cairo
    const cityDistanceMap = {
      'Cairo': 15,
      'Alexandria': 220,
      'Giza': 25,
      'Mansoura': 130,
      'Suez': 140,
      'Tanta': 90,
      'Hurghada': 460
    };

    const batches = [];
    let savedTotalKM = 0;
    let totalOptimizedOrders = 0;
    let totalWeightKG = 0;

    // 3. Compile optimized dispatches
    for (const [city, cityOrders] of Object.entries(cityGroups)) {
      const distance = cityDistanceMap[city] || 100;
      const count = cityOrders.length;
      
      // Select vehicle size dynamically by payload capacity
      let vehicleType = 'Mini Delivery Van';
      if (count > 8) vehicleType = 'Heavy Duty Cargo Truck';
      else if (count > 3) vehicleType = 'Medium Consolidated Truck';

      // Mileage saved: consolidate N orders to 1 dispatch saves (N - 1) * distance * 2 KM!
      const milesSaved = Math.max(0, (count - 1) * distance * 1.5);
      savedTotalKM += milesSaved;
      totalOptimizedOrders += count;

      const batchWeight = count * 12.5; // Average items weight representation
      totalWeightKG += batchWeight;

      batches.push({
        BatchID: `BAT-${city.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        City: city,
        OrdersCount: count,
        OrderIDs: cityOrders.map(o => o.OrderID),
        DistanceKM: distance,
        VehicleType: vehicleType,
        TotalWeight: batchWeight.toFixed(2),
        MilesSavedKM: Math.round(milesSaved),
        OptimizedRoute: ['Apex Fulfillment Center Cairo', `${city} Distribution Hub`, `${city} Local Delivery Grid`]
      });
    }

    return {
      batches,
      stats: {
        totalBatches: batches.length,
        totalOptimizedOrders,
        totalWeightKG: totalWeightKG.toFixed(2),
        totalKMSaved: Math.round(savedTotalKM)
      }
    };
  }

  async validateScan(orderId, scannedUID) {
    // 1. Fetch expected order items
    const details = await orderRepository.getOrderDetails(orderId);
    if (!details.order) {
      throw new Error(`Order #${orderId} not found`);
    }

    // 2. Fetch scanned UID product details
    const res = await dbInstance.query(
      'SELECT ProductID, Status FROM ProductUnits WHERE UID = @uid',
      { uid: scannedUID }
    );
    const unit = res.recordset[0];
    if (!unit) {
      return { valid: false, reason: `Invalid barcode block scanned (UID ${scannedUID} does not exist)` };
    }

    if (unit.Status !== 'Picked') {
      return { valid: false, reason: `Scanned item UID ${scannedUID} has invalid transit state (Current status: ${unit.Status})` };
    }

    // Verify product belongs to order requirements
    const expected = details.items.some(item => item.ProductID === unit.ProductID);
    if (!expected) {
      return { valid: false, reason: `Scanned product does not match order requirements for ORD-${orderId}` };
    }

    return { valid: true, productId: unit.ProductID };
  }
}

export default new OutboundService();
export { OutboundService };
