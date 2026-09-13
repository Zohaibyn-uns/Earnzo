import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  History,
  FileText,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const WalletPage: React.FC = () => {
  const { wallet, transactions, plan, settings } = usePlatform();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ledger Wallet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Auditable double-entry balances with zero client-side mutations.
          </p>
        </div>

        <Link to="/dashboard/withdraw">
          <Button variant="primary" size="md" leftIcon={<ArrowUpRight className="w-4 h-4" />}>
            Request Payout
          </Button>
        </Link>
      </div>

      {/* Balances Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Available Balance */}
        <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-0 shadow-lg">
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-semibold text-indigo-200">Available For Payout</span>
            <div className="text-3xl font-black">{formatCurrency(wallet.balance)}</div>
            <p className="text-[11px] text-indigo-300">Min threshold: Rs. {settings.minWithdrawalBalance}</p>
          </CardContent>
        </Card>

        {/* Pending Locked Balance */}
        <Card>
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500">Pending Review Lock</span>
            <div className="text-3xl font-black text-amber-600">{formatCurrency(wallet.pending_balance)}</div>
            <p className="text-[11px] text-slate-400">Locked in active withdrawals</p>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card>
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500">Total Lifetime Earned</span>
            <div className="text-3xl font-black text-emerald-600">{formatCurrency(wallet.total_earned)}</div>
            <p className="text-[11px] text-slate-400">All credited tasks & bonuses</p>
          </CardContent>
        </Card>

        {/* Total Withdrawn */}
        <Card>
          <CardContent className="p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500">Total Dispatched</span>
            <div className="text-3xl font-black text-slate-900">{formatCurrency(wallet.total_withdrawn)}</div>
            <p className="text-[11px] text-slate-400">Sent to JazzCash/Easypaisa</p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Security Reassurance */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-950">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            <strong>Double-Entry Ledger Active:</strong> Balances cannot be modified directly via frontend code. Each financial modification corresponds to a cryptographic reference ID.
          </span>
        </div>
      </div>

      {/* Complete Transaction History Table */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Immutable Ledger Entries</h3>
              <p className="text-xs text-slate-500">Full audit trail of earnings, purchases, and withdrawals</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold">
                      <Badge
                        variant={
                          t.type.includes('reward') || t.type === 'bonus'
                            ? 'success'
                            : t.type.includes('request')
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {t.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{t.description}</td>
                    <td className="p-3 font-bold">
                      <span className={t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {t.amount >= 0 ? `+Rs. ${t.amount.toFixed(2)}` : `-Rs. ${Math.abs(t.amount).toFixed(2)}`}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">Rs. {t.balance_after.toFixed(2)}</td>
                    <td className="p-3 text-slate-400">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
