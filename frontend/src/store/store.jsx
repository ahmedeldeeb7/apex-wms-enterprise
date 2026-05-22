import React, { createContext, useContext, useState, useEffect } from 'react';

const StateContext = createContext(null);

export const StateProvider = ({ children }) => {
  // Auth Session State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('apex_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('apex_token') || null);

  // Command Palette & Global Overlays
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications & Interactive Toasts Log
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Active Terminal Staff States
  const [onlineEmployees, setOnlineEmployees] = useState(1);
  const [activeSystemLogs, setActiveSystemLogs] = useState([]);

  // Central Authentication handlers
  const loginSession = (accessToken, userData) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('apex_token', accessToken);
    localStorage.setItem('apex_user', JSON.stringify(userData));
  };

  const logoutSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
  };

  // Toast Queue Manager
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Keyboard Event Handlers for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const value = {
    user,
    token,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    searchQuery,
    setSearchQuery,
    notifications,
    setNotifications,
    toasts,
    setToasts,
    onlineEmployees,
    setOnlineEmployees,
    activeSystemLogs,
    setActiveSystemLogs,
    loginSession,
    logoutSession,
    addToast,
    removeToast
  };

  return (
    <StateContext.Provider value={value}>
      {children}
    </StateContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useStore must be utilized within a StateProvider context boundary');
  }
  return context;
};

export default useStore;
