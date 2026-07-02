import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrderById, updateStatus } from '../../api/order.api';
import StatusBadge from '../../components/StatusBadge';
import { toast } from 'react-toastify';
import { ArrowLeft, RefreshCw, AlertTriangle, Truck, CheckSquare, MessageSquare, Calendar, User, MapPin } from 'lucide-react';

const UpdateStatus = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [nextStatus, setNextStatus] = useState('');
  const [note, setNote] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
      
      // Auto-populate first valid status
      const validNextList = getValidNextStatuses(data.status);
      if (validNextList.length > 0) {
        setNextStatus(validNextList[0]);
      } else {
        setNextStatus('');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const getValidNextStatuses = (currentStatus) => {
    switch (currentStatus) {
      case 'ASSIGNED':
        return ['PICKED_UP'];
      case 'PICKED_UP':
        return ['IN_TRANSIT'];
      case 'IN_TRANSIT':
        return ['OUT_FOR_DELIVERY'];
      case 'OUT_FOR_DELIVERY':
        return ['DELIVERED', 'FAILED'];
      default:
        return [];
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!nextStatus) return;

    if (nextStatus === 'FAILED') {
      if (!rescheduleDate) {
        toast.warn('Please select a tentative reschedule date for delivery failure');
        return;
      }
      if (!note.trim()) {
        toast.warn('Please add a failure reason note');
        return;
      }
    }

    setSubmitting(true);
    try {
      await updateStatus(orderId, {
        status: nextStatus,
        note: note.trim(),
        rescheduleDate: nextStatus === 'FAILED' ? rescheduleDate : undefined
      });

      toast.success(`Shipment status updated to ${nextStatus}`);
      setNote('');
      setRescheduleDate('');
      
      const nextList = getValidNextStatuses(nextStatus);
      if (nextList.length === 0) {
        navigate('/agent/deliveries');
      } else {
        fetchOrder();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="flex flex-col justify-center items-center py-40 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl animate-pulse-glow">
          <RefreshCw className="w-7 h-7 text-white animate-spin360" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-semibold">Loading shipment details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center animate-scale-in">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Shipment Not Found</h2>
        <Link to="/agent/deliveries" className="btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" /> Go back to Deliveries
        </Link>
      </div>
    );
  }

  const validNextOptions = getValidNextStatuses(order.status);

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="mb-6">
        <Link to="/agent/deliveries" className="inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Deliveries
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-slate-800/50 pb-6 mb-8 gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            Update Delivery Status
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Order Reference: <strong className="font-mono text-slate-700 dark:text-slate-200">{order.id}</strong>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">Current Status:</span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Cards */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/50 pb-2 uppercase tracking-wide">
              Address & Consignee details
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customer (Consignee)</span>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{order.customer?.name}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pickup Location</span>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{order.pickupAddress}</p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Pincode: {order.pickupPincode}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Delivery Location</span>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{order.dropAddress}</p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Pincode: {order.dropPincode}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Payment Term</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {order.paymentType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Volumetric weight</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{order.volumetricWeight} kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Form */}
        <div className="glass-card rounded-2xl p-6 h-fit">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wide flex items-center">
            <CheckSquare className="w-4.5 h-4.5 text-indigo-500 mr-1.5" />
            Transition Status
          </h3>

          {validNextOptions.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4 text-xs text-yellow-800 dark:text-yellow-400 font-medium">
              You cannot perform any status updates for this shipment at this stage. It is in a terminal status or requires admin actions.
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Select Next Status</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="mt-1.5 block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {validNextOptions.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Inputs for FAILED status */}
              {nextStatus === 'FAILED' && (
                <div className="space-y-3 pt-3 border-t border-dashed border-red-100 dark:border-red-500/20 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-red-700 dark:text-red-400 uppercase flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      Tentative Reschedule Date
                    </label>
                    <input
                      type="date"
                      required
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1.5 block w-full px-3 py-2 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-red-700 dark:text-red-400 uppercase flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      Reason for Failure
                    </label>
                    <textarea
                      required
                      rows="2"
                      placeholder="e.g. Customer not available / Door locked"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="mt-1.5 block w-full px-3 py-2 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Standard note if not failed */}
              {nextStatus !== 'FAILED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Optional Activity Note</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Package picked up from warehouse"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-1.5 block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Updating...' : 'Update Status'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateStatus;
