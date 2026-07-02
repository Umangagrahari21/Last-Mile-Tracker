import React, { useState, useEffect } from 'react';
import { getAgents } from '../../api/agent.api';
import { getZones } from '../../api/zone.api';
import { register } from '../../api/auth.api';
import { toast } from 'react-toastify';
import { Users, Plus, RefreshCw, MapPin, User, Mail, Lock } from 'lucide-react';

const AgentManager = () => {
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registering, setRegistering] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsData, zonesData] = await Promise.all([getAgents(), getZones()]);
      setAgents(agentsData);
      setZones(zonesData);
    } catch { toast.error('Failed to load agent data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRegisterAgent = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setRegistering(true);
    try {
      await register(name, email, password, 'AGENT');
      toast.success(`Agent registered: ${name}`);
      setName(''); setEmail(''); setPassword('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to register agent'); }
    finally { setRegistering(false); }
  };

  const statusConfig = {
    AVAILABLE: { dot: 'dot-online', label: 'Available', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
    BUSY:      { dot: 'dot-busy',   label: 'Busy',      bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/20',       text: 'text-amber-700 dark:text-amber-400' },
    OFFLINE:   { dot: 'dot-offline', label: 'Offline',   bg: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',           text: 'text-slate-500 dark:text-slate-400' },
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h1 className="section-title">Agent Directory</h1>
          </div>
          <p className="section-subtitle">{agents.length} agent{agents.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin360' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Register Form */}
        <div className="glass-card rounded-2xl p-5 h-fit animate-slide-up">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-500" /> Register Agent
          </h3>
          <form onSubmit={handleRegisterAgent} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" required placeholder="David Miller" value={name}
                  onChange={(e) => setName(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required placeholder="david@lastmile.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" required placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="input-field" />
              </div>
            </div>
            <button type="submit" disabled={registering} className="btn-primary w-full text-sm">
              {registering ? 'Registering...' : 'Register Agent'}
            </button>
          </form>
        </div>

        {/* Agent Cards */}
        <div className="lg:col-span-3">
          {loading && agents.length === 0 ? (
            <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-indigo-500 animate-spin360" /></div>
          ) : agents.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No agents registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {agents.map((agent, idx) => {
                const s = statusConfig[agent.status] || statusConfig.OFFLINE;
                const initials = agent.user?.name ? agent.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
                return (
                  <div key={agent.id} className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-black shadow-md shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{agent.user?.name}</h4>
                        <p className="text-xs text-slate-400 truncate">{agent.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${s.bg} ${s.text}`}>
                        <span className={s.dot} />
                        {s.label}
                      </div>
                      {agent.currentZone ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          <MapPin className="w-3 h-3" />
                          {agent.currentZone.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No zone</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentManager;
