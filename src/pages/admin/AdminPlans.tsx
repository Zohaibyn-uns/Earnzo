import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { Sliders, ShieldCheck, CheckCircle2, Save, Sparkles, Zap, Crown } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Plan } from '../../types/database';

export const AdminPlans: React.FC = () => {
  const { plans, updatePlan } = usePlatform();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || 'plan-1');
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const [name, setName] = useState(selectedPlan?.name || '');
  const [badge, setBadge] = useState(selectedPlan?.badge || '');
  const [ctaText, setCtaText] = useState(selectedPlan?.cta_text || 'Buy Plan');
  const [price, setPrice] = useState(selectedPlan?.price || 300);
  const [durationDays, setDurationDays] = useState(selectedPlan?.duration_days || 30);
  const [dailyTaskLimit, setDailyTaskLimit] = useState(selectedPlan?.daily_task_limit || 7);
  const [rewardPerTask, setRewardPerTask] = useState(selectedPlan?.reward_per_task || 8);
  const [dailyRewardLimit, setDailyRewardLimit] = useState(selectedPlan?.daily_reward_limit || 56);
  const [minWithdrawal, setMinWithdrawal] = useState(selectedPlan?.min_withdrawal || 500);
  const [maxWithdrawal, setMaxWithdrawal] = useState(selectedPlan?.max_withdrawal || 50000);
  const [feePct, setFeePct] = useState(selectedPlan?.withdrawal_fee_pct || 0);
  const [isActive, setIsActive] = useState(selectedPlan?.is_active ?? true);

  const [savedMsg, setSavedMsg] = useState(false);

  // Sync state when selected plan changes
  useEffect(() => {
    if (selectedPlan) {
      setName(selectedPlan.name);
      setBadge(selectedPlan.badge || '');
      setCtaText(selectedPlan.cta_text || `Buy ${selectedPlan.name}`);
      setPrice(selectedPlan.price);
      setDurationDays(selectedPlan.duration_days);
      setDailyTaskLimit(selectedPlan.daily_task_limit);
      setRewardPerTask(selectedPlan.reward_per_task);
      setDailyRewardLimit(selectedPlan.daily_reward_limit || selectedPlan.daily_task_limit * selectedPlan.reward_per_task);
      setMinWithdrawal(selectedPlan.min_withdrawal);
      setMaxWithdrawal(selectedPlan.max_withdrawal);
      setFeePct(selectedPlan.withdrawal_fee_pct);
      setIsActive(selectedPlan.is_active);
    }
  }, [selectedPlanId, selectedPlan]);

  // Auto-calculate daily reward limit when tasks or rate change
  const handleDailyTaskChange = (val: number) => {
    setDailyTaskLimit(val);
    setDailyRewardLimit(val * rewardPerTask);
  };

  const handleRewardPerTaskChange = (val: number) => {
    setRewardPerTask(val);
    setDailyRewardLimit(dailyTaskLimit * val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    updatePlan(selectedPlan.id, {
      name,
      badge: badge || undefined,
      cta_text: ctaText,
      price: Number(price),
      duration_days: Number(durationDays),
      daily_task_limit: Number(dailyTaskLimit),
      reward_per_task: Number(rewardPerTask),
      daily_reward_limit: Number(dailyRewardLimit),
      min_withdrawal: Number(minWithdrawal),
      max_withdrawal: Number(maxWithdrawal),
      withdrawal_fee_pct: Number(feePct),
      is_active: isActive,
    });

    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Membership Plans Configuration</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure live parameters, limits, pricing, and tasks for all 3 VIP membership tiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm" className="text-slate-400 border-slate-700 bg-slate-900">
            {plans.length} Configured Tiers
          </Badge>
          <Badge variant={selectedPlan?.is_active ? 'success' : 'warning'} size="md">
            {selectedPlan?.is_active ? 'Selected: Active' : 'Selected: Inactive'}
          </Badge>
        </div>
      </div>

      {savedMsg && (
        <AlertBanner
          type="success"
          message={`Parameters for "${selectedPlan?.name}" updated and recorded in the system audit log.`}
          onClose={() => setSavedMsg(false)}
        />
      )}

      {/* Plan Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const isSelected = p.id === selectedPlanId;
          const isVip = p.name.includes('Plan 3');
          const isPopular = p.name.includes('Plan 2') || p.badge?.toUpperCase() === 'POPULAR';

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlanId(p.id)}
              className={`text-left p-5 rounded-2xl border transition-all relative ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {p.badge && (
                <span className={`absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isVip
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : isPopular
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}>
                  {p.badge}
                </span>
              )}

              <div className="flex items-center gap-2 mb-1">
                {isVip ? (
                  <Crown className="w-4 h-4 text-purple-400" />
                ) : isPopular ? (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                ) : (
                  <Zap className="w-4 h-4 text-indigo-400" />
                )}
                <span className="font-bold text-white text-base">{p.name}</span>
              </div>

              <div className="text-2xl font-black text-white mt-2">
                {formatCurrency(p.price)}
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div className="flex justify-between">
                  <span>Daily Tasks:</span>
                  <span className="text-slate-200 font-semibold">{p.daily_task_limit} videos</span>
                </div>
                <div className="flex justify-between">
                  <span>Per Video:</span>
                  <span className="text-emerald-400 font-semibold">{formatCurrency(p.reward_per_task)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Daily:</span>
                  <span className="text-indigo-300 font-semibold">
                    {formatCurrency(p.daily_reward_limit || p.daily_task_limit * p.reward_per_task)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Edit Form for Selected Plan */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-800 text-sm font-bold text-white">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Editing Parameters: {selectedPlan?.name}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Plan Title"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Input
              label="Badge / Tag (Optional)"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="e.g. POPULAR, VIP, RECOMMENDED"
            />
            <Input
              label="Button CTA Text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="e.g. Buy Plan 1, Buy Plan 2, Buy Plan 3"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Membership Price (PKR)"
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="e.g. 300, 500, 950"
            />
            <Input
              label="Duration (Days)"
              type="number"
              required
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="Standard 30 days"
            />
            <Input
              label="Daily Task Limit (Videos/day)"
              type="number"
              required
              value={dailyTaskLimit}
              onChange={(e) => handleDailyTaskChange(Number(e.target.value))}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="Plan 1: 7 | Plan 2: 12 | Plan 3: 17"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Reward Per Video (PKR)"
              type="number"
              step="0.5"
              required
              value={rewardPerTask}
              onChange={(e) => handleRewardPerTaskChange(Number(e.target.value))}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="Plan 1: Rs. 8 | Plan 2: Rs. 10 | Plan 3: Rs. 12"
            />
            <Input
              label="Daily Max Earning Cap (PKR)"
              type="number"
              required
              value={dailyRewardLimit}
              onChange={(e) => setDailyRewardLimit(Number(e.target.value))}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="Calculated: tasks × rate (e.g. 56, 120, 204)"
            />
            <Input
              label="Minimum Withdrawal (PKR)"
              type="number"
              required
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(Number(e.target.value))}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="Platform requirement: Rs. 500.00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Maximum Withdrawal Cap (PKR)"
              type="number"
              required
              value={maxWithdrawal}
              onChange={(e) => setMaxWithdrawal(Number(e.target.value))}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="Anti-drain single request cap"
            />
            <Input
              label="Withdrawal Fee (%)"
              type="number"
              step="0.1"
              required
              value={feePct}
              onChange={(e) => setFeePct(Number(e.target.value))}
              className="bg-slate-900 border-slate-700 text-white"
              helperText="0% standard, or network transaction surcharge"
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-800 gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Plan Is Actively Available For Public Purchase</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save {selectedPlan?.name} Configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
