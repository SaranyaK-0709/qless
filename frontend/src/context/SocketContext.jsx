import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    console.log(`🔌 Initializing Socket.IO connection to: ${socketUrl}`);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      
      // Auto join personal notifications room
      socketInstance.emit('join:user', user.id);
      
      // Auto join admin room if user is admin
      if (user.role === 'admin' && user.organization_id) {
        socketInstance.emit('join:admin', user.organization_id);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Room Join Helpers
  const joinBranch = (branchId) => {
    if (socket) socket.emit('join:branch', branchId);
  };

  const leaveBranch = (branchId) => {
    if (socket) socket.emit('leave:branch', branchId);
  };

  const joinQueue = (serviceId) => {
    if (socket) socket.emit('join:queue', serviceId);
  };

  const leaveQueue = (serviceId) => {
    if (socket) socket.emit('leave:queue', serviceId);
  };

  const joinAdmin = (orgId) => {
    if (socket) socket.emit('join:admin', orgId);
  };

  const leaveAdmin = (orgId) => {
    if (socket) socket.emit('leave:admin', orgId);
  };

  const joinCounter = (counterId) => {
    if (socket) socket.emit('join:counter', counterId);
  };

  return (
    <SocketContext.Provider value={{ socket, joinBranch, leaveBranch, joinQueue, leaveQueue, joinAdmin, leaveAdmin, joinCounter }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
