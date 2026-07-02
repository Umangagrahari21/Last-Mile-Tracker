import React, { useState, useEffect } from 'react';
import { getOrders, updateStatus, previewCharge, createOrder } from '../../api/order.api';
import { getAgents, assignAgent, autoAssign } from '../../api/agent.api';
import { getZones } from '../../api/zone.api';
import { getCustomers } from '../../api/admin.api';
import StatusBadge from '../../components/StatusBadge';
import { toast } from 'react-toastify';
import {
  ClipboardList, RefreshCw, Filter, Truck, UserCheck, Zap, Search,
  Plus, X, Package, MapPin, Scale, Calculator, ChevronRight
} from 'lucide-react';

const selectClass = "px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all";

// ─── Create Order Modal ──────────────────────────────────────────────────────
const CreateOrderModal = ({ onClose, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [step, setStep] = useState(1); // 1=select customer, 2=fill form, 3=preview
  const [form, setForm] = useState({
    pickupAddress: '', pickupPincode: '',
    dropAddress: '', dropPincode: '',
    length: '', breadth: '', height: '', actualWeight: '',
    orderType: 'B2C', paymentType: 'PREPAID'
  });
  const [chargeData, setChargeData] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getCustomers().then(setCustomers).catch(() => toast.error('Failed to load customers'));
  }, []);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setChargeData(null);
  };

  const validate = () => {
    const err = {};
    if (!selectedCustomer) err.customer = 'Select a customer';
    if (form.pickupAddress.length < 5) err.pickupAddress = 'Too short';
    if (!/^\d{6}$/.test(form.pickupPincode)) err.pickupPincode = '6 digits';
    if (form.dropAddress.length < 5) err.dropAddress = 'Too short';
    if (!/^\d{6}$/.test(form.dropPincode)) err.dropPincode = '6 digits';
    ['length', 'breadth', 'height', 'actualWeight'].forEach(f => {
      if (!form[f] || parseFloat(form[f]) <= 0) err[f] = 'Required';
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setCalculating(true);
    try {
      const data = await previewCharge({
        ...form,
        length: parseFloat(form.length), breadth: parseFloat(form.breadth),
        height: parseFloat(form.height), actualWeight: parseFloat(form.actualWeight)
      });
      setChargeData(data);
      setStep(3);
      toast.success('Charges calculated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to calculate — check pincodes');
    } finally { setCalculating(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createOrder({
        ...form,
        length: parseFloat(form.length), breadth: parseFloat(form.breadth),
        height: parseFloat(form.height), actualWeight: parseFloat(form.actualWeight),
        customerId: selectedCustomer
      });
      toast.success('Order created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    } finally { setSubmitting(false); }
  };

  const inputCls = (field) => `w-full px-3 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
    errors[field]
      ? 'border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-300'
      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
  }`;

  const selectedCust = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="glass-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#1e1310] z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Create Order for Customer</h2>
              <p className="text-xs text-slate-400">Admin — placing order on behalf of a customer</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-3">
          {[{ n: 1, label: 'Customer' }, { n: 2, label: 'Package' }, { n: 3, label: 'Confirm' }].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                step === s.n ? 'bg-brand-500 text-white shadow-md' :
                step > s.n ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                <span>{s.n}</span> {s.label}
              </div>
              {i < 2 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        <div className="p-6 pt-3">
          {/* Step 1: Select Customer */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Customer</label>
                {customers.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin360" /> Loading customers...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                    {customers.map(c => (
                      <button key={c.id} type="button" onClick={() => setSelectedCustomer(c.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                          selectedCustomer === c.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600/50'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</div>
                            <div className="text-xs text-slate-400 truncate">{c.email}</div>
                          </div>
                          {selectedCustomer === c.id && (
                            <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { if (!selectedCustomer) { toast.warn('Select a customer first'); return; } setStep(2); }}
                className="btn-primary w-full">
                Continue to Package Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Package / Order form */}
          {step >= 2 && step <= 3 && (
            <div>
              {/* Selected customer indicator */}
              {selectedCust && (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-5 border border-brand-200 dark:border-brand-700/40 bg-brand-50 dark:bg-brand-950/20">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-black">
                    {selectedCust.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-700 dark:text-brand-400">Ordering for</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedCust.name} — {selectedCust.email}</p>
                  </div>
                  <button onClick={() => { setStep(1); setChargeData(null); }} className="ml-auto text-xs font-bold text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
                    Change
                  </button>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleCalculate} className="space-y-5">
                  {/* Order type & payment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Order Type</label>
                      <div className="flex gap-2">
                        {['B2C', 'B2B'].map(t => (
                          <button key={t} type="button" onClick={() => setForm(p => ({ ...p, orderType: t }))}
                            className={`flex-1 py-2 rounded-xl border-2 text-xs font-black transition-all ${
                              form.orderType === t ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Payment</label>
                      <div className="flex gap-2">
                        {['PREPAID', 'COD'].map(t => (
                          <button key={t} type="button" onClick={() => setForm(p => ({ ...p, paymentType: t }))}
                            className={`flex-1 py-2 rounded-xl border-2 text-xs font-black transition-all ${
                              form.paymentType === t ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pickup */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-500" /> Pickup
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input name="pickupAddress" value={form.pickupAddress} onChange={handleChange}
                          placeholder="Pickup address" className={inputCls('pickupAddress')} />
                        {errors.pickupAddress && <p className="text-red-500 text-[10px] mt-0.5">{errors.pickupAddress}</p>}
                      </div>
                      <div>
                        <input name="pickupPincode" value={form.pickupPincode} onChange={handleChange}
                          placeholder="Pincode" maxLength={6} className={inputCls('pickupPincode')} />
                        {errors.pickupPincode && <p className="text-red-500 text-[10px] mt-0.5">{errors.pickupPincode}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Drop */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" /> Delivery
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input name="dropAddress" value={form.dropAddress} onChange={handleChange}
                          placeholder="Delivery address" className={inputCls('dropAddress')} />
                        {errors.dropAddress && <p className="text-red-500 text-[10px] mt-0.5">{errors.dropAddress}</p>}
                      </div>
                      <div>
                        <input name="dropPincode" value={form.dropPincode} onChange={handleChange}
                          placeholder="Pincode" maxLength={6} className={inputCls('dropPincode')} />
                        {errors.dropPincode && <p className="text-red-500 text-[10px] mt-0.5">{errors.dropPincode}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Package Dimensions */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Package className="w-3 h-3 text-blue-500" /> Package Dimensions (cm) & Weight (kg)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['length', 'breadth', 'height', 'actualWeight'].map(f => (
                        <div key={f}>
                          <input name={f} value={form[f]} onChange={handleChange} type="number" step="0.1" min="0.1"
                            placeholder={f === 'actualWeight' ? 'Weight' : f.charAt(0).toUpperCase() + f.slice(1)}
                            className={inputCls(f)} />
                          {errors[f] && <p className="text-red-500 text-[10px] mt-0.5">{errors[f]}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={calculating} className="btn-primary w-full">
                    {calculating ? (
                      <><Scale className="w-4 h-4 animate-spin360" /> Calculating...</>
                    ) : (
                      <><Calculator className="w-4 h-4" /> Calculate Charges</>
                    )}
                  </button>
                </form>
              )}

              {/* Step 3: Confirm & Submit */}
              {step === 3 && chargeData && (
                <div className="space-y-4">
                  {/* Charge Summary */}
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="px-5 py-3 flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-700">
                      <Scale className="w-4 h-4 text-white" />
                      <span className="text-white font-black text-sm">Charge Breakdown</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { label: 'Volumetric Weight', value: `${chargeData.volumetricWeight} kg` },
                        { label: 'Billed Weight', value: `${chargeData.billedWeight} kg` },
                        { label: 'Rate per kg', value: `₹${chargeData.ratePerKg}` },
                        { label: 'Base Charge', value: `₹${chargeData.baseCharge}` },
                        { label: 'COD Surcharge', value: `₹${chargeData.codSurcharge}` },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center px-5 py-2.5">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{row.label}</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{row.value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center px-5 py-3 bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">Total Charge</span>
                        <span className="text-xl font-black gradient-text">₹{chargeData.totalCharge}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order summary */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-slate-50 dark:bg-slate-800/30">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Route</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{form.pickupPincode} → {form.dropPincode}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Type</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{form.orderType} · {form.paymentType}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Edit</button>
                    <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
                      {submitting ? 'Creating...' : '✓ Confirm & Create Order'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main AllOrders Component ─────────────────────────────────────────────────
const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [selectedAgents, setSelectedAgents] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, agentsData, zonesData] = await Promise.all([
        getOrders({ status: statusFilter || undefined, zoneId: zoneFilter || undefined, agentId: agentFilter || undefined }),
        getAgents(),
        getZones()
      ]);
      setOrders(ordersData);
      setAgents(agentsData);
      setZones(zonesData);
    } catch (err) {
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter, zoneFilter, agentFilter]);

  const handleAutoAssign = async (orderId) => {
    setActionLoading(p => ({ ...p, [orderId]: true }));
    try {
      const res = await autoAssign(orderId);
      toast.success(res.message || 'Agent auto-assigned!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Auto-assign failed');
    } finally {
      setActionLoading(p => ({ ...p, [orderId]: false }));
    }
  };

  const handleManualAssign = async (orderId) => {
    const agentId = selectedAgents[orderId];
    if (!agentId) { toast.warn('Select an agent first'); return; }
    setActionLoading(p => ({ ...p, [orderId]: true }));
    try {
      const res = await assignAgent(orderId, agentId);
      toast.success(res.message || 'Agent assigned!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Assign failed');
    } finally {
      setActionLoading(p => ({ ...p, [orderId]: false }));
    }
  };

  const handleStatusOverride = async (orderId, newStatus) => {
    setActionLoading(p => ({ ...p, [orderId]: true }));
    try {
      await updateStatus(orderId, { status: newStatus, note: 'Admin status override' });
      toast.success(`Status → ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Override failed');
    } finally {
      setActionLoading(p => ({ ...p, [orderId]: false }));
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="page-wrapper animate-fade-in">
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <h1 className="section-title">All Orders</h1>
          </div>
          <p className="section-subtitle">{orders.length} shipment{orders.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Order
          </button>
          <button onClick={fetchData} disabled={loading} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin360' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm font-bold">
          <Filter className="w-4 h-4 text-brand-500" />
          Filters:
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          {['CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RESCHEDULED'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
        <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className={selectClass}>
          <option value="">All Zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className={selectClass}>
          <option value="">All Agents</option>
          {agents.map(a => <option key={a.userId} value={a.userId}>{a.user?.name} ({a.status})</option>)}
        </select>
        {(statusFilter || zoneFilter || agentFilter) && (
          <button onClick={() => { setStatusFilter(''); setZoneFilter(''); setAgentFilter(''); }}
            className="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
            Clear All
          </button>
        )}
      </div>

      {/* Desktop Table / Mobile Card Layout */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="flex justify-center items-center py-24">
            <RefreshCw className="w-8 h-8 text-brand-500 animate-spin360" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-slate-400">
            <Search className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-semibold">No shipments match the current filters.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-4 text-sm">
              <Plus className="w-4 h-4" /> Create First Order
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Order ID</th><th>Customer</th><th>Route</th><th>Status</th>
                    <th>Amount</th><th>Date</th><th>Agent</th><th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isPending = order.status === 'CREATED' || order.status === 'RESCHEDULED';
                    const busy = actionLoading[order.id];
                    return (
                      <tr key={order.id}>
                        <td>
                          <span className="font-black text-brand-600 dark:text-brand-400 font-mono text-xs">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="font-bold text-slate-800 dark:text-slate-100">{order.customer?.name}</div>
                          <div className="text-xs text-slate-400">{order.customer?.email}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                            <span>{order.pickupPincode}</span>
                            <span className="text-slate-300 dark:text-slate-600">→</span>
                            <span>{order.dropPincode}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{order.pickupZone?.name} → {order.dropZone?.name}</div>
                        </td>
                        <td><StatusBadge status={order.status} /></td>
                        <td>
                          <span className="font-black text-slate-900 dark:text-white">₹{order.totalCharge}</span>
                        </td>
                        <td className="text-xs text-slate-400">{formatDate(order.createdAt)}</td>
                        <td>
                          {order.agent ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                              <span className="dot-online w-1.5 h-1.5" />
                              {order.agent.name}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-500/20">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-col gap-2 items-center min-w-[180px]">
                            {isPending && (
                              <div className="flex items-center gap-1.5 w-full">
                                <button onClick={() => handleAutoAssign(order.id)} disabled={busy}
                                  className="flex items-center gap-1 px-2 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 shrink-0">
                                  <Zap className="w-3 h-3" /> Auto
                                </button>
                                <select value={selectedAgents[order.id] || ''} onChange={(e) => setSelectedAgents(p => ({ ...p, [order.id]: e.target.value }))}
                                  className="flex-1 px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-medium focus:outline-none">
                                  <option value="">Agent...</option>
                                  {agents.filter(a => a.status === 'AVAILABLE').map(a => (
                                    <option key={a.id} value={a.id}>{a.user?.name}</option>
                                  ))}
                                </select>
                                <button onClick={() => handleManualAssign(order.id)} disabled={busy || !selectedAgents[order.id]}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg border border-emerald-100 transition-all disabled:opacity-50">
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 w-full">
                              <span className="text-[10px] font-bold text-slate-400 shrink-0">Override:</span>
                              <select defaultValue="" onChange={(e) => { if (e.target.value) { handleStatusOverride(order.id, e.target.value); e.target.value = ''; }}}
                                className="flex-1 px-1.5 py-1 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-slate-800 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-rose-400">
                                <option value="" disabled>Status...</option>
                                {['ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED'].map(s => (
                                  <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((order) => {
                const isPending = order.status === 'CREATED' || order.status === 'RESCHEDULED';
                const busy = actionLoading[order.id];
                return (
                  <div key={order.id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="font-black text-brand-600 dark:text-brand-400 font-mono text-xs block">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Customer</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{order.customer?.name}</div>
                        <div className="text-slate-400 text-[10px] truncate">{order.customer?.email}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Amount</span>
                        <div className="font-black text-slate-900 dark:text-white text-sm">₹{order.totalCharge}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Route</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {order.pickupPincode} → {order.dropPincode}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Zones</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {order.pickupZone?.name} to {order.dropZone?.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1.5">
                        <span className="text-slate-400 font-medium">Agent</span>
                        {order.agent ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">
                            {order.agent.name}
                          </span>
                        ) : (
                          <span className="text-orange-500 font-bold">Unassigned</span>
                        )}
                      </div>
                    </div>

                    {/* Actions Panel on mobile */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {isPending && (
                        <div className="flex flex-col gap-2">
                          <button onClick={() => handleAutoAssign(order.id)} disabled={busy}
                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                            <Zap className="w-3.5 h-3.5" /> Auto-Assign Nearest Agent
                          </button>
                          
                          <div className="flex gap-1.5">
                            <select value={selectedAgents[order.id] || ''} onChange={(e) => setSelectedAgents(p => ({ ...p, [order.id]: e.target.value }))}
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none">
                              <option value="">Select Agent manually...</option>
                              {agents.filter(a => a.status === 'AVAILABLE').map(a => (
                                <option key={a.id} value={a.id}>{a.user?.name}</option>
                              ))}
                            </select>
                            <button onClick={() => handleManualAssign(order.id)} disabled={busy || !selectedAgents[order.id]}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                              Assign
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Admin Override Status</span>
                        <select defaultValue="" onChange={(e) => { if (e.target.value) { handleStatusOverride(order.id, e.target.value); e.target.value = ''; }}}
                          className="flex-1 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400">
                          <option value="" disabled>Choose status override...</option>
                          {['ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED'].map(s => (
                            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllOrders;
