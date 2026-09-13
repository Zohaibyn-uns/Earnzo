import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  PlayCircle,
  Wallet,
  CreditCard,
  ArrowUpRight,
  Users,
  History,
  User,
  LifeBuoy,
  LogOut,
  Bell,
  Menu,
  X,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { DisplayAdUnit } from '../ads/DisplayAdUnit';

export const DashboardLayout: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const { wallet, membership, activePlan, hasActivePlan, notifications, markNotificationRead } = usePlatform();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Earn', href: '/dashboard/videos', icon: PlayCircle, highlight: true },
    { name: 'Plans', href: '/plans', icon: CreditCard },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Withdraw', href: '/dashboard/withdraw', icon: ArrowUpRight },
    { name: 'Referrals', href: '/dashboard/referrals', icon: Users },
    { name: 'Transactions', href: '/dashboard/transactions', icon: History },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar for Member App */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-subtle">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <PlayCircle className="w-5 h-5 fill-white/20 stroke-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                Watch<span className="text-indigo-600">Earn</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Live Wallet Pill */}
            <Link
              to="/dashboard/wallet"
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-100 rounded-xl text-xs sm:text-sm font-semibold text-indigo-900 transition-colors"
            >
              <Wallet className="w-4 h-4 text-indigo-600" />
              <span>{formatCurrency(wallet.balance)}</span>
            </Link>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-sm text-slate-900">Notifications</span>
                    <span className="text-xs text-slate-400">{unreadCount} unread</span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 rounded-xl text-xs cursor-pointer transition-colors ${
                            n.is_read ? 'bg-slate-50 text-slate-600' : 'bg-indigo-50/70 text-indigo-950 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Switcher */}
            <button
              onClick={() => {
                switchRole('admin');
                navigate('/admin');
              }}
              className="hidden sm:inline-flex text-xs px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 font-medium transition-colors"
            >
              Switch to Admin
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-none">{user?.full_name}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 pt-16 lg:pt-0 transform transition-transform duration-200 lg:static lg:translate-x-0 flex flex-col justify-between ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Membership Status Badge */}
            <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50/50 border border-indigo-100 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase text-indigo-700 tracking-wider">Membership</span>
                <Badge variant={hasActivePlan ? 'success' : 'neutral'} size="sm">
                  {hasActivePlan ? 'Active' : 'Not Active'}
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-800">
                {hasActivePlan ? activePlan?.name : 'No Active Plan'}
              </p>
              {hasActivePlan ? (
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Daily limit:</span>
                  <span className="font-semibold text-slate-700">{activePlan?.daily_task_limit} tasks/day</span>
                </div>
              ) : (
                <div className="mt-2 space-y-1.5">
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Choose a plan to start earning.
                  </p>
                  <Link to="/plans" className="block pt-0.5">
                    <span className="text-xs text-indigo-600 font-bold hover:underline inline-flex items-center gap-1">
                      View Plans →
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                    {item.highlight && (
                      <span className="ml-auto px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-bold rounded-md">
                        Earn
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Isolated Sidebar Display Ad */}
            <div className="pt-2">
              <DisplayAdUnit placement="sidebar" />
            </div>
          </div>

          {/* Bottom logout */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
