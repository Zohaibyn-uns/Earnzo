import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  Smartphone,
  Users,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AlertBanner } from '../../components/ui/AlertBanner';

export const WithdrawPage: React.FC = () => {
  const { wallet, activePlan, withdrawals, requestWithdrawal, withdrawalEligibility } = usePlatform();

  const minWithdrawal = withdrawalEligibility.minBalance;
  const [amount, setAmount] = useState<number>(minWithdrawal);
  const [method, setMethod] = useState<'JazzCash' | 'Easypaisa' | 'Bank Transfer'>('JazzCash');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const feePct = activePlan?.withdrawal_fee_pct || 2.5;
  const fee = Math.round(amount * (feePct / 100) * 100) / 100;
  const netAmount = Math.max(0, amount - fee);

  const pendingWithdrawal = withdrawals.find((w) => w.status === 'pending');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!withdrawalEligibility.isEligible) {
      setError(
        `Withdrawal requirement not met: ${withdrawalEligibility.missingRequirements.join('. ')}`
      );
      return;
    }

    if (amount < minWithdrawal) {
      setError(`Minimum withdrawal is Rs. ${minWithdrawal}`);
      return;
    }

    if (amount > wallet.balance) {
      setError(`Insufficient available balance. You have Rs. ${wallet.balance.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    const res = await requestWithdrawal({
      amount: Number(amount),
      method,
      accountTitle,
      accountNumber,
      bankName: method === 'Bank Transfer' ? bankName : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setAccountTitle('');
      setAccountNumber('');
      setBankName('');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Withdrawal Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Disburse earned platform task rewards directly to JazzCash, Easypaisa, or Pakistani bank accounts.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

      {/* Section 12: Clear Withdrawal Eligibility Card */}
      <Card
        className={`border-2 ${
          withdrawalEligibility.isEligible
            ? 'border-emerald-500/40 bg-gradient-to-br from-white to-emerald-50/30'
            : 'border-amber-400/50 bg-gradient-to-br from-white to-amber-50/40'
        }`}
      >
        <CardContent className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Compliance Gating Audit
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">Withdrawal Eligibility Status</h3>
            </div>
            <Badge variant={withdrawalEligibility.isEligible ? 'success' : 'warning'} size="md">
              {withdrawalEligibility.isEligible ? 'Eligible for Payout' : 'Requirements Incomplete'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-subtle">
              <span className="text-slate-400 block font-medium">Your Balance</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                {formatCurrency(wallet.balance)}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-subtle">
              <span className="text-slate-400 block font-medium">Minimum Required</span>
              <span className="text-lg font-black text-indigo-600 mt-0.5 block">
                Rs. {minWithdrawal}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-subtle">
              <span className="text-slate-400 block font-medium">Qualified Referrals</span>
              <span
                className={`text-lg font-black mt-0.5 block ${
                  withdrawalEligibility.qualifiedReferralsCurrent >= 2 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {withdrawalEligibility.qualifiedReferralsCurrent >= 2
                  ? `${withdrawalEligibility.qualifiedReferralsCurrent} Qualified Referrals`
                  : `${withdrawalEligibility.qualifiedReferralsCurrent} / ${withdrawalEligibility.qualifiedReferralsNeeded}`}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">2 Qualified Referrals Required</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-subtle">
              <span className="text-slate-400 block font-medium">Status</span>
              <span
                className={`text-sm font-black mt-1.5 block uppercase tracking-wider ${
                  withdrawalEligibility.isEligible ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {withdrawalEligibility.isEligible ? 'Eligible' : 'Not Eligible'}
              </span>
            </div>
          </div>

          {/* Missing Requirements Guidance */}
          {!withdrawalEligibility.isEligible && (
            <div className="p-3.5 bg-amber-100/70 border border-amber-300/80 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Missing Qualification Requirements:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-900 text-[11px]">
                  {withdrawalEligibility.missingRequirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-amber-800 pt-1">
                  You can invite friends using your{' '}
                  <Link to="/referrals" className="font-bold underline text-indigo-700">
                    Referral Link
                  </Link>{' '}
                  to qualify for payouts.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Pending Lock Notification */}
      {pendingWithdrawal && (
        <AlertBanner
          type="warning"
          title="Pending Withdrawal in Progress"
          message={`Your previous request for Rs. ${pendingWithdrawal.net_amount} via ${pendingWithdrawal.method} is undergoing audit review. New requests unlock once approved or refunded.`}
        />
      )}

      {/* Main Request Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <h3 className="font-bold text-slate-900 text-base">Request Withdrawal Payout</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Payout Channel Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Payout Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['JazzCash', 'Easypaisa', 'Bank Transfer'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                          method === m
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m === 'Bank Transfer' ? (
                          <Building className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Smartphone className="w-5 h-5 text-indigo-600" />
                        )}
                        <span>{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label={`Withdrawal Amount (Min Rs. ${minWithdrawal})`}
                  type="number"
                  min={minWithdrawal}
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  helperText={`Available balance: Rs. ${wallet.balance.toFixed(2)}`}
                />

                <Input
                  label="Account Holder Legal Name / Title"
                  required
                  placeholder="e.g. Ali Raza"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  helperText="Must match verified recipient name"
                />

                <Input
                  label={method === 'Bank Transfer' ? 'IBAN / Account Number' : 'Mobile Account Number'}
                  required
                  placeholder={method === 'Bank Transfer' ? 'PK36MEZN0001234567890123' : '03001234567'}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />

                {method === 'Bank Transfer' && (
                  <Input
                    label="Bank Name"
                    required
                    placeholder="e.g. Meezan Bank, HBL, Allied Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                )}

                {/* Net Breakdown */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Requested Gross Amount:</span>
                    <span>Rs. {amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Processing Network Fee ({feePct}%):</span>
                    <span>Rs. {fee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Net Disbursed:</span>
                    <span className="text-emerald-600 font-black">Rs. {netAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={Boolean(pendingWithdrawal) || isSubmitting}
                  isLoading={isSubmitting}
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  Request Payout (Rs. {amount.toFixed(2)})
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Rules Box */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Qualification Requirements</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                To guarantee genuine platform engagement and satisfy anti-fraud thresholds:
              </p>
              <div className="space-y-2 text-xs text-slate-700 pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 ${wallet.balance >= minWithdrawal ? 'text-emerald-600' : 'text-slate-300'}`}
                  />
                  <span>Minimum balance of Rs. {minWithdrawal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 ${withdrawalEligibility.qualifiedReferralsCurrent >= 2 ? 'text-emerald-600' : 'text-slate-300'}`}
                  />
                  <span>At least 2 qualified active referrals</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payout History */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Your Payout Records</h3>
          {withdrawals.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No withdrawal requests recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3">Method</th>
                    <th className="p-3">Gross</th>
                    <th className="p-3">Net Disbursed</th>
                    <th className="p-3">Account Beneficiary</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td className="p-3 font-semibold text-slate-800">{w.method}</td>
                      <td className="p-3">Rs. {w.amount.toFixed(2)}</td>
                      <td className="p-3 font-bold text-emerald-600">Rs. {w.net_amount.toFixed(2)}</td>
                      <td className="p-3">
                        <span className="font-medium text-slate-800">{w.account_title}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{w.account_number}</span>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            w.status === 'paid'
                              ? 'success'
                              : w.status === 'pending'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {w.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-400">{formatDate(w.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
