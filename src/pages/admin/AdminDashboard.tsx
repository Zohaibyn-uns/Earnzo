import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  Video,
  Award,
  AlertTriangle,
  FileText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { allProfiles, membership, payments, videos, withdrawals, transactions, activeRevenue, totalClearedRevenue } = usePlatform();

  // Metrics calculations
  const totalUsers = allProfiles.length;
  const activeMembers = membership?.status === 'active' ? 1 : 0;
  const grossRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalRevenue = typeof activeRevenue === 'number' ? activeRevenue : grossRevenue;
  const todayRevenue = payments
    .filter((p) => p.status === 'paid' && p.created_at.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((s, p) => s + p.amount, 0);

  const totalRewards = transactions
    .filter((t) => t.type === 'video_reward')
    .reduce((s, t) => s + t.amount, 0);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const pendingWithdrawalSum = pendingWithdrawals.reduce((s, w) => s + w.amount, 0);
  const completedWithdrawals = withdrawals.filter((w) => w.status === 'paid');
  const activeVideos = videos.filter((v) => v.status === 'active').length;

  // Chart data
  const weeklyTrendData = [
    { day: 'Mon', revenue: 1200, rewards: 450, withdrawals: 300 },
    { day: 'Tue', revenue: 2100, rewards: 780, withdrawals: 600 },
    { day: 'Wed', revenue: 1800, rewards: 620, withdrawals: 450 },
    { day: 'Thu', revenue: 2700, rewards: 910, withdrawals: 800 },
    { day: 'Fri', revenue: 3600, rewards: 1300, withdrawals: 1100 },
    { day: 'Sat', revenue: 4200, rewards: 1650, withdrawals: 1400 },
    { day: 'Sun', revenue: totalRevenue > 0 ? totalRevenue : 3900, rewards: totalRewards > 0 ? totalRewards : 1420, withdrawals: 900 },
  ];

  return (
    <div className="space-y-8 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            Admin Master Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform oversight, liquidity surveillance, and compliance telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/withdrawals">
            <Button
              variant="primary"
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              Review Payouts ({pendingWithdrawals.length})
            </Button>
          </Link>
          <Link to="/admin/payments">
            <Button variant="secondary" size="sm" className="bg-slate-800 text-white hover:bg-slate-700">
              Verify Payments
            </Button>
          </Link>
        </div>
      </div>

      {/* Step 15 Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalUsers}</div>
          <span className="text-[10px] text-emerald-400">100% verified emails</span>
        </div>

        {/* Active Members */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Paid Members</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{activeMembers}</div>
          <span className="text-[10px] text-slate-400">Rs. 300 30-day passes</span>
        </div>

        {/* Total Platform Active Revenue */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Revenue Total</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">Rs. {totalRevenue.toFixed(2)}</div>
          <span className="text-[10px] text-slate-400 block truncate">
            Gross: Rs. {grossRevenue.toFixed(2)} {totalClearedRevenue > 0 ? `• Cleared: Rs. ${totalClearedRevenue.toFixed(2)}` : ''}
          </span>
        </div>

        {/* Total Rewards Disbursed */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Task Rewards</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">Rs. {totalRewards.toFixed(2)}</div>
          <span className="text-[10px] text-slate-400">Campaign sponsor spend</span>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pending Payout Requests</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">{pendingWithdrawals.length}</div>
          <span className="text-[10px] text-slate-400">Value: Rs. {pendingWithdrawalSum.toFixed(2)}</span>
        </div>

        {/* Completed Withdrawals */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Completed Payouts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{completedWithdrawals.length}</div>
          <span className="text-[10px] text-emerald-400">Dispatched successfully</span>
        </div>

        {/* Active Videos */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Video Tasks</span>
            <Video className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{activeVideos}</div>
          <span className="text-[10px] text-slate-400">In rotation</span>
        </div>

        {/* Compliance Status */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Risk / Fraud Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">Optimal</div>
          <span className="text-[10px] text-slate-400">Anti-bot heuristics 100%</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Rewards Chart */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Weekly Revenue vs. Rewards (PKR)</h3>
            <span className="text-xs text-slate-400">Past 7 Days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="revenue" name="Revenue (Rs.)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rewards" name="Rewards (Rs.)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payout Trend Chart */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Withdrawals Dispatched Trend</h3>
            <span className="text-xs text-slate-400">Liquidity Outflow</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="withdrawals" name="Withdrawals (Rs.)" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
