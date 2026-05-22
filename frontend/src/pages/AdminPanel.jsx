import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Eye, Terminal, ToggleLeft, ToggleRight, Radio, Laptop, ShieldAlert } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import useStore from '../store/store';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';

const AdminPanel = () => {
  const { addToast } = useStore();
  const { notifications } = useSocket();

  const [users, setUsers] = useState([]);
  const [audits, setAudits] = useState([]);
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Administrative Configuration Variables states
  const [settings, setSettings] = useState({
    autoFifo: true,
    capacityLimit: 90,
    scannerMode: 'USB-HID Emulation',
    apiLogs: true
  });

  const fetchAdminData = async () => {
    try {
      // 1. Fetch Users
      const uRes = await apiFetch('/admin/users');
      if (uRes.success) {
        setUsers(uRes.users);
      }

      // 2. Fetch Stats (Audits & Logins)
      const statsRes = await apiFetch('/admin/stats');
      if (statsRes.success) {
        setAudits(statsRes.recentOperations || []);
        setLogins(statsRes.recentLogins || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading admin control panel data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [notifications]);

  const toggleUser = async (id) => {
    try {
      const data = await apiFetch(`/admin/users/${id}/toggle`, {
        method: 'PUT'
      });
      if (data.success) {
        addToast(data.message, 'success');
        fetchAdminData();
      } else {
        addToast(data.message || 'Failed to toggle operator status', 'error');
      }
    } catch (err) {
      addToast('Communication error locking user account', 'error');
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    addToast('System variable successfully updated', 'success');
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex font-sans text-white">
      <Sidebar />

      <div className="flex-1 pl-72 flex flex-col min-w-0">
        <Header title="Operator & System Console" />

        <main className="flex-1 p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
          
          {/* Title */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-cyan-400">Security Admin Console</h1>
              <p className="text-[10px] text-white/40 mt-1 uppercase font-semibold">Configure active operators, lockout credentials, and trace system parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* User Management Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-white/5 rounded-2xl bg-white/5 p-6 glass">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xs font-bold tracking-wider uppercase">Active Operators Matrix</h2>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-white/40 font-bold uppercase text-[9px] tracking-wider">
                        <th className="py-2.5 px-3">Operator Username</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Terminal Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-white/20 font-mono">No operators found in SQL registry</td>
                        </tr>
                      ) : (
                        users.map(u => (
                          <tr key={u.UserID} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-3 font-semibold text-white">{u.Username}</td>
                            <td className="py-4 px-3 text-cyan-400 font-bold font-mono">{u.Role || 'Operator'}</td>
                            <td className="py-4 px-3 text-white/60">{u.Department || 'Logistics'}</td>
                            <td className="py-4 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                u.IsActive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                              }`}>
                                {u.IsActive ? 'Active' : 'Locked'}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-right">
                              <button
                                onClick={() => toggleUser(u.UserID)}
                                className={`px-3 py-1.5 text-[9px] font-bold border rounded-lg transition-all cursor-pointer uppercase ${
                                  u.IsActive 
                                    ? 'border-red-500/20 hover:border-red-400/40 text-red-400 bg-red-500/5 hover:bg-red-500/10' 
                                    : 'border-emerald-500/20 hover:border-emerald-400/40 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                                }`}
                              >
                                {u.IsActive ? 'Lock Operator' : 'Unlock'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Trail Logs */}
              <div className="border border-white/5 rounded-2xl bg-white/5 p-6 glass">
                <div className="flex items-center gap-2 mb-6">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xs font-bold tracking-wider uppercase">Live Action Audits Timeline</h2>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {audits.length === 0 ? (
                    <div className="text-center text-xs font-mono text-white/20 py-8">No audit logs compiled in SQL registry</div>
                  ) : (
                    audits.map(a => (
                      <div key={a.AuditID} className="flex gap-4 p-3.5 rounded-xl border border-white/5 bg-white/5 text-xs hover:border-cyan-400/20 transition-all">
                        <div className="p-2 rounded bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 h-fit">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1.5 flex-wrap gap-1">
                            <span className="font-bold text-white">{a.Username} <span className="text-[10px] text-cyan-400 font-bold ml-1 font-mono uppercase bg-cyan-500/5 px-2 py-0.5 rounded">{a.Department || 'Logistics'}</span></span>
                            <span className="text-[10px] text-white/30 font-semibold font-mono">{new Date(a.OperationDate).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-white/60 font-medium">Performed: <span className="text-cyan-400 font-bold">{a.Operation}</span> targeting {a.ObjectType} "{a.ObjectName}"</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Global Settings & Presence stats */}
            <div className="space-y-6">
              
              {/* Settings Variables */}
              <div className="border border-white/5 rounded-2xl bg-white/5 p-6 glass">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xs font-bold tracking-wider uppercase">System Parameters Settings</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 text-xs">
                    <div>
                      <p className="font-semibold text-white/80">Auto FIFO Dispatch</p>
                      <p className="text-[10px] text-white/40 mt-0.5">Select earliest stored stock UIDs</p>
                    </div>
                    <button onClick={() => toggleSetting('autoFifo')} className="cursor-pointer">
                      {settings.autoFifo ? (
                        <ToggleRight className="w-6 h-6 text-cyan-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-white/20" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 text-xs">
                    <div>
                      <p className="font-semibold text-white/80">Structured API Audits</p>
                      <p className="text-[10px] text-white/40 mt-0.5">Log operator endpoints actions</p>
                    </div>
                    <button onClick={() => toggleSetting('apiLogs')} className="cursor-pointer">
                      {settings.apiLogs ? (
                        <ToggleRight className="w-6 h-6 text-cyan-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-white/20" />
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl border border-white/5 bg-white/5 text-xs space-y-2.5">
                    <div className="flex justify-between">
                      <span className="font-semibold text-white/80">Capacity Limit Alert</span>
                      <span className="text-cyan-400 font-bold font-mono">{settings.capacityLimit}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.capacityLimit}
                      onChange={(e) => setSettings(prev => ({ ...prev, capacityLimit: e.target.value }))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Active Presence Terminals */}
              <div className="border border-white/5 rounded-2xl bg-white/5 p-6 glass">
                <div className="flex items-center gap-2 mb-6">
                  <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h2 className="text-xs font-bold tracking-wider uppercase">Active Staff Terminals</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5 text-xs">
                    <Laptop className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="font-bold text-white/80">Fulfillment Hub # Cairo-East</p>
                      <p className="text-[9px] text-white/40 font-mono mt-0.5">IP: 192.168.1.45 (Active)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5 text-xs opacity-50">
                    <Laptop className="w-5 h-5 text-white/30" />
                    <div>
                      <p className="font-bold text-white/40">Dispatch Depot Giza</p>
                      <p className="text-[9px] text-white/30 font-mono mt-0.5">Offline (Session Cleared)</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
export { AdminPanel };
