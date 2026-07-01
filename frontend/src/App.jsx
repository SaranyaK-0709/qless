import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import BookToken from './pages/customer/BookToken';
import TokenStatus from './pages/customer/TokenStatus';
import LiveQueue from './pages/customer/LiveQueue';

// Staff Pages
import CounterDashboard from './pages/staff/CounterDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Analytics from './pages/admin/Analytics';
import AuditLogs from './pages/admin/AuditLogs';

// Super Admin Pages
import PlatformDashboard from './pages/superAdmin/PlatformDashboard';

import { Toaster } from 'react-hot-toast';

// Helper component to redirect authenticated users home or to login
const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'customer':
      return <Navigate to="/customer/book" replace />;
    case 'staff':
      return <Navigate to="/staff/counter" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'super_admin':
      return <Navigate to="/super-admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function AppContent() {
  return (
    <>
      {/* React Hot Toast configurations */}
      <Toaster 
        toastOptions={{
          style: {
            background: '#12121a',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px'
          }
        }} 
      />
      
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Portal Routes */}
          <Route element={<Layout />}>
            {/* Customer Routes */}
            <Route path="/customer/book" element={<BookToken />} />
            <Route path="/customer/active" element={<TokenStatus />} />
            <Route path="/customer/queue" element={<LiveQueue />} />

            {/* Staff Routes */}
            <Route path="/staff/counter" element={<CounterDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/audit" element={<AuditLogs />} />

            {/* Super Admin Routes */}
            <Route path="/super-admin" element={<PlatformDashboard />} />
          </Route>

          {/* Root Fallback */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
