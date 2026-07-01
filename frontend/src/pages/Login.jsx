import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      redirectUser(data.user.role);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role) => {
    switch (role) {
      case 'customer':
        navigate('/customer/book');
        break;
      case 'staff':
        navigate('/staff/counter');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'super_admin':
        navigate('/super-admin');
        break;
      default:
        navigate('/');
    }
  };

  const fillCredentials = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 font-extrabold text-white text-xl shadow-[0_0_30px_rgba(99,102,241,0.3)] mb-4">
            Q
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">QLess</h2>
          <p className="text-slate-400 text-sm mt-2">Intelligent Real-Time Queue Optimization</p>
        </div>

        <div className="glass-panel border border-white/5 rounded-3xl p-8 shadow-2xl relative">
          <h3 className="text-xl font-bold text-white mb-6">Welcome Back</h3>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <FiMail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  placeholder="name@organization.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <FiLock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glow-btn bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.25)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Register Here
            </Link>
          </p>
        </div>

        {/* Demo Accounts Panel */}
        <div className="glass-panel border border-white/5 rounded-2xl p-5 mt-6 shadow-lg">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Quick Login Shortcuts</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => fillCredentials('customer@example.com')}
              className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left truncate"
            >
              👤 Customer Demo
            </button>
            <button
              onClick={() => fillCredentials('staff1@apollo.com')}
              className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left truncate"
            >
              🔧 Staff Console
            </button>
            <button
              onClick={() => fillCredentials('admin@apollo.com')}
              className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left truncate"
            >
              ⚙️ Admin Dashboard
            </button>
            <button
              onClick={() => fillCredentials('superadmin@qless.com')}
              className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left truncate"
            >
              🌐 Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
