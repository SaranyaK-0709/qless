import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiLock, FiSearch, FiSliders, FiClock, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      if (res.data && res.data.success) {
        setLogs(res.data.logs || []);
        setFilteredLogs(res.data.logs || []);
      } else {
        setError(res.data?.message || 'Failed to load audit logs.');
      }
    } catch (err) {
      console.error('Audit logs fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs dynamically
  useEffect(() => {
    let result = logs;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(log => 
        (log.user_name && log.user_name.toLowerCase().includes(query)) ||
        (log.action && log.action.toLowerCase().includes(query)) ||
        (log.entity_type && log.entity_type.toLowerCase().includes(query))
      );
    }

    if (filterAction !== 'ALL') {
      result = result.filter(log => log.action === filterAction);
    }

    setFilteredLogs(result);
  }, [search, filterAction, logs]);

  // Extract unique action types for filter dropdown
  const actionTypes = ['ALL', ...new Set(logs.map(log => log.action))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-xs">Loading audit histories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-rose-400 text-sm font-semibold">{error}</p>
        <button onClick={fetchLogs} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 text-left">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FiLock className="text-indigo-400" /> Platform Security Audit Logs
          </h2>
          <p className="text-slate-400 text-sm mt-1">Immutable ledger trail of all activities, tokens, and staff console actions.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <FiSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="Search logs..."
            />
          </div>

          {/* Action Filter */}
          <div className="relative flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl py-1 px-3">
            <FiSliders className="text-slate-500 w-3.5 h-3.5" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white appearance-none cursor-pointer pr-4"
            >
              {actionTypes.map(act => (
                <option key={act} value={act} className="bg-[#0a0a0f] text-white">
                  {act.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vertical Timeline Card */}
      <div className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No audit logs match your filters.
          </div>
        ) : (
          <div className="relative before:absolute before:inset-y-1 before:left-[17px] before:w-[2px] before:bg-white/5 space-y-6">
            {filteredLogs.map((log) => {
              const details = (() => { try { return JSON.parse(log.details || '{}'); } catch(_) { return {}; } })();
              
              // Color code actions
              const isBooking = log.action === 'TOKEN_BOOKED' || log.action === 'USER_REGISTERED';
              const isCall = log.action === 'TOKEN_CALLED';
              const isComplete = log.action === 'TOKEN_COMPLETED' || log.action === 'TOKEN_STARTED';
              const isSkip = log.action === 'TOKEN_SKIPPED' || log.action === 'TOKEN_CANCELLED';

              const badgeColor = isBooking 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15'
                : isCall 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                : isComplete 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/15';

              return (
                <div key={log.id} className="relative pl-10 flex flex-col md:flex-row md:items-start justify-between gap-2">
                  {/* Timeline bullet */}
                  <div className={`absolute left-[11px] top-[4px] w-3 h-3 rounded-full border-2 bg-[#0a0a0f] z-10 ${
                    isBooking ? 'border-indigo-500' : isCall ? 'border-amber-500' : isComplete ? 'border-emerald-500' : 'border-rose-500'
                  }`} />
                  
                  {/* Left Column: Action Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-400 text-xs font-semibold">{log.user_name || 'System'}</span>
                      <span className="text-slate-600 text-xs">•</span>
                      <span className="text-slate-500 text-[10px] font-mono">{log.ip_address}</span>
                    </div>
                    
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {log.action === 'USER_REGISTERED' && `Registered user ${details.email} as role ${details.role}`}
                      {log.action === 'USER_LOGIN' && `User signed into account: ${details.email}`}
                      {log.action === 'TOKEN_BOOKED' && `Booked queue token ${details.tokenNumber} for service ID ${details.serviceId}`}
                      {log.action === 'TOKEN_CALLED' && `Called token ${details.tokenNumber} at counter ${details.counterName}`}
                      {log.action === 'TOKEN_STARTED' && `Started serving token ${details.tokenNumber}`}
                      {log.action === 'TOKEN_COMPLETED' && `Completed token ${details.tokenNumber} in ${Math.round(details.duration / 60)} minutes`}
                      {log.action === 'TOKEN_SKIPPED' && `Skipped client token ${details.tokenNumber}`}
                    </p>
                  </div>

                  {/* Right Column: Date Stamp */}
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] md:self-start md:pt-1">
                    <FiClock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
