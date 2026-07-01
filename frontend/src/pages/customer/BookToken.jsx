import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiBriefcase, FiMapPin, FiActivity, FiUsers, FiClock, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BookToken = () => {
  const navigate = useNavigate();
  
  // Data lists
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  
  // Selections
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedService, setSelectedService] = useState('');
  
  // Previews & States
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [error, setError] = useState('');

  // 1. Fetch organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get('/organizations');
        if (res.data.success) {
          setOrganizations(res.data.organizations);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch organizations.');
      }
    };
    fetchOrgs();
  }, []);

  // 2. Fetch branches when organization changes
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedOrg) {
        setBranches([]);
        return;
      }
      try {
        const res = await api.get(`/organizations/${selectedOrg}/branches`);
        if (res.data.success) {
          setBranches(res.data.branches);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load branches.');
      }
    };
    
    setBranches([]);
    setServices([]);
    setSelectedBranch('');
    setSelectedService('');
    fetchBranches();
  }, [selectedOrg]);

  // 3. Fetch services when branch changes
  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedBranch) {
        setServices([]);
        return;
      }
      try {
        const res = await api.get(`/organizations/branches/${selectedBranch}/services`);
        if (res.data.success) {
          setServices(res.data.services);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load services.');
      }
    };
    
    setServices([]);
    setSelectedService('');
    fetchServices();
  }, [selectedBranch]);

  // 4. Load queue preview when service is selected
  useEffect(() => {
    const fetchQueuePreview = async () => {
      if (!selectedService) return;
      setPreviewLoading(true);
      try {
        // Find selected service meta
        const svc = services.find(s => s.id === parseInt(selectedService));
        if (svc) {
          setAvgTime(svc.avg_service_time);
        }

        const res = await api.get(`/tokens/live/service/${selectedService}`);
        if (res.data.success) {
          setQueueCount(res.data.queue.filter(t => t.status === 'WAITING').length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setPreviewLoading(false);
      }
    };
    
    fetchQueuePreview();
  }, [selectedService, services]);

  const handleBookToken = async (e) => {
    e.preventDefault();
    if (!selectedOrg || !selectedBranch || !selectedService) {
      toast.error('Please complete all selection steps.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/tokens/book', {
        organization_id: selectedOrg,
        branch_id: selectedBranch,
        service_id: selectedService
      });

      if (res.data.success) {
        toast.success(`Token ${res.data.token.token_number} booked successfully!`);
        navigate(`/customer/active`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to book token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Book Queue Token</h2>
        <p className="text-slate-400 text-sm mt-1">Select the organization, branch, and service to secure your real-time token.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
          <FiAlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Booking Form Card */}
        <div className="md:col-span-2 glass-panel border border-white/5 rounded-3xl p-6 shadow-xl">
          <form onSubmit={handleBookToken} className="space-y-6">
            
            {/* Step 1: Organization */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FiBriefcase className="text-indigo-400" /> Step 1: Select Organization
              </label>
              <select
                required
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none"
              >
                <option value="" className="bg-[#0a0a0f] text-slate-500">-- Choose Organization --</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id} className="bg-[#0a0a0f] text-white">{org.name}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Branch */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FiMapPin className="text-indigo-400" /> Step 2: Select Branch
              </label>
              <select
                required
                disabled={!selectedOrg}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-[#0a0a0f] text-slate-500">-- Choose Branch --</option>
                {branches.map(br => (
                  <option key={br.id} value={br.id} className="bg-[#0a0a0f] text-white">{br.name}</option>
                ))}
              </select>
            </div>

            {/* Step 3: Service */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FiActivity className="text-indigo-400" /> Step 3: Select Service
              </label>
              <select
                required
                disabled={!selectedBranch}
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-[#0a0a0f] text-slate-500">-- Choose Service --</option>
                {services.map(svc => (
                  <option key={svc.id} value={svc.id} className="bg-[#0a0a0f] text-white">{svc.name} ({svc.prefix})</option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedService}
              className="w-full glow-btn bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Book Token Now</span>
              )}
            </button>

          </form>
        </div>

        {/* Live Preview Pane */}
        <div className="md:col-span-1 space-y-4">
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl text-left relative overflow-hidden">
            <h4 className="text-sm font-semibold text-white mb-4">Queue Live Preview</h4>
            
            {!selectedService ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Select a service to view wait estimates and queue lengths.
              </div>
            ) : previewLoading ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-[10px] text-slate-500">Retrieving stats...</span>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <FiUsers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">People Waiting</p>
                    <p className="text-xl font-bold text-white">{queueCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                    <FiClock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Est. Wait Time</p>
                    <p className="text-xl font-bold text-white">
                      {queueCount * avgTime} <span className="text-xs text-slate-400 font-normal">mins</span>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-xs text-indigo-300 leading-relaxed">
                  📢 Wait estimates are calculated live based on current staff serving speeds and queue sizes.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookToken;
