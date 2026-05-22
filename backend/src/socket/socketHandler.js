import { Server } from 'socket.io';

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allows connecting from any development port
      methods: ['GET', 'POST']
    }
  });

  console.log('Socket.IO Server Initialized');

  // Tracking online users count dynamically
  let onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // User identifies themselves and joins specific role/department rooms
    socket.on('auth:identify', (data) => {
      if (data && data.username) {
        socket.username = data.username;
        socket.role = data.role;
        onlineUsers.set(socket.id, { username: data.username, role: data.role });
        
        console.log(`User [${data.username}] with Role [${data.role}] registered socket ID: ${socket.id}`);

        // Join specific role-based room
        socket.join(data.role);
        // Also join general authenticated room
        socket.join('authenticated');

        // Broadcast active users updates to Admins
        io.emit('system:users', Array.from(onlineUsers.values()));
      }
    });

    // Custom notification broker
    socket.on('notification:publish', (notification) => {
      // Broadcast globally or to target room
      if (notification.targetRoom) {
        io.to(notification.targetRoom).emit('notification:receive', notification);
      } else {
        io.emit('notification:receive', notification);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      if (socket.username) {
        console.log(`User [${socket.username}] disconnected`);
        onlineUsers.delete(socket.id);
        io.emit('system:users', Array.from(onlineUsers.values()));
      } else {
        console.log(`Anonymous client disconnected: ${socket.id}`);
      }
    });
  });

  return io;
};
