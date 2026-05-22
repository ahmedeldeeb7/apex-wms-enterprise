import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, ShieldCheck, Users, Radio, Trash2 } from 'lucide-react';

const Header = ({ title }) => {
  const { user } = useAuth();
  const { notifications, activeUsers, clearNotifications, removeNotification, socket } = useSocket();
  const [showNotif, setShowNotif] = useState(false);

  if (!user) return null;

  return (
    <header className="flex items-center justify-between h-20 px-8 border-b border-dark-border bg-dark-bg/40 backdrop-blur-md sticky top-0 z-10 w-full">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide font-sans">{title}</h1>
        <p className="text-xs text-dark-muted">Fulfillment Hub Location #FC-CAIRO-1</p>
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center gap-6">
        {/* Real-time connection badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-dark-border">
          <Radio className={`h-4 w-4 animate-pulse ${socket?.connected ? 'text-success' : 'text-danger'}`} />
          <span className="text-[10px] font-bold tracking-widest uppercase text-dark-muted">
            {socket?.connected ? 'Sync Online' : 'Sync Offline'}
          </span>
        </div>

        {/* Active staff indicator */}
        <div className="flex items-center gap-2 text-dark-muted">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">{activeUsers.length} active terminals</span>
        </div>

        {/* Notifications Panel Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2.5 rounded-xl bg-white/5 border border-dark-border hover:bg-white/10 text-dark-muted hover:text-white transition-all duration-300 relative"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-accent text-[10px] font-bold text-dark-bg border border-dark-bg animate-bounce">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown overlay */}
          {showNotif && (
            <div className="glass-panel absolute right-0 mt-3 w-96 max-h-[500px] overflow-y-auto rounded-2xl z-30 py-3 shadow-glass flex flex-col border border-dark-border">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-dark-border">
                <span className="text-sm font-semibold text-white">Live Operations Log</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-danger hover:text-danger-light uppercase transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Notification rows */}
              <div className="flex flex-col py-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-dark-muted gap-2">
                    <ShieldCheck className="h-8 w-8 text-white/20" />
                    <span className="text-xs">All systems nominal. No alerts active.</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 border-b border-dark-border/40 last:border-0 hover:bg-white/5 transition-colors flex items-start justify-between gap-3 relative group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {/* Alert indicator dot */}
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            notif.type === 'alert' ? 'bg-danger' : 
                            notif.type === 'movement' ? 'bg-success' : 'bg-primary'
                          }`} />
                          <span className="text-xs font-semibold text-white truncate">{notif.title}</span>
                        </div>
                        <p className="text-xs text-dark-muted leading-relaxed break-words">{notif.message}</p>
                        <span className="text-[9px] text-dark-muted mt-1 block">
                          {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="text-[9px] font-bold text-dark-muted hover:text-danger border border-transparent group-hover:border-dark-border px-1.5 py-0.5 rounded transition-all"
                      >
                        Dismiss
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="h-[30px] w-[1px] bg-dark-border" />
          <div className="text-right">
            <span className="block text-xs text-dark-muted">Terminal User</span>
            <span className="block text-sm font-semibold text-white tracking-wide leading-tight">{user.username}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
