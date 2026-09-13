import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ArrowUpRight, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export const AdminWithdrawals: React.FC = () => {
  const { withdrawals, processWithdrawal } = usePlatform();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [trxRef, setTrxRef] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!selectedId) return;
    const res = await processWithdrawal(selectedId, 'approve', trxRef);
    setApproveModalOpen(false);
    setTrxRef('');
    if (res.success) {
      setNotice('Withdrawal approved and marked as paid. Payout ledger transaction posted.');
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const handleReject = async () => {
    if (!selectedId) return;
    const res = await processWithdrawal(selectedId, 'reject', undefined, rejectReason);
    setRejectModalOpen(false);
    setRejectReason('');
    if (res.success) {
      setNotice('Withdrawal rejected. Funds have been refunded to the user wallet.');
      setTimeout(() => setNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Payout Withdrawal Approvals</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit pending liquidity dispatches, confirm bank receipts, or trigger automated wallet refunds.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-semibold">
          {notice}
        </div>
      )}

      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Withdrawal ID</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Gross / Net</th>
                <th className="p-3.5">Account Beneficiary</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Submission Date</th>
                <th className="p-3.5 text-right">Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-900/40">
                  <td className="p-3.5 font-mono text-slate-400">{w.id}</td>
                  <td className="p-3.5 font-bold text-white">{w.method}</td>
                  <td className="p-3.5">
                    <span className="text-xs text-slate-400 block line-through">Rs. {w.amount.toFixed(2)}</span>
                    <span className="font-black text-emerald-400 text-sm">Rs. {w.net_amount.toFixed(2)}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-200 block">{w.account_title}</span>
                    <span className="font-mono text-[11px] text-slate-400">{w.account_number}</span>
                    {w.bank_name && <span className="block text-[10px] text-slate-500">{w.bank_name}</span>}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        w.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : w.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">{formatDate(w.created_at)}</td>
                  <td className="p-3.5 text-right space-x-2">
                    {w.status === 'pending' ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setSelectedId(w.id);
                            setApproveModalOpen(true);
                          }}
                        >
                          Approve Payout
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs"
                          onClick={() => {
                            setSelectedId(w.id);
                            setRejectModalOpen(true);
                          }}
                        >
                          Reject & Refund
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">
                        {w.transaction_reference ? `TRX: ${w.transaction_reference}` : 'Finalized'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Confirm Payout Dispatch">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Confirm that funds have been sent via your JazzCash/Easypaisa merchant portal or bank. Enter the bank transaction ID.
          </p>
          <Input
            label="Banking Transaction Reference (TRX ID)"
            required
            placeholder="e.g. JC918237461 or PK-RAAST-782"
            value={trxRef}
            onChange={(e) => setTrxRef(e.target.value)}
          />
          <Button variant="primary" size="md" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>
            Confirm Payout & Deduct Balance
          </Button>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject & Refund Withdrawal">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Rejection will <strong>immediately refund 100% of the locked funds back into the user's available wallet balance</strong>.
          </p>
          <Input
            label="Rejection Reason"
            required
            placeholder="e.g. Inactive JazzCash account / Name mismatch"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <Button variant="danger" size="md" className="w-full" onClick={handleReject}>
            Confirm Rejection & Refund Funds
          </Button>
        </div>
      </Modal>
    </div>
  );
};
