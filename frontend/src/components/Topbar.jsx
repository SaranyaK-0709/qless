import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { FiBell, FiUser, FiLogOut, FiMenu, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Topbar = ({ isCollapsed, setIsCollapsed, title }) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.notifications.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Subscribe to real-time notifications via Socket.IO
  useEffect(() => {
    if (socket) {
      const handleNotification = (notif) => {
        setNotifications(prev => [
          {
            id: Date.now(),
            title: notif.title,
            message: notif.message,
            is_read: false,
            created_at: new Date().toISOString()
          },
          ...prev
        ]);
        setUnreadCount(prev => prev + 1);
        toast.success(`${notif.title}: ${notif.message}`, {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#12121a',
            color: '#f8fafc',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }
        });
      };

      socket.on('notification', handleNotification);

      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [socket]);

  const markAllAsRead = async () => {
    try {
      // Mark individually or update all
      const unreadNotifs = notifications.filter(n => !n.is_read);
      await Promise.all(unreadNotifs.map(n => api.put(`/notifications/${n.id}/read`)));
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#0a0a0f]/60 backdrop-blur-md sticky top-0 flex items-center justify-between px-6 z-20">
      <div className="flex items-center gap-4">
        {/* Mobile toggle menu */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 border border-white/5 md:hidden"
        >
          <FiMenu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white tracking-wide">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Icon and Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={`p-2.5 rounded-xl transition-all relative ${
              showNotifications ? 'bg-indigo-600/10 border-indigo-600/30 text-indigo-400' : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border border-[#0a0a0f] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-panel border border-white/10 rounded-2xl shadow-2xl py-2 overflow-hidden z-50">
              <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="font-semibold text-sm text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500 text-xs">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`px-4 py-3 border-b border-white/5 text-left transition-colors relative flex items-start gap-2 hover:bg-white/5 ${
                        !notif.is_read ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <div className="flex-grow">
                        <h4 className="text-xs font-semibold text-white">{notif.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                        <span className="text-[9px] text-slate-500 block mt-1">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!notif.is_read && (
                        <button 
                          onClick={() => markRead(notif.id)}
                          className="text-slate-500 hover:text-indigo-400 p-0.5" 
                          title="Mark read"
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile actions */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white truncate max-w-[100px]">{user?.name}</p>
              <p className="text-[9px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-48 glass-panel border border-white/10 rounded-2xl shadow-2xl py-2 overflow-hidden z-50">
              <div className="px-4 py-2 border-b border-white/5">
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={logout} 
                className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 transition-colors flex items-center gap-2"
              >
                <FiLogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
