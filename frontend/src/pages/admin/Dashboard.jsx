import React, { useState, useEffect } from 'react';
import { getDashboardMetrics } from '../../api/admin.api';
import {
  LayoutDashboard, Package, Truck, CheckCircle2, XCircle,
  AlertCircle, Users, RefreshCw, Layers, TrendingUp, Activity, Zap
} from 'lucide-react';
import { toast } from 'react-toastify';

const StatCard = ({ icon: Icon, label, value, gradient, delay }) => (
  <div
    className="glass-card stat-card animate-slide-up"
    style={{ animationDelay: delay }}
  >
    <div className={`absolute inset-0 rounded-2xl opacity-[0.07] ${gradient} pointer-events-none`} />
    <div className="relative z-10 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white animate-count-up">{value}</p>
      </div>
    </div>
  </div>
);

const ProgressBar = ({ label, value, total, color, textColor }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-black ${textColor}`}>{value}</span>
          <span className="text-xs text-slate-400">({pct}%)</span>
        </div>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  if (loading && !metrics) {
    return (
      <div className="flex flex-col justify-center items-center py-40 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl animate-pulse-glow">
          <RefreshCw className="w-7 h-7 text-white animate-spin360" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-semibold">Loading metrics...</p>
      </div>
    );
  }

  const { totalOrders = 0, statusCounts = {}, agentStatusCounts = {}, zoneOrders = [] } = metrics || {};
  const get = (s) => statusCounts[s] || 0;

  const pending    = get('CREATED') + get('RESCHEDULED');
  const active     = get('ASSIGNED') + get('PICKED_UP') + get('IN_TRANSIT') + get('OUT_FOR_DELIVERY');
  const delivered  = get('DELIVERED');
  const failed     = get('FAILED');

  const totalAgents = (agentStatusCounts.AVAILABLE || 0) + (agentStatusCounts.BUSY || 0) + (agentStatusCounts.OFFLINE || 0);

  const stats = [
    { icon: Package,      label: 'Total Shipments', value: totalOrders, gradient: 'from-indigo-500 to-violet-600',  delay: '0ms' },
    { icon: AlertCircle,  label: 'Pending Assign',  value: pending,     gradient: 'from-amber-500 to-orange-500',  delay: '80ms' },
    { icon: Truck,        label: 'In Transit',       value: active,      gradient: 'from-sky-500 to-cyan-500',      delay: '160ms' },
    { icon: CheckCircle2, label: 'Delivered',        value: delivered,   gradient: 'from-emerald-500 to-green-500', delay: '240ms' },
    { icon: XCircle,      label: 'Failed',           value: failed,      gradient: 'from-rose-500 to-red-500',      delay: '320ms' },
  ];

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h1 className="section-title">Dashboard</h1>
          </div>
          <p className="section-subtitle flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            Real-time delivery operations overview
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin360' : ''}`} />
          {loading ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up delay-400">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Agent Status</h3>
          </div>

          {/* Big donut-style display */}
          <div className="flex justify-around mb-6">
            {[
              { label: 'Available', count: agentStatusCounts.AVAILABLE || 0, color: 'text-emerald-500', dot: 'dot-online' },
              { label: 'Busy',      count: agentStatusCounts.BUSY || 0,      color: 'text-indigo-500',  dot: 'dot-busy' },
              { label: 'Offline',   count: agentStatusCounts.OFFLINE || 0,   color: 'text-slate-400',   dot: 'dot-offline' },
            ].map(({ label, count, color, dot }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={dot} />
                  <span className={`text-2xl font-black ${color}`}>{count}</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <ProgressBar label="Available" value={agentStatusCounts.AVAILABLE || 0} total={totalAgents} color="bg-emerald-500" textColor="text-emerald-600 dark:text-emerald-400" />
            <ProgressBar label="Busy (On-Trip)" value={agentStatusCounts.BUSY || 0} total={totalAgents} color="bg-gradient-to-r from-indigo-500 to-violet-500" textColor="text-indigo-600 dark:text-indigo-400" />
            <ProgressBar label="Offline" value={agentStatusCounts.OFFLINE || 0} total={totalAgents} color="bg-slate-300 dark:bg-slate-600" textColor="text-slate-500" />
          </div>
        </div>

        {/* Zone Distribution */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 animate-slide-up delay-500">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
              <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Order Distribution by Zone</h3>
          </div>

          {zoneOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Zap className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No zone data available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {zoneOrders.map((z, idx) => {
                const pct = totalOrders > 0 ? Math.round((z.count / totalOrders) * 100) : 0;
                const gradients = [
                  'from-indigo-500 to-violet-500',
                  'from-sky-500 to-cyan-500',
                  'from-emerald-500 to-teal-500',
                  'from-amber-500 to-orange-500',
                  'from-rose-500 to-pink-500',
                ];
                const grad = gradients[idx % gradients.length];
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{z.zoneName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black bg-gradient-to-r ${grad} bg-clip-text text-transparent`}>{z.count} orders</span>
                        <span className="text-xs text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="glass-card rounded-2xl p-6 mt-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Full Status Breakdown</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { status: 'CREATED',          label: 'Created',          color: 'from-blue-500 to-blue-600' },
            { status: 'ASSIGNED',         label: 'Assigned',         color: 'from-green-500 to-emerald-600' },
            { status: 'PICKED_UP',        label: 'Picked Up',        color: 'from-yellow-500 to-amber-600' },
            { status: 'IN_TRANSIT',       label: 'In Transit',       color: 'from-sky-500 to-blue-600' },
            { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'from-violet-500 to-purple-600' },
            { status: 'DELIVERED',        label: 'Delivered',        color: 'from-emerald-500 to-green-600' },
            { status: 'FAILED',           label: 'Failed',           color: 'from-rose-500 to-red-600' },
            { status: 'RESCHEDULED',      label: 'Rescheduled',      color: 'from-orange-500 to-amber-600' },
          ].map(({ status, label, color }) => (
            <div key={status} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
              <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${color} shrink-0`} />
              <div>
                <div className="text-xl font-black text-slate-800 dark:text-slate-100">{get(status)}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
