import React from 'react';
import { Link } from 'react-router-dom';
import {
  PlayCircle,
  CreditCard,
  Wallet,
  ArrowUpRight,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DisplayAdUnit } from '../../components/ads/DisplayAdUnit';

export const DashboardOverview: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const {
    wallet,
    activePlan,
    hasActivePlan,
    membership,
    transactions,
    qualifiedReferralsCount,
    withdrawalEligibility,
    payments,
    plans,
  } = usePlatform();

  const pendingPayment = payments.find((p) => p.status === 'pending');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEarnings = transactions
    .filter((t) => t.type === 'video_reward' && t.created_at.startsWith(todayStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const tasksCompletedToday = membership?.tasks_completed_today || 0;
  const maxDailyTasks = activePlan?.daily_task_limit || 0;
  const progressPercent = maxDailyTasks > 0 ? Math.min(100, Math.round((tasksCompletedToday / maxDailyTasks) * 100)) : 0;

  return (
    <div className="space-y-8">
      {/* 1. Header & Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, {user?.full_name || 'Member'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your personal hub for sponsored tasks, ledger wallet, and payout dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={hasActivePlan ? 'success' : 'warning'} size="md">
            {hasActivePlan ? `${activePlan?.name} Active` : 'No Active Plan'}
          </Badge>
        </div>
      </div>

      {/* Pending Payment Verification Banner */}
      {pendingPayment && !hasActivePlan && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-indigo-950">Payment Verification Pending</h4>
              <p className="text-xs text-indigo-800/90 mt-0.5">
                Your payment of Rs. {pendingPayment.amount} for {plans.find(p => p.id === pendingPayment.plan_id)?.name || 'Plan'} (TRX: {pendingPayment.transaction_ref}) is under review. Your plan will activate once approved by admin.
              </p>
            </div>
          </div>
          {isAdmin && (
            <Link to="/admin/payments" className="shrink-0 w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                Admin Review
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Warning banner if no active plan and no pending payment */}
      {!hasActivePlan && !pendingPayment && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Choose a Plan to Start Earning</h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Subscribe to Plan 1, Plan 2, or Plan 3 to unlock daily sponsored task allocations.
              </p>
            </div>
          </div>
          <Link to="/plans" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              View Plans
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Section 15 Required Clean KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Active Plan */}
        <Card className="bg-gradient-to-br from-white to-indigo-50/40">
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Active Plan</span>
            <div className="text-base sm:text-lg font-black text-indigo-700 truncate">
              {hasActivePlan ? activePlan?.name : 'No Active Plan'}
            </div>
            <p className="text-[10px] text-slate-400">
              {hasActivePlan ? `Rs. ${activePlan?.price} Tier` : 'Requires Plan'}
            </p>
          </CardContent>
        </Card>

        {/* Plan Status */}
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Plan Status</span>
            <div
              className={`text-base sm:text-lg font-black ${
                hasActivePlan ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {hasActivePlan ? 'Active' : 'Not Active'}
            </div>
            <p className="text-[10px] text-slate-400">
              {hasActivePlan ? '30-Day Validity' : 'No validity'}
            </p>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Today's Tasks</span>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {tasksCompletedToday} / {maxDailyTasks}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Today's Earnings */}
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Today's Earnings</span>
            <div className="text-base sm:text-lg font-black text-emerald-600">
              Rs. {todayEarnings > 0 ? todayEarnings.toFixed(2) : '0'}
            </div>
            <p className="text-[10px] text-slate-400">Task rewards</p>
          </CardContent>
        </Card>

        {/* Wallet Balance */}
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Wallet Balance</span>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {formatCurrency(wallet.balance)}
            </div>
            <p className="text-[10px] text-slate-400">Audited ledger</p>
          </CardContent>
        </Card>

        {/* Qualified Referrals */}
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Qualified Referrals</span>
            <div
              className={`text-base sm:text-lg font-black ${
                qualifiedReferralsCount >= 2 ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {qualifiedReferralsCount >= 2
                ? `${qualifiedReferralsCount} Qualified Referrals`
                : `${qualifiedReferralsCount} / ${withdrawalEligibility.qualifiedReferralsNeeded}`}
            </div>
            <p className="text-[10px] text-slate-400">2 Qualified Referrals Required</p>
          </CardContent>
        </Card>

        {/* Withdrawal Status */}
        <Card
          className={
            withdrawalEligibility.isEligible
              ? 'bg-gradient-to-br from-white to-emerald-50/40 border-emerald-300'
              : ''
          }
        >
          <CardContent className="p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Withdrawal Status</span>
            <div
              className={`text-xs sm:text-sm font-black mt-1 ${
                withdrawalEligibility.isEligible ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {withdrawalEligibility.isEligible ? 'Eligible' : 'Not Eligible'}
            </div>
            <p className="text-[10px] text-slate-500">
              Min: Rs. {withdrawalEligibility.minBalance}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Section 15 Quick Actions Strip */}
      <Card>
        <CardContent className="p-5 sm:p-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Quick Actions
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Link to="/earn">
              <Button
                variant="primary"
                size="md"
                className="w-full flex-col py-3.5 h-auto text-xs font-bold gap-1"
                leftIcon={<PlayCircle className="w-5 h-5 text-indigo-200" />}
              >
                Earn Tasks
              </Button>
            </Link>

            <Link to="/plans">
              <Button
                variant="secondary"
                size="md"
                className="w-full flex-col py-3.5 h-auto text-xs font-bold gap-1 bg-slate-100 hover:bg-slate-200"
                leftIcon={<CreditCard className="w-5 h-5 text-indigo-600" />}
              >
                Plans
              </Button>
            </Link>

            <Link to="/wallet">
              <Button
                variant="secondary"
                size="md"
                className="w-full flex-col py-3.5 h-auto text-xs font-bold gap-1 bg-slate-100 hover:bg-slate-200"
                leftIcon={<Wallet className="w-5 h-5 text-indigo-600" />}
              >
                Wallet
              </Button>
            </Link>

            <Link to="/withdraw">
              <Button
                variant="secondary"
                size="md"
                className="w-full flex-col py-3.5 h-auto text-xs font-bold gap-1 bg-slate-100 hover:bg-slate-200"
                leftIcon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
              >
                Withdraw
              </Button>
            </Link>

            <Link to="/referrals">
              <Button
                variant="secondary"
                size="md"
                className="w-full flex-col py-3.5 h-auto text-xs font-bold gap-1 bg-slate-100 hover:bg-slate-200"
                leftIcon={<Users className="w-5 h-5 text-purple-600" />}
              >
                Referrals
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Non-Incentivized Third-Party Display Ad */}
      <DisplayAdUnit placement="dashboard" />

      {/* Recent Activity Mini Ledger */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Ledger Activity</h3>
              <p className="text-xs text-slate-500">Immutable credit & debit entries</p>
            </div>
            <Link to="/wallet" className="text-xs text-indigo-600 font-semibold hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-2.5">
            {transactions.slice(0, 4).map((trx) => (
              <div
                key={trx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 text-xs border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${
                      trx.amount >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {trx.amount >= 0 ? '+' : '-'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">{trx.description}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(trx.created_at)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black ${
                      trx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {trx.amount >= 0 ? `+Rs. ${trx.amount.toFixed(2)}` : `-Rs. ${Math.abs(trx.amount).toFixed(2)}`}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Bal: Rs. {trx.balance_after.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
