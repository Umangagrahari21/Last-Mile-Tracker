import React from 'react';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import OrderCard from '../../components/OrderCard';
import { Truck, RefreshCw, AlertTriangle } from 'lucide-react';

const MyDeliveries = () => {
  const { user } = useAuth();
  const { orders, loading, error, refresh } = useOrders();

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <h1 className="section-title">My Assigned Deliveries</h1>
          </div>
          <p className="section-subtitle">{orders.length} delivery trip{orders.length !== 1 ? 's' : ''} assigned</p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="btn-secondary"
          title="Refresh list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin360' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex justify-center py-24">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin360" />
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-5 border-l-4 border-red-500 text-sm text-red-700 dark:text-red-400 font-semibold">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center max-w-lg mx-auto animate-slide-up">
          <Truck className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">No Shipments Assigned</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">You currently have no delivery orders assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order, idx) => (
            <div key={order.id} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <OrderCard order={order} userRole={user?.role} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;
