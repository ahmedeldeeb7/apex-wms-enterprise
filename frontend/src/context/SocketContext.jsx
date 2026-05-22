import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io('http://localhost:5000');

    // Register user credentials on connection
    socketInstance.on('connect', () => {
      console.log('Socket connected client-side:', socketInstance.id);
      
      socketInstance.emit('auth:identify', {
        username: user.username,
        role: user.role
      });
    });

    // Real-time Event Listeners
    socketInstance.on('notification:receive', (data) => {
      addNotification(data);
    });

    socketInstance.on('inventory:movement', (data) => {
      addNotification({
        id: Math.random().toString(36).substring(2, 9),
        title: 'Inventory Movement',
        message: data.message || `UID ${data.UID} moved from Location ${data.FromLocation || 'N/A'} to ${data.ToLocation}`,
        type: 'movement',
        time: new Date()
      });
    });

    socketInstance.on('order:update', (data) => {
      addNotification({
        id: Math.random().toString(36).substring(2, 9),
        title: 'Order Status Updated',
        message: `Order #${data.OrderID} is now [${data.Status}]`,
        type: 'order',
        time: new Date()
      });
    });

    socketInstance.on('capacity:warning', (data) => {
      addNotification({
        id: Math.random().toString(36).substring(2, 9),
        title: '⚠️ Warehouse Alert',
        message: data.message,
        type: 'alert',
        time: new Date()
      });
    });

    socketInstance.on('shipment:new', (data) => {
      addNotification({
        id: Math.random().toString(36).substring(2, 9),
        title: 'Inbound Shipment',
        message: `New Inbound Shipment registered. ID: ${data.ShipmentID}`,
        type: 'shipment',
        time: new Date()
      });
    });

    socketInstance.on('system:users', (users) => {
      setActiveUsers(users);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  const addNotification = (notif) => {
    setNotifications((prev) => [
      {
        id: notif.id || Math.random().toString(36).substring(2, 9),
        title: notif.title || 'System Notification',
        message: notif.message,
        type: notif.type || 'info',
        time: notif.time || new Date()
      },
      ...prev
    ].slice(0, 50)); // Keep last 50 notifications
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, activeUsers, addNotification, clearNotifications, removeNotification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
