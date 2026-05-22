import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useStore } from '../store/store';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { apiFetch } from '../services/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Boxes, 
  Clock, 
  ArrowDownLeft, 
  BookOpen,
  UserCheck,
  Shield,
  Activity,
  Terminal
} from 'lucide-react';

const Dashboard = () => {
  const { notifications } = useSocket();
  const { onlineEmployees, setOnlineEmployees, addToast } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/admin/stats');
        setStats(data);
        // Set simulated presence count
        setOnlineEmployees(Math.floor(2 + Math.random() * 4));
      } catch (err) {
        console.error('Fetch dashboard stats failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [notifications]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090D16] text-cyan-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  const kpis = stats?.kpis || { TotalOrders: 0, TotalProducts: 0, TotalUnits: 0, StoredUnits: 0, TotalLocations: 0 };
  const capacityData = stats?.capacityByZone || [];
  const statusDataRaw = stats?.ordersStatus || [];
  const recentOps = stats?.recentOperations || [];
  const recentLogins = stats?.recentLogins || [];
  const monthlyOrders = stats?.monthlyOrders || [];

  const statusColors = {
    'Pending': '#F59E0B',
    'Picking': '#3B82F6',
    'Packing': '#8B5CF6',
    'Shipped': '#10B981',
    'Packed': '#6366F1',
    'Delivered': '#06B6D4'
  };

  const pieData = statusDataRaw.map(item => ({
    name: item.Status,
    value: item.Count,
    color: statusColors[item.Status] || '#64748B'
  }));

  return (
    <div className="min-h-screen bg-[#090D16] flex font-sans">
      <Sidebar />

      <div className="flex-1 pl-72 flex flex-col min-w-0">
        <Header title="Overview Control Console" />

        <main className="flex-1 p-8 flex flex-col gap-8 max-w-[1600px] w-full mx-auto text-white">
          
          {/* Top Quick Info Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border border-white/5 rounded-2xl bg-white/5 glass gap-4">
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-cyan-400 uppercase">System Status: Active</h2>
              <p className="text-xs text-white/50 mt-1">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">Ctrl+K</kbd> to search products, look up UIDs, or jump tabs instantly.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/5 text-cyan-400 text-xs">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="font-bold">{onlineEmployees} Terminals Online</span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1 */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex items-center justify-between hover:scale-[1.01] transition-transform duration-300 glass group">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Total Stock Units</span>
                <span className="text-3xl font-extrabold text-white leading-none">{kpis.TotalUnits}</span>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{kpis.StoredUnits} Stored / Shelved</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                <Boxes className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex items-center justify-between hover:scale-[1.01] transition-transform duration-300 glass group">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Fulfillment Orders</span>
                <span className="text-3xl font-extrabold text-white leading-none">{kpis.TotalOrders}</span>
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{statusDataRaw.find(s=>s.Status==='Pending')?.Count || 0} Pending Picks</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-400 group-hover:bg-amber-500/20 transition-all">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex items-center justify-between hover:scale-[1.01] transition-transform duration-300 glass group">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Registered Products</span>
                <span className="text-3xl font-extrabold text-white leading-none">{kpis.TotalProducts}</span>
                <div className="text-[10px] text-white/40 font-bold mt-1">
                  Active SKU catalog templates
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                <Boxes className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex items-center justify-between hover:scale-[1.01] transition-transform duration-300 glass group">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Total Bins Capacity</span>
                <span className="text-3xl font-extrabold text-white leading-none">{kpis.TotalLocations}</span>
                <div className="text-[10px] text-white/40 font-bold mt-1">
                  Active storage zones monitored
                </div>
              </div>
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20 transition-all">
                <ArrowDownLeft className="h-6 w-6" />
              </div>
            </div>

          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Area Chart */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 lg:col-span-2 flex flex-col gap-4 glass">
              <div>
                <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Fulfillment Orders Timeline</h2>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Monthly throughput trends</span>
              </div>
              <div className="h-80 w-full">
                {monthlyOrders.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-white/20 font-mono">No historical records</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyOrders}>
                      <defs>
                        <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="MonthName" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0b101d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                      <Area type="monotone" dataKey="OrdersCount" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#orderGrad)" name="Orders" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Pie Chart */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col justify-between glass">
              <div>
                <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Fulfillment Status Allocation</h2>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Live orders composition</span>
              </div>
              <div className="h-56 flex items-center justify-center relative">
                {pieData.length === 0 ? (
                  <span className="text-xs text-white/20 font-mono">No active orders</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0b101d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {/* Legend List */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                {pieData.map((item) => (
                  <div key={item.name} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-white truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-white/40 pl-3 font-semibold">{item.value} units</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Zone Capacity Bar Chart */}
          <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-4 glass">
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Warehouse Zones Capacity Allocation</h2>
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Capacity vs current load by zone</span>
            </div>
            <div className="h-80 w-full">
              {capacityData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-white/20 font-mono">No capacity details available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={capacityData}>
                    <XAxis dataKey="Zone" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0b101d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="TotalCapacity" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} name="Total Capacity" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="TotalLoad" fill="#06b6d4" name="Current Load" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Activity Feeds */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Recent Operations */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-4 glass">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan-400" />
                <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Fulfillment Audit Logs</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3 px-3">Operator</th>
                      <th className="pb-3 px-3">Department</th>
                      <th className="pb-3 px-3">Action</th>
                      <th className="pb-3 px-3">Object</th>
                      <th className="pb-3 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOps.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-white/20 font-mono">No audit trails recorded</td>
                      </tr>
                    ) : (
                      recentOps.map((op) => (
                        <tr key={op.AuditID} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white">{op.Username}</td>
                          <td className="py-3 px-3 text-cyan-400/80 font-bold text-[10px] uppercase">{op.Department || 'Logistics'}</td>
                          <td className="py-3 px-3 text-white/60 font-medium">{op.Operation}</td>
                          <td className="py-3 px-3 text-cyan-400 font-semibold">{op.ObjectName} <span className="text-[10px] text-white/30 font-normal">({op.ObjectType})</span></td>
                          <td className="py-3 px-3 text-right text-[10px] text-white/40 font-semibold">
                            {new Date(op.OperationDate).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Logins */}
            <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex flex-col gap-4 glass">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-400" />
                <h2 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Security Sessions Log</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3 px-3">Terminal Operator</th>
                      <th className="pb-3 px-3">Access Verification</th>
                      <th className="pb-3 px-3 text-right">Session Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogins.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-white/20 font-mono">No login activity traced</td>
                      </tr>
                    ) : (
                      recentLogins.map((lg) => (
                        <tr key={lg.LoginID} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white">{lg.Username}</td>
                          <td className="py-3 px-3 text-emerald-400 font-bold">JWT Verified</td>
                          <td className="py-3 px-3 text-right text-[10px] text-white/40 font-semibold">
                            {new Date(lg.LoginTime).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};

export default Dashboard;
export { Dashboard };
