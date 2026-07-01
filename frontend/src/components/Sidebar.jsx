import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiLayout, FiCalendar, FiActivity, FiCpu, 
  FiClock, FiTrendingUp, FiLock, FiChevronLeft, 
  FiChevronRight, FiLogOut, FiLayers
} from 'react-icons/fi';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();

  const getMenuLinks = () => {
    switch (user?.role) {
      case 'customer':
        return [
          { path: '/customer/book', label: 'Book Token', icon: FiCalendar },
          { path: '/customer/active', label: 'Active Token', icon: FiClock },
          { path: '/customer/queue', label: 'Live Queue Tracking', icon: FiActivity }
        ];
      case 'staff':
        return [
          { path: '/staff/counter', label: 'Counter Console', icon: FiCpu }
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'Overview', icon: FiLayout, end: true },
          { path: '/admin/analytics', label: 'Analytics & Trends', icon: FiTrendingUp },
          { path: '/admin/audit', label: 'Audit Timeline', icon: FiLock }
        ];
      case 'super_admin':
        return [
          { path: '/super-admin', label: 'Platform Settings', icon: FiLayers }
        ];
      default:
        return [];
    }
  };

  const links = getMenuLinks();

  return (
    <aside 
      className={`glass-panel border-r border-white/5 h-screen sticky top-0 flex flex-col justify-between transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Header Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] flex-shrink-0">
              Q
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-lg text-white tracking-tight">
                QLess<span className="text-indigo-400">.</span>
              </span>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)} 
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors hidden md:block"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
          )}
          {isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(false)} 
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors absolute -right-3 top-4 bg-[#0d0d15] border border-white/5 rounded-full hidden md:block"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 px-4 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105`} />
                {!isCollapsed && <span>{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Block */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between gap-3 overflow-hidden bg-white/5 rounded-2xl p-3 border border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center font-bold text-indigo-300 text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={logout} 
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors flex-shrink-0"
              title="Logout"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
