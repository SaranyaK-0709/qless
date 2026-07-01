import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  Cell, ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts';
import { FiTrendingUp, FiPieChart, FiClock, FiAlertCircle, FiRefreshCw, FiInfo } from 'react-icons/fi';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c084fc', '#f472b6', '#fb7185'];

const Analytics = () => {
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      if (res.data && res.data.success) {
        setCharts(res.data.charts);
      } else {
        setError(res.data?.message || 'Server returned an error.');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // ── Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-xs">Loading analytics visualizations...</span>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────
  if (error || !charts) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <FiAlertCircle className="w-12 h-12 text-rose-400" />
        </div>
        <div className="text-center max-w-md">
          <h3 className="text-white font-bold text-lg">Analytics failed to load</h3>
          <p className="text-slate-400 text-sm mt-2 bg-white/5 border border-white/5 rounded-xl px-4 py-2 font-mono">
            {error || 'No data returned.'}
          </p>
          <p className="text-slate-500 text-xs mt-3">
            💡 Log out and log back in to refresh your session.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // ── Safe data extraction ─────────────────────────
  const peakHours         = Array.isArray(charts.peakHours)         ? charts.peakHours         : [];
  const dailyTrends       = Array.isArray(charts.dailyTrends)       ? charts.dailyTrends       : [];
  const serviceDistribution = Array.isArray(charts.serviceDistribution) ? charts.serviceDistribution : [];

  const NoData = ({ label }) => (
    <div className="h-72 flex flex-col items-center justify-center text-slate-500 gap-2">
      <FiInfo className="w-8 h-8 opacity-40" />
      <p className="text-xs">{label}</p>
      <p className="text-[10px] text-slate-600">Book tokens and process them to see data here.</p>
    </div>
  );

  return (
    <div className="space-y-6 text-left">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Analytics &amp; Reports</h2>
        <p className="text-slate-400 text-sm mt-1">
          Visitor volumes, peak hours, and service load analytics for your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Peak Hours Chart */}
        <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <FiClock className="text-indigo-400" /> Hourly Peak Traffic (Today)
          </h3>
          {peakHours.length === 0 ? (
            <NoData label="No token data for today yet." />
          ) : (
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours}>
                  <defs>
                    <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="url(#colorIndigo)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Daily Trends Chart */}
        <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-indigo-400" /> Visitor Trends (Last 7 Days)
          </h3>
          {dailyTrends.length === 0 ? (
            <NoData label="No trend data available yet." />
          ) : (
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrends}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Service Distribution */}
        <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <FiPieChart className="text-indigo-400" /> Service Distribution
          </h3>
          {serviceDistribution.length === 0 ? (
            <NoData label="No service distribution data yet. Book and complete some tokens first." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceDistribution}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {serviceDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Service Shares</h4>
                <div className="grid grid-cols-2 gap-4">
                  {serviceDistribution.map((entry, idx) => (
                    <div key={entry.name || idx} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div className="truncate">
                        <p className="font-semibold text-white truncate">{entry.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{entry.value} tickets</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Analytics;
