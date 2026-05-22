import React, { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BarcodeComponent from '../components/Barcode';
import { apiFetch } from '../services/api';
import { 
  Plus, 
  ArrowRightLeft, 
  Truck, 
  UserPlus, 
  FilePlus2, 
  CheckCircle,
  Barcode,
  Printer
} from 'lucide-react';

const Inbound = () => {
  const { addToast } = useStore();
  
  // Data lists
  const [shipments, setShipments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  // Form states
  const [supplierForm, setSupplierForm] = useState({ companyName: '', contactName: '', phone: '', address: '' });
  const [productForm, setProductForm] = useState({ productName: '', category: '', weight: '', dimensions: '', sku: '' });
  const [receiveForm, setReceiveForm] = useState({ productId: '', serialNumber: '', locationId: '' });

  // Real-time generated label details
  const [allocatedItem, setAllocatedItem] = useState(null);

  // UI state feedback
  const [activeTab, setActiveTab] = useState('receive'); // receive, shipments, catalog

  const fetchData = async () => {
    try {
      const shipData = await apiFetch('/inbound/shipments');
      if (shipData.success) setShipments(shipData.shipments);

      const supData = await apiFetch('/inbound/suppliers');
      if (supData.success) setSuppliers(supData.suppliers);

      const prodData = await apiFetch('/inbound/products');
      if (prodData.success) setProducts(prodData.products);

      const locData = await apiFetch('/inventory/locations');
      if (locData.success) {
        const availableLocs = locData.locations.filter(l => l.CurrentLoad < l.Capacity);
        setLocations(availableLocs);
      }
    } catch (err) {
      console.error('Inbound data fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.companyName) return;

    try {
      const data = await apiFetch('/inbound/suppliers', {
        method: 'POST',
        body: supplierForm
      });
      if (data.success) {
        addToast('New Supplier successfully logged in central directory.', 'success');
        setSupplierForm({ companyName: '', contactName: '', phone: '', address: '' });
        fetchData();
      } else {
        addToast(data.message || 'Supplier registration failed', 'error');
      }
    } catch (err) {
      addToast('Server communication exception', 'error');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productForm.productName) return;

    try {
      const data = await apiFetch('/inbound/products', {
        method: 'POST',
        body: productForm
      });
      if (data.success) {
        addToast(`Product SKU registered successfully: ${data.sku}`, 'success');
        setProductForm({ productName: '', category: '', weight: '', dimensions: '', sku: '' });
        fetchData();
      } else {
        addToast(data.message || 'Product catalog entry failed', 'error');
      }
    } catch (err) {
      addToast('Server communication exception', 'error');
    }
  };

  const handleReceiveItem = async (e) => {
    e.preventDefault();
    const { productId, locationId } = receiveForm;
    if (!productId || !locationId) {
      addToast('Please select both Product and target Location Rack Shelf', 'error');
      return;
    }

    try {
      const data = await apiFetch('/inbound/receive', {
        method: 'POST',
        body: receiveForm
      });
      if (data.success) {
        addToast(`Received item successfully! UID: ${data.UID}`, 'success');
        
        // Save the details to display the live barcode generator
        const matchedProd = products.find(p => p.ProductID === parseInt(productId, 10));
        setAllocatedItem({
          UID: String(data.UID),
          ProductName: matchedProd ? matchedProd.ProductName : 'Product Unit',
          Location: data.location
        });

        setReceiveForm({ productId: '', serialNumber: '', locationId: '' });
        fetchData();
      } else {
        addToast(data.message || 'Item allocation failed', 'error');
      }
    } catch (err) {
      addToast('Receiving transaction server error', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex font-sans text-white">
      <Sidebar />

      <div className="flex-1 pl-72 flex flex-col min-w-0">
        <Header title="Inbound Control Dock" />

        <main className="flex-1 p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
          
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-1">
            <button
              onClick={() => setActiveTab('receive')}
              className={`px-5 py-3 border-b-2 text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'receive' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              Receiving Workstation
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-5 py-3 border-b-2 text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'shipments' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              Incoming Shipments
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-5 py-3 border-b-2 text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'catalog' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              Product Catalog & Suppliers
            </button>
          </div>

          {/* Tab 1: Workstation Receiving Form */}
          {activeTab === 'receive' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Product Receiving workstation console */}
              <div className="p-6 border border-white/5 rounded-2xl bg-white/5 lg:col-span-2 flex flex-col gap-5 glass">
                <div className="flex items-center gap-2">
                  <Barcode className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Item Allocation Console</h2>
                </div>
                
                <form onSubmit={handleReceiveItem} className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                  
                  {/* Select Product */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Target Product SKU</label>
                    <select
                      value={receiveForm.productId}
                      onChange={(e) => setReceiveForm({...receiveForm, productId: e.target.value})}
                      className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-400/40 w-full"
                      required
                    >
                      <option value="" disabled className="bg-[#090D16] text-white/40">Select registered product SKU...</option>
                      {products.map(p => (
                        <option key={p.ProductID} value={p.ProductID} className="bg-[#090D16] text-white">
                          [{p.SKU}] - {p.ProductName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Serial Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Manufacturer Serial Number (Optional)</label>
                    <input
                      type="text"
                      value={receiveForm.serialNumber}
                      onChange={(e) => setReceiveForm({...receiveForm, serialNumber: e.target.value})}
                      placeholder="e.g. SN-9812A-X"
                      className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                    />
                  </div>

                  {/* Select Location Target Rack */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Target Storage Slot Slot</label>
                    <select
                      value={receiveForm.locationId}
                      onChange={(e) => setReceiveForm({...receiveForm, locationId: e.target.value})}
                      className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-400/40"
                      required
                    >
                      <option value="" disabled className="bg-[#090D16] text-white/40">Select storage rack...</option>
                      {locations.map(l => (
                        <option key={l.LocationID} value={l.LocationID} className="bg-[#090D16] text-white">
                          {l.Zone}-{l.Aisle}-{l.Rack}-{l.Shelf}-{l.Bin} (Cap: {l.CurrentLoad}/{l.Capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="md:col-span-2 bg-cyan-500 text-[#090D16] font-extrabold text-xs tracking-widest uppercase py-3.5 rounded-xl mt-4 hover:bg-cyan-400 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
                    <span>Allocate Stock & Generate UID</span>
                  </button>

                </form>
              </div>

              {/* Barcode label generation panel */}
              <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-4 glass">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Live Labeling Station</h2>
                </div>
                
                {allocatedItem ? (
                  <div className="space-y-4">
                    <BarcodeComponent value={allocatedItem.UID} label={allocatedItem.ProductName} />
                    <div className="text-center text-xs text-white/50">
                      <p className="font-bold text-cyan-400 uppercase">Slot Allocated: {allocatedItem.Location}</p>
                      <p className="mt-1">Affix label to physical item before shelf placement.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-white/30 text-xs text-center">
                    <Barcode className="w-12 h-12 mb-3 text-white/10" />
                    <p>No item allocated in this session yet.</p>
                    <p className="text-[10px] text-white/20 mt-1">Successfully allocated items will render labels here.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Tab 2: Incoming shipments list */}
          {activeTab === 'shipments' && (
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 glass">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Active Inbound Shipments Log</h2>
                </div>
                <button
                  onClick={async () => {
                    if (suppliers.length === 0) {
                      addToast('Please log a supplier catalog template first', 'error');
                      return;
                    }
                    const res = await fetch(`${API_URL}/inbound/shipments`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        supplierId: suppliers[0].SupplierID,
                        status: 'Transit'
                      })
                    });
                    const d = await res.json();
                    if (d.success) {
                      addToast('Simulated Incoming Shipment Transit logged successfully.', 'success');
                      fetchData();
                    }
                  }}
                  className="bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg hover:bg-cyan-500/20 transition-all cursor-pointer"
                >
                  Log Shipment Transit
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3 px-3">Shipment ID</th>
                      <th className="pb-3 px-3">Supplier Origin</th>
                      <th className="pb-3 px-3">Contact</th>
                      <th className="pb-3 px-3">Expected Arrival</th>
                      <th className="pb-3 px-3">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-white/20 font-mono">No incoming shipments tracked currently</td>
                      </tr>
                    ) : (
                      shipments.map((s) => (
                        <tr key={s.ShipmentID} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-3 font-semibold text-white">SHP-{s.ShipmentID}</td>
                          <td className="py-4 px-3 text-white/80 font-semibold">{s.CompanyName}</td>
                          <td className="py-4 px-3 text-white/50">{s.ContactName}</td>
                          <td className="py-4 px-3 text-white/50 font-semibold">{new Date(s.ArrivalDate).toLocaleDateString()}</td>
                          <td className="py-4 px-3">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                              s.Status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse'
                            }`}>
                              {s.Status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Catalog products & suppliers */}
          {activeTab === 'catalog' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Product catalog form */}
              <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-4 glass">
                <div className="flex items-center gap-2">
                  <FilePlus2 className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Create Product Definition</h2>
                </div>
                
                <form onSubmit={handleAddProduct} className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Product Name</label>
                    <input
                      type="text"
                      value={productForm.productName}
                      onChange={(e) => setProductForm({...productForm, productName: e.target.value})}
                      placeholder="e.g. Wireless Ergonomic Mouse"
                      className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Category</label>
                      <input
                        type="text"
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        placeholder="Electronics"
                        className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.weight}
                        onChange={(e) => setProductForm({...productForm, weight: e.target.value})}
                        placeholder="0.35"
                        className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Dimensions (cm)</label>
                      <input
                        type="text"
                        value={productForm.dimensions}
                        onChange={(e) => setProductForm({...productForm, dimensions: e.target.value})}
                        placeholder="12x8x4"
                        className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Custom SKU (Optional)</label>
                      <input
                        type="text"
                        value={productForm.sku}
                        onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                        placeholder="e.g. ELE-MOU-901"
                        className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-cyan-500 text-[#090D16] font-extrabold text-xs tracking-widest uppercase py-3.5 rounded-xl mt-2 hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    Register SKU Definition
                  </button>
                </form>
              </div>

              {/* Supplier registration form */}
              <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-4 glass">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Register Supplier</h2>
                </div>
                
                <form onSubmit={handleAddSupplier} className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Company / Manufacturer Name</label>
                    <input
                      type="text"
                      value={supplierForm.companyName}
                      onChange={(e) => setSupplierForm({...supplierForm, companyName: e.target.value})}
                      placeholder="Logitech Global Ltd."
                      className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Contact Person</label>
                      <input
                        type="text"
                        value={supplierForm.contactName}
                        onChange={(e) => setSupplierForm({...supplierForm, contactName: e.target.value})}
                        placeholder="John Doe"
                        className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Contact Phone</label>
                      <input
                        type="text"
                        value={supplierForm.phone}
                        onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                        placeholder="+2012345678"
                        className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Physical Address</label>
                    <input
                      type="text"
                      value={supplierForm.address}
                      onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                      placeholder="e.g. 5th Settlement, Cairo"
                      className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-cyan-500 text-[#090D16] font-extrabold text-xs tracking-widest uppercase py-3.5 rounded-xl mt-2 hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    Log Supplier
                  </button>
                </form>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Inbound;
export { Inbound };
