import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  PlayCircle,
  Clock,
  Award,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ContentElementRenderer } from '../../components/content/ContentElementRenderer';

export const WatchAndEarnPage: React.FC = () => {
  const { videos, activePlan, hasActivePlan, membership, transactions, completedVideoIdsToday, refetchData } = usePlatform();

  useEffect(() => {
    refetchData();
  }, []);

  // If user has NO active plan: show locked state (Section 7 requirement)
  if (!hasActivePlan || !activePlan) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <Badge variant="warning" size="md">
            Subscription Required
          </Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <span>🔒</span> Earning Locked
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Choose a plan to start completing eligible reward tasks.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/plans">
            <Button
              variant="primary"
              size="lg"
              className="px-8 shadow-lg shadow-indigo-200"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Plans
            </Button>
          </Link>
        </div>

        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs text-slate-500 max-w-md mx-auto">
          <ShieldCheck className="w-4 h-4 text-indigo-600 inline mr-1 -mt-0.5" />
          <span>Membership fees cover identity validation and unlock sponsored brand advertising pools.</span>
        </div>
      </div>
    );
  }

  // If user HAS active plan: Show premium active task dashboard
  const todayStr = new Date().toISOString().split('T')[0];
  const tasksCompletedToday = membership?.tasks_completed_today || 0;
  const maxTasks = activePlan.daily_task_limit;
  const taskReward = activePlan.reward_per_task;
  const progressPercent = Math.min(100, Math.round((tasksCompletedToday / maxTasks) * 100));

  const todayEarnings = transactions
    .filter((t) => t.type === 'video_reward' && t.created_at.startsWith(todayStr))
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-8">
      {/* Dynamic Content Element: Watch & Earn Top */}
      <ContentElementRenderer placement="earn_top" />

      {/* Active Plan Dashboard Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-300">
                ACTIVE PLAN
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Tier
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activePlan.name}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              {maxTasks} Daily Tasks Allocation • Rs. {taskReward.toFixed(2)} Reward Per Completed Task
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Today's Earned</span>
              <span className="text-2xl font-black text-emerald-400">Rs. {todayEarnings.toFixed(2)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Today's Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Today's Progress</span>
            <span className="font-bold text-amber-400">
              {tasksCompletedToday} / {maxTasks} tasks completed
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Remaining today: {Math.max(0, maxTasks - tasksCompletedToday)} tasks</span>
            <span>Max potential: Rs. {activePlan.daily_reward_limit || maxTasks * taskReward}</span>
          </div>
        </div>
      </div>

      {/* Available Tasks Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Available Sponsored Reward Tasks</h2>
          <p className="text-xs text-slate-500">
            Watch authenticated promotional campaigns to credit rewards into your ledger wallet.
          </p>
        </div>

        {(() => {
          const activeVideos = (videos || []).filter((v) => v.status === 'active');

          if (activeVideos.length === 0) {
            return (
              <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Sponsored Tasks Available Right Now</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  New active sponsored video tasks will appear here as soon as they are launched by partners and administrators.
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeVideos.map((video) => {
                const isCompletedToday = completedVideoIdsToday.includes(video.id);

                return (
                  <Card key={video.id} className="group hover:border-indigo-300 transition-all flex flex-col justify-between">
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{video.duration_seconds}s required</span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded shadow">
                        Rs. {taskReward.toFixed(2)}
                      </div>
                    </div>

                    <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-indigo-600 mb-1">
                          <span>{video.category}</span>
                          <Badge variant="neutral" size="sm">
                            {video.sponsor_badge}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mt-1">
                          {video.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {video.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Duration: {video.duration_seconds}s
                        </span>
                        {isCompletedToday ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            className="border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-xs font-semibold"
                          >
                            Available Tomorrow
                          </Button>
                        ) : tasksCompletedToday >= maxTasks ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-xs font-semibold"
                          >
                            Daily Limit Met
                          </Button>
                        ) : (
                          <Link to={`/dashboard/videos/${video.id}`}>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<PlayCircle className="w-4 h-4" />}
                            >
                              Start Task
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Dynamic Content Element: Watch & Earn Bottom */}
      <ContentElementRenderer placement="earn_bottom" />
    </div>
  );
};
