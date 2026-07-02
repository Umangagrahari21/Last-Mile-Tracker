import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById, reschedule } from '../../api/order.api';
import TrackingTimeline from '../../components/TrackingTimeline';
import StatusBadge from '../../components/StatusBadge';
import { toast } from 'react-toastify';
import { Package, MapPin, Scale, Calendar, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const TrackOrder = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tracking details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleReason) {
      toast.error('Please enter a date and reason for rescheduling');
      return;
    }

    setRescheduling(true);
    try {
      const result = await reschedule(orderId, {
        newDate: rescheduleDate,
        reason: rescheduleReason
      });

      toast.success(
        result.autoAssigned
          ? `Delivery rescheduled. Assigned to agent: ${result.agentName}`
          : 'Delivery rescheduled successfully. Waiting for agent assignment.'
      );
      
      setRescheduleDate('');
      setRescheduleReason('');
      await fetchOrderDetails();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to reschedule delivery.');
    } finally {
      setRescheduling(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="flex flex-col justify-center items-center py-40 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl animate-pulse-glow">
          <RefreshCw className="w-7 h-7 text-white animate-spin360" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-semibold">Loading tracking details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center animate-scale-in">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Order Not Found</h2>
        <Link to="/customer/orders" className="btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" /> Go back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Back button link */}
      <div className="mb-6">
        <Link to="/customer/orders" className="inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to My Orders
        </Link>
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-slate-800/50 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="section-title">Track Delivery</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Order Reference: <strong className="font-mono text-slate-700 dark:text-slate-200">{order.id}</strong>
          </p>
        </div>

        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl px-5 py-3 text-right shadow-sm">
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest block mb-0.5">Total Amount</span>
          <span className="text-2xl font-black text-indigo-900 dark:text-indigo-300">₹{order.totalCharge}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details & Rescheduling */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAILED State Reschedule banner/form */}
          {order.status === 'FAILED' && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/25 rounded-2xl p-6 shadow-sm animate-scale-in">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-red-950 dark:text-red-400">Delivery Attempt Failed</h3>
                  <p className="text-sm text-red-700 dark:text-red-300/80">
                    We were unable to deliver your package. Please choose a new delivery date and time to reschedule.
                  </p>
                </div>
              </div>

              <form onSubmit={handleReschedule} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-red-900 dark:text-red-400 uppercase">New Delivery Date</label>
                    <input
                      type="datetime-local"
                      required
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="mt-1.5 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/30 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-900 dark:text-red-400 uppercase">Reason for Rescheduling</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Availability changes / Address corrections"
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      className="mt-1.5 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/30 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-sm font-bold text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Confirm Reschedule
                </button>
              </form>
            </div>
          )}

          {/* Details Card */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center border-b border-slate-100 dark:border-slate-800/50 pb-3">
              <Package className="w-5 h-5 text-indigo-500 mr-2" />
              Shipment Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pickup Address</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{order.pickupAddress}</p>
                    <span className="text-xs text-slate-400">Pincode: {order.pickupPincode} ({order.pickupZone?.name || 'Resolving...'})</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Drop Address</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{order.dropAddress}</p>
                    <span className="text-xs text-slate-400">Pincode: {order.dropPincode} ({order.dropZone?.name || 'Resolving...'})</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-l border-slate-100 dark:border-slate-800/50 md:pl-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Actual Weight</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">{order.actualWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Billed Weight</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">{order.billedWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Segment</span>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">{order.orderType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payment</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">{order.paymentType}</p>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/50" />

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Assigned Agent</span>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">
                    {order.agent?.name ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                        <span className="dot-online w-1.5 h-1.5 shrink-0" />
                        {order.agent.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-lg border border-orange-100 dark:border-orange-500/20">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Allocation Pending
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Log */}
        <div className="glass-card rounded-2xl p-6 h-fit">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/50 pb-3 mb-6 flex items-center">
            <Calendar className="w-5 h-5 text-indigo-500 mr-2" />
            Tracking Activity
          </h2>
          <TrackingTimeline logs={order.trackingLogs} />
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
