import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, AlertCircle, ArrowRight, Zap, LayoutDashboard, Users, MapPin, DollarSign } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const AdminLogin = () => {
  const { login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, true);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential, 'ADMIN', true);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { Icon: LayoutDashboard, label: 'Dashboard & Real-time Analytics' },
    { Icon: MapPin,          label: 'Zone & Area Configuration' },
    { Icon: DollarSign,      label: 'Rate Cards & COD Surcharge' },
    { Icon: Users,           label: 'Agent Assignment & Management' },
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh flex">

      {/* Left brand panel – hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 flex-col justify-between p-12">
        {/* animated blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full bg-white/5 animate-blob" />
        <div className="absolute bottom-[-100px] right-[-60px] w-[420px] h-[420px] rounded-full bg-white/5 animate-blob delay-300" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/3 w-[200px] h-[200px] rounded-full bg-indigo-400/10 animate-float" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-white font-black text-2xl tracking-tight block leading-none">Last-Mile</span>
              <span className="text-indigo-200 text-xs font-bold tracking-widest uppercase">Admin Portal</span>
            </div>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Full operations,<br />
            <span className="text-indigo-200">one control center.</span>
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed max-w-sm">
            Manage zones, configure pricing, assign agents, and oversee every delivery — all from one place.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {features.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="gradient-text font-black text-xl block leading-none">Last-Mile</span>
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-widest uppercase">Admin Portal</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin Sign In 🛡️</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
              Not an admin?{' '}
              <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Customer / Agent Login
              </Link>
            </p>
          </div>

          {/* Form card */}
          <div className="glass-card rounded-2xl p-8">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input-field" placeholder="admin@lastmile.com" />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input-field" placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Signing in...' : 'Access Admin Portal'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Or login with
                </span>
              </div>
            </div>

            {/* Google Login for Admin */}
            <div className="flex flex-col items-center gap-2.5 mb-5">
              {googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in failed. Please try again.')}
                    useOneTap
                    theme="outline"
                    shape="rectangular"
                    width="100%"
                  />
                </GoogleOAuthProvider>
              ) : (
                <div className="w-full p-3.5 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs text-center">
                  <strong>Google Login:</strong> Add <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to enable.
                </div>
              )}
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/20">
              <span className="text-base leading-none">🔒</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This portal is <span className="font-bold text-slate-700 dark:text-slate-300">restricted to administrators</span>. All actions are logged for security and audit purposes.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
