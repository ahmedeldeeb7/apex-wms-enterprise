import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store/store';
import { ShieldAlert, User, Lock, Warehouse } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { addToast } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Credentials terminal fields cannot be blank');
      return;
    }

    setError('');
    setSubmitting(true);

    const result = await login(username, password);

    if (result.success) {
      addToast(`Session successfully established for ${username}`, 'success');
      // Role-based redirection logic
      switch (result.user.role) {
        case 'Inbound':
          navigate('/inbound');
          break;
        case 'Inventory':
          navigate('/inventory');
          break;
        case 'Outbound':
          navigate('/outbound');
          break;
        case 'Network':
          navigate('/network');
          break;
        default:
          navigate('/'); // Admin or fallback to Admin Dashboard
      }
    } else {
      setError(result.message || 'Access Denied: Authentication Failure');
      addToast(result.message || 'Authentication Failure', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090D16] p-4 relative overflow-hidden font-sans">
      {/* Background visual graphics - Warehouse grid blueprint lines */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 blur-[120px]" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-3xl p-8 relative z-10 border border-white/5 bg-[#0b101d]/85 shadow-[0_0_50px_rgba(6,182,212,0.1)] hover:shadow-[0_0_80px_rgba(6,182,212,0.25)] transition-all duration-700 glass">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-4 text-center mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Warehouse className="h-8 w-8 text-[#090D16]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-white">APEX <span className="text-cyan-400">WMS</span></h1>
            <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mt-1">Terminal Authentication Session</p>
          </div>
        </div>

        {/* Error panel */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs animate-pulse">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-white/40 uppercase">Terminal Login Username</label>
            <div className="relative flex items-center">
              <User className="absolute left-4 h-4.5 w-4.5 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin_operator"
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-xl py-3 px-11 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 font-medium"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-white/40 uppercase">Terminal Secure Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 h-4.5 w-4.5 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-xl py-3 px-11 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 font-medium"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cyan-500 text-[#090D16] font-bold text-sm tracking-wider uppercase py-3.5 rounded-xl mt-4 hover:bg-cyan-400 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#090D16] border-t-transparent"></div>
                <span>Securing Tunnel...</span>
              </div>
            ) : (
              <span>Establish Session</span>
            )}
          </button>
        </form>

        {/* Roles Hint Box */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest leading-normal">
            Authorizations are mapped dynamically by Active Directory RBAC.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
export { Login };
