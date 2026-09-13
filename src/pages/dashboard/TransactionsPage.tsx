import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { History, Filter, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const TransactionsPage: React.FC = () => {
  const { transactions } = usePlatform();
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Transaction History & Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete cryptographic audit records of all debits, credits, and payout requests.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Transactions</option>
            <option value="video_reward">Video Rewards</option>
            <option value="withdrawal_request">Withdrawal Requests</option>
            <option value="membership_purchase">Membership Purchases</option>
            <option value="referral_reward">Referral Rewards</option>
            <option value="bonus">Bonuses</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Impact</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No matching ledger transactions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono text-[11px] text-slate-400">{t.id}</td>
                      <td className="p-3">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
