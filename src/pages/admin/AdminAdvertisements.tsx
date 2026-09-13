import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { AdPlacement } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Compass, Plus, Eye, MousePointer, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';

export const AdminAdvertisements: React.FC = () => {
  const { adPlacements, addAdPlacement, updateAdPlacement, deleteAdPlacement } = usePlatform();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [placement, setPlacement] = useState<'homepage' | 'dashboard' | 'sidebar' | 'content' | 'footer'>('dashboard');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [sponsorName, setSponsorName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addAdPlacement({
      title,
      placement,
      image_url: imageUrl,
      target_url: targetUrl,
      sponsor_name: sponsorName,
      is_active: true,
    });
    setIsCreateOpen(false);
    setTitle('');
    setImageUrl('');
    setTargetUrl('');
    setSponsorName('');
  };

  const toggleStatus = (ad: AdPlacement) => {
    updateAdPlacement(ad.id, { is_active: !ad.is_active });
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Third-Party Display Ad Inventory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage partner banner placements. Strictly separated from platform reward video tasks.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Add Display Placement
        </Button>
      </div>

      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Ad Network Compliance Policy:</strong> Third-party display ads do not grant task credits or money to users. Forced clicks, auto-clicks, artificial iframe refreshes, and deceptive incentives are strictly prohibited to comply with major advertising network terms.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adPlacements.map((ad) => (
          <div
            key={ad.id}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {ad.placement}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    ad.is_active ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {ad.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              {ad.image_url && (
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-28 object-cover rounded-xl border border-slate-800 mb-3"
                />
              )}

              <h4 className="font-bold text-white text-sm">{ad.title}</h4>
              <span className="text-xs text-slate-400 block mt-0.5">{ad.sponsor_name}</span>
            </div>

            <div className="pt-3 border-t border-slate-900 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {ad.impressions} Views
                </span>
                <span className="flex items-center gap-1">
                  <MousePointer className="w-3.5 h-3.5" /> {ad.clicks} Clicks
                </span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleStatus(ad)}
                  className="text-xs text-indigo-400 hover:underline font-medium"
                >
                  {ad.is_active ? 'Pause' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteAdPlacement(ad.id)}
                  className="p-1.5 text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Third-Party Display Placement">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Banner Title"
            required
            placeholder="e.g. NVMe High-Speed Cloud VPS"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Partner Sponsor Name"
            required
            placeholder="e.g. GlobalCloud Hosting"
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Placement Slot</label>
            <select
              value={placement}
              onChange={(e: any) => setPlacement(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900"
            >
              <option value="homepage">Homepage Banner</option>
              <option value="dashboard">Dashboard Banner</option>
              <option value="sidebar">Sidebar Unit</option>
              <option value="content">Content Break</option>
              <option value="footer">Footer Unit</option>
            </select>
          </div>
          <Input
            label="Creative Image URL"
            required
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Input
            label="Target Link Destination"
            required
            placeholder="https://..."
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
          <Button type="submit" variant="primary" className="w-full" size="md">
            Save Display Placement
          </Button>
        </form>
      </Modal>
    </div>
  );
};
