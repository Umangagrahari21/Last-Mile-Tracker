import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';
import PlaceOrder from './pages/customer/PlaceOrder';
import MyOrders from './pages/customer/MyOrders';
import TrackOrder from './pages/customer/TrackOrder';
import Dashboard from './pages/admin/Dashboard';
import AllOrders from './pages/admin/AllOrders';
import ZoneManager from './pages/admin/ZoneManager';
import RateCardManager from './pages/admin/RateCardManager';
import AgentManager from './pages/admin/AgentManager';
import MyDeliveries from './pages/agent/MyDeliveries';
import UpdateStatus from './pages/agent/UpdateStatus';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user } = useAuth();

  return (
    <div className="app-bg bg-gradient-mesh min-h-screen flex flex-col">
      {user && <Navbar />}
      <div className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Customer Routes */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/customer/place-order" element={<PlaceOrder />} />
            <Route path="/customer/orders" element={<MyOrders />} />
            <Route path="/customer/track/:orderId" element={<TrackOrder />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/orders" element={<AllOrders />} />
            <Route path="/admin/zones" element={<ZoneManager />} />
            <Route path="/admin/ratecards" element={<RateCardManager />} />
            <Route path="/admin/agents" element={<AgentManager />} />
          </Route>

          {/* Agent Routes */}
          <Route element={<ProtectedRoute allowedRoles={['AGENT']} />}>
            <Route path="/agent/deliveries" element={<MyDeliveries />} />
            <Route path="/agent/update/:orderId" element={<UpdateStatus />} />
          </Route>

          {/* Fallback routing */}
          <Route
            path="*"
            element={
              user ? (
                user.role === 'ADMIN' ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : user.role === 'AGENT' ? (
                  <Navigate to="/agent/deliveries" replace />
                ) : (
                  <Navigate to="/customer/place-order" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
