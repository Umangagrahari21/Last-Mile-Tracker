import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, AlertCircle, ArrowRight, Zap, Package, Truck, Shield } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const navigateUser = (role) => {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'AGENT') navigate('/agent/deliveries');
    else navigate('/customer/place-order');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigateUser(user.role);
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
      const user = await loginWithGoogle(credentialResponse.credential);
      navigateUser(user.role);
    } catch (err) {
      setError(err.response?.data?.error || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { Icon: Package, label: 'Smart Order Tracking' },
    { Icon: Truck, label: 'Real-time Delivery Updates' },
    { Icon: Shield, label: 'Secure Role-based Access' },
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
            <span className="text-white font-black text-2xl tracking-tight">Last-Mile</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Delivering the future,<br />
            <span className="text-indigo-200">one package at a time.</span>
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed max-w-sm">
            Intelligent logistics management with real-time tracking, smart agent assignment, and automated rate calculation.
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
              <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="gradient-text font-black text-xl">Last-Mile</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome back 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Register here
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
                <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input-field" placeholder="name@example.com" />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input-field" placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Signing in...' : 'Sign In'}
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
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google */}
            <div className="flex flex-col items-center gap-2">
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
                  <strong>Google Login:</strong> Add <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">frontend/.env</code> to enable.
                </div>
              )}
            </div>
          </div>

          {/* Admin Portal Link */}
          <div className="mt-4 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Administrator? Access Admin Portal →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
