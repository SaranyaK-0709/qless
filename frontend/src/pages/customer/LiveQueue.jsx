import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { FiUsers, FiClock, FiTv, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LiveQueue = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { socket, joinQueue, leaveQueue } = useSocket();

  // Dropdown list inputs
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);

  // Selection state
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedService, setSelectedService] = useState(() => {
    return location.state?.serviceId || '';
  });

  // Active Queue data
  const [queue, setQueue] = useState([]);
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // 1. Fetch initial organization selectors
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get('/organizations');
        if (res.data.success) {
          setOrganizations(res.data.organizations);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrgs();
  }, []);

  // 2. Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedOrg) return;
      try {
        const res = await api.get(`/organizations/${selectedOrg}/branches`);
        if (res.data.success) {
          setBranches(res.data.branches);
        }
      } catch (err) {
        console.error(err);
      }
    };
    setBranches([]);
    setSelectedBranch('');
    fetchBranches();
  }, [selectedOrg]);

  // 3. Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedBranch) return;
      try {
        const res = await api.get(`/organizations/branches/${selectedBranch}/services`);
        if (res.data.success) {
          setServices(res.data.services);
        }
      } catch (err) {
        console.error(err);
      }
    };
    setServices([]);
    setSelectedService('');
    fetchServices();
  }, [selectedBranch]);

  // 4. Fetch the queue list
  const fetchQueue = async () => {
    if (!selectedService) return;
    setLoadingQueue(true);
    try {
      const res = await api.get(`/tokens/live/service/${selectedService}`);
      if (res.data.success) {
        setQueue(res.data.queue);
        setCurrentlyServing(res.data.currentlyServing);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [selectedService]);

  // 5. Setup Socket.IO subscription
  useEffect(() => {
    if (selectedService && socket) {
      joinQueue(selectedService);

      const handleQueueUpdate = () => {
        console.log('🔄 Live queue update received via Socket.IO');
        fetchQueue();
      };

      socket.on('queue:update', handleQueueUpdate);

      return () => {
        leaveQueue(selectedService);
        socket.off('queue:update', handleQueueUpdate);
      };
    }
  }, [selectedService, socket]);

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FiTv className="text-indigo-400 animate-pulse" /> Live Queue Tracking Board
          </h2>
          <p className="text-slate-400 text-sm mt-1">Real-time status of service counters and active queues.</p>
        </div>

        {/* Dropdown Filters (Only show if not navigated directly with a service selection) */}
        <div className="flex flex-wrap gap-2">
          {!location.state?.serviceId && (
            <>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="" className="bg-[#0a0a0f] text-slate-500">Organization</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id} className="bg-[#0a0a0f] text-white">{org.name}</option>
                ))}
              </select>

              <select
                disabled={!selectedOrg}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="" className="bg-[#0a0a0f] text-slate-500">Branch</option>
                {branches.map(br => (
                  <option key={br.id} value={br.id} className="bg-[#0a0a0f] text-white">{br.name}</option>
                ))}
              </select>

              <select
                disabled={!selectedBranch}
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="" className="bg-[#0a0a0f] text-slate-500">Service Queue</option>
                {services.map(svc => (
                  <option key={svc.id} value={svc.id} className="bg-[#0a0a0f] text-white">{svc.name}</option>
                ))}
              </select>
            </>
          )}

          {location.state?.serviceId && (
            <button
              onClick={() => navigate('/customer/active')}
              className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 py-2 px-4 rounded-xl hover:bg-indigo-500/20 transition-all font-semibold"
            >
              ← Back to Active Token
            </button>
          )}
        </div>
      </div>

      {!selectedService ? (
        <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center text-slate-500">
          <FiAlertCircle className="w-8 h-8 mx-auto mb-3 text-slate-600" />
          <span>Please select an organization, branch, and service to view the live dashboard.</span>
        </div>
      ) : loadingQueue && queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-slate-500 text-xs">Connecting to live feed...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Currently Serving Banner Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="glass-panel border border-white/5 rounded-3xl p-6 text-center bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent relative overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Live Status
              </div>

              <h3 className="text-sm font-bold text-slate-400 mt-6 uppercase tracking-wider">Now Serving</h3>
              
              {currentlyServing ? (
                <div className="my-8">
                  <div className="text-6xl font-black font-mono tracking-widest text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                    {currentlyServing.token_number}
                  </div>
                  <p className="text-xs text-indigo-300 font-semibold mt-4 bg-indigo-500/10 border border-indigo-500/15 py-1.5 px-4 rounded-xl inline-block">
                    Proceed to {currentlyServing.counter_name}
                  </p>
                </div>
              ) : (
                <div className="my-10 text-slate-500 text-xs">
                  No active tokens are currently being served.
                </div>
              )}

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-around text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Total in Queue</p>
                  <p className="text-lg font-bold text-white mt-1">{queue.filter(t => t.status === 'WAITING').length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Avg service time</p>
                  <p className="text-lg font-bold text-white mt-1">10 <span className="text-[10px] text-slate-400 font-normal">min</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Queue Board */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center gap-1.5">
              <FiUsers className="text-indigo-400" /> Queue Board (Next in Line)
            </h3>
            
            <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl max-h-[500px] overflow-y-auto space-y-3">
              {queue.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  The queue is currently empty.
                </div>
              ) : (
                queue.map((tk, idx) => {
                  const isOwnToken = user && tk.user_id === user.id;
                  const isWaiting = tk.status === 'WAITING';
                  const isCalled = tk.status === 'CALLED';
                  const isInService = tk.status === 'IN_SERVICE';

                  return (
                    <div
                      key={tk.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isOwnToken
                          ? 'bg-indigo-600/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'bg-white/[0.02] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Position Indicator */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isOwnToken 
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'bg-white/5 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-mono font-bold tracking-wider text-white text-base">{tk.token_number}</span>
                          {isOwnToken && (
                            <span className="ml-2 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 px-1.5 py-0.5 rounded">
                              Your Token
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isWaiting ? (
                          <span className="text-[10px] font-bold bg-white/5 border border-white/5 text-slate-400 px-3 py-1 rounded-full">
                            Waiting
                          </span>
                        ) : isCalled ? (
                          <span className="text-[10px] font-bold bg-amber-500/15 border border-amber-500/25 text-amber-400 px-3 py-1 rounded-full animate-pulse">
                            Called
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-3 py-1 rounded-full">
                            Serving
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default LiveQueue;
