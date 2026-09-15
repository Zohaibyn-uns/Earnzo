import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { formatDate } from '../../lib/utils';
import { PaymentClearing } from '../../types/database';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Zap,
  TrendingUp,
  History,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Calendar,
  UserCheck,
  FileText,
} from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const {
    payments,
    approvePayment,
    rejectPayment,
    activeRevenue,
    totalClearedRevenue,
    paymentClearings,
    clearRevenue,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState<'invoices' | 'clearings'>('invoices');
  const [selectedPayId, setSelectedPayId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Clearing Modal states
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearAmount, setClearAmount] = useState<string>('');
  const [clearNotes, setClearNotes] = useState('');
  const [isClearingSubmitting, setIsClearingSubmitting] = useState(false);

  const grossRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  const handleApprove = async (id: string) => {
    setActionError(null);
    setActionNotice(null);
    setIsProcessing(id);
    try {
      const res = await approvePayment(id);
      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setActionError(res.message || 'Payment approval failed.');
      }
    } catch (err: any) {
      setActionError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPayId) return;
    setActionError(null);
    setActionNotice(null);
    setIsProcessing(selectedPayId);
    try {
      const res = await rejectPayment(selectedPayId, rejectReason);
      setRejectModalOpen(false);
      setRejectReason('');
      if (res.success) {
        setActionNotice('Payment marked as rejected.');
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setActionError(res.message || 'Payment rejection failed.');
      }
    } catch (err: any) {
      setActionError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleOpenClearModal = () => {
    setClearAmount(activeRevenue.toString());
    setClearNotes('');
    setIsClearModalOpen(true);
  };

  const handleConfirmClear = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionNotice(null);
    const numAmount = parseFloat(clearAmount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setActionError('Please enter a valid clearing amount greater than zero.');
      return;
    }

    if (numAmount > activeRevenue) {
      setActionError(`Clearing amount (Rs. ${numAmount}) exceeds current active revenue (Rs. ${activeRevenue}).`);
      return;
    }

    setIsClearingSubmitting(true);
    try {
      const res = await clearRevenue(numAmount, clearNotes || 'Administrative revenue clearance');
      if (res.success) {
        setIsClearModalOpen(false);
        setActionNotice(res.message || 'Revenue successfully cleared.');
        setTimeout(() => setActionNotice(null), 6000);
      } else {
        setActionError(res.error || res.message || 'Revenue clearance failed.');
      }
    } catch (err: any) {
      setActionError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsClearingSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Membership Payment Invoices & Revenue</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit proof of payments, manage revenue clearance, and activate member subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenClearModal}
            disabled={activeRevenue <= 0}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
          >
            Clear Active Revenue Total
          </Button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Revenue Clearance Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Revenue */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/40 space-y-1 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">Current Active Total</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            Rs. {activeRevenue.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Displayed revenue available for clearing
          </span>
        </div>

        {/* Cleared Revenue */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span className="uppercase tracking-wider text-[11px]">Cleared to Date</span>
            <History className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-300">
            Rs. {totalClearedRevenue.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {paymentClearings.length} clearance actions recorded
          </span>
        </div>

        {/* Gross Lifetime Preserved */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span className="uppercase tracking-wider text-[11px]">Gross Historical Receipts</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            Rs. {grossRevenue.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {payments.length} total payment invoices permanently stored
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>All Payment Invoices ({payments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clearings')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'clearings'
              ? 'border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Payment Clearing History ({paymentClearings.length})</span>
        </button>
      </div>

      {/* TAB 1: ALL INVOICES (Permanent Record) */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Invoice ID</th>
                  <th className="p-3.5">Method & Amount</th>
                  <th className="p-3.5">Transaction Ref (TRX)</th>
                  <th className="p-3.5">Sender Info</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date Submitted</th>
                  <th className="p-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-mono text-slate-400">{p.id}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-white block">{p.method}</span>
                      <span className="font-black text-emerald-400">Rs. {p.amount.toFixed(2)}</span>
                    </td>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">
                      {p.transaction_ref || 'N/A'}
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-200 block font-medium">{p.sender_account_title || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.sender_account_number || ''}</span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="p-3.5 text-right">
                      {p.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={isProcessing === p.id}
                            onClick={() => handleApprove(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isProcessing === p.id}
                            onClick={() => {
                              setSelectedPayId(p.id);
                              setRejectModalOpen(true);
                            }}
                            className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300"
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">
                          {p.status === 'paid' ? 'Activated' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT CLEARING HISTORY */}
      {activeTab === 'clearings' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm">Permanent Payment Clearing Audit Trail</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every clearance event is immutably logged with admin identity, timestamp, breakdown, and previous vs. remaining balances.
              </p>
            </div>
            <div className="text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-xl">
              Original Financial Invoices Untouched (100% Preserved)
            </div>
          </div>

          {paymentClearings.length === 0 ? (
            <div className="p-12 text-center bg-slate-950 border border-dashed border-slate-800 rounded-2xl space-y-2">
              <History className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">No Payment Clearance Records Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When an administrator clears or resets the active revenue display, permanent audit logs will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Clearing Ref ID</th>
                      <th className="p-3.5">Date & Exact Time</th>
                      <th className="p-3.5">Amount Cleared</th>
                      <th className="p-3.5">Admin Performed</th>
                      <th className="p-3.5">Contributing Counts</th>
                      <th className="p-3.5">Method Breakdown</th>
                      <th className="p-3.5">Remaining Active</th>
                      <th className="p-3.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paymentClearings.map((c: PaymentClearing) => (
                      <tr key={c.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-mono text-amber-400 font-bold">
                          {c.reference_id}
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">
                          {formatDate(c.created_at)}
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-rose-400 text-sm">
                            - Rs. {Number(c.amount_cleared).toFixed(2)}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            Before: Rs. {Number(c.total_before).toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="truncate max-w-[150px]">{c.admin_email}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          <div>{c.contributing_payments_count} paid payments</div>
                          <div className="text-[10px] text-slate-500">{c.contributing_users_count} unique users</div>
                        </td>
                        <td className="p-3.5">
                          {c.breakdown ? (
                            <div className="space-y-0.5 text-[10px]">
                              {Object.entries(c.breakdown).map(([method, amt]) => (
                                <div key={method} className="text-slate-300 flex items-center justify-between gap-2">
                                  <span>{method}:</span>
                                  <span className="font-mono text-emerald-400">Rs. {Number(amt).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500">General</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-400">
                          Rs. {Number(c.remaining_total).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] max-w-[180px] truncate">
                          {c.notes || 'Routine clearance'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REVENUE CLEARING MODAL */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear Current Active Revenue Total"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmClear} className="space-y-5 text-slate-100">
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Immutable Ledger Protection Guarantee</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Clearing the active displayed revenue does <strong>NOT</strong> delete, alter or hide original user payments or ledger transactions. A permanent <em>Payment Clearing History</em> record will be registered with your admin email and exact timestamp.
            </p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Current Active Total:</span>
            <span className="text-xl font-black text-amber-400">Rs. {activeRevenue.toFixed(2)}</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setClearAmount(activeRevenue.toString())}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Clear Entire Active Total (Rs. {activeRevenue.toFixed(2)})
            </button>
            {activeRevenue > 500 && (
              <button
                type="button"
                onClick={() => setClearAmount((Math.floor(activeRevenue / 2)).toString())}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Clear 50%
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Amount to Clear (PKR)
            </label>
            <Input
              type="number"
              min="1"
              max={activeRevenue}
              step="any"
              value={clearAmount}
              onChange={(e) => setClearAmount(e.target.value)}
              placeholder="Enter amount to clear"
              required
            />
            <div className="text-[11px] text-slate-400 flex justify-between pt-1">
              <span>
                Remaining active total after clear:
              </span>
              <span className="font-bold text-emerald-400">
                Rs. {Math.max(0, activeRevenue - (parseFloat(clearAmount) || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Administrative Notes / Reason (Optional)
            </label>
            <Input
              type="text"
              value={clearNotes}
              onChange={(e) => setClearNotes(e.target.value)}
              placeholder="e.g. End of testing cycle reset, audit reconcilation"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsClearModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isClearingSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              Confirm & Create Clearing Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* REJECT PAYMENT MODAL */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Payment Proof"
        maxWidth="sm"
      >
        <div className="space-y-4 text-slate-100">
          <p className="text-xs text-slate-400 leading-relaxed">
            Specify the audit reason for rejecting this transaction. The user will be notified in their ledger.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rejection Reason
            </label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid TRX ID, amount mismatch, fake screenshot"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReject}
              disabled={isProcessing === selectedPayId}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
