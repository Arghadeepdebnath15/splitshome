import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { useFlat } from './FlatContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { currentFlat } = useFlat();
  const [toasts, setToasts] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);

  const addToast = (toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { ...toast, id }]);

    // Auto dismiss after 5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const socket = getSocket();

    if (user && user._id) {
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('join_user', user._id);

      if (currentFlat && currentFlat._id) {
        socket.emit('join_flat', currentFlat._id);
      }

      // Notifications
      socket.on('new_notification', (notification) => {
        addToast({
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          link: notification.link
        });
        setLastEvent({ type: 'notification', data: notification });
      });

      // Task events
      socket.on('task_created', (task) => {
        setLastEvent({ type: 'task_created', data: task });
      });

      socket.on('task_updated', (task) => {
        setLastEvent({ type: 'task_updated', data: task });
      });

      socket.on('task_completed', (data) => {
        setLastEvent({ type: 'task_completed', data });
      });

      socket.on('task_deleted', (data) => {
        setLastEvent({ type: 'task_deleted', data });
      });

      // Ledger events
      socket.on('ledger_updated', (data) => {
        setLastEvent({ type: 'ledger_updated', data });
      });

      // Exchange events
      socket.on('exchange_created', (data) => {
        setLastEvent({ type: 'exchange_created', data });
      });

      socket.on('exchange_updated', (data) => {
        setLastEvent({ type: 'exchange_updated', data });
      });

      // Item debt events
      socket.on('item_debt_created', (data) => {
        setLastEvent({ type: 'item_debt_created', data });
      });

      socket.on('item_debt_updated', (data) => {
        setLastEvent({ type: 'item_debt_updated', data });
      });

      // Activity
      socket.on('new_activity', (activity) => {
        setLastEvent({ type: 'new_activity', data: activity });
      });
    }

    return () => {
      if (socket) {
        socket.off('new_notification');
        socket.off('task_created');
        socket.off('task_updated');
        socket.off('task_completed');
        socket.off('task_deleted');
        socket.off('ledger_updated');
        socket.off('exchange_created');
        socket.off('exchange_updated');
        socket.off('item_debt_created');
        socket.off('item_debt_updated');
        socket.off('new_activity');
      }
    };
  }, [user?._id, currentFlat?._id]);

  return (
    <SocketContext.Provider value={{ toasts, dismissToast, addToast, lastEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

