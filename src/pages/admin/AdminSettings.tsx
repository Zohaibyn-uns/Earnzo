import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { Settings, ShieldCheck, RefreshCw, Save } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { settings, updateSettings, logAuditEvent, resetToDefaults } = usePlatform();

  const [minWithdrawalBalance, setMinWithdrawalBalance] = useState(settings.minWithdrawalBalance);
  const [requiredQualifiedReferrals, setRequiredQualifiedReferrals] = useState(settings.requiredQualifiedReferrals);
  const [referralCommissionPct, setReferralCommissionPct] = useState(settings.referralCommissionPct);

  const [jcTitle, setJcTitle] = useState(settings.jazzcashTitle);
  const [jcNumber, setJcNumber] = useState(settings.jazzcashNumber);
  const [epTitle, setEpTitle] = useState(settings.easypaisaTitle);
  const [epNumber, setEpNumber] = useState(settings.easypaisaNumber);
  const [bankIban, setBankIban] = useState(settings.bankIban);
  const [msg, setMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      minWithdrawalBalance: Number(minWithdrawalBalance),
      requiredQualifiedReferrals: Number(requiredQualifiedReferrals),
      referralCommissionPct: Number(referralCommissionPct),
      jazzcashTitle: jcTitle,
      jazzcashNumber: jcNumber,
      easypaisaTitle: epTitle,
      easypaisaNumber: epNumber,
      bankIban,
    });
    setMsg(true);
    setTimeout(() => setMsg(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">System Settings & Rails</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure live withdrawal gating thresholds, referral commission, and official deposit rails.
          </p>
        </div>
      </div>

      {msg && <AlertBanner type="success" message="System configurations successfully saved." onClose={() => setMsg(false)} />}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Business Rules: Withdrawal & Referral Settings */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <Settings className="w-4 h-4" />
            <h3 className="text-white uppercase tracking-wider text-xs">
              Live Business Rules (Withdrawals & Referrals)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Minimum Withdrawal Balance (Rs.)"
              type="number"
              min={1}
              required
              value={minWithdrawalBalance}
              onChange={(e) => setMinWithdrawalBalance(Number(e.target.value))}
              helperText="Default: Rs. 500"
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Input
              label="Required Qualified Referrals"
              type="number"
              min={0}
              required
              value={requiredQualifiedReferrals}
              onChange={(e) => setRequiredQualifiedReferrals(Number(e.target.value))}
              helperText="Default: 2 Qualified Referrals (Minimum)"
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Input
              label="Direct Referral Commission (%)"
              type="number"
              min={0}
              max={100}
              required
              value={referralCommissionPct}
              onChange={(e) => setReferralCommissionPct(Number(e.target.value))}
              helperText="Default: 10% direct 1-tier"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Payment Rails Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Official Deposit Receiving Accounts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="JazzCash Account Title"
              value={jcTitle}
              onChange={(e) => setJcTitle(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Input
              label="JazzCash Mobile Number"
              value={jcNumber}
              onChange={(e) => setJcNumber(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Easypaisa Account Title"
              value={epTitle}
              onChange={(e) => setEpTitle(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Input
              label="Easypaisa Mobile Number"
              value={epNumber}
              onChange={(e) => setEpNumber(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <Input
            label="Corporate Bank IBAN (Meezan Bank)"
            value={bankIban}
            onChange={(e) => setBankIban(e.target.value)}
            className="bg-slate-900 border-slate-700 text-white"
          />
        </div>

        {/* Anti-Fraud Engine Configurations */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Fraud Heuristics Safeguards</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            - Minimum qualified referrals for withdrawal: <strong>{requiredQualifiedReferrals} verified referrals</strong>.<br />
            - Minimum balance threshold for payout: <strong>Rs. {minWithdrawalBalance}</strong>.<br />
            - Referral commission payout rate: <strong>{referralCommissionPct}% direct cash reward</strong>.<br />
            - Minimum playback completion tolerance: <strong>95% of video duration</strong>.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            className="border-rose-800 text-rose-400 hover:bg-rose-950/40"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => {
              if (confirm('Reset all sandbox storage back to pristine seed defaults?')) {
                resetToDefaults();
              }
            }}
          >
            Reset Demo Data
          </Button>

          <Button
            type="submit"
            variant="primary"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
