import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Info,
  CalendarCheck,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { VideoWatchSession } from '../../types/database';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { formatCurrency } from '../../lib/utils';
import { SponsoredVideoPlayer } from '../../components/video/SponsoredVideoPlayer';

export const VideoPlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    videos,
    membership,
    startWatchSession,
    completeWatchSession,
    wallet,
    refetchData,
    completedVideoIdsToday,
  } = usePlatform();

  useEffect(() => {
    refetchData();
  }, []);

  const video = videos.find((v) => v.id === id);
  const isAlreadyCompletedToday = Boolean(id && completedVideoIdsToday.includes(id));

  // Player telemetry states
  const [session, setSession] = useState<VideoWatchSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardGranted, setRewardGranted] = useState<number | null>(null);
  const [tabIsActive, setTabIsActive] = useState(true);

  const timerRef = useRef<any>(null);

  const requiredDuration = video?.duration_seconds || 30;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / requiredDuration) * 100));

  // Initialize secure session on mount (only if not already completed today)
  useEffect(() => {
    if (!video) return;

    if (isAlreadyCompletedToday) {
      return;
    }

    if (!membership || membership.status !== 'active') {
      setError('An active membership plan is required to start tasks.');
      return;
    }

    const initSession = async () => {
      const res = await startWatchSession(video.id);
      if (res.error) {
        setError(res.error);
      } else {
        setSession(res.session);
        setIsPlaying(true);
      }
    };

    initSession();
  }, [video?.id, isAlreadyCompletedToday]);

  // Tab visibility detection (anti-cheat: pause if user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabIsActive(false);
        setIsPlaying(false);
      } else {
        setTabIsActive(true);
        if (session && !isCompleted && !isAlreadyCompletedToday) {
          setIsPlaying(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session, isCompleted, isAlreadyCompletedToday]);

  // Playback timer ticker
  useEffect(() => {
    if (isPlaying && tabIsActive && !isCompleted && !isAlreadyCompletedToday) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= requiredDuration) {
            clearInterval(timerRef.current);
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, tabIsActive, requiredDuration, isCompleted, isAlreadyCompletedToday]);

  // Submit to Server-Side Verification Engine
  const handleClaimReward = async () => {
    if (!session || !video || isCompleted || isAlreadyCompletedToday) return;

    setIsSubmitting(true);
    setError(null);

    // Call server-side validator with session token
    const result = await completeWatchSession(session.id, session.session_token);
    setIsSubmitting(false);

    if (result.success && result.rewardAmount) {
      setIsCompleted(true);
      setIsPlaying(false);
      setRewardGranted(result.rewardAmount);
    } else {
      setError(result.error || 'Server validation failed. Verification criteria not met.');
    }
  };

  if (!video) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Sponsored Video Not Found</h2>
        <Link to="/dashboard/videos">
          <Button variant="outline">Return to Earn Tasks</Button>
        </Link>
      </div>
    );
  }

  // If task is ALREADY completed today: Stay on Earn section with informative card
  if (isAlreadyCompletedToday && !isCompleted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <Link
          to="/dashboard/videos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Earn Tasks</span>
        </Link>

        <div className="p-8 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CalendarCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Completed Today
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {video.title}
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              You have already completed this sponsored task today and the reward has been credited to your ledger wallet. This task will become available again tomorrow at 12:00 AM PKT.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link to="/dashboard/videos">
              <Button
                variant="primary"
                size="md"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Return to Earn Tasks
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation - Strictly Earn Section */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/videos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Earn Tasks</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            {video.sponsor_badge}
          </Badge>
          <Badge variant="success" size="sm">
            Reward: Rs. {video.reward_amount.toFixed(2)}
          </Badge>
        </div>
      </div>

      {error && <AlertBanner type="error" title="Session Verification Alert" message={error} />}

      {!tabIsActive && !isCompleted && (
        <AlertBanner
          type="warning"
          title="Playback Paused"
          message="Tab switching detected. Video task requires focused viewing to credit rewards."
        />
      )}

      {/* Main Video Screen with Restricted Sponsored Player */}
      <Card className="overflow-hidden border-slate-200">
        <div className="relative">
          {/* Restricted Player: User cannot seek/skip. Volume & Share allowed only */}
          <SponsoredVideoPlayer
            video={video}
            isPlaying={isPlaying}
            isCompleted={isCompleted}
            tabIsActive={tabIsActive}
            elapsedSeconds={elapsedSeconds}
            requiredDuration={requiredDuration}
            onPlayStateChange={setIsPlaying}
          />

          {/* Reward Completion Overlay: Strictly keeps user on Earn section */}
          {isCompleted && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-4 text-white z-30 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Available Tomorrow
                </span>
                <h3 className="text-2xl font-black">Task Reward Credited!</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Rs. {rewardGranted?.toFixed(2)} added to your double-entry ledger wallet.
                </p>
              </div>
              <div className="text-xs text-emerald-400 font-semibold bg-emerald-950/80 px-3 py-1.5 rounded-full border border-emerald-800">
                Wallet Balance: {formatCurrency(wallet.balance)}
              </div>
              <div className="flex gap-3 pt-2">
                <Link to="/dashboard/videos">
                  <Button
                    variant="primary"
                    size="md"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Return to Earn Tasks
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Player Controls & Telemetry Bar */}
        <div className="p-5 sm:p-6 space-y-4 bg-white border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{video.title}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>Category: {video.category}</span>
                <span>•</span>
                <span>Required Duration: {video.duration_seconds} seconds</span>
              </div>
            </div>

            {/* Claim Reward Button (Enabled only once duration met) */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isCompleted && (
                <Button
                  variant="success"
                  size="md"
                  className="w-full sm:w-auto"
                  disabled={elapsedSeconds < requiredDuration || isSubmitting}
                  isLoading={isSubmitting}
                  onClick={handleClaimReward}
                  leftIcon={<Award className="w-4 h-4" />}
                >
                  Claim Rs. {video.reward_amount.toFixed(2)}
                </Button>
              )}
            </div>
          </div>

          {/* Verification Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Anti-Cheat Duration Telemetry</span>
              </span>
              <span className={elapsedSeconds >= requiredDuration ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                {elapsedSeconds}s / {requiredDuration}s ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  elapsedSeconds >= requiredDuration ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Anti-cheat compliance reassurance */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Rewards are issued via atomic database RPC. Client browsers cannot forge completion timestamps or seek past video content.
            </span>
          </div>
        </div>
      </Card>

      {/* Video Details */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Task Description & Campaign Details</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {video.description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
