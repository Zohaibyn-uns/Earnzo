import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AlertBanner } from '../../components/ui/AlertBanner';
import {
  Settings,
  ShieldCheck,
  RefreshCw,
  Save,
  Users,
  Wallet,
  Sparkles,
  Lock,
  Globe,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  GeneralSettings,
  ReferralSettings,
  WithdrawalSettings,
  WelcomeMessageSettings,
  AuthSettings,
} from '../../types/database';

export const AdminSettings: React.FC = () => {
  const { settings, updateSettings, resetToDefaults } = usePlatform();

  const [activeTab, setActiveTab] = useState<'general' | 'referrals' | 'withdrawals' | 'welcome' | 'auth'>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. General Settings State
  const [general, setGeneral] = useState<GeneralSettings>({
    site_name: settings.general?.site_name || 'Earnzo',
    site_description: settings.general?.site_description || 'Official Sponsored Video & Engagement Rewards Hub',
    maintenance_mode: settings.general?.maintenance_mode ?? settings.maintenanceMode ?? false,
    support_email: settings.general?.support_email || 'support@earnzo.com',
    support_phone: settings.general?.support_phone || '+92 300 1234567',
    currency: settings.general?.currency || 'PKR',
    timezone: settings.general?.timezone || 'Asia/Karachi',
  });

  // 2. Referral Settings State
  const [referrals, setReferrals] = useState<ReferralSettings>({
    referral_system_enabled: settings.referrals?.referral_system_enabled ?? true,
    referral_rewards_enabled: settings.referrals?.referral_rewards_enabled ?? true,
    reward_type: settings.referrals?.reward_type || 'percentage',
    reward_amount: settings.referrals?.reward_amount ?? settings.referralCommissionPct ?? 10,
    min_qualified_condition: settings.referrals?.min_qualified_condition ?? settings.requiredQualifiedReferrals ?? 2,
    max_reward_cap: settings.referrals?.max_reward_cap ?? 10000,
    referral_earnings_enabled: settings.referrals?.referral_earnings_enabled ?? true,
  });

  // 3. Withdrawal Settings State
  const [withdrawals, setWithdrawals] = useState<WithdrawalSettings>({
    withdrawals_enabled: settings.withdrawals?.withdrawals_enabled ?? true,
    min_withdrawal_amount: settings.withdrawals?.min_withdrawal_amount ?? settings.minWithdrawalBalance ?? 500,
    max_withdrawal_amount: settings.withdrawals?.max_withdrawal_amount ?? 50000,
    withdrawal_fee_pct: settings.withdrawals?.withdrawal_fee_pct ?? 0,
    jazzcash_enabled: settings.withdrawals?.jazzcash_enabled ?? true,
    easypaisa_enabled: settings.withdrawals?.easypaisa_enabled ?? true,
    bank_enabled: settings.withdrawals?.bank_enabled ?? true,
    jazzcash_title: settings.withdrawals?.jazzcash_title || settings.jazzcashTitle || 'Earnzo Official Operations',
    jazzcash_number: settings.withdrawals?.jazzcash_number || settings.jazzcashNumber || '03001234567',
    easypaisa_title: settings.withdrawals?.easypaisa_title || settings.easypaisaTitle || 'Earnzo Payments',
    easypaisa_number: settings.withdrawals?.easypaisa_number || settings.easypaisaNumber || '03451234567',
    bank_iban: settings.withdrawals?.bank_iban || settings.bankIban || 'PK36MEZN0001234567890123',
    bank_name: settings.withdrawals?.bank_name || 'Meezan Bank Limited',
  });

  // 4. Welcome Message Settings State
  const [welcome, setWelcome] = useState<WelcomeMessageSettings>({
    enabled: settings.welcomeMessage?.enabled ?? true,
    new_user_title: settings.welcomeMessage?.new_user_title || 'Welcome to Earnzo! 🎉',
    new_user_message:
      settings.welcomeMessage?.new_user_message ||
      'Hi {name}, start earning today by completing tasks and inviting friends!',
    returning_user_title: settings.welcomeMessage?.returning_user_title || 'Welcome Back! 👋',
    returning_user_message:
      settings.welcomeMessage?.returning_user_message ||
      'Hi {name}, great to see you again! Check out your new daily tasks.',
    display_duration_seconds: settings.welcomeMessage?.display_duration_seconds ?? 6,
  });

  // 5. Auth & Security Settings State
  const [auth, setAuth] = useState<AuthSettings>({
    registration_enabled: settings.auth?.registration_enabled ?? true,
    email_otp_enabled: settings.auth?.email_otp_enabled ?? false,
    otp_cooldown_seconds: settings.auth?.otp_cooldown_seconds ?? 60,
  });

  // Keep state in sync with platform context when fetched
  useEffect(() => {
    if (settings.general) setGeneral(settings.general);
    if (settings.referrals) setReferrals(settings.referrals);
    if (settings.withdrawals) setWithdrawals(settings.withdrawals);
    if (settings.welcomeMessage) setWelcome(settings.welcomeMessage);
    if (settings.auth) setAuth(settings.auth);
  }, [settings]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    await updateSettings({
      general,
      referrals,
      withdrawals,
      welcomeMessage: welcome,
      auth,
      // Mirror legacy properties for immediate seamless backward compatibility
      maintenanceMode: general.maintenance_mode,
      minWithdrawalBalance: withdrawals.min_withdrawal_amount,
      requiredQualifiedReferrals: referrals.min_qualified_condition,
      referralCommissionPct: referrals.reward_amount,
      jazzcashTitle: withdrawals.jazzcash_title,
      jazzcashNumber: withdrawals.jazzcash_number,
      easypaisaTitle: withdrawals.easypaisa_title,
      easypaisaNumber: withdrawals.easypaisa_number,
      bankIban: withdrawals.bank_iban,
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Platform Control & Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Database-driven control panel to configure website behavior, referrals, payment rails, and security.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveAll}
          isLoading={isSaving}
          className="shadow-md shadow-indigo-900/30 text-xs px-4"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      {saveSuccess && (
        <AlertBanner
          type="success"
          message="All configurations have been successfully saved to Supabase and published live."
          onClose={() => setSaveSuccess(false)}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'general'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'referrals'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Referrals</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'withdrawals'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Wallet & Rails</span>
        </button>

        <button
          onClick={() => setActiveTab('welcome')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'welcome'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Welcome Message</span>
        </button>

        <button
          onClick={() => setActiveTab('auth')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'auth'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Auth & Security</span>
        </button>
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* 1. GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">General Website Identity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Control public branding, contact information, and maintenance status.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Site Name"
                value={general.site_name}
                onChange={(e) => setGeneral({ ...general, site_name: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />

              <Input
                label="Site Tagline / Description"
                value={general.site_description}
                onChange={(e) => setGeneral({ ...general, site_description: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />

              <Input
                label="Support Contact Email"
                type="email"
                value={general.support_email}
                onChange={(e) => setGeneral({ ...general, support_email: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />

              <Input
                label="Support Phone / WhatsApp"
                value={general.support_phone}
                onChange={(e) => setGeneral({ ...general, support_phone: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />

              <Input
                label="Platform Currency Symbol"
                value={general.currency}
                onChange={(e) => setGeneral({ ...general, currency: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
                helperText="e.g. PKR"
              />

              <Input
                label="Platform Timezone"
                value={general.timezone}
                onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
                helperText="e.g. Asia/Karachi"
              />
            </div>

            {/* Maintenance Mode */}
            <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-amber-300">Platform Maintenance Mode</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  When enabled, visitors will see a scheduled maintenance screen. Admins retain full bypass access.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={general.maintenance_mode}
                  onChange={(e) => setGeneral({ ...general, maintenance_mode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        )}

        {/* 2. REFERRALS TAB */}
        {activeTab === 'referrals' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Referral & Commission Control</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure affiliate rules, qualification thresholds, and multi-mode referral reward calculation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Referral System Status</p>
                  <p className="text-[11px] text-slate-400">Enable or pause the entire referral engine.</p>
                </div>
                <input
                  type="checkbox"
                  checked={referrals.referral_system_enabled}
                  onChange={(e) => setReferrals({ ...referrals, referral_system_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Referral Rewards Dispensation</p>
                  <p className="text-[11px] text-slate-400">Award bonuses to referrers when users upgrade.</p>
                </div>
                <input
                  type="checkbox"
                  checked={referrals.referral_rewards_enabled}
                  onChange={(e) => setReferrals({ ...referrals, referral_rewards_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Reward Calculation Type</label>
                <select
                  value={referrals.reward_type}
                  onChange={(e: any) => setReferrals({ ...referrals, reward_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5"
                >
                  <option value="percentage">Percentage (%) of Plan Price</option>
                  <option value="fixed">Fixed Cash Amount (Rs.)</option>
                </select>
              </div>

              <Input
                label={referrals.reward_type === 'percentage' ? 'Reward Percentage (%)' : 'Fixed Reward Amount (Rs.)'}
                type="number"
                min={0}
                value={referrals.reward_amount}
                onChange={(e) => setReferrals({ ...referrals, reward_amount: Number(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                helperText={referrals.reward_type === 'percentage' ? 'Default: 10%' : 'e.g. Rs. 50'}
              />

              <Input
                label="Required Qualified Referrals"
                type="number"
                min={0}
                value={referrals.min_qualified_condition}
                onChange={(e) => setReferrals({ ...referrals, min_qualified_condition: Number(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                helperText="Min paid friends before withdrawal (Default: 2)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Maximum Lifetime Referral Earnings Cap (Rs.)"
                type="number"
                min={0}
                value={referrals.max_reward_cap}
                onChange={(e) => setReferrals({ ...referrals, max_reward_cap: Number(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                helperText="Maximum cumulative referral commission per account"
              />

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Referral Earning Counter</p>
                  <p className="text-[11px] text-slate-400">Enable earning stats on user referral dashboard.</p>
                </div>
                <input
                  type="checkbox"
                  checked={referrals.referral_earnings_enabled}
                  onChange={(e) => setReferrals({ ...referrals, referral_earnings_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. WITHDRAWALS & PAYMENT RAILS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Withdrawal Thresholds & Payment Rails</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set disbursement boundaries, withdrawal fees, and official receiving details for manual deposits.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Global Withdrawal Processing</p>
                <p className="text-[11px] text-slate-400">Toggle whether members can submit withdrawal requests.</p>
              </div>
              <input
                type="checkbox"
                checked={withdrawals.withdrawals_enabled}
                onChange={(e) => setWithdrawals({ ...withdrawals, withdrawals_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Minimum Withdrawal Balance (Rs.)"
                type="number"
                min={1}
                value={withdrawals.min_withdrawal_amount}
                onChange={(e) => setWithdrawals({ ...withdrawals, min_withdrawal_amount: Number(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                helperText="Default: Rs. 500"
              />

              <Input
                label="Maximum Withdrawal Amount (Rs.)"
                type="number"
                min={1}
                value={withdrawals.max_withdrawal_amount}
                onChange={(e) => setWithdrawals({ ...withdrawals, max_withdrawal_amount: Number(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                helperText="Per transaction limit (Default: 50000)"
              />

              <Input
                label="Disbursement Processing Fee (%)"
                type="number"
                min={0}
                max={100}
                value={withdrawals.withdrawal_fee_pct}
                onChange={(e) => setWithdrawals({ ...withdrawals, withdrawal_fee_pct: Number(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                helperText="Deducted at disbursement (Default: 0%)"
              />
            </div>

            {/* Rails */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Official Payment Reception Rails</h4>

              {/* JazzCash */}
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-400">JazzCash Account Details</span>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={withdrawals.jazzcash_enabled}
                      onChange={(e) => setWithdrawals({ ...withdrawals, jazzcash_enabled: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Account Title"
                    value={withdrawals.jazzcash_title}
                    onChange={(e) => setWithdrawals({ ...withdrawals, jazzcash_title: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Input
                    label="Account Number"
                    value={withdrawals.jazzcash_number}
                    onChange={(e) => setWithdrawals({ ...withdrawals, jazzcash_number: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Easypaisa */}
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-400">Easypaisa Account Details</span>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={withdrawals.easypaisa_enabled}
                      onChange={(e) => setWithdrawals({ ...withdrawals, easypaisa_enabled: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Account Title"
                    value={withdrawals.easypaisa_title}
                    onChange={(e) => setWithdrawals({ ...withdrawals, easypaisa_title: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Input
                    label="Account Number"
                    value={withdrawals.easypaisa_number}
                    onChange={(e) => setWithdrawals({ ...withdrawals, easypaisa_number: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Bank Transfer */}
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-400">Bank Transfer / IBAN</span>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={withdrawals.bank_enabled}
                      onChange={(e) => setWithdrawals({ ...withdrawals, bank_enabled: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Bank Name"
                    value={withdrawals.bank_name || ''}
                    onChange={(e) => setWithdrawals({ ...withdrawals, bank_name: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Input
                    label="IBAN / Account Number"
                    value={withdrawals.bank_iban}
                    onChange={(e) => setWithdrawals({ ...withdrawals, bank_iban: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. WELCOME MESSAGE TAB */}
        {activeTab === 'welcome' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Welcome Message Customizer</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure greeting popups displayed to new members and returning users. Supports dynamic <code className="text-amber-400">{"{name}"}</code> tag.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Welcome Message System</p>
                  <p className="text-[11px] text-slate-400">Display greeting card upon dashboard entry.</p>
                </div>
                <input
                  type="checkbox"
                  checked={welcome.enabled}
                  onChange={(e) => setWelcome({ ...welcome, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <Input
                label="Auto-Dismiss Duration (Seconds)"
                type="number"
                min={0}
                max={60}
                value={welcome.display_duration_seconds}
                onChange={(e) => setWelcome({ ...welcome, display_duration_seconds: Number(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                helperText="Set to 0 to require user to manually click close (X)"
              />
            </div>

            {/* New User Template */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">New Member Welcome (First 24 Hours)</h4>
              <Input
                label="Title Template"
                value={welcome.new_user_title}
                onChange={(e) => setWelcome({ ...welcome, new_user_title: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Message Template</label>
                <textarea
                  rows={3}
                  value={welcome.new_user_message}
                  onChange={(e) => setWelcome({ ...welcome, new_user_message: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-3"
                />
                <p className="text-[11px] text-slate-500 mt-1">Hint: Use {"{name}"} to automatically insert user's full name.</p>
              </div>
            </div>

            {/* Returning User Template */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Returning Member Welcome</h4>
              <Input
                label="Title Template"
                value={welcome.returning_user_title}
                onChange={(e) => setWelcome({ ...welcome, returning_user_title: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Message Template</label>
                <textarea
                  rows={3}
                  value={welcome.returning_user_message}
                  onChange={(e) => setWelcome({ ...welcome, returning_user_message: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-3"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. AUTH & SECURITY TAB */}
        {activeTab === 'auth' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registration & Security Settings</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Control user registration availability and mandatory Supabase email OTP authentication.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Member Registrations Enabled</p>
                  <p className="text-[11px] text-slate-400">
                    If disabled, prospective users cannot sign up and will see a temporary maintenance message.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={auth.registration_enabled}
                  onChange={(e) => setAuth({ ...auth, registration_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Email OTP Verification Required</p>
                  <p className="text-[11px] text-slate-400">
                    Require newly registered users to enter a 6-digit confirmation code sent to their email before accessing account.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={auth.email_otp_enabled}
                  onChange={(e) => setAuth({ ...auth, email_otp_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <Input
                label="OTP Resend Cooldown (Seconds)"
                type="number"
                min={10}
                max={300}
                value={auth.otp_cooldown_seconds}
                onChange={(e) => setAuth({ ...auth, otp_cooldown_seconds: Number(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white max-w-sm"
                helperText="Wait duration before allowing user to request a replacement verification code (Default: 60s)"
              />
            </div>
          </div>
        )}

        {/* Global Save Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-400">
            Changes saved here are committed directly to <strong className="text-slate-200">public.settings</strong> in Supabase.
          </p>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            className="shadow-md shadow-indigo-900/30 text-xs px-5"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>Save All Configurations</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
