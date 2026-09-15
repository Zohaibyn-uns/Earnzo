import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Volume1,
  VolumeX,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { VideoTask } from '../../types/database';
import { parseYouTubeVideo } from '../../lib/youtube';

interface SponsoredVideoPlayerProps {
  video: VideoTask;
  isPlaying: boolean;
  isCompleted: boolean;
  tabIsActive: boolean;
  elapsedSeconds: number;
  requiredDuration: number;
  onPlayStateChange?: (playing: boolean) => void;
  className?: string;
}

export const SponsoredVideoPlayer: React.FC<SponsoredVideoPlayerProps> = ({
  video,
  isPlaying,
  isCompleted,
  tabIsActive,
  elapsedSeconds,
  requiredDuration,
  onPlayStateChange,
  className = '',
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [shareSuccess, setShareSuccess] = useState(false);

  const parsedYt = parseYouTubeVideo(video.video_url || '');

  // Helper to safely send postMessage commands to YouTube iframe
  const sendYouTubeCommand = useCallback((func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func,
            args,
          }),
          '*'
        );
      } catch (e) {
        // Suppress cross-origin postMessage warnings
      }
    }
  }, []);

  // Sync tab visibility and play/pause state to YouTube
  useEffect(() => {
    if (!parsedYt.isYouTube) {
      if (videoRef.current) {
        if (isPlaying && tabIsActive && !isCompleted) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
      return;
    }

    if (isPlaying && tabIsActive && !isCompleted) {
      sendYouTubeCommand('playVideo');
    } else {
      sendYouTubeCommand('pauseVideo');
    }
  }, [isPlaying, tabIsActive, isCompleted, parsedYt.isYouTube, sendYouTubeCommand]);

  // Handle Volume Change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }

    if (parsedYt.isYouTube) {
      sendYouTubeCommand('setVolume', [newVolume]);
      if (newVolume > 0) {
        sendYouTubeCommand('unMute');
      }
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      videoRef.current.muted = newVolume === 0;
    }
  };

  // Toggle Mute / Unmute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      const targetVol = volume > 0 ? volume : 80;
      setVolume(targetVol);
      if (parsedYt.isYouTube) {
        sendYouTubeCommand('unMute');
        sendYouTubeCommand('setVolume', [targetVol]);
      } else if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = targetVol / 100;
      }
    } else {
      setIsMuted(true);
      if (parsedYt.isYouTube) {
        sendYouTubeCommand('mute');
      } else if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  // Share Video Link
  const handleShare = async () => {
    const shareData = {
      title: video.title,
      text: `Watch "${video.title}" on Earnzo to earn verified rewards!`,
      url: window.location.href,
    };

    if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
        return;
      } catch (err) {
        // User cancelled share
      }
    }

    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  // Construct restricted YouTube embed URL
  // controls=0 (removes seek bar, progress bar, play/pause, time, fullscreen, settings)
  // disablekb=1 (disables keyboard seek shortcuts: arrows, 0-9, J, L)
  // fs=0 (disables native fullscreen)
  // modestbranding=1 & rel=0 (removes branding & related videos)
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const secureEmbedUrl = parsedYt.isYouTube && parsedYt.embedUrl
    ? `${parsedYt.embedUrl}?enablejsapi=1&autoplay=1&controls=0&disablekb=1&fs=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&origin=${encodeURIComponent(origin)}`
    : '';

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl flex flex-col ${className}`}>
      {/* Video Display Container */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden select-none">
        {parsedYt.isYouTube && secureEmbedUrl ? (
          <div className="w-full h-full relative aspect-video bg-black pointer-events-auto">
            <iframe
              ref={iframeRef}
              src={secureEmbedUrl}
              title={video.title}
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen={false}
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
            {/* Anti-Seek Transparent Protective Shield: Blocks mouse/touch scrubbing */}
            <div
              className="absolute inset-0 z-10 bg-transparent cursor-default select-none"
              style={{ touchAction: 'none' }}
              onClick={(e) => {
                // Prevent click-through that would trigger YouTube pause or video link
                e.preventDefault();
                e.stopPropagation();
              }}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={video.video_url}
            poster={video.thumbnail_url}
            playsInline
            controls={false}
            className="w-full h-full object-contain pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          />
        )}

        {/* Top Floating Telemetry & Sponsor Header Badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white text-[11px] font-semibold shadow-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anti-Skip Protected</span>
          </div>

          <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-amber-300 text-[11px] font-bold shadow-lg">
            {video.sponsor_badge || 'Official Sponsor'}
          </div>
        </div>
      </div>

      {/* Allowed Controls Bar: Volume & Share Only */}
      <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-4 text-white z-20">
        {/* Left: Volume Control (Allowed) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors flex items-center justify-center"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4 text-slate-300" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              aria-label="Volume Slider"
            />
            <span className="text-[10px] font-mono text-slate-400 w-7">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
        </div>

        {/* Center: Real-Time Verified Watch Time */}
        <div className="text-center">
          <div className="text-[11px] font-mono font-bold text-slate-300">
            <span className={elapsedSeconds >= requiredDuration ? 'text-emerald-400' : 'text-amber-400'}>
              {elapsedSeconds}s
            </span>
            <span className="text-slate-500"> / {requiredDuration}s</span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-slate-500 hidden sm:block">
            {elapsedSeconds >= requiredDuration ? 'Goal Achieved' : 'Watch Duration'}
          </span>
        </div>

        {/* Right: Share Button (Allowed) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            {shareSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
