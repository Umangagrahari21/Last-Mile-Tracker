import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

const OrderCard = ({ order, userRole }) => {
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const getLinkPath = () => {
    if (userRole === 'CUSTOMER') return `/customer/track/${order.id}`;
    if (userRole === 'AGENT') return `/agent/update/${order.id}`;
    if (userRole === 'ADMIN') return `/admin/orders`;
    return '/';
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <Calendar className="w-3 h-3" />
              {formatDate(order.createdAt)}
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Addresses */}
        <div className="space-y-2.5 my-4">
          <div className="flex items-start gap-2 text-sm">
            <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3 h-3 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">{order.pickupAddress}</p>
              <span className="text-xs text-slate-400 font-mono">{order.pickupPincode}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">{order.dropAddress}</p>
              <span className="text-xs text-slate-400 font-mono">{order.dropPincode}</span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold">Total Charge</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">₹{order.totalCharge}</span>
          </div>
        </div>

        {userRole === 'ADMIN' && (
          <div className="space-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/50 pt-2">
            <div><strong className="text-slate-600 dark:text-slate-300">Customer:</strong> {order.customer?.name}</div>
            <div><strong className="text-slate-600 dark:text-slate-300">Agent:</strong> {order.agent?.name || <span className="text-orange-500">Unassigned</span>}</div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Link
          to={getLinkPath()}
          className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-600 dark:hover:bg-indigo-600 rounded-xl transition-all duration-200 border border-indigo-100 dark:border-indigo-500/20 hover:border-transparent gap-1.5"
        >
          {userRole === 'CUSTOMER' && 'Track Delivery'}
          {userRole === 'AGENT' && 'Update Status'}
          {userRole === 'ADMIN' && 'Manage Order'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default OrderCard;
