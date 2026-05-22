import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { apiFetch } from '../services/api';
import { 
  Route, 
  Truck, 
  MapPin, 
  Navigation, 
  TrendingDown,
  ChevronRight
} from 'lucide-react';

const Network = () => {
  const { notifications } = useSocket();

  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState({ totalBatches: 0, totalOptimizedOrders: 0, totalWeightKG: '0.00', totalKMSaved: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      const data = await apiFetch('/network/batches');
      if (data.success) {
        setBatches(data.batches);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch network batches failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [notifications]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090D16] text-cyan-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] flex font-sans text-white">
      <Sidebar />

      <div className="flex-1 pl-72 flex flex-col min-w-0">
        <Header title="Network Logistics Router" />

        <main className="flex-1 p-8 flex flex-col gap-8 max-w-[1600px] w-full mx-auto">
          
          {/* Optimization stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1: Batches compiled */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex items-center justify-between hover:scale-[1.01] transition-all duration-300 glass group">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Optimized Batches</span>
                <span className="text-3xl font-extrabold text-white leading-none">{stats.totalBatches}</span>
                <span className="text-[10px] text-white/40 font-bold mt-1">Ready for route dispatch</span>
              </div>
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                <Truck className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 2: Optimized Orders */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex items-center justify-between hover:scale-[1.01] transition-all duration-300 glass group">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Grouped Orders</span>
                <span className="text-3xl font-extrabold text-white leading-none">{stats.totalOptimizedOrders}</span>
                <span className="text-[10px] text-white/40 font-bold mt-1">Consolidated shipments</span>
              </div>
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                <MapPin className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 3: Saved Mileage */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex items-center justify-between hover:scale-[1.01] transition-all duration-300 glass group">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Transit Travel Saved</span>
                <span className="text-3xl font-extrabold text-emerald-400 leading-none">{stats.totalKMSaved} KM</span>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3 animate-pulse" />
                  <span>Reduced carbon footprint</span>
                </span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 4: Total Grouped Weight */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex items-center justify-between hover:scale-[1.01] transition-all duration-300 glass group">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Consolidated Weight</span>
                <span className="text-3xl font-extrabold text-purple-400 leading-none">{stats.totalWeightKG} KG</span>
                <span className="text-[10px] text-white/40 font-bold mt-1">Consolidated truck payload</span>
              </div>
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20 transition-all">
                <Navigation className="h-6 w-6" />
              </div>
            </div>

          </div>

          {/* Grouped Batches Details */}
          <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-6 glass">
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Optimized City Dispatches Schedule</h2>
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Consolidated shipments schedules grouped by destination city</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {batches.length === 0 ? (
                <div className="col-span-full py-16 text-center text-white/20 font-mono text-xs">
                  No packed or dispatched orders are currently ready for network routing optimizations.
                </div>
              ) : (
                batches.map((batch) => (
                  <div key={batch.BatchID} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4 hover:border-cyan-400/30 transition-all">
                    
                    {/* Batch Summary Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white">{batch.City}</span>
                          <span className="text-[9px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded uppercase">
                            {batch.BatchID}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 font-semibold">Route group: egypt-{batch.City.toLowerCase()}</span>
                      </div>
                      
                      <div className="text-right">
                        <span className="block text-xs font-bold text-white">{batch.OrdersCount} Orders consolidated</span>
                        <span className="block text-[10px] text-emerald-400 font-semibold mt-0.5">-{batch.MilesSavedKM} KM saved</span>
                      </div>
                    </div>

                    <div className="h-[1px] w-full bg-white/5" />

                    {/* Dispatch vehicle specs */}
                    <div className="grid grid-cols-3 gap-3 text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white/40 uppercase">Dispatch Vehicle</span>
                        <span className="font-semibold text-white mt-0.5 truncate">{batch.VehicleType}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white/40 uppercase">Payload Weight</span>
                        <span className="font-semibold text-white mt-0.5">{batch.TotalWeight} KG</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white/40 uppercase">Trip Distance</span>
                        <span className="font-semibold text-white mt-0.5">{batch.DistanceKM} KM</span>
                      </div>
                    </div>

                    {/* Route Timeline mapping */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Optimized route timeline</span>
                      <div className="flex items-center gap-1 overflow-x-auto py-1">
                        {batch.OptimizedRoute.map((step, idx) => (
                          <div key={idx} className="flex items-center shrink-0">
                            <div className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-white">
                              {step}
                            </div>
                            {idx < batch.OptimizedRoute.length - 1 && (
                              <ChevronRight className="h-4 w-4 text-white/40 shrink-0 mx-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Network;
export { Network };
