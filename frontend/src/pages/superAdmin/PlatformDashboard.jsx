import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { FiLayers, FiMapPin, FiUsers, FiActivity, FiServer, FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PlatformDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlatformStats = async () => {
    try {
      const res = await api.get('/super-admin/stats');
      if (res.data.success) {
        setData(res.data.stats);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-xs">Loading platform overview...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 text-left">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Super Admin Platform Overview</h2>
        <p className="text-slate-400 text-sm mt-1">Multi-tenant monitoring console. Track tenant activity and platform growth.</p>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Organizations"
          value={data.organizationsCount}
          icon={FiLayers}
          trend="Active Tenants"
          color="indigo"
        />
        <StatCard
          title="Total Branches"
          value={data.branchesCount}
          icon={FiMapPin}
          trend="Global coverage"
          color="violet"
        />
        <StatCard
          title="Registered Users"
          value={data.usersCount}
          icon={FiUsers}
          trend="Customers + Staff"
          color="emerald"
        />
        <StatCard
          title="Tokens Today"
          value={data.todayTokensCount}
          icon={FiActivity}
          trend="Virtual check-ins"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Organization management table */}
        <div className="lg:col-span-2 glass-panel border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FiLayers className="text-indigo-400" /> Platform Organization Tenants
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-semibold uppercase tracking-wider text-left">
                  <th className="pb-3">Tenant Name</th>
                  <th className="pb-3">Slug</th>
                  <th className="pb-3">Branches</th>
                  <th className="pb-3">Registered Users</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 font-semibold text-white">{org.name}</td>
                    <td className="py-3 font-mono text-slate-400">{org.slug}</td>
                    <td className="py-3 text-slate-300">{org.branch_count} Branches</td>
                    <td className="py-3 text-slate-300">{org.user_count} Users</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        org.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {org.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Node health dashboard */}
        <div className="lg:col-span-1 glass-panel border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FiServer className="text-indigo-400" /> Platform Infrastructure Nodes
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5"><FiGlobe className="text-indigo-400" /> API Server Node</span>
                <span className="font-bold text-emerald-400">99.98% Uptime</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[99.98%] rounded-full animate-pulse" />
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5"><FiServer className="text-indigo-400" /> MySQL Database</span>
                <span className="font-bold text-emerald-400">Online</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[100%] rounded-full" />
              </div>
            </div>

            <div className="p-4 bg-[#1a1a2e]/30 border border-indigo-500/10 rounded-2xl text-[11px] text-indigo-300 leading-relaxed">
              💡 As QLess operates in multi-tenant mode, organizations partition their branches and token sequences independently to maintain privacy and structural isolation.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlatformDashboard;
