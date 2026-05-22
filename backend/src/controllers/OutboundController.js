import orderRepository from '../repositories/OrderRepository.js';
import outboundService from '../services/OutboundService.js';

class OutboundController {
  async getOrders(req, res, next) {
    try {
      const { status } = req.query;
      const orders = await orderRepository.getOrders(status);
      return res.json({ success: true, orders });
    } catch (err) {
      next(err);
    }
  }

  async getOrderDetails(req, res, next) {
    try {
      const { orderId } = req.params;
      const details = await orderRepository.getOrderDetails(parseInt(orderId, 10));
      if (!details.order) {
        return res.status(404).json({ success: false, message: 'Order reference not found' });
      }
      return res.json(details);
    } catch (err) {
      next(err);
    }
  }

  async startPicking(req, res, next) {
    try {
      const { orderId } = req.params;
      const operator = req.user.username;
      
      const pickingList = await orderRepository.startPicking(parseInt(orderId, 10), operator);

      const io = req.app.get('io');
      if (io) {
        io.emit('order:update', { OrderID: orderId, Status: 'Picking' });
      }

      return res.json({ success: true, message: 'Picking cycle initialized', pickingList });
    } catch (err) {
      next(err);
    }
  }

  async completePicking(req, res, next) {
    try {
      const { orderId } = req.params;
      const { pickedUIDs } = req.body;
      const operator = req.user.username;

      if (!pickedUIDs || !Array.isArray(pickedUIDs) || pickedUIDs.length === 0) {
        return res.status(400).json({ success: false, message: 'Picked item UIDs are required to complete picking' });
      }

      await orderRepository.completePicking(
        parseInt(orderId, 10),
        pickedUIDs.map(id => parseInt(id, 10)),
        operator
      );

      const io = req.app.get('io');
      if (io) {
        io.emit('order:update', { OrderID: orderId, Status: 'Packing' });
      }

      return res.json({ success: true, message: 'Picking completed. Staged in packaging lanes.' });
    } catch (err) {
      next(err);
    }
  }

  async packOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const { packedUIDs } = req.body;
      const operator = req.user.username;

      if (!packedUIDs || !Array.isArray(packedUIDs) || packedUIDs.length === 0) {
        return res.status(400).json({ success: false, message: 'Packed UIDs list is required to complete packing verification' });
      }

      await orderRepository.packOrder(
        parseInt(orderId, 10),
        packedUIDs.map(id => parseInt(id, 10)),
        operator
      );

      const io = req.app.get('io');
      if (io) {
        io.emit('order:update', { OrderID: orderId, Status: 'Packed' });
      }

      return res.json({ success: true, message: 'Packing verified successfully. Staged for transit dispatch.' });
    } catch (err) {
      next(err);
    }
  }

  async shipOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const { trackingUIDs } = req.body;
      const operator = req.user.username;

      if (!trackingUIDs || !Array.isArray(trackingUIDs) || trackingUIDs.length === 0) {
        return res.status(400).json({ success: false, message: 'Tracking UIDs list is required for dispatch releases' });
      }

      await orderRepository.shipOrder(
        parseInt(orderId, 10),
        trackingUIDs.map(id => parseInt(id, 10)),
        operator
      );

      const io = req.app.get('io');
      if (io) {
        io.emit('order:update', { OrderID: orderId, Status: 'Shipped' });
      }

      return res.json({ success: true, message: 'Order released to courier cargo dispatch' });
    } catch (err) {
      next(err);
    }
  }

  async validateScan(req, res, next) {
    try {
      const { orderId } = req.params;
      const { uid } = req.body;
      if (!uid) {
        return res.status(400).json({ success: false, message: 'Scan requires a stock barcode UID parameter' });
      }

      const result = await outboundService.validateScan(parseInt(orderId, 10), parseInt(uid, 10));
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default new OutboundController();
export { OutboundController };
