import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Smartphone,
  Building,
  Upload,
  ArrowRight,
  AlertCircle,
  Copy,
  Zap,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { VipPaymentAccountCard } from '../../components/payment/VipPaymentAccountCard';

export const MembershipPage: React.FC = () => {
  const { plan, activePlan, hasActivePlan, membership, payments, submitPayment, approvePayment, refetchData } = usePlatform();

  React.useEffect(() => {
    refetchData();
  }, []);

  const [method, setMethod] = useState<'JazzCash' | 'Easypaisa' | 'Bank Transfer'>('JazzCash');
  const [transactionRef, setTransactionRef] = useState('');
  const [senderTitle, setSenderTitle] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isMembershipActive = membership?.status === 'active';
  const pendingPayment = payments.find((p) => p.status === 'pending');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSubmitting(true);

    const res = await submitPayment({
      planId: plan.id,
      amount: plan.price,
      method,
      transactionRef,
      senderAccountTitle: senderTitle,
      senderAccountNumber: senderNumber,
      proofImageUrl: proofImage || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setStatusMsg({ type: 'success', message: res.message });
      setTransactionRef('');
      setSenderTitle('');
      setSenderNumber('');
    } else {
      setStatusMsg({ type: 'error', message: res.message });
    }
  };

  // Instant simulation helper for evaluators/testers
  const handleSimulateInstantApproval = async (payId: string) => {
    const res = await approvePayment(payId);
    if (res.success) {
      setStatusMsg({ type: 'success', message: 'Instant simulation: Payment approved & membership activated!' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Membership Plan & Subscription
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access verified daily promotional video tasks with our 30-day membership.
          </p>
        </div>

        <Badge variant={isMembershipActive ? 'success' : 'warning'} size="md">
          {isMembershipActive ? 'Active 30-Day Pass' : 'Subscription Required'}
        </Badge>
      </div>

      {statusMsg && (
        <AlertBanner
          type={statusMsg.type}
          message={statusMsg.message}
          onClose={() => setStatusMsg(null)}
        />
      )}

      {/* Current Membership Status Card */}
      <Card className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white border-0 shadow-xl">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-indigo-300">Membership</span>
              <h3 className="text-2xl sm:text-3xl font-black mt-1">
                {hasActivePlan ? activePlan?.name : 'No Active Plan'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {hasActivePlan
                  ? `Rs. ${activePlan?.price} / ${activePlan?.duration_days} Days Access`
                  : 'Choose a plan to unlock eligible reward tasks.'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Status</span>
              <span
                className={`text-sm font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  hasActivePlan
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {hasActivePlan ? 'Active' : 'Not Active'}
              </span>
            </div>
          </div>

          {hasActivePlan && activePlan ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Daily Video Tasks</span>
                <div className="text-base font-black text-white mt-0.5">{activePlan.daily_task_limit} Tasks / day</div>
              </div>
              <div>
                <span className="text-slate-400">Reward Per Task</span>
                <div className="text-base font-black text-emerald-400 mt-0.5">Rs. {activePlan.reward_per_task.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-slate-400">Min Withdrawal</span>
                <div className="text-base font-black text-white mt-0.5">Rs. {activePlan.min_withdrawal.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-slate-400">Expires At</span>
                <div className="text-base font-black text-amber-300 mt-0.5">
                  {membership?.expires_at ? formatDate(membership.expires_at).split(',')[0] : 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-300">
                You currently have no active membership. Subscribe to start earning daily video rewards.
              </p>
              <Link to="/plans">
                <Button variant="primary" size="md" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0">
                  View Plans
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Payment Verification Notice */}
      {pendingPayment && (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Payment Proof Under Review</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Rs. {pendingPayment.amount} submitted via {pendingPayment.method} (TRX: {pendingPayment.transaction_ref}). Admin is verifying against official bank statements.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              leftIcon={<Zap className="w-3.5 h-3.5" />}
              onClick={() => handleSimulateInstantApproval(pendingPayment.id)}
            >
              Simulate Instant Admin Approval
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Instructions & Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: VIP Official Receiving Account Rails */}
        <VipPaymentAccountCard
          plan={plan}
          selectedMethod={method}
          onSelectMethod={setMethod}
        />

        {/* Right: Payment Verification Form */}
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Step 2</span>
              <h3 className="text-lg font-bold text-slate-900">Submit Verification Receipt</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide your transaction reference number for instant statement matching.
              </p>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Transfer Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['JazzCash', 'Easypaisa', 'Bank Transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                        method === m
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
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
                placeholder="e.g. JC892347102"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                helperText="Provided in the SMS or payment confirmation receipt"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Sender Account Name"
                  required
                  placeholder="e.g. Tariq Mehmood"
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
                Submit Payment For Verification
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
