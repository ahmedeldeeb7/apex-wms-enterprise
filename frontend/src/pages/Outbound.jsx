import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useStore } from '../store/store';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import InvoicePDF from '../components/InvoicePDF';
import { apiFetch } from '../services/api';
import { 
  Package, 
  ArrowRight, 
  Clock, 
  CheckSquare, 
  Scan, 
  Truck,
  AlertCircle,
  Printer,
  Barcode
} from 'lucide-react';

const Outbound = () => {
  const { notifications } = useSocket();
  const { addToast } = useStore();

  // Active orders lists
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  
  // Workstation states
  const [pickingChecklist, setPickingChecklist] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Simulated Barcode Scanner inputs
  const [scanInput, setScanInput] = useState('');
  const [validatedUIDs, setValidatedUIDs] = useState([]);

  // Printer invoice state
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchOrders = async () => {
    try {
      const url = `/outbound/orders${statusFilter ? `?status=${statusFilter}` : ''}`;
      const data = await apiFetch(url);
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, notifications]);

  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    setOrderDetails(null);
    setPickingChecklist([]);
    setValidatedUIDs([]);
    setScanInput('');

    try {
      const data = await apiFetch(`/outbound/orders/${order.OrderID}`);
      if (data.success) {
        setOrderDetails(data);
      }
    } catch (err) {
      console.error('Fetch order details error:', err);
    }
  };

  // 1. Trigger Start Picking
  const handleStartPicking = async () => {
    if (!selectedOrder) return;
    
    try {
      const data = await apiFetch(`/outbound/orders/${selectedOrder.OrderID}/start-picking`, {
        method: 'POST'
      });
      if (data.success) {
        addToast(`Picking checklist generated successfully for Order #${selectedOrder.OrderID}`, 'success');
        setPickingChecklist(data.pickingList);
        handleSelectOrder(selectedOrder);
      } else {
        addToast(data.message || 'Start picking failed', 'error');
      }
    } catch (err) {
      addToast('Server connection error during picking setup', 'error');
    }
  };

  // 2. Trigger Complete Picking (updates to Packing)
  const handleCompletePicking = async () => {
    if (!selectedOrder || pickingChecklist.length === 0) return;

    const pickedUIDs = pickingChecklist.map(item => item.UID);

    try {
      const data = await apiFetch(`/outbound/orders/${selectedOrder.OrderID}/complete-picking`, {
        method: 'POST',
        body: { pickedUIDs }
      });
      if (data.success) {
        addToast('Picking completed! Items staged in packaging lanes.', 'success');
        setSelectedOrder(null);
        setOrderDetails(null);
        setPickingChecklist([]);
        fetchOrders();
      } else {
        addToast(data.message || 'Complete picking failed', 'error');
      }
    } catch (err) {
      addToast('Server communication error completing pick', 'error');
    }
  };

  // Simulated Barcode Scanner matching picked items!
  const executeSimulatedBarcodeScan = async (e) => {
    e.preventDefault();
    if (!scanInput) return;

    try {
      const data = await apiFetch(`/outbound/orders/${selectedOrder.OrderID}/validate-scan`, {
        method: 'POST',
        body: { uid: scanInput }
      });
      if (data.success) {
        addToast(`Scan Matched! SKU: ${data.sku}`, 'success');
        if (!validatedUIDs.includes(parseInt(scanInput, 10))) {
          setValidatedUIDs(prev => [...prev, parseInt(scanInput, 10)]);
        }
        setScanInput('');
      } else {
        addToast(data.message || 'Scan validation failed', 'error');
      }
    } catch (err) {
      addToast('Scan validation request failed', 'error');
    }
  };

  // 3. Complete packing
  const handleCompletePacking = async () => {
    if (!selectedOrder || !orderDetails) return;

    if (validatedUIDs.length === 0) {
      addToast('Please scan item UIDs to verify before packing', 'error');
      return;
    }

    try {
      const data = await apiFetch(`/outbound/orders/${selectedOrder.OrderID}/pack`, {
        method: 'POST',
        body: { packedUIDs: validatedUIDs }
      });
      if (data.success) {
        addToast(`Order #${selectedOrder.OrderID} packed and sealed successfully!`, 'success');
        handleSelectOrder(selectedOrder);
        fetchOrders();
      } else {
        addToast(data.message || 'Packing completion rejected', 'error');
      }
    } catch (err) {
      addToast('Server communication failed during packing', 'error');
    }
  };

  // 4. Trigger Dispatch Ship
  const handleShipOrder = async () => {
    if (!selectedOrder || !orderDetails) return;

    try {
      // Find matching items from pack list
      const itemsData = await apiFetch('/inventory/units?status=Packed');
      
      const uidsToShip = itemsData.units
        .filter(u => orderDetails.items.some(oi => oi.ProductID === u.ProductID))
        .map(u => u.UID);

      if (uidsToShip.length === 0) {
        addToast('No packed items found in staging lanes for this order', 'error');
        return;
      }

      const data = await apiFetch(`/outbound/orders/${selectedOrder.OrderID}/ship`, {
        method: 'POST',
        body: { trackingUIDs: uidsToShip }
      });
      if (data.success) {
        addToast(`Order #${selectedOrder.OrderID} dispatched successfully.`, 'success');
        handleSelectOrder(selectedOrder);
        fetchOrders();
      } else {
        addToast(data.message || 'Dispatch rejected by server', 'error');
      }
    } catch (err) {
      addToast('Server dispatch request failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex font-sans text-white">
      <Sidebar />

      <div className="flex-1 pl-72 flex flex-col min-w-0">
        <Header title="Outbound Sorting Hub" />

        <main className="flex-1 p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
          
          {/* Order State Filters */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {['', 'Pending', 'Picking', 'Packing', 'Packed', 'Shipped', 'Delivered'].map(status => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setSelectedOrder(null); setOrderDetails(null); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase border tracking-wider transition-all cursor-pointer ${
                    statusFilter === status 
                      ? 'bg-cyan-500 text-[#090D16] border-cyan-400' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                  }`}
                >
                  {status || 'All Orders'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Orders list grid */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 lg:col-span-2 flex flex-col gap-4 glass">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-400" />
                <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Outbound Orders Registry</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3 px-3">Order ID</th>
                      <th className="pb-3 px-3">Customer</th>
                      <th className="pb-3 px-3">Fulfillment Route</th>
                      <th className="pb-3 px-3">Items Count</th>
                      <th className="pb-3 px-3">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-white/20 font-mono">No orders matched filters</td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr 
                          key={o.OrderID} 
                          onClick={() => handleSelectOrder(o)}
                          className={`border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer ${
                            selectedOrder?.OrderID === o.OrderID ? 'bg-white/5 border-l-2 border-l-cyan-400' : ''
                          }`}
                        >
                          <td className="py-4 px-3 font-semibold text-white">ORD-{o.OrderID}</td>
                          <td className="py-4 px-3 text-white/80 font-semibold">{o.FullName}</td>
                          <td className="py-4 px-3 text-white/50">{o.City}</td>
                          <td className="py-4 px-3 font-bold text-cyan-400 font-mono">{o.ItemsCount} items</td>
                          <td className="py-4 px-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                              {o.Status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order details workstation dashboard */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-6 glass">
              
              {!selectedOrder ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-white/30 gap-2">
                  <Package className="h-10 w-10 text-white/10" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Select order to engage terminal station</span>
                </div>
              ) : !orderDetails ? (
                <div className="flex h-40 items-center justify-center text-white/20 text-xs font-mono">Compiling transaction details...</div>
              ) : (
                <div className="flex flex-col gap-6">
                  
                  {/* Order Details Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Workstation ORD-{orderDetails.order.OrderID}</h3>
                      <p className="text-[10px] text-white/40 mt-1">{orderDetails.order.FullName} ({orderDetails.order.City})</p>
                    </div>
                    
                    {/* Invoice Print Button */}
                    <button
                      onClick={() => setShowInvoice(true)}
                      className="p-2 rounded bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                      title="Print Dispatch Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="h-[1px] w-full bg-white/5" />

                  {/* Order Items Required List */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Fulfillment items list</span>
                    <div className="flex flex-col gap-2">
                      {orderDetails.items.map(item => (
                        <div key={item.OrderItemID} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{item.ProductName}</span>
                            <span className="text-[9px] text-white/40">SKU: {item.SKU}</span>
                          </div>
                          <div className="text-right">
                            <span className="block font-bold text-white">Qty: {item.Quantity}</span>
                            <span className={`block text-[9px] font-bold ${item.AvailableInStock >= item.Quantity ? 'text-emerald-400' : 'text-red-400'}`}>
                              In Stock: {item.AvailableInStock}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Controllers based on Status */}
                  <div className="mt-2">
                    
                    {/* CASE 1: PENDING -> START PICKING */}
                    {orderDetails.order.Status === 'Pending' && (
                      <button
                        onClick={handleStartPicking}
                        className="w-full bg-cyan-500 text-[#090D16] font-extrabold text-xs tracking-widest uppercase py-3.5 rounded-xl hover:bg-cyan-400 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      >
                        <Clock className="h-4 w-4 stroke-[2.5]" />
                        <span>Generate Picker Checklist</span>
                      </button>
                    )}

                    {/* CASE 2: PICKING CHEKLIST RENDER & COMPLETION */}
                    {orderDetails.order.Status === 'Picking' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-1 text-[10px] text-cyan-400 uppercase font-bold tracking-widest">
                          <AlertCircle className="h-4 w-4" />
                          <span>Active Pick List compilation</span>
                        </div>
                        {pickingChecklist.length === 0 ? (
                          <button
                            onClick={handleStartPicking}
                            className="w-full bg-white/5 border border-white/10 text-white font-bold text-xs tracking-widest uppercase py-3 rounded-xl hover:bg-white/10 transition-all"
                          >
                            Compile Picking slots
                          </button>
                        ) : (
                          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                            {pickingChecklist.map(item => (
                              <div key={item.UID} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs font-medium">
                                <div>
                                  <span className="block font-bold text-white">UID: {item.UID}</span>
                                  <span className="block text-[9px] text-white/40 font-bold tracking-wide">SN: {item.SerialNumber}</span>
                                </div>
                                <span className="text-[10px] font-extrabold text-cyan-400 font-mono">
                                  {item.Zone}-{item.Aisle}-{item.Rack}-{item.Shelf}-{item.Bin}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={handleCompletePicking}
                          className="w-full bg-cyan-500 text-[#090D16] font-extrabold text-xs tracking-widest uppercase py-3.5 rounded-xl mt-1 hover:bg-cyan-400 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        >
                          <CheckSquare className="h-4.5 w-4.5 stroke-[2.5]" />
                          <span>Verify Complete picking</span>
                        </button>
                      </div>
                    )}

                    {/* CASE 3: PACKING SCAN VALIDATION */}
                    {orderDetails.order.Status === 'Packing' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-purple-400 uppercase font-bold tracking-widest">
                          <Scan className="h-4 w-4 animate-pulse" />
                          <span>Interactive Packing Scans</span>
                        </div>
                        
                        {/* Barcode scanner Simulator form */}
                        <form onSubmit={executeSimulatedBarcodeScan} className="flex gap-2">
                          <input
                            type="number"
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            placeholder="Scan stock UID barcode..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400/40"
                          />
                          <button
                            type="submit"
                            className="bg-cyan-500 text-[#090D16] px-3 py-2 rounded-lg text-xs font-bold uppercase hover:bg-cyan-400 transition-all"
                          >
                            Scan
                          </button>
                        </form>

                        {/* Scanned checklist results */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Scanned Verification ({validatedUIDs.length})</span>
                          <div className="max-h-[100px] overflow-y-auto space-y-1">
                            {validatedUIDs.map(uid => (
                              <div key={uid} className="flex items-center justify-between p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                                <div className="flex items-center gap-1.5">
                                  <Barcode className="w-3.5 h-3.5" />
                                  <span>UID: {uid}</span>
                                </div>
                                <span className="text-[10px]">Verified</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleCompletePacking}
                          className="w-full bg-cyan-500 text-[#090D16] font-extrabold text-xs tracking-widest uppercase py-3.5 rounded-xl hover:bg-cyan-400 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        >
                          <Package className="h-4.5 w-4.5" />
                          <span>Complete Packing validation</span>
                        </button>
                      </div>
                    )}

                    {/* CASE 4: PACKED -> SHIP DISPATCH */}
                    {orderDetails.order.Status === 'Packed' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-cyan-400 uppercase font-bold tracking-widest">
                          <Truck className="h-4 w-4" />
                          <span>Staged for route dispatch</span>
                        </div>
                        <button
                          onClick={handleShipOrder}
                          className="w-full bg-cyan-500 text-[#090D16] font-extrabold text-xs tracking-widest uppercase py-3.5 rounded-xl hover:bg-cyan-400 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        >
                          <ArrowRight className="h-4.5 w-4.5 stroke-[2.5]" />
                          <span>Dispatch vehicle route</span>
                        </button>
                      </div>
                    )}

                    {/* CASE 5: DISPATCHED / SHIPPED / DELIVERED */}
                    {['Shipped', 'Delivered'].includes(orderDetails.order.Status) && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        <span>Fulfillment Cycle Complete</span>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

          </div>

        </main>
      </div>

      {/* Invoice Modals Overlay */}
      {showInvoice && orderDetails && (
        <InvoicePDF
          order={orderDetails.order}
          items={orderDetails.items}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
};

export default Outbound;
export { Outbound };
