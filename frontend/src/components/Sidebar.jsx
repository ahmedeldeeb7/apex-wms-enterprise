import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowDownLeft, 
  Boxes, 
  ArrowUpRight, 
  Route, 
  FileBarChart2, 
  LogOut,
  Warehouse
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Filter links dynamically based on user role (Admin sees all)
  const navLinks = [
    { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard, roles: ['Admin'] },
    { path: '/inbound', label: 'Inbound Control', icon: ArrowDownLeft, roles: ['Admin', 'Inbound'] },
    { path: '/inventory', label: 'Inventory Grid', icon: Boxes, roles: ['Admin', 'Inventory'] },
    { path: '/outbound', label: 'Outbound Sorting', icon: ArrowUpRight, roles: ['Admin', 'Outbound'] },
    { path: '/network', label: 'Network Logistics', icon: Route, roles: ['Admin', 'Network'] },
    { path: '/reports', label: 'Analytical Reports', icon: FileBarChart2, roles: ['Admin'] }
  ].filter(link => link.roles.includes(user.role));

  return (
    <aside className="glass-panel w-72 h-screen fixed left-0 top-0 z-20 flex flex-col justify-between border-r border-dark-border py-6 px-4">
      {/* Brand Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-accent to-accent-light shadow-amazon-glow">
            <Warehouse className="h-6 w-6 text-dark-bg" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wider text-white">APEX <span className="text-accent">WMS</span></h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-dark-muted">Fulfillment OS</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-dark-border" />

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `
                  flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300
                  ${isActive 
                    ? 'bg-accent/15 text-accent border border-accent/20 shadow-amazon-glow scale-102 font-semibold' 
                    : 'text-dark-muted hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="flex flex-col gap-4">
        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-dark-border">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/20 text-primary font-bold border border-primary/20">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate text-white">{user.username}</h2>
            <span className="text-[10px] font-bold tracking-wider text-accent uppercase leading-none">{user.role}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-danger/80 hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/15 transition-all duration-300 w-full"
        >
          <LogOut className="h-5 w-5" />
          <span>Exit Terminal</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
