import React, { useState } from 'react';
import { LifeBuoy, Send, Plus, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';

export const SupportPage: React.FC = () => {
  const { tickets, createTicket, replyToTicket } = usePlatform();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);

  // New ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'Payment' | 'Withdrawal' | 'Video Tasks' | 'Account' | 'Other'>('Payment');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [message, setMessage] = useState('');

  // Reply state
  const [replyMessage, setReplyMessage] = useState('');

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createTicket(subject, category, priority, message);
    if (res.success) {
      setSelectedTicketId(res.ticketId);
      setIsCreateOpen(false);
      setSubject('');
      setMessage('');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyMessage.trim()) return;
    await replyToTicket(selectedTicketId, replyMessage, false);
    setReplyMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Support Desk & Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directly communicate with WatchEarn operations regarding tasks, payments, and payouts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List Column */}
        <Card className="lg:col-span-1 flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Your Tickets ({tickets.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {tickets.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No support tickets yet.</p>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-4 cursor-pointer transition-colors text-xs ${
                    selectedTicketId === t.id ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 line-clamp-1">{t.subject}</span>
                    <Badge
                      variant={
                        t.status === 'resolved'
                          ? 'success'
                          : t.status === 'open'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>{t.category}</span>
                    <span>•</span>
                    <span>{formatDate(t.created_at).split(',')[0]}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Selected Ticket Thread Column */}
        <Card className="lg:col-span-2 flex flex-col h-[600px]">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>Category: {selectedTicket.category}</span>
                    <span>•</span>
                    <span>Priority: {selectedTicket.priority}</span>
                  </div>
                </div>
                <Badge
                  variant={
                    selectedTicket.status === 'resolved'
                      ? 'success'
                      : selectedTicket.status === 'open'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {selectedTicket.status}
                </Badge>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {selectedTicket.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-2xl max-w-lg text-xs ${
                      msg.is_admin_reply
                        ? 'bg-indigo-600 text-white ml-auto shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold mb-1 opacity-75">
                      <span>{msg.sender_name}</span>
                      <span>{formatDate(msg.created_at)}</span>
                    </div>
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 flex gap-2 bg-white">
                <input
                  type="text"
                  placeholder="Type your message reply..."
                  className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
                <Button type="submit" variant="primary" size="sm" rightIcon={<Send className="w-3.5 h-3.5" />}>
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select or create a ticket to view messages.
            </div>
          )}
        </Card>
      </div>

      {/* New Ticket Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Open New Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <Input
            label="Subject"
            required
            placeholder="Brief summary of issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900"
              >
                <option value="Payment">Payment</option>
                <option value="Withdrawal">Withdrawal</option>
                <option value="Video Tasks">Video Tasks</option>
                <option value="Account">Account</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Priority</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Description</label>
            <textarea
              rows={4}
              required
              placeholder="Describe your issue with transaction IDs if applicable..."
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" size="md">
            Submit Support Request
          </Button>
        </form>
      </Modal>
    </div>
  );
};
