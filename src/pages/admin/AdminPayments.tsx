import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { CreditCard, CheckCircle2, XCircle, Clock, ShieldCheck, Zap } from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const { payments, approvePayment, rejectPayment } = usePlatform();

  const [selectedPayId, setSelectedPayId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Membership Payment Invoices</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit proof of payments and activate member subscriptions.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-semibold">
          {actionNotice}
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-2xl text-xs font-semibold">
          {actionError}
        </div>
      )}

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
                  <td className="p-3.5 text-slate-400">{formatDate(p.created_at)}</td>
                  <td className="p-3.5 text-right space-x-2">
                    {p.status === 'pending' ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => handleApprove(p.id)}
                          disabled={Boolean(isProcessing)}
                          isLoading={isProcessing === p.id}
                        >
                          Approve & Activate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs"
                          onClick={() => {
                            setSelectedPayId(p.id);
                            setRejectModalOpen(true);
                          }}
                          disabled={Boolean(isProcessing)}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Audited</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Payment Invoice"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Provide a clear reason for rejecting this deposit proof (e.g., transaction reference not found on bank portal).
          </p>
          <Input
            label="Rejection Reason"
            required
            placeholder="e.g. Transaction ID not found on bank statement"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <Button variant="danger" size="md" className="w-full" onClick={handleReject}>
            Confirm Rejection
          </Button>
        </div>
      </Modal>
    </div>
  );
};
