import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Lock,
  Smartphone,
  Building,
  Copy,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { useAuth } from '../../context/AuthContext';
import { Plan } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { ContentElementRenderer } from '../../components/content/ContentElementRenderer';
import { formatCurrency } from '../../lib/utils';
import { VipPaymentAccountCard } from '../../components/payment/VipPaymentAccountCard';

export const PlansPage: React.FC = () => {
  const { plans, activePlan, submitPayment, settings, refetchData } = usePlatform();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    refetchData();
  }, []);

  // Checkout modal state
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [method, setMethod] = useState<'JazzCash' | 'Easypaisa' | 'Bank Transfer'>('JazzCash');
  const [transactionRef, setTransactionRef] = useState('');
  const [senderTitle, setSenderTitle] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenCheckout = (planToBuy: Plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedPlan(planToBuy);
    setStatusNotice(null);
    setTransactionRef('');
    setSenderTitle('');
    setSenderNumber('');
    setIsCheckoutOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsSubmitting(true);
    setStatusNotice(null);

    const res = await submitPayment({
      planId: selectedPlan.id,
      amount: selectedPlan.price,
      method,
      transactionRef,
      senderAccountTitle: senderTitle,
      senderAccountNumber: senderNumber,
    });

    setIsSubmitting(false);

    if (res.success) {
      // Per Rule 7: Never activate a plan simply because the frontend checkout says successful.
      // Payment remains in 'pending' status until verified and approved by admin.
      setStatusNotice({
        type: 'success',
        message: 'Payment submitted successfully! Your transaction is pending administrative audit and verification. Your plan will activate once approved.',
      });
      setTimeout(() => {
        setIsCheckoutOpen(false);
        navigate('/dashboard');
      }, 2500);
    } else {
      setStatusNotice({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Dynamic Content Element: Plans Top */}
      <ContentElementRenderer placement="plans_top" />

      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Configurable VIP Tier Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Choose Your Reward Plan
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Select a verified 30-day sponsored task allocation. Unlock daily brand promotional video tasks, receive transparent rewards, and disburse directly to your wallet.
        </p>

        {activePlan && (
          <div className="inline-flex items-center gap-2 p-2 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Currently Active: {activePlan.name} ({activePlan.daily_task_limit} tasks/day @ Rs. {activePlan.reward_per_task}/task)</span>
          </div>
        )}
      </div>

      {/* 3 VIP Plans in Vertical Layout */}
      <div className="space-y-6 max-w-3xl mx-auto">
        {plans.map((p, idx) => {
          const isPopular = p.badge === 'POPULAR';
          const isVip = p.badge === 'VIP';
          const isCurrentActive = activePlan?.id === p.id;

          return (
            <div
              key={p.id}
              className={`relative rounded-3xl transition-all duration-300 overflow-hidden border ${
                isCurrentActive
                  ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl ' +
                    (isVip
                      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white'
                      : 'bg-white text-slate-900')
                  : isVip
                  ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-amber-500/40 shadow-2xl hover:shadow-indigo-500/20'
                  : isPopular
                  ? 'bg-gradient-to-br from-white via-indigo-50/40 to-white text-slate-900 border-indigo-500/60 shadow-xl hover:shadow-indigo-200'
                  : 'bg-white text-slate-900 border-slate-200 shadow-card hover:shadow-lg'
              }`}
            >
              {/* Badge Ribbons */}
              {isCurrentActive ? (
                <div className="absolute top-0 right-8 px-4 py-1.5 rounded-b-xl text-[11px] font-black uppercase tracking-wider shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACTIVATED PLAN</span>
                </div>
              ) : p.badge ? (
                <div
                  className={`absolute top-0 right-8 px-4 py-1 rounded-b-xl text-[11px] font-black uppercase tracking-wider shadow-sm ${
                    isVip
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
                  }`}
                >
                  {p.badge}
                </div>
              ) : null}

              <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Plan Specs */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                        isVip
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}
                    >
                      {p.name}
                    </span>
                    {isCurrentActive && (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Activated Plan
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight">
                      Rs. {p.price}
                    </span>
                    <span className={`text-xs ${isVip ? 'text-slate-400' : 'text-slate-500'}`}>
                      / {p.duration_days} Days Access
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed max-w-lg ${isVip ? 'text-slate-300' : 'text-slate-600'}`}>
                    {p.description}
                  </p>

                  {/* Feature Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isVip ? 'text-amber-400' : 'text-emerald-600'}`} />
                      <span>{p.daily_task_limit} Daily Tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isVip ? 'text-amber-400' : 'text-emerald-600'}`} />
                      <span>Rs. {p.reward_per_task} Per Task</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isVip ? 'text-amber-400' : 'text-emerald-600'}`} />
                      <span>Up to Rs. {p.daily_reward_limit || p.daily_task_limit * p.reward_per_task} Daily</span>
                    </div>
                  </div>
                </div>

                {/* Right: CTA Button */}
                <div className="shrink-0 flex flex-col sm:items-end justify-center pt-2 md:pt-0">
                  {isCurrentActive ? (
                    <div className="w-full sm:w-auto flex flex-col items-center sm:items-end">
                      <Button
                        size="lg"
                        variant="outline"
                        disabled
                        className="w-full sm:w-auto font-black px-8 py-3.5 rounded-2xl border-emerald-500/50 bg-emerald-500/15 text-emerald-400 cursor-default"
                        leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      >
                        Activated Plan
                      </Button>
                      <span className="text-[10px] mt-2 block sm:text-right text-emerald-500 font-semibold">
                        ✓ Your Current Active Tier
                      </span>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        variant={isVip ? 'primary' : isPopular ? 'primary' : 'outline'}
                        className={`w-full sm:w-auto font-black px-8 py-3.5 rounded-2xl shadow-lg transition-transform hover:scale-105 ${
                          isVip
                            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:from-amber-500 hover:to-amber-700 shadow-amber-500/20'
                            : isPopular
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                            : ''
                        }`}
                        onClick={() => handleOpenCheckout(p)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {p.cta_text || `Buy ${p.name}`}
                      </Button>
                      <span className={`text-[10px] mt-2 block sm:text-right ${isVip ? 'text-slate-400' : 'text-slate-400'}`}>
                        Verified Payment Required
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance & Regulatory Guarantee */}
      <div className="max-w-3xl mx-auto p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>Transparent Platform Access Terms</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Earnzo is an authentic sponsored video advertising hub. Membership fees cover identity screening, cryptographic playback telemetry, and access to sponsored task pools. We make zero claims of guaranteed investment dividends or fixed interest returns.
        </p>
      </div>

      {/* Dynamic Content Element: Plans Bottom */}
      <ContentElementRenderer placement="plans_bottom" />

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={selectedPlan ? `Checkout: ${selectedPlan.name}` : 'Plan Checkout'}
        maxWidth="lg"
      >
        {selectedPlan && (
          <div className="space-y-6">
            {statusNotice && (
              <AlertBanner
                type={statusNotice.type}
                message={statusNotice.message}
                onClose={() => setStatusNotice(null)}
              />
            )}

            {/* VIP Level Premium Receiving Account Card */}
            <VipPaymentAccountCard
              plan={selectedPlan}
              selectedMethod={method}
              onSelectMethod={setMethod}
            />

            {/* Payment Submission Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Payment Method Transferred
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['JazzCash', 'Easypaisa', 'Bank Transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        method === m
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Transaction ID / TRX Reference"
                required
                placeholder="e.g. JC983427189"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                helperText="Enter the reference number from your bank or wallet confirmation message"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Sender Account Name"
                  required
                  placeholder="e.g. Ali Raza"
                  value={senderTitle}
                  onChange={(e) => setSenderTitle(e.target.value)}
                />
                <Input
                  label="Sender Mobile Number"
                  required
                  placeholder="03001234567"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Submit Payment (Rs. {selectedPlan.price})
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
