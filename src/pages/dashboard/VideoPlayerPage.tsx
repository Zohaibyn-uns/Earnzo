import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  Clock,
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { VideoWatchSession } from '../../types/database';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { formatCurrency } from '../../lib/utils';
import { parseYouTubeVideo } from '../../lib/youtube';

export const VideoPlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { videos, membership, startWatchSession, completeWatchSession, wallet, refetchData } = usePlatform();

  useEffect(() => {
    refetchData();
  }, []);

  const video = videos.find((v) => v.id === id);
  const parsedYt = parseYouTubeVideo(video?.video_url || '');

  // Player telemetry states
  const [session, setSession] = useState<VideoWatchSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardGranted, setRewardGranted] = useState<number | null>(null);
  const [tabIsActive, setTabIsActive] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<any>(null);

  const requiredDuration = video?.duration_seconds || 30;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / requiredDuration) * 100));

  // Initialize secure session on mount
  useEffect(() => {
    if (!video) return;

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
        // If YouTube embed, playback starts automatically with session timer
        if (parsedYt.isYouTube) {
          setIsPlaying(true);
        }
      }
    };

    initSession();
  }, [video?.id]);

  // Tab visibility detection (anti-cheat: pause if user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabIsActive(false);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        setTabIsActive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Playback timer ticker
  useEffect(() => {
    if (isPlaying && tabIsActive && !isCompleted) {
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
  }, [isPlaying, tabIsActive, requiredDuration, isCompleted]);

  const handlePlay = () => {
    if (!session) return;
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Submit to Server-Side Verification Engine
  const handleClaimReward = async () => {
    if (!session || !video) return;

    setIsSubmitting(true);
    setError(null);

    // Call server-side validator with session token
    const result = await completeWatchSession(session.id, session.session_token);
    setIsSubmitting(false);

    if (result.success && result.rewardAmount) {
      setIsCompleted(true);
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
          <Button variant="outline">Back to Video Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/videos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tasks</span>
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

      {/* Main Video Screen */}
      <Card className="overflow-hidden border-slate-200">
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {parsedYt.isYouTube && parsedYt.embedUrl ? (
            <div className="w-full h-full relative aspect-video bg-black">
              <iframe
                src={`${parsedYt.embedUrl}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={video.video_url}
              poster={video.thumbnail_url}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              playsInline
              controls={false}
              className="w-full h-full object-contain"
            />
          )}

          {/* Center Play/Pause Overlay Button (Only for direct MP4 videos) */}
          {!parsedYt.isYouTube && !isPlaying && !isCompleted && session && (
            <button
              onClick={handlePlay}
              className="absolute w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
            >
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
          )}

          {/* Reward Completion Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-4 text-white z-10 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
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
                  <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" size="sm">
                    Next Video Task
                  </Button>
                </Link>
                <Link to="/dashboard/wallet">
                  <Button variant="primary" size="sm">
                    Inspect Wallet
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

            {/* Playback action / Claim button */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isCompleted && (
                <>
                  {isPlaying ? (
                    <Button variant="secondary" size="md" onClick={handlePause} leftIcon={<Pause className="w-4 h-4" />}>
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handlePlay}
                      disabled={!session}
                      leftIcon={<Play className="w-4 h-4" />}
                    >
                      {elapsedSeconds > 0 ? 'Resume' : 'Start Playback'}
                    </Button>
                  )}

                  {/* Claim Reward Button (Enabled only once duration met) */}
                  <Button
                    variant="success"
                    size="md"
                    disabled={elapsedSeconds < requiredDuration || isSubmitting}
                    isLoading={isSubmitting}
                    onClick={handleClaimReward}
                    leftIcon={<Award className="w-4 h-4" />}
                  >
                    Claim Rs. {video.reward_amount.toFixed(2)}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Verification Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Server-Side Duration Telemetry</span>
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
              Rewards are issued via atomic database RPC. Client browsers cannot forge completion timestamps. Please ensure continuous playback to complete verification.
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
