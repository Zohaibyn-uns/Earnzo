import React, { useState, useMemo } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import {
  WebsiteContentItem,
  ContentElementType,
  ContentPlacement,
  ContentLayoutConfig,
} from '../../types/database';
import { parseYouTubeVideo } from '../../lib/youtube';
import { SingleContentBlock } from '../../components/content/ContentElementRenderer';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  MessageSquare,
  Youtube,
  Video,
  Volume2,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  LayoutTemplate,
  Sliders,
} from 'lucide-react';

const PLACEMENT_LABELS: Record<ContentPlacement, string> = {
  dashboard_top: 'Dashboard — Top Banner',
  dashboard_content: 'Dashboard — Mid Content',
  dashboard_bottom: 'Dashboard — Bottom Section',
  earn_top: 'Watch & Earn — Top Header',
  earn_bottom: 'Watch & Earn — Bottom Footer',
  plans_top: 'VIP Plans — Top Banner',
  plans_bottom: 'VIP Plans — Bottom Footer',
};

const TYPE_ICONS: Record<ContentElementType, React.ReactNode> = {
  banner: <ImageIcon className="w-4 h-4 text-sky-400" />,
  text: <MessageSquare className="w-4 h-4 text-indigo-400" />,
  youtube: <Youtube className="w-4 h-4 text-red-500" />,
  video: <Video className="w-4 h-4 text-emerald-400" />,
  audio: <Volume2 className="w-4 h-4 text-amber-400" />,
};

const DEFAULT_LAYOUT: ContentLayoutConfig = {
  width: 'full',
  height: 'auto',
  alignment: 'center',
  margin: 'md',
  padding: 'md',
  borderRadius: 'xl',
};

