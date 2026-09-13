import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Sliders,
  CreditCard,
  Video,
  Layers,
  Award,
  ArrowUpRight,
  History,
  FileBarChart,
  Megaphone,
  LifeBuoy,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  Eye,
  LayoutDashboard,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { Badge } from '../ui/Badge';

export const AdminLayout: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const { withdrawals, payments, tickets } = usePlatform();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;
  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'open').length;

  const adminNav = [
    { name: 'Command Center', href: '/admin', icon: LayoutDashboard },
    { name: 'User Directory', href: '/admin/users', icon: Users },
    { name: 'Membership Plans', href: '/admin/plans', icon: Sliders },
    {
      name: 'Payment Invoices',
      href: '/admin/payments',
      icon: CreditCard,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
    },
    { name: 'Sponsored Videos', href: '/admin/videos', icon: Video },
    { name: 'Ad Campaigns', href: '/admin/campaigns', icon: Layers },
    { name: 'Task Rewards Audit', href: '/admin/rewards', icon: Award },
    {
      name: 'Payout Approvals',
      href: '/admin/withdrawals',
      icon: ArrowUpRight,
      badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : undefined,
    },
    { name: 'Ledger Transactions', href: '/admin/transactions', icon: History },
    { name: 'Third-Party Ads', href: '/admin/advertisements', icon: Compass },
    { name: 'Referral Engine', href: '/admin/referrals', icon: Users },
    { name: 'Analytics & Reports', href: '/admin/reports', icon: FileBarChart },
    { name: 'Broadcast Bulletins', href: '/admin/announcements', icon: Megaphone },
    {
      name: 'Support Desk',
      href: '/admin/support',
      icon: LifeBuoy,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
    },
    { name: 'System Settings', href: '/admin/settings', icon: Settings },
    { name: 'Audit Trail Logs', href: '/admin/audit-logs', icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white">
                  WatchEarn <span className="text-amber-400">HQ</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider -mt-1">
                  Master Control Plane
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* View Member Portal Button */}
            <button
              onClick={() => {
                switchRole('user');
                navigate('/dashboard');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Switch to User View</span>
            </button>

            {/* Admin identity badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-white">{user?.full_name || 'Admin Officer'}</span>
                <span className="text-[10px] text-amber-400 font-medium capitalize">
                  Role: {user?.role || 'admin'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Admin Navigation Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 pt-16 lg:pt-0 transform transition-transform duration-200 lg:static lg:translate-x-0 flex flex-col justify-between ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Platform Governance
            </div>
            {adminNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`w-4 h-4 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-slate-950 text-amber-400' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-900 bg-slate-950">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Admin Logout</span>
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
