import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Lock, Shield, AlertCircle, ArrowRight, Zap, ChevronDown } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const Register = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
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
      const user = await register(name, email, password, role);
      navigateUser(user.role);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential, role);
      navigateUser(user.role);
    } catch (err) {
      setError(err.response?.data?.error || 'Google registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'CUSTOMER', label: 'Customer', desc: 'Ship & track packages' },
    { value: 'AGENT', label: 'Delivery Agent', desc: 'Handle deliveries' },
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-7 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="gradient-text font-black text-xl">Last-Mile</span>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-xl p-3.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field" placeholder="name@example.com" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="reg-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field" placeholder="••••••••" />
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Register As</label>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      role === value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600/50'
                    }`}
                  >
                    <div className={`text-sm font-bold ${role === value ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{label}</div>
                    <div className={`text-xs mt-0.5 ${role === value ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'}`}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Or sign up with</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {googleClientId ? (
              <GoogleOAuthProvider clientId={googleClientId}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-up failed. Please try again.')}
                  useOneTap
                  theme="outline"
                  shape="rectangular"
                  width="100%"
                  text="signup_with"
                />
              </GoogleOAuthProvider>
            ) : (
              <div className="w-full p-3.5 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs text-center">
                <strong>Google Sign-Up:</strong> Add <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to enable.
              </div>
            )}
            <p className="text-[10px] text-slate-400 text-center">Google Sign-Up uses the selected role above.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