export const AdminWebsiteContent: React.FC = () => {
  const {
    websiteContent,
    addWebsiteContent,
    updateWebsiteContent,
    deleteWebsiteContent,
    toggleWebsiteContent,
  } = usePlatform();

  // Filters
  const [filterPlacement, setFilterPlacement] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<ContentElementType>('banner');
  const [placement, setPlacement] = useState<ContentPlacement>('dashboard_top');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [enabled, setEnabled] = useState(true);
  const [desktopVisible, setDesktopVisible] = useState(true);
  const [mobileVisible, setMobileVisible] = useState(true);
  const [layoutConfig, setLayoutConfig] = useState<ContentLayoutConfig>(DEFAULT_LAYOUT);

  // Filtered Content
  const filteredContent = useMemo(() => {
    return (websiteContent || [])
      .filter((item) => {
        if (filterPlacement !== 'all' && item.placement !== filterPlacement) return false;
        if (filterType !== 'all' && item.type !== filterType) return false;
        return true;
      })
      .sort((a, b) => a.display_order - b.display_order);
  }, [websiteContent, filterPlacement, filterType]);

  // YouTube live validation for form
  const ytParsed = useMemo(() => {
    if (type === 'youtube' && contentUrl.trim()) {
      return parseYouTubeVideo(contentUrl);
    }
    return null;
  }, [type, contentUrl]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setType('banner');
    setPlacement('dashboard_top');
    setTitle('');
    setDescription('');
    setContentUrl('');
    setDisplayOrder(websiteContent.length);
    setEnabled(true);
    setDesktopVisible(true);
    setMobileVisible(true);
    setLayoutConfig(DEFAULT_LAYOUT);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: WebsiteContentItem) => {
    setEditingId(item.id);
    setType(item.type);
    setPlacement(item.placement);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setContentUrl(item.content_url || '');
    setDisplayOrder(item.display_order || 0);
    setEnabled(item.enabled);
    setDesktopVisible(item.desktop_visible !== false);
    setMobileVisible(item.mobile_visible !== false);
    setLayoutConfig(item.layout_config || DEFAULT_LAYOUT);
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalContentUrl = contentUrl.trim();
    if (type === 'youtube') {
      const parsed = parseYouTubeVideo(finalContentUrl);
      if (parsed.isYouTube && parsed.embedUrl) {
        finalContentUrl = parsed.embedUrl;
      }
    }

    const payload = {
      type,
      placement,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      content_url: finalContentUrl,
      display_order: Number(displayOrder) || 0,
      enabled,
      desktop_visible: desktopVisible,
      mobile_visible: mobileVisible,
      layout_config: layoutConfig,
    };

    if (editingId) {
      await updateWebsiteContent(editingId, payload);
    } else {
      await addWebsiteContent(payload);
    }

    setIsModalOpen(false);
  };

  // Delete Handler
  const handleDelete = async (id: string, itemTitle?: string) => {
    if (window.confirm(`Are you sure you want to delete "${itemTitle || 'this content element'}"?`)) {
      await deleteWebsiteContent(id);
    }
  };

  // Move Order
  const handleMoveOrder = async (item: WebsiteContentItem, direction: 'up' | 'down') => {
    const currentItems = [...websiteContent].sort((a, b) => a.display_order - b.display_order);
    const index = currentItems.findIndex((c) => c.id === item.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentItems.length) return;

    const targetItem = currentItems[targetIndex];
    const currentOrder = item.display_order;
    const targetOrder = targetItem.display_order;

    await updateWebsiteContent(item.id, {
      display_order: targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder,
    });
    await updateWebsiteContent(targetItem.id, { display_order: currentOrder });
  };

  // Preview Object
  const previewItem: WebsiteContentItem = useMemo(() => {
    let previewUrl = contentUrl.trim();
    if (type === 'youtube' && ytParsed?.isYouTube && ytParsed.embedUrl) {
      previewUrl = ytParsed.embedUrl;
    }
    return {
      id: editingId || 'preview-temp',
      type,
      placement,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      content_url: previewUrl,
      display_order: displayOrder,
      enabled: true,
      desktop_visible: desktopVisible,
      mobile_visible: mobileVisible,
      layout_config: layoutConfig,
      created_at: new Date().toISOString(),
    };
  }, [editingId, type, placement, title, description, contentUrl, ytParsed, displayOrder, desktopVisible, mobileVisible, layoutConfig]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-indigo-400" />
            Dynamic Website Content & Elements
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, customize, and arrange responsive banners, YouTube video embeds, HTML5 videos, notices, and audio across key pages.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreate}
        >
          Add Content Element
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold uppercase tracking-wider">Filters:</span>
        </div>

        {/* Placement Filter */}
        <select
          value={filterPlacement}
          onChange={(e) => setFilterPlacement(e.target.value)}
          className="text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Placement Slots</option>
          {Object.entries(PLACEMENT_LABELS).map(([val, lbl]) => (
            <option key={val} value={val}>
              {lbl}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Element Types</option>
          <option value="banner">Banner / Image</option>
          <option value="text">Text / Announcement</option>
          <option value="youtube">YouTube Video</option>
          <option value="video">Direct Video (MP4)</option>
          <option value="audio">Audio Broadcast</option>
        </select>

        <div className="ml-auto text-xs text-slate-500 font-medium">
          Showing {filteredContent.length} of {websiteContent.length} elements
        </div>
      </div>

      {/* Content Elements List */}
      {filteredContent.length === 0 ? (
        <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl">
          <LayoutTemplate className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No content elements found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {websiteContent.length === 0
              ? 'No website elements have been created yet. Click "Add Content Element" to publish your first banner, notice, or YouTube embed.'
              : 'No elements match the selected placement and type filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredContent.map((item, idx) => (
            <div
              key={item.id}
              className={`bg-slate-950 border rounded-2xl p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                item.enabled ? 'border-slate-800 hover:border-slate-700' : 'border-slate-900 opacity-60'
              }`}
            >
              {/* Left Column: Icon & Basic Info */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {TYPE_ICONS[item.type] || <LayoutTemplate className="w-5 h-5 text-slate-400" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {PLACEMENT_LABELS[item.placement] || item.placement}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                      {item.type}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        item.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.enabled ? 'Published' : 'Disabled'}
                    </span>
                    <span className="text-[10px] text-slate-500">Order: #{item.display_order}</span>
                  </div>

                  <h3 className="font-bold text-white text-sm truncate">
                    {item.title || '(No Title / Direct Element)'}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                  )}

                  <p className="text-[11px] text-slate-500 font-mono truncate mt-1 max-w-lg">
                    {item.content_url}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-slate-500" />
                      {item.desktop_visible !== false ? 'Desktop On' : 'Desktop Off'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-slate-500" />
                      {item.mobile_visible !== false ? 'Mobile On' : 'Mobile Off'}
                    </span>
                    <span>Width: {item.layout_config?.width || 'full'}</span>
                    <span>Align: {item.layout_config?.alignment || 'center'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-900 w-full md:w-auto justify-end">
                {/* Reorder Up/Down */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(item, 'up')}
                    disabled={idx === 0}
                    title="Move up"
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(item, 'down')}
                    disabled={idx === filteredContent.length - 1}
                    title="Move down"
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Toggle Published */}
                <button
                  type="button"
                  onClick={() => toggleWebsiteContent(item.id, !item.enabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    item.enabled
                      ? 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                  }`}
                >
                  {item.enabled ? 'Pause' : 'Enable'}
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl"
                  title="Edit Element"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl"
                  title="Delete Element"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Website Content Element' : 'New Website Content Element'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Element Type Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Element Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { val: 'banner', lbl: 'Banner / Image', icon: <ImageIcon className="w-3.5 h-3.5" /> },
                  { val: 'text', lbl: 'Text / Notice', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                  { val: 'youtube', lbl: 'YouTube Video', icon: <Youtube className="w-3.5 h-3.5" /> },
                  { val: 'video', lbl: 'Direct Video (MP4)', icon: <Video className="w-3.5 h-3.5" /> },
                  { val: 'audio', lbl: 'Audio Broadcast', icon: <Volume2 className="w-3.5 h-3.5" /> },
                ] as const
              ).map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setType(t.val)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    type === t.val
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {t.icon}
                  <span>{t.lbl}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Placement Slot */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Placement Slot
            </label>
            <select
              value={placement}
              onChange={(e: any) => setPlacement(e.target.value)}
              className="w-full text-xs border border-slate-800 rounded-xl p-2.5 bg-slate-900 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {Object.entries(PLACEMENT_LABELS).map(([val, lbl]) => (
                <option key={val} value={val}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Title / Heading (Optional)"
              placeholder="e.g. Special Weekend Bonus Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Description / Subtitle (Optional)"
              placeholder="e.g. Upgrade to Platinum for 2x rewards"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Content / Media Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              {type === 'youtube'
                ? 'YouTube Embed Code or Video URL'
                : type === 'banner'
                ? 'Image URL (PNG, JPG, WebP)'
                : type === 'text'
                ? 'Announcement Text Content'
                : type === 'video'
                ? 'Video File URL (MP4 / WebM)'
                : 'Audio Stream URL (MP3 / WAV)'}
            </label>

            {type === 'text' ? (
              <textarea
                rows={3}
                required
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="Enter the announcement message to display..."
                className="w-full text-xs border border-slate-800 rounded-xl p-2.5 bg-slate-900 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              />
            ) : type === 'youtube' ? (
              <div className="space-y-2">
                <textarea
                  rows={2}
                  required
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder='Paste <iframe src="https://www.youtube.com/embed/..." ...> or standard watch URL'
                  className="w-full text-xs font-mono border border-slate-800 rounded-xl p-2.5 bg-slate-900 text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                {ytParsed && (
                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs ${
                      ytParsed.isYouTube
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                    }`}
                  >
                    {ytParsed.isYouTube ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Valid YouTube video detected (ID: {ytParsed.videoId})</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{ytParsed.error || 'Invalid YouTube URL or embed iframe'}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Input
                required
                placeholder="https://..."
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
              />
            )}
          </div>

          {/* Layout Properties Section */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Layout & Sizing Controls
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Width */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Max Width</label>
                <select
                  value={layoutConfig.width || 'full'}
                  onChange={(e: any) => setLayoutConfig((prev) => ({ ...prev, width: e.target.value }))}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="full">Full Width (100%)</option>
                  <option value="4xl">Extra Wide (4XL)</option>
                  <option value="2xl">Wide (2XL)</option>
                  <option value="xl">Standard (XL)</option>
                  <option value="lg">Medium (LG)</option>
                  <option value="md">Compact (MD)</option>
                  <option value="sm">Small (SM)</option>
                </select>
              </div>

              {/* Alignment */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Alignment</label>
                <select
                  value={layoutConfig.alignment || 'center'}
                  onChange={(e: any) => setLayoutConfig((prev) => ({ ...prev, alignment: e.target.value }))}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="center">Center</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>

              {/* Border Radius */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Corner Radius</label>
                <select
                  value={layoutConfig.borderRadius || 'xl'}
                  onChange={(e: any) => setLayoutConfig((prev) => ({ ...prev, borderRadius: e.target.value }))}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="none">Square (None)</option>
                  <option value="sm">Small (rounded-lg)</option>
                  <option value="md">Medium (rounded-xl)</option>
                  <option value="xl">Standard (rounded-2xl)</option>
                  <option value="2xl">Card (rounded-3xl)</option>
                  <option value="full">Pill (full)</option>
                </select>
              </div>

              {/* Padding */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Inner Padding</label>
                <select
                  value={layoutConfig.padding || 'md'}
                  onChange={(e: any) => setLayoutConfig((prev) => ({ ...prev, padding: e.target.value }))}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="none">No Padding</option>
                  <option value="sm">Small Padding</option>
                  <option value="md">Medium Padding</option>
                  <option value="lg">Large Padding</option>
                </select>
              </div>

              {/* Margin */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Vertical Margin</label>
                <select
                  value={layoutConfig.margin || 'md'}
                  onChange={(e: any) => setLayoutConfig((prev) => ({ ...prev, margin: e.target.value }))}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="none">None (my-0)</option>
                  <option value="sm">Small (my-2)</option>
                  <option value="md">Medium (my-4)</option>
                  <option value="lg">Large (my-6)</option>
                </select>
              </div>

              {/* Display Order */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            {/* Visibility & Enabled Toggles */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={desktopVisible}
                  onChange={(e) => setDesktopVisible(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
                <span>Show on Desktop</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mobileVisible}
                  onChange={(e) => setMobileVisible(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                />
                <span>Show on Mobile</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0"
                />
                <span className="font-semibold text-emerald-400">Published / Enabled</span>
              </label>
            </div>
          </div>

          {/* Live Preview Box */}
          {contentUrl.trim() && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  Live Preview
                </span>
                <span className="text-[10px] text-slate-500">Rendered in user container</span>
              </div>

              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                <SingleContentBlock item={previewItem} />
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full font-bold" size="md">
            {editingId ? 'Save Changes' : 'Publish Content Element'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
