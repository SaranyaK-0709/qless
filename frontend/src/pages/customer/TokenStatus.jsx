import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { FiClock, FiUsers, FiAward, FiMapPin, FiActivity, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TokenStatus = () => {
  const navigate = useNavigate();
  const { socket, joinQueue, leaveQueue } = useSocket();
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // 1. Fetch user's active tokens on mount
  const fetchActiveTokens = async (shouldSelectFirst = true) => {
    try {
      const res = await api.get('/tokens/user/active');
      if (res.data.success) {
        setTokens(res.data.tokens);
        if (res.data.tokens.length > 0 && shouldSelectFirst) {
          setSelectedToken(res.data.tokens[0].id);
        } else if (res.data.tokens.length === 0) {
          setDetails(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load active tokens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTokens(true);
  }, []);

  // 2. Fetch specific token details when selectedToken changes
  const fetchTokenDetails = async () => {
    if (!selectedToken) return;
    setDetailsLoading(true);
    try {
      const res = await api.get(`/tokens/${selectedToken}`);
      if (res.data.success) {
        setDetails(res.data.token);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenDetails();
  }, [selectedToken]);

  // 3. Connect Socket.IO listeners to receive real-time queue position updates
  useEffect(() => {
    if (details?.service_id && socket) {
      joinQueue(details.service_id);
      
      const handleQueueUpdate = () => {
        console.log('🔄 Live queue advanced! Refreshing token positions...');
        fetchTokenDetails();
      };

      socket.on('queue:update', handleQueueUpdate);

      return () => {
        leaveQueue(details.service_id);
        socket.off('queue:update', handleQueueUpdate);
      };
    }
  }, [details?.service_id, socket, selectedToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-xs tracking-wider">Loading active tokens...</span>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6 glass-panel border border-white/5 rounded-3xl mt-10">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6 text-indigo-400">
          <FiClock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Active Tokens</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You do not have any active appointments or booked tokens. Secure your spot in the virtual queue.
        </p>
        <button
          onClick={() => navigate('/customer/book')}
          className="glow-btn bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-all inline-flex items-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.25)]"
        >
          <span>Book Token</span>
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Token Selector Sidebar */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-2">Active Appointments</h3>
          <div className="space-y-2">
            {tokens.map((tk) => (
              <button
                key={tk.id}
                onClick={() => setSelectedToken(tk.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                  selectedToken === tk.id 
                    ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                    : 'glass-panel border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold tracking-wider text-sm">{tk.token_number}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tk.status === 'CALLED' 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse'
                      : tk.status === 'IN_SERVICE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25'
                  }`}>
                    {tk.status}
                  </span>
                </div>
                <p className="text-xs mt-2 font-semibold text-slate-300 truncate">{tk.service_name}</p>
                <p className="text-[10px] text-slate-500 mt-1 truncate">{tk.organization_name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Token Details Panel */}
        <div className="md:col-span-2">
          {detailsLoading ? (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-slate-500 text-xs">Loading queue state...</span>
            </div>
          ) : details ? (
            <div className="glass-panel border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
              
              {/* Pulsing overlay for Called state */}
              {details.status === 'CALLED' && (
                <div className="absolute inset-0 border border-amber-500/20 rounded-3xl bg-amber-500/[0.01] pulse-glow-active pointer-events-none" />
              )}

              {/* Status Header */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-slate-400 font-medium">
                <FiMapPin className="text-indigo-400" />
                <span>{details.organization_name}</span>
                <span className="text-slate-600">•</span>
                <span>{details.branch_name}</span>
              </div>

              {/* Token Number Card */}
              <div className="my-8">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Your Token Number</p>
                <div className="text-5xl font-black font-mono tracking-widest text-white mt-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  {details.token_number}
                </div>
                <div className="mt-4">
                  <span className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    details.status === 'CALLED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : details.status === 'IN_SERVICE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    Status: {details.status}
                  </span>
                </div>
              </div>

              {details.status === 'WAITING' ? (
                /* Waiting Stats Grid */
                <div className="grid grid-cols-2 gap-4 mt-6 border-t border-b border-white/5 py-6">
                  <div className="text-center">
                    <div className="inline-flex p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 mb-2">
                      <FiUsers className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-white">{details.people_ahead}</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">People Ahead</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex p-2.5 rounded-xl bg-violet-500/10 text-violet-400 mb-2">
                      <FiClock className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {details.estimated_wait} <span className="text-xs text-slate-400 font-normal">mins</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Estimated Wait</p>
                  </div>
                </div>
              ) : details.status === 'CALLED' ? (
                /* Called Banner */
                <div className="my-6 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <h4 className="text-lg font-bold">🔔 Please Proceed Now</h4>
                  <p className="text-sm mt-1 leading-relaxed">
                    Your token is being called at <strong className="text-white font-extrabold">{details.counter_name || 'Assigned Counter'}</strong>.
                  </p>
                </div>
              ) : (
                /* In Service Banner */
                <div className="my-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <h4 className="text-lg font-bold">🩺 Service in Progress</h4>
                  <p className="text-sm mt-1 leading-relaxed">
                    You are currently being served at <strong className="text-white font-extrabold">{details.counter_name}</strong>.
                  </p>
                </div>
              )}

              {/* Service Meta */}
              <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FiActivity className="text-indigo-400" />
                  <span>Service: {details.service_name}</span>
                </div>
                {details.status === 'WAITING' && details.current_serving && (
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/15">
                    <FiAward className="w-4.5 h-4.5" />
                    <span>Now Serving: {details.current_serving}</span>
                  </div>
                )}
              </div>

              {/* View Live Queue Action Button */}
              <div className="mt-8">
                <button
                  onClick={() => navigate('/customer/queue', { state: { serviceId: details.service_id, serviceName: details.service_name } })}
                  className="w-full py-3 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <span>View Live Queue Tracker</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Select a token from the sidebar to inspect its queue details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TokenStatus;
