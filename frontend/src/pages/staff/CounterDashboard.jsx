import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { FiUsers, FiClock, FiCpu, FiAlertTriangle, FiCheck, FiPlay, FiSkipForward } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CounterDashboard = () => {
  const { socket, joinQueue, leaveQueue } = useSocket();
  const [counter, setCounter] = useState(null);
  const [stats, setStats] = useState({ servedCount: 0, avgDuration: 0 });
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCounterStatus = async () => {
    try {
      const res = await api.get('/tokens/staff/counter-status');
      if (res.data.success) {
        setCounter(res.data.counter);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve counter status.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingQueue = async () => {
    if (!counter?.service_id) return;
    try {
      const res = await api.get(`/tokens/live/service/${counter.service_id}`);
      if (res.data.success) {
        // filter only WAITING tokens
        setQueue(res.data.queue.filter(t => t.status === 'WAITING'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCounterStatus();
  }, []);

  useEffect(() => {
    if (counter?.service_id) {
      fetchUpcomingQueue();
    }
  }, [counter]);

  // Subscribe to real-time events via Socket.IO
  useEffect(() => {
    if (counter?.service_id && socket) {
      joinQueue(counter.service_id);

      const handleQueueUpdate = () => {
        console.log('🔄 Counter queue update received!');
        fetchUpcomingQueue();
        fetchCounterStatus(); // reload status to update served stats
      };

      socket.on('queue:update', handleQueueUpdate);

      return () => {
        leaveQueue(counter.service_id);
        socket.off('queue:update', handleQueueUpdate);
      };
    }
  }, [counter?.service_id, socket]);

  // Operations
  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/tokens/call');
      if (res.data.success) {
        if (res.data.token) {
          toast.success(`Token ${res.data.token.token_number} called!`);
          fetchCounterStatus();
        } else {
          toast.error('No customers waiting in the queue.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Call next failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async () => {
    if (!counter?.token_id) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/tokens/${counter.token_id}/start`);
      if (res.data.success) {
        toast.success('Service started!');
        fetchCounterStatus();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to start service.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async () => {
    if (!counter?.token_id) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/tokens/${counter.token_id}/complete`);
      if (res.data.success) {
        toast.success('Service completed successfully!');
        fetchCounterStatus();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete service.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipService = async () => {
    if (!counter?.token_id) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/tokens/${counter.token_id}/skip`);
      if (res.data.success) {
        toast.success('Token skipped / marked missed.');
        fetchCounterStatus();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to skip token.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-xs">Loading Console state...</span>
      </div>
    );
  }

  if (!counter) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6 glass-panel border border-white/5 rounded-3xl mt-10">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 text-rose-400">
          <FiAlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Counter Assignment Needed</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          You are currently not mapped to any active counter. Ask your administrator to assign Counter and Service mappings.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4">
      {/* Console Header Info */}
      <div className="mb-6 flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/15">
            <FiCpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{counter.name} Console</h2>
            <p className="text-xs text-indigo-300 font-semibold">{counter.service_name}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full uppercase tracking-widest">
          Active Serving Mode
        </span>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="glass-panel border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Served Today</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.servedCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <FiCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Avg Service Speed</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.avgDuration} <span className="text-xs text-slate-400 font-normal">mins</span></p>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/10 text-violet-400">
            <FiClock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Waiting in Line</span>
            <p className="text-2xl font-bold text-white mt-1">{queue.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <FiUsers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Call Actions Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Actions Panel */}
        <div className="md:col-span-2 glass-panel border border-white/5 rounded-3xl p-8 text-center relative overflow-hidden flex flex-col justify-center min-h-[350px]">
          {counter.token_number ? (
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Ticket</p>
              <h3 className="text-7xl font-black font-mono tracking-widest text-white mt-4 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                {counter.token_number}
              </h3>
              
              <div className="mt-4 mb-8">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                  counter.token_status === 'CALLED'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                }`}>
                  Status: {counter.token_status}
                </span>
              </div>

              {/* Action buttons based on status */}
              <div className="flex flex-wrap justify-center gap-3">
                {counter.token_status === 'CALLED' && (
                  <button
                    onClick={handleStartService}
                    disabled={actionLoading}
                    className="glow-btn bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-3 px-6 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center gap-2"
                  >
                    <FiPlay /> Start Serving
                  </button>
                )}

                {counter.token_status === 'IN_SERVICE' && (
                  <button
                    onClick={handleCompleteService}
                    disabled={actionLoading}
                    className="glow-btn bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center gap-2"
                  >
                    <FiCheck /> Complete Ticket
                  </button>
                )}

                <button
                  onClick={handleSkipService}
                  disabled={actionLoading}
                  className="py-3 px-6 bg-[#1a1a2e] border border-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-xl text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-2"
                >
                  <FiSkipForward /> Skip / Miss
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6 text-indigo-400">
                <FiUsers className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Counter is Idle</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                You are ready to accept new clients. Pull the next waiting visitor in queue.
              </p>
              
              <button
                onClick={handleCallNext}
                disabled={actionLoading || queue.length === 0}
                className="glow-btn bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3.5 px-8 rounded-xl text-xs tracking-wider uppercase transition-all inline-flex items-center gap-2 shadow-[0_4px_25px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Call Next Customer</span>
              </button>
            </div>
          )}
        </div>

        {/* Next Customers Panel */}
        <div className="md:col-span-1 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Next in Line</h4>
          
          <div className="glass-panel border border-white/5 rounded-3xl p-5 space-y-2 max-h-[350px] overflow-y-auto">
            {queue.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No customers waiting.
              </div>
            ) : (
              queue.map((tk, idx) => (
                <div key={tk.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-semibold">#{idx + 1}</span>
                    <span className="font-mono font-bold tracking-wider text-white">{tk.token_number}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Waiting</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CounterDashboard;
