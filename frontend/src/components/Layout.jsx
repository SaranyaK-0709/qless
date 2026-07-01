import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Resolve topbar title based on route path
  const getPageTitle = (pathname) => {
    if (pathname.includes('/customer/book')) return 'Book Appointment / Token';
    if (pathname.includes('/customer/active')) return 'Active Queue Token';
    if (pathname.includes('/customer/queue')) return 'Live Queue Tracking';
    if (pathname.includes('/staff/counter')) return 'Counter Control Console';
    if (pathname.includes('/admin/analytics')) return 'Analytical Optimization Charts';
    if (pathname.includes('/admin/audit')) return 'Platform Audit Logs';
    if (pathname.includes('/admin')) return 'Organization Admin Dashboard';
    if (pathname.includes('/super-admin')) return 'Super Admin Platform Overview';
    return 'QLess Portal';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 animate-spin flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <div className="w-8 h-8 rounded-lg bg-[#0a0a0f]" />
          </div>
          <span className="text-slate-400 text-xs tracking-widest uppercase font-semibold animate-pulse mt-2">Loading Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Layout Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Topbar Header */}
        <Topbar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          title={getPageTitle(location.pathname)} 
        />

        {/* Content Body */}
        <main className="flex-grow p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
