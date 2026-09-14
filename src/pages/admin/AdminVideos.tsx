import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { VideoTask } from '../../types/database';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Video, Plus, Edit2, Trash2, Clock, Award, Eye, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { parseYouTubeVideo } from '../../lib/youtube';

export const AdminVideos: React.FC = () => {
  const { videos, campaigns, addVideo, updateVideo, deleteVideo, refetchData } = usePlatform();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    refetchData();
  }, []);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoSourceInput, setVideoSourceInput] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [rewardAmount, setRewardAmount] = useState(10);
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id || '');
  const [category, setCategory] = useState('Technology');
  const [sponsorBadge, setSponsorBadge] = useState('Official Sponsor');

  const parsedVideo = parseYouTubeVideo(videoSourceInput);

  const handleSourceInputChange = (val: string) => {
    setVideoSourceInput(val);
    const parsed = parseYouTubeVideo(val);
    if (parsed.isYouTube && parsed.embedUrl) {
      setVideoUrl(parsed.embedUrl);
      if (!thumbnailUrl || thumbnailUrl.includes('img.youtube.com') || thumbnailUrl.includes('unsplash.com')) {
        setThumbnailUrl(parsed.defaultThumbnailUrl || '');
      }
    } else {
      setVideoUrl(val.trim());
    }
  };

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    const defaultYt = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    setVideoSourceInput(defaultYt);
    setVideoUrl(defaultYt);
    setThumbnailUrl('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    setDurationSeconds(30);
    setRewardAmount(10);
    setCampaignId(campaigns[0]?.id || '');
    setEditingVideo(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (v: VideoTask) => {
    setEditingVideo(v);
    setTitle(v.title);
    setDescription(v.description);
    setVideoSourceInput(v.video_url);
    setVideoUrl(v.video_url);
    setThumbnailUrl(v.thumbnail_url);
    setDurationSeconds(v.duration_seconds);
    setRewardAmount(v.reward_amount);
    setCampaignId(v.campaign_id || '');
    setCategory(v.category);
    setSponsorBadge(v.sponsor_badge);
    setIsCreateOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    if (editingVideo) {
      const res = await updateVideo(editingVideo.id, {
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration_seconds: Number(durationSeconds),
        reward_amount: Number(rewardAmount),
        campaign_id: campaignId || undefined,
        category,
        sponsor_badge: sponsorBadge,
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to update sponsored video in database');
        setIsSubmitting(false);
        return;
      }
      setActionSuccess(`Task "${title}" updated successfully.`);
    } else {
      const res = await addVideo({
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration_seconds: Number(durationSeconds),
        reward_amount: Number(rewardAmount),
        campaign_id: campaignId || undefined,
        daily_limit: 500,
        per_user_limit: 1,
        status: 'active',
        category,
        sponsor_badge: sponsorBadge,
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to publish sponsored video to database');
        setIsSubmitting(false);
        return;
      }
      setActionSuccess(`New sponsored task "${title}" published and live for users.`);
    }

    setIsSubmitting(false);
    setIsCreateOpen(false);
    setTimeout(() => setActionSuccess(null), 5000);
  };

  const toggleStatus = async (v: VideoTask) => {
    const nextStatus = v.status === 'active' ? 'paused' : 'active';
    setActionError(null);
    const res = await updateVideo(v.id, { status: nextStatus });
    if (!res.success) {
      setActionError(res.error || `Failed to change status for "${v.title}"`);
    } else {
      setActionSuccess(`Task "${v.title}" is now ${nextStatus}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleDelete = async (id: string, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${taskTitle}"? It will immediately disappear from user task lists.`)) {
      return;
    }
    setActionError(null);
    const res = await deleteVideo(id);
    if (!res.success) {
      setActionError(res.error || `Failed to delete task "${taskTitle}" from database`);
    } else {
      setActionSuccess(`Task "${taskTitle}" deleted successfully.`);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Sponsored Video Catalog</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage active brand video tasks, required watch durations, and reward allocations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreate}
        >
          Add New Sponsored Video
        </Button>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Action Failed</p>
            <p className="mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="font-medium">{actionSuccess}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((v) => (
          <div
            key={v.id}
            className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
          >
            <div className="relative aspect-video bg-black">
              <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover opacity-80" />
              <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                {v.duration_seconds}s required
              </div>
              <div className="absolute top-2 right-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    v.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {v.status}
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  {v.sponsor_badge} • {v.category}
                </span>
                <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">{v.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{v.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="font-black text-emerald-400">Rs. {v.reward_amount.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-300 hover:text-white text-xs p-1.5"
                    onClick={() => toggleStatus(v)}
                  >
                    {v.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-400 hover:text-indigo-300 text-xs p-1.5"
                    onClick={() => handleOpenEdit(v)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-400 hover:text-rose-300 text-xs p-1.5"
                    onClick={() => handleDelete(v.id, v.title)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal Form */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={editingVideo ? 'Edit Sponsored Video' : 'Create Sponsored Video Task'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Video Title"
            required
            placeholder="e.g. Smart Living 2026 Trailer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description
            </label>
            <textarea
              rows={3}
              required
              placeholder="Brief promotional overview..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* YouTube Embed Code / Video URL */}
          <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                YouTube Embed Code or Video URL
              </label>
              {parsedVideo.isYouTube && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  YouTube Verified ({parsedVideo.videoId})
                </span>
              )}
            </div>

            <textarea
              rows={2}
              required
              placeholder='Paste YouTube iframe embed code (<iframe ...>) or URL (https://www.youtube.com/watch?v=... / https://youtu.be/...)'
              value={videoSourceInput}
              onChange={(e) => handleSourceInputChange(e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {parsedVideo.error && videoSourceInput && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {parsedVideo.error}
              </p>
            )}

            {parsedVideo.isYouTube && (
              <div className="text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="truncate">
                  Safe Canonical Embed: <code className="text-indigo-600 font-semibold">{parsedVideo.embedUrl}</code>
                </span>
                {parsedVideo.defaultThumbnailUrl && (
                  <img
                    src={parsedVideo.defaultThumbnailUrl}
                    alt="YouTube Preview"
                    className="w-14 h-9 object-cover rounded-lg shrink-0 border border-slate-200 ml-2"
                  />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Thumbnail Image URL"
              required
              placeholder="Auto-filled from YouTube or enter image URL"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
            <Input
              label="Direct Video URL (Resolved)"
              required
              readOnly={parsedVideo.isYouTube}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={parsedVideo.isYouTube ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Duration (Seconds)"
              type="number"
              required
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
            />
            <Input
              label="Reward (PKR)"
              type="number"
              step="0.5"
              required
              value={rewardAmount}
              onChange={(e) => setRewardAmount(Number(e.target.value))}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Campaign
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Input
              label="Sponsor Badge"
              value={sponsorBadge}
              onChange={(e) => setSponsorBadge(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="md"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {editingVideo ? 'Update Video Task' : 'Deploy Video Task'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
