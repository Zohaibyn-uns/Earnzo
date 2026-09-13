import React, { useState } from 'react';
import { Users, Copy, CheckCircle2, ShieldCheck, Share2, Sparkles, Award, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const ReferralPage: React.FC = () => {
  const { user } = useAuth();
  const { referrals, qualifiedReferralsCount, transactions, settings } = usePlatform();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referral_code || 'ALI789';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const referralTransactions = transactions.filter((t) => t.type === 'referral_reward');
  const totalReferralEarned = referralTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Direct Referral Program
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Earn a {settings.referralCommissionPct}% direct commission when a referred friend joins WatchEarn and activates a verified membership plan.
        </p>
      </div>

      {/* Referral Link & Stats Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Your Invitation URL (1-Tier Only)
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Share With Genuine Peers</h3>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-700 font-mono focus:outline-none px-2"
              />
              <Button
                variant={copied ? 'success' : 'primary'}
                size="sm"
                onClick={handleCopy}
                leftIcon={copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
              <span className="text-slate-600 font-medium">Your Unique Code:</span>
              <span className="font-mono font-black text-indigo-700 text-sm">{referralCode}</span>
            </div>
          </CardContent>
        </Card>

        {/* Qualified Referrals Metric Card */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-6 space-y-3">
            <span className="text-xs font-semibold text-slate-500">Qualified Referrals</span>
            <div className="text-3xl font-black text-emerald-600">
              {qualifiedReferralsCount >= 2 ? (
                <span>
                  {qualifiedReferralsCount}{' '}
                  <span className="text-sm text-slate-500 font-semibold">Qualified Referrals</span>
                </span>
              ) : (
                <span>
                  {qualifiedReferralsCount}{' '}
                  <span className="text-base text-slate-400 font-normal">
                    / {settings.requiredQualifiedReferrals}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {qualifiedReferralsCount >= 2
                ? `✓ 2 Qualified Referrals requirement satisfied (Eligible for withdrawal if balance ≥ Rs. ${settings.minWithdrawalBalance})!`
                : `2 Qualified Referrals Required (${settings.requiredQualifiedReferrals - qualifiedReferralsCount} more needed to qualify for withdrawals).`}
            </p>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
            Earned to date: Rs. {totalReferralEarned.toFixed(2)} ({settings.referralCommissionPct}% rate)
          </div>
        </Card>
      </div>

      {/* Non-Pyramid Policy Guarantee */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-3">
        <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>Strict 1-Tier Direct Referral Policy</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          WatchEarn operates on a <strong>pure direct 1-tier commission</strong> ({settings.referralCommissionPct}%). There are no multi-level matrix structures, downstream override percentages, or recruitment chains. A referral is "qualified" once they register through your referral link, choose an eligible plan, and their payment is successfully verified by admin.
        </p>
      </div>

      {/* Referred Friends Directory */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Referred Friends</h3>
              <p className="text-xs text-slate-500">Track registration and plan verification progress</p>
            </div>
            <Badge variant="neutral" size="sm">
              {referrals.length} Total
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Friend</th>
                  <th className="p-3">Activated Tier</th>
                  <th className="p-3">{settings.referralCommissionPct}% Commission</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-semibold text-slate-800">
                      {r.referred_user?.full_name || 'Referred Member'}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {r.referred_user?.email || 'verified'}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{r.plan_name || 'Plan 1'}</td>
                    <td className="p-3 font-black text-emerald-600">
                      +Rs. {(r.commission_amount || 30).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <Badge variant={r.is_qualified ? 'success' : 'warning'} size="sm">
                        {r.is_qualified ? 'Qualified' : 'Pending Plan'}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-400">{formatDate(r.created_at).split(',')[0]}</td>
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
