import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { VideoCampaign } from '../../types/database';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Layers, Plus, DollarSign, Users, AlertCircle } from 'lucide-react';

export const AdminCampaigns: React.FC = () => {
  const { campaigns, addCampaign, updateCampaign } = usePlatform();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<VideoCampaign | null>(null);

  const [name, setName] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [description, setDescription] = useState('');
  const [totalBudget, setTotalBudget] = useState(50000);
  const [rewardPerCompletion, setRewardPerCompletion] = useState(10);
  const [maxCompletions, setMaxCompletions] = useState(5000);

  const handleOpenCreate = () => {
    setEditingCamp(null);
    setName('');
    setSponsorName('');
    setDescription('');
    setTotalBudget(50000);
    setRewardPerCompletion(10);
    setMaxCompletions(5000);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCamp) {
      updateCampaign(editingCamp.id, {
        name,
        sponsor_name: sponsorName,
        description,
        total_budget: Number(totalBudget),
        reward_per_completion: Number(rewardPerCompletion),
        max_completions: Number(maxCompletions),
      });
    } else {
      addCampaign({
        name,
        sponsor_name: sponsorName,
        description,
        total_budget: Number(totalBudget),
        reward_per_completion: Number(rewardPerCompletion),
        max_completions: Number(maxCompletions),
        status: 'active',
        start_date: new Date().toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Sponsor Advertising Campaigns</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Budget allocations and maximum task completions financed by commercial sponsors.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreate}
        >
          New Sponsor Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => {
          const budgetPercent = Math.min(100, Math.round((c.spent_budget / c.total_budget) * 100));
          return (
            <div
              key={c.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                    {c.sponsor_name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white line-clamp-1">{c.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
              </div>

              {/* Budget Progress Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-900 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Campaign Budget:</span>
                  <span className="font-bold text-white">
                    Rs. {c.spent_budget.toFixed(2)} / Rs. {c.total_budget.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Completions: {c.current_completions} / {c.max_completions}</span>
                  <span>Rs. {c.reward_per_completion}/view</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCamp ? 'Edit Campaign' : 'Create Sponsor Campaign'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Campaign Name"
            required
            placeholder="e.g. EduLearn AI Scholars"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Sponsor / Organization Name"
            required
            placeholder="e.g. SmartTech Pvt Ltd"
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Allocated Budget (PKR)"
              type="number"
              required
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
            />
            <Input
              label="Reward Per Task View (PKR)"
              type="number"
              required
              value={rewardPerCompletion}
              onChange={(e) => setRewardPerCompletion(Number(e.target.value))}
            />
          </div>
          <Input
            label="Maximum Allowed Task Completions"
            type="number"
            required
            value={maxCompletions}
            onChange={(e) => setMaxCompletions(Number(e.target.value))}
          />
          <Button type="submit" variant="primary" className="w-full" size="md">
            Save Campaign
          </Button>
        </form>
      </Modal>
    </div>
  );
};
