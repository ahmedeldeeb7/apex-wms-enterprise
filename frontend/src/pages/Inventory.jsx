import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useStore } from '../store/store';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { apiFetch } from '../services/api';
import { 
  Search, 
  Filter, 
  Map, 
  Table, 
  ArrowRightLeft, 
  AlertTriangle,
  Move,
  History,
  ArrowRight,
  Clock,
  User
} from 'lucide-react';

const Inventory = () => {
  const { notifications } = useSocket();
  const { addToast } = useStore();

  // Data lists
  const [locations, setLocations] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);

  // Pagination, search and filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [zone, setZone] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Transfer item state
  const [transferForm, setTransferForm] = useState({ uid: '', newLocationId: '' });

  // View state: map (heatmap) or table
  const [viewMode, setViewMode] = useState('heatmap');
  const [selectedZone, setSelectedZone] = useState('A');

  // UID timeline history search state
  const [timelineUid, setTimelineUid] = useState('');
  const [searchedTimelineUid, setSearchedTimelineUid] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const fetchLocations = async () => {
    try {
      const data = await apiFetch('/inventory/locations');
      if (data.success) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error('Fetch locations error:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      let endpoint = `/inventory/units?page=${page}&limit=10&search=${search}&category=${category}&status=${status}&zone=${zone}`;
      const data = await apiFetch(endpoint);
      if (data.success) {
        setInventoryList(data.units);
        setCategories(data.categories);
        setZones(data.zones);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Fetch inventory units error:', err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [notifications]);

  useEffect(() => {
    fetchInventory();
  }, [page, search, category, status, zone, notifications]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    const { uid, newLocationId } = transferForm;
    if (!uid || !newLocationId) {
      addToast('Please fill out all fields in structural move checklist', 'error');
      return;
    }

    try {
      const data = await apiFetch('/inventory/transfer', {
        method: 'POST',
        body: { uid, newLocationId }
      });
      if (data.success) {
        addToast(`Item transferred successfully! UID ${uid} relocated.`, 'success');
        setTransferForm({ uid: '', newLocationId: '' });
        fetchLocations();
        fetchInventory();
        if (searchedTimelineUid && parseInt(searchedTimelineUid, 10) === parseInt(uid, 10)) {
          fetchTimeline(uid);
        }
      } else {
        addToast(data.message || 'Movement transaction rejected by DBMS', 'error');
      }
    } catch (err) {
      addToast('Database communication error during transfer', 'error');
    }
  };

  // Click on a heatmap cell to auto-select that destination location!
  const selectDestinationCell = (loc) => {
    if (loc.CurrentLoad >= loc.Capacity) {
      addToast('Selected slot has reached maximum capacity!', 'error');
      return;
    }
    setTransferForm(prev => ({ ...prev, newLocationId: loc.LocationID }));
    addToast(`Auto-selected slot: ${loc.Zone}-${loc.Aisle}-${loc.Rack}-${loc.Shelf}-${loc.Bin}`, 'info');
  };

  const fetchTimeline = async (uidToSearch) => {
    const searchUid = uidToSearch || timelineUid;
    if (!searchUid) return;
    
    setLoadingTimeline(true);
    setSearchedTimelineUid(searchUid);
    try {
      const data = await apiFetch(`/inventory/timeline/${searchUid}`);
      if (data.success) {
        setTimelineEvents(data.timeline);
      } else {
        addToast(data.message || 'Error pulling item movement history', 'error');
        setTimelineEvents([]);
      }
    } catch (err) {
      addToast('Failed to connect to history repository', 'error');
      setTimelineEvents([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleTimelineSearch = (e) => {
    e.preventDefault();
    fetchTimeline();
  };

  const groupedLocations = locations.reduce((acc, loc) => {
    const z = loc.Zone || 'Unknown';
    if (!acc[z]) acc[z] = [];
    acc[z].push(loc);
    return acc;
  }, {});

  const getHeatmapColor = (currentLoad, capacity) => {
    if (!capacity) return 'bg-white/5 border-white/10';
    const rate = currentLoad / capacity;
    if (rate >= 1.0) return 'bg-red-500/20 border-red-500 text-red-400 animate-pulse';
    if (rate >= 0.8) return 'bg-red-500/10 border-red-500/40 text-red-300';
    if (rate >= 0.5) return 'bg-amber-500/10 border-amber-500/40 text-amber-300';
    return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400';
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex font-sans text-white">
      <Sidebar />

      <div className="flex-1 pl-72 flex flex-col min-w-0">
        <Header title="Inventory Grid Management" />

        <main className="flex-1 p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
          
          {/* Header Action Tools */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('heatmap')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase border tracking-wider transition-all cursor-pointer ${
                  viewMode === 'heatmap' ? 'bg-cyan-500 text-[#090D16] border-cyan-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                <Map className="h-4 w-4" />
                <span>Heatmap Matrix</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase border tracking-wider transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-cyan-500 text-[#090D16] border-cyan-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                <Table className="h-4 w-4" />
                <span>Search Inventory</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-wider uppercase px-4 py-2 rounded-xl">
              <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
              <span>Full storage limits are monitored in real-time</span>
            </div>
          </div>

          {/* Map view */}
          {viewMode === 'heatmap' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Heatmap main grids */}
              <div className="p-6 border border-white/5 rounded-2xl bg-white/5 lg:col-span-2 flex flex-col gap-6 glass">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Visual Warehouse Grid</h2>
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Click cells to auto-fill relocations destination slot</span>
                  </div>
                  
                  <div className="flex gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl">
                    {Object.keys(groupedLocations).sort().map(z => (
                      <button
                        key={z}
                        onClick={() => setSelectedZone(z)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedZone === z ? 'bg-cyan-500 text-[#090D16]' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        Zone {z}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heatmap Grid */}
                <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mt-2 min-h-[300px]">
                  {(!groupedLocations[selectedZone] || groupedLocations[selectedZone].length === 0) ? (
                    <div className="col-span-full flex items-center justify-center text-xs text-white/20 font-mono">No slots defined for this zone.</div>
                  ) : (
                    groupedLocations[selectedZone].map((loc) => {
                      const fillRate = loc.Capacity ? Math.round((loc.CurrentLoad * 100) / loc.Capacity) : 0;
                      return (
                        <div
                          key={loc.LocationID}
                          onClick={() => selectDestinationCell(loc)}
                          className={`rounded-xl p-2 flex flex-col items-center justify-center border text-center transition-all hover:scale-105 select-none relative group cursor-pointer ${
                            getHeatmapColor(loc.CurrentLoad, loc.Capacity)
                          }`}
                        >
                          <span className="text-[8px] font-mono tracking-wider font-bold">
                            A{loc.Aisle}R{loc.Rack}S{loc.Shelf}
                          </span>
                          <span className="text-[10px] font-extrabold mt-1">
                            {fillRate}%
                          </span>
                          
                          {/* Hover stats tooltips */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-[#090D16] border border-white/10 p-3 rounded-lg shadow-xl pointer-events-none w-48 text-left">
                            <span className="block text-[10px] uppercase font-bold text-cyan-400">Slot Info</span>
                            <span className="block text-xs font-semibold text-white mt-1">Slot: {loc.Zone}-{loc.Aisle}-{loc.Rack}-{loc.Shelf}-{loc.Bin}</span>
                            <span className="block text-[10px] text-white/60 mt-0.5">Load: {loc.CurrentLoad} of {loc.Capacity} units</span>
                            <div className="w-full bg-white/15 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, fillRate)}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Legend bar */}
                <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-white/5 text-[9px] font-bold uppercase text-white/40">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-emerald-500/10 border border-emerald-500/40" />
                    <span>0 - 50% Load (Available)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-amber-500/10 border border-amber-500/40" />
                    <span>50 - 80% Load (Moderate)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-red-500/10 border border-red-500/40" />
                    <span>80 - 100% Load (High)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-red-500/20 border border-red-500 animate-pulse" />
                    <span>100% Full (Locked)</span>
                  </div>
                </div>
              </div>

              {/* Relocation panel */}
              <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-4 glass">
                <div className="flex items-center gap-2">
                  <Move className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Item Relocation Console</h2>
                </div>
                
                <form onSubmit={handleTransfer} className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Unique Item ID (UID)</label>
                    <input
                      type="number"
                      value={transferForm.uid}
                      onChange={(e) => setTransferForm({...transferForm, uid: e.target.value})}
                      placeholder="e.g. 100000000021"
                      className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Destination Slot Location</label>
                    <select
                      value={transferForm.newLocationId}
                      onChange={(e) => setTransferForm({...transferForm, newLocationId: e.target.value})}
                      className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-cyan-400/40"
                      required
                    >
                      <option value="" disabled className="bg-[#090D16] text-white/40">Select destination slot...</option>
                      {locations.map(l => (
                        <option key={l.LocationID} value={l.LocationID} className="bg-[#090D16] text-white">
                          {l.Zone}-{l.Aisle}-{l.Rack}-{l.Shelf}-{l.Bin} (Cap: {l.CurrentLoad}/{l.Capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="bg-cyan-500 text-[#090D16] font-extrabold text-xs tracking-widest uppercase py-3.5 rounded-xl mt-2 hover:bg-cyan-400 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    <ArrowRightLeft className="h-4.5 w-4.5 stroke-[2.5]" />
                    <span>Authorize Stock Movement</span>
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* Table view */}
          {viewMode === 'table' && (
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-6 glass">
              
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="relative flex items-center flex-1 max-w-md">
                  <Search className="absolute left-4 h-4.5 w-4.5 text-white/30" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search UID, SKU, Serial Number..."
                    className="w-full bg-white/5 border border-white/10 focus:border-cyan-400/40 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-white/20 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  
                  {/* Category */}
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                    <select
                      value={category}
                      onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                      className="bg-transparent text-xs text-white font-medium focus:outline-none border-none cursor-pointer"
                    >
                      <option value="" className="bg-[#090D16] text-white/40">All Categories</option>
                      {categories.map(c => <option key={c} value={c} className="bg-[#090D16] text-white">{c}</option>)}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                    <select
                      value={status}
                      onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                      className="bg-transparent text-xs text-white font-medium focus:outline-none border-none cursor-pointer"
                    >
                      <option value="" className="bg-[#090D16] text-white/40">All Statuses</option>
                      <option value="Stored" className="bg-[#090D16] text-white font-semibold">Stored</option>
                      <option value="Picked" className="bg-[#090D16] text-white font-semibold">Picked</option>
                      <option value="Packed" className="bg-[#090D16] text-white font-semibold">Packed</option>
                      <option value="Shipped" className="bg-[#090D16] text-white font-semibold">Shipped</option>
                    </select>
                  </div>

                  {/* Zone */}
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                    <select
                      value={zone}
                      onChange={(e) => { setZone(e.target.value); setPage(1); }}
                      className="bg-transparent text-xs text-white font-medium focus:outline-none border-none cursor-pointer"
                    >
                      <option value="" className="bg-[#090D16] text-white/40">All Zones</option>
                      {zones.map(z => <option key={z} value={z} className="bg-[#090D16] text-white">Zone {z}</option>)}
                    </select>
                  </div>

                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3 px-3">Unique ID (UID)</th>
                      <th className="pb-3 px-3">Product Name</th>
                      <th className="pb-3 px-3">SKU</th>
                      <th className="pb-3 px-3">Location Slot</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Received Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-white/20 font-mono">No inventory records matched query</td>
                      </tr>
                    ) : (
                      inventoryList.map((item) => (
                        <tr key={item.UID} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-3 font-semibold text-cyan-400 font-mono">{item.UID}</td>
                          <td className="py-4 px-3 text-white font-semibold">{item.ProductName}</td>
                          <td className="py-4 px-3 font-medium text-white/50">{item.SKU}</td>
                          <td className="py-4 px-3 text-cyan-400 font-bold font-mono">
                            {item.Zone ? `${item.Zone}-${item.Aisle}-${item.Rack}-${item.Shelf}-${item.Bin}` : 'Transit'}
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                              item.Status === 'Stored' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25'
                            }`}>
                              {item.Status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right text-white/40 font-semibold">
                            {new Date(item.ReceivedDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Warehouse Movement History Lifecycle Timeline Widget */}
          <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-4 glass">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Stock Lifecycle Timeline Search</h2>
            </div>
            
            <form onSubmit={handleTimelineSearch} className="flex gap-2 max-w-md mt-1">
              <input
                type="number"
                value={timelineUid}
                onChange={(e) => setTimelineUid(e.target.value)}
                placeholder="Enter stock UID (e.g. 100000000001)..."
                className="flex-1 bg-white/5 border border-white/10 focus:border-cyan-400/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-cyan-500 text-[#090D16] px-5 rounded-xl text-xs font-bold uppercase hover:bg-cyan-400 transition-all cursor-pointer"
              >
                Track Unit
              </button>
            </form>

            {searchedTimelineUid && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
                  Relocation timeline for stock unit <span className="text-cyan-400 font-mono">UID-{searchedTimelineUid}</span>
                </h3>

                {loadingTimeline ? (
                  <div className="text-xs font-mono text-cyan-400 py-6">Reconstructing transaction ledger timeline...</div>
                ) : timelineEvents.length === 0 ? (
                  <div className="text-xs font-mono text-white/20 py-6">No movement events registered for this stock unit.</div>
                ) : (
                  <div className="relative pl-6 border-l border-cyan-500/20 space-y-6">
                    {timelineEvents.map((evt, index) => (
                      <div key={evt.MovementID} className="relative group">
                        
                        {/* Event bullet point */}
                        <div className="absolute -left-[30px] top-1 h-4.5 w-4.5 rounded-full bg-[#090D16] border-2 border-cyan-400 flex items-center justify-center">
                          <Clock className="w-2.5 h-2.5 text-cyan-400" />
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-400/25 transition-all">
                          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-400/20">
                                {evt.MovementType}
                              </span>
                              <span className="font-semibold text-white/80">Movement Record #{evt.MovementID}</span>
                            </div>
                            <span className="text-[10px] text-white/30 font-semibold font-mono">
                              {new Date(evt.MovementDate).toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center gap-3 text-xs bg-[#090D16]/40 p-2.5 rounded-lg border border-white/5">
                            <div className="text-white/40">From:</div>
                            <div className="font-mono text-white font-bold">{evt.FromZone ? `${evt.FromZone}-${evt.FromAisle}-${evt.FromRack}-${evt.FromShelf}-${evt.FromBin}` : 'Dock Station'}</div>
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                            <div className="text-white/40">To:</div>
                            <div className="font-mono text-cyan-400 font-bold">{evt.ToZone ? `${evt.ToZone}-${evt.ToAisle}-${evt.ToRack}-${evt.ToShelf}-${evt.ToBin}` : 'Transit Staging'}</div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default Inventory;
export { Inventory };
