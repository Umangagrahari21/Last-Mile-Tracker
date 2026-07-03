import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, AlertCircle, ArrowRight, Zap, Shield } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const slides = [
    {
      title: "Order Online",
      description: "Book shipments instantly with real-time rate calculations and automated address verification.",
      illustration: (
        <svg viewBox="0 0 200 150" className="w-full h-44 text-white/90 drop-shadow-lg mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="75" y="10" width="50" height="90" rx="6" strokeWidth="3" />
          <line x1="90" y1="92" x2="110" y2="92" />
          <path d="M100 35 l15 -8 l15 8 l-15 8 z" fill="rgba(255,255,255,0.1)" />
          <path d="M100 35 v18 l15 8 v-18 z" />
          <path d="M130 43 v18 l-15 -8 v-18 z" />
          <circle cx="50" cy="110" r="16" fill="rgba(255,255,255,0.15)" strokeWidth="0" />
          <circle cx="50" cy="110" r="16" />
          <path d="M30 140 c0 -15 10 -20 20 -20 s20 5 20 20" />
          <circle cx="135" cy="105" r="12" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="0" />
          <circle cx="135" cy="105" r="12" stroke="#22c55e" />
          <polyline points="130 105 133 108 140 102" stroke="#22c55e" strokeWidth="3" />
        </svg>
      )
    },
    {
      title: "Fast Delivery",
      description: "Nearest available agent is automatically assigned to ensure swift dispatch and tracking logs.",
      illustration: (
        <svg viewBox="0 0 200 150" className="w-full h-44 text-white/90 drop-shadow-lg mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="125" x2="180" y2="125" strokeWidth="3" strokeDasharray="6 6" />
          <line x1="15" y1="45" x2="35" y2="45" opacity="0.6" />
          <line x1="5" y1="65" x2="30" y2="65" opacity="0.4" />
          <line x1="10" y1="85" x2="25" y2="85" opacity="0.5" />
          <path d="M60 100 c5 -30 25 -35 45 -35 h20 l15 20 h10 v15 h-15 l-5 15 z" fill="rgba(255,255,255,0.1)" strokeWidth="0" />
          <path d="M60 100 c5 -30 25 -35 45 -35 h20 l15 20 h10 v15 h-15 l-5 15 z" />
          <circle cx="135" cy="115" r="14" strokeWidth="3.5" fill="rgba(255,255,255,0.2)" />
          <circle cx="135" cy="115" r="4" />
          <circle cx="65" cy="115" r="14" strokeWidth="3.5" fill="rgba(255,255,255,0.2)" />
          <circle cx="65" cy="115" r="4" />
          <rect x="42" y="55" width="26" height="26" rx="3" fill="rgba(255,255,255,0.2)" strokeWidth="0" />
          <rect x="42" y="55" width="26" height="26" rx="3" />
          <path d="M42 68 h26" />
        </svg>
      )
    },
    {
      title: "Your Choice",
      description: "Manage delivery zones, configuration matrices, and agent statuses through a secure control panel.",
      illustration: (
        <svg viewBox="0 0 200 150" className="w-full h-44 text-white/90 drop-shadow-lg mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="40" y="25" width="120" height="85" rx="5" strokeWidth="3" fill="rgba(255,255,255,0.05)" strokeWidth="0" />
          <rect x="40" y="25" width="120" height="85" rx="5" strokeWidth="3" />
          <line x1="40" y1="40" x2="160" y2="40" />
          <circle cx="50" cy="32" r="2" />
          <circle cx="58" cy="32" r="2" />
          <rect x="55" y="70" width="12" height="40" fill="rgba(255,255,255,0.2)" strokeWidth="0" />
          <rect x="55" y="70" width="12" height="40" />
          <rect x="75" y="55" width="12" height="55" fill="rgba(255,255,255,0.2)" strokeWidth="0" />
          <rect x="75" y="55" width="12" height="55" />
          <rect x="95" y="78" width="12" height="32" fill="rgba(255,255,255,0.2)" strokeWidth="0" />
          <rect x="95" y="78" width="12" height="32" />
          <path d="M115 80 l10 -15 l15 20 l12 -25" stroke="#22c55e" strokeWidth="3" />
          <circle cx="152" cy="60" r="3" fill="#22c55e" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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




  return (
    <div className="min-h-screen bg-gradient-mesh flex">
      {/* Left brand panel – Onboarding Carousel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 flex-col justify-center items-center p-12">
        {/* animated blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full bg-white/5 animate-blob" />
        <div className="absolute bottom-[-100px] right-[-60px] w-[420px] h-[420px] rounded-full bg-white/5 animate-blob" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/3 w-[200px] h-[200px] rounded-full bg-indigo-400/10 animate-float" />

        {/* Logo top */}
        <div className="absolute top-10 left-10 flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-black text-2xl tracking-tight">Last-Mile</span>
        </div>

        {/* Slide card */}
        <div className="relative z-10 w-full max-w-sm">
          {/* Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 transition-all duration-500">
            {/* Illustration */}
            <div className="bg-white/10 rounded-2xl p-4 mb-6 flex items-center justify-center min-h-[160px]">
              {slides[currentSlide].illustration}
            </div>

            {/* Title + Description */}
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-indigo-200 text-sm leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? 'w-6 h-2.5 bg-white'
                      : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Floating badge cards */}
          <div className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2 animate-float">
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-700">Delivered!</span>
          </div>

          <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2" style={{ animationDelay: '1s' }}>
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-700">Live Tracking</span>
          </div>
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
