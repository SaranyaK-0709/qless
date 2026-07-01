import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import {
  FiUsers, FiCheckSquare, FiClock, FiHeart,
  FiActivity, FiServer, FiSettings,
  FiAlertCircle, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { socket, joinAdmin, leaveAdmin } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      if (res.data && res.data.success) {
        setData(res.data.stats);
      } else {
        setError(res.data?.message || 'Server returned an error.');
      }
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to connect to server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time Socket.IO admin updates
  useEffect(() => {
    const orgId = user?.organization_id;
    if (!orgId || !socket) return;

    joinAdmin(orgId);
    const handleAdminUpdate = () => fetchDashboardData();
    socket.on('admin:update', handleAdminUpdate);

    return () => {
      leaveAdmin(orgId);
      socket.off('admin:update', handleAdminUpdate);
    };
  }, [user?.organization_id, socket]);

  // ── Loading State ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-xs">Loading analytics summaries...</span>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <FiAlertCircle className="w-12 h-12 text-rose-400" />
        </div>
        <div className="text-center max-w-md">
          <h3 className="text-white font-bold text-lg">Dashboard failed to load</h3>
          <p className="text-slate-400 text-sm mt-2 bg-white/5 border border-white/5 rounded-xl px-4 py-2 font-mono">
            {error || 'No data returned from server.'}
          </p>
          <p className="text-slate-500 text-xs mt-3">
            💡 Log out and log back in as <span className="text-indigo-400 font-semibold">admin@apollo.com</span> to refresh your session token.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
        >
          <FiRefreshCw className="w-4 h-4" /> Retry Now
        </button>
      </div>
    );
  }

  // ── Safe data extraction with fallbacks ───────────
  const serviceStats   = Array.isArray(data.serviceStats)  ? data.serviceStats  : [];
  const counterStats   = Array.isArray(data.counterStats)  ? data.counterStats  : [];
  const recentLogs     = Array.isArray(data.recentLogs)    ? data.recentLogs    : [];
  const totalVisitors  = data.totalVisitors  ?? 0;
  const completedCount = data.completedCount ?? 0;
  const avgWaitTime    = data.avgWaitTime    ?? 0;
  const healthScore    = data.healthScore    ?? 100;

  // ── Main Render ────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Visitors"
          value={totalVisitors}
          icon={FiUsers}
          trend="+12% from yesterday"
          trendType="success"
          color="indigo"
        />
        <StatCard
          title="Completed Tokens"
          value={completedCount}
          icon={FiCheckSquare}
          trend="+8% from yesterday"
          trendType="success"
          color="emerald"
        />
        <StatCard
          title="Avg Wait Time"
          value={`${avgWaitTime} Min`}
          icon={FiClock}
          trend="-2 min improvement"
          trendType="success"
          color="violet"
        />
        <StatCard
          title="Queue Health"
          value={`${healthScore}%`}
          icon={FiHeart}
          trend={healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Fair'}
          trendType={healthScore >= 60 ? 'success' : 'danger'}
          color={healthScore >= 80 ? 'emerald' : healthScore >= 60 ? 'amber' : 'rose'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Service Queues */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl text-left">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FiActivity className="text-indigo-400" /> Active Service Queues
            </h3>
            {serviceStats.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">No active services found for your organization.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 font-semibold uppercase tracking-wider text-left">
                      <th className="pb-3">Service Name</th>
                      <th className="pb-3">Prefix</th>
                      <th className="pb-3">Waiting</th>
                      <th className="pb-3">Active</th>
                      <th className="pb-3">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {serviceStats.map((svc) => (
                      <tr key={svc.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 font-semibold text-white">{svc.name}</td>
                        <td className="py-3 font-mono text-slate-400">{svc.prefix}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            svc.waiting_count > 10
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {svc.waiting_count ?? 0}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-emerald-400 font-bold">{svc.active_count ?? 0}</span>
                        </td>
                        <td className="py-3">{svc.avg_service_time} mins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Counter Status */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl text-left">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FiServer className="text-indigo-400" /> Counter Console Terminals
            </h3>
            {counterStats.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">No counters found for your organization.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {counterStats.map((c) => (
                  <div key={c.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">{c.staff_name || 'Unassigned'}</p>
                      <p className="text-[9px] text-indigo-400 font-semibold mt-0.5">{c.service_name || 'No Service'}</p>
                    </div>
                    <div className="text-right">
                      {c.current_token ? (
                        <div>
                          <span className="font-mono text-xs font-bold text-white bg-indigo-500/15 border border-indigo-500/20 px-2 py-1 rounded">
                            {c.current_token}
                          </span>
                          <p className="text-[9px] text-slate-500 mt-1.5 uppercase font-bold tracking-wider">{c.token_status}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 border border-white/5 px-2 py-1 rounded">
                          IDLE
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Audit Log */}
        <div className="lg:col-span-1 glass-panel border border-white/5 rounded-3xl p-6 shadow-xl text-left">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FiSettings className="text-indigo-400" /> Audit Log Feed
          </h3>
          {recentLogs.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-6">No recent activity yet.</p>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-[11px] before:w-[2px] before:bg-white/5">
              {recentLogs.map((log) => {
                let details = {};
                try { details = JSON.parse(log.details || '{}'); } catch (_) {}
                return (
                  <div key={log.id} className="relative pl-7 text-[11px]">
                    <div className="absolute left-[7px] top-[3px] w-[10px] h-[10px] rounded-full border-2 border-indigo-500 bg-[#0a0a0f] z-10" />
                    <p className="font-semibold text-slate-300">
                      {log.user_name || 'System'}{' '}
                      <span className="font-normal text-slate-400">performed</span>{' '}
                      <span className="font-bold text-white tracking-wider">{log.action}</span>
                    </p>
                    <p className="text-slate-500 mt-0.5 font-mono truncate">
                      {details.tokenNumber
                        ? `Token: ${details.tokenNumber}`
                        : details.email
                        ? `Email: ${details.email}`
                        : ''}
                    </p>
                    <span className="text-[9px] text-slate-600 mt-1 block">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
