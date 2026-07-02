import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeContext } from '../context/ThemeContext';
import { getOrders } from '../api/order.api';
import {
  LogOut, Package, Truck, LayoutDashboard, MapPin, DollarSign,
  Users, ClipboardList, Menu, X, Sun, Moon, Zap, Bell, Calendar
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const roleColor = {
    ADMIN: 'from-brand-500 to-brand-700',
    AGENT: 'from-sky-500 to-cyan-600',
    CUSTOMER: 'from-indigo-500 to-blue-600',
  }[user.role] || 'from-brand-500 to-brand-700';

  const roleBadgeClass = {
    ADMIN: 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400',
    AGENT: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    CUSTOMER: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  }[user.role] || 'bg-indigo-100 text-indigo-700';

  const linkClass = (path) =>
    `flex items-center px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 gap-1.5 ${
      isActive(path)
        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/25'
        : 'text-slate-600 hover:bg-brand-50 hover:text-brand-750 dark:text-slate-400 dark:hover:bg-brand-950/20 dark:hover:text-brand-400'
    }`;

  // Fetch recent updates and build notifications
  const fetchNotifications = async () => {
    try {
      const orders = await getOrders();
      // Generate notification-like items from order tracking history/latest status
      const list = [];
      orders.forEach(order => {
        // Add latest status update
        const date = new Date(order.createdAt).getTime();
        list.push({
          id: `${order.id}-${order.status}`,
          orderId: order.id,
          title: `Order #${order.id.slice(-6).toUpperCase()}`,
          message: getStatusMessage(order.status, order.agent?.name),
          status: order.status,
          time: order.createdAt,
          timestamp: date
        });
      });

      // Sort by latest timestamp
      const sorted = list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
      setNotifications(sorted);

      // Compute unread count
      const lastViewed = localStorage.getItem(`lastNotificationsViewed_${user.id}`);
      if (!lastViewed) {
        setUnreadCount(sorted.length);
      } else {
        const count = sorted.filter(n => n.timestamp > parseInt(lastViewed)).length;
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const getStatusMessage = (status, agentName) => {
    switch (status) {
      case 'CREATED': return 'Registered and confirmed successfully.';
      case 'ASSIGNED': return agentName ? `Assigned to delivery agent ${agentName}.` : 'Agent assigned to order.';
      case 'PICKED_UP': return 'Package picked up from source address.';
      case 'IN_TRANSIT': return 'Shipment has departed and is in transit.';
      case 'OUT_FOR_DELIVERY': return 'Out for delivery today!';
      case 'DELIVERED': return 'Delivered successfully 🎉';
      case 'FAILED': return 'Delivery failed. Action required to reschedule.';
      case 'RESCHEDULED': return 'Rescheduled. New attempt pending agent assignment.';
      default: return `Status updated to ${status}.`;
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
      localStorage.setItem(`lastNotificationsViewed_${user.id}`, Date.now().toString());
    }
  };

  const handleNotificationClick = (notif) => {
    setShowNotifications(false);
    if (user.role === 'CUSTOMER') {
      navigate(`/customer/track/${notif.orderId}`);
    } else if (user.role === 'AGENT') {
      navigate(`/agent/update/${notif.orderId}`);
    } else {
      navigate('/admin/orders');
    }
  };

  const formatNotifTime = (d) => {
    const diffMs = Date.now() - new Date(d).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };


  const mobileLinkClass = (path) =>
    `flex items-center px-4 py-3 text-base font-semibold rounded-xl transition-all gap-3 ${
      isActive(path)
        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-400 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300'
    }`;

  const navLinks = {
    CUSTOMER: [
      { to: '/customer/place-order', label: 'Place Order', Icon: Package },
      { to: '/customer/orders', label: 'My Orders', Icon: ClipboardList },
    ],
    AGENT: [
      { to: '/agent/deliveries', label: 'My Deliveries', Icon: Truck },
    ],
    ADMIN: [
      { to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { to: '/admin/orders', label: 'Orders', Icon: ClipboardList },
      { to: '/admin/create-order', label: 'Create Order', Icon: Package },
      { to: '/admin/zones', label: 'Zones', Icon: MapPin },
      { to: '/admin/ratecards', label: 'Rate Cards', Icon: DollarSign },
      { to: '/admin/agents', label: 'Agents', Icon: Users },
    ],
  }[user.role] || [];

  return (
    <nav className="glass sticky top-0 z-50 border-b border-slate-200/60 dark:border-indigo-500/10 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-200">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-black text-lg tracking-tight gradient-text">Last-Mile</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, Icon }) => (
                <Link key={to} to={to} className={linkClass(to)}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleOpenNotifications}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-white/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-500/40 transition-all duration-200 hover:scale-105 active:scale-95 relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border-2 border-white dark:border-slate-800" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 p-4 shadow-xl z-50 animate-scale-in">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-150 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-brand-500" /> Notifications
                    </span>
                    <button onClick={fetchNotifications} className="text-[10px] font-bold text-brand-500 hover:underline">
                      Refresh
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 font-medium">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-800/30 transition-all duration-150 block"
                        >
                          <div className="flex justify-between items-start gap-2 mb-0.5">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">{n.title}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0">{formatNotifTime(n.time)}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark/Light toggle */}
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-white/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4" />
              }
            </button>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-xs font-black shadow-md`}>
                {initials}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.name}</div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${roleBadgeClass}`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl border border-slate-200 dark:border-red-500/20 bg-white/70 dark:bg-slate-800/60 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:border-red-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-white/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 transition-all duration-200"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-indigo-500/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg animate-slide-down">
          <div className="px-3 py-3 space-y-1">
            {navLinks.map(({ to, label, Icon }) => (
              <Link key={to} to={to} onClick={() => setIsOpen(false)} className={mobileLinkClass(to)}>
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
          <div className="px-3 py-3 border-t border-slate-100 dark:border-indigo-500/10">
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-sm font-black shadow-md`}>
                {initials}
              </div>
              <div>
                <div className="text-base font-bold text-slate-800 dark:text-slate-100">{user.name}</div>
                <span className={`text-xs font-bold uppercase tracking-wider ${roleBadgeClass}`}>{user.role}</span>
              </div>
            </div>
            <button
              onClick={() => { setIsOpen(false); handleLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-semibold transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
