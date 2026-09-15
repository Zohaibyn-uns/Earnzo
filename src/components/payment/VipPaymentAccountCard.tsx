import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Copy,
  CheckCircle2,
  Smartphone,
  Building2,
  AlertCircle,
  CreditCard,
  Lock,
} from 'lucide-react';
import { Plan, PaymentMethod } from '../../types/database';
import { usePlatform } from '../../context/PlatformContext';

interface VipPaymentAccountCardProps {
  plan: Plan;
  selectedMethod: 'JazzCash' | 'Easypaisa' | 'Bank Transfer';
  onSelectMethod: (method: 'JazzCash' | 'Easypaisa' | 'Bank Transfer') => void;
  className?: string;
}

export const VipPaymentAccountCard: React.FC<VipPaymentAccountCardProps> = ({
  plan,
  selectedMethod,
  onSelectMethod,
  className = '',
}) => {
  const { settings } = usePlatform();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const paymentChannels = [
    {
      id: 'JazzCash' as const,
      name: 'JazzCash',
      subtitle: 'Instant Mobile Wallet',
      number: settings.withdrawals?.jazzcash_number || settings.jazzcashNumber || '03001234567',
      title: settings.withdrawals?.jazzcash_title || settings.jazzcashTitle || 'Earnzo Official Operations',
      icon: Smartphone,
      accentColor: 'from-amber-500 to-rose-600',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      activeRing: 'ring-rose-500 border-rose-500',
    },
    {
      id: 'Easypaisa' as const,
      name: 'Easypaisa',
      subtitle: 'Instant Mobile Account',
      number: settings.withdrawals?.easypaisa_number || settings.easypaisaNumber || '03451234567',
      title: settings.withdrawals?.easypaisa_title || settings.easypaisaTitle || 'Earnzo Payments',
      icon: Smartphone,
      accentColor: 'from-emerald-500 to-teal-600',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      activeRing: 'ring-emerald-500 border-emerald-500',
    },
    {
      id: 'Bank Transfer' as const,
      name: settings.withdrawals?.bank_name || 'Meezan Bank',
      subtitle: 'Direct 1Link Raast / IBAN',
      number: settings.withdrawals?.bank_iban || settings.bankIban || 'PK36MEZN0001234567890123',
      title: 'Earnzo Official Operations',
      icon: Building2,
      accentColor: 'from-indigo-500 to-blue-700',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      activeRing: 'ring-indigo-500 border-indigo-500',
    },
  ];

  const activeChannel = paymentChannels.find((c) => c.id === selectedMethod) || paymentChannels[0];

  return (
    <div className={`rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 shadow-2xl overflow-hidden text-white ${className}`}>
      {/* VIP Luxury Gold Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 px-4 py-2.5 flex items-center justify-between text-slate-950">
        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4 fill-slate-950 stroke-none" />
          <span>VIP Official Payment Account</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold bg-slate-950/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Merchant Rails</span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Tier & Exact Amount to Pay Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
              <span>Selected Tier:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {plan.name}
              </span>
            </span>
            <div className="text-xs text-slate-400">
              {plan.daily_task_limit} daily sponsored tasks • Rs. {plan.reward_per_task.toFixed(2)}/task
            </div>
          </div>

          <div className="text-left sm:text-right bg-black/40 px-4 py-2.5 rounded-xl border border-slate-800/80 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Exact Amount to Transfer
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              Rs. {plan.price.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Method Selector Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Select Deposit Rail:</span>
            <span className="text-[11px] text-amber-400 font-medium">Tap to view account details</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {paymentChannels.map((channel) => {
              const isSelected = selectedMethod === channel.id;
              const Icon = channel.icon;
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => onSelectMethod(channel.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-400 shadow-lg ring-1 ring-amber-400'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-white truncate">{channel.name}</span>
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 truncate">{channel.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prominent Active Receiving Account Display Card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-black p-5 sm:p-6 border-2 border-amber-500/40 shadow-inner space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {activeChannel.name} Official Receiving Coordinates
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Active Channel
            </span>
          </div>

          {/* Account Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="text-slate-400">Account Title / Holder:</span>
            <span className="font-bold text-slate-200 text-sm">{activeChannel.title}</span>
          </div>

          {/* Account Number Display & Copy Button */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Receiving Account Number / IBAN:
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 bg-black/80 border border-amber-500/40 rounded-xl px-4 py-3 font-mono font-black text-lg sm:text-xl text-white tracking-wider break-all select-all flex items-center justify-between shadow-inner">
                <span>{activeChannel.number}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(activeChannel.number, activeChannel.id)}
                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg ${
                  copiedKey === activeChannel.id
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {copiedKey === activeChannel.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Number</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step-by-Step Payment Instructions */}
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <div className="font-bold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Step-by-Step Payment Instructions</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed">
              <li>Open your <strong className="text-white">{activeChannel.name}</strong> or banking app.</li>
              <li>Transfer exactly <strong className="text-emerald-400">Rs. {plan.price.toFixed(2)}</strong> to the copied account number above.</li>
              <li>Ensure the recipient title matches: <strong className="text-white">{activeChannel.title}</strong>.</li>
              <li>Copy the <strong className="text-amber-300">Transaction ID (TRX / Ref)</strong> from your payment receipt.</li>
              <li>Fill out the form below with your Sender Account details and TRX ID to submit for instant activation.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
