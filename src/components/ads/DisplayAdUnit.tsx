import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

interface DisplayAdUnitProps {
  placement: 'homepage' | 'dashboard' | 'sidebar' | 'content' | 'footer';
  className?: string;
}

export const DisplayAdUnit: React.FC<DisplayAdUnitProps> = ({ placement, className = '' }) => {
  const { adPlacements, recordAdClick } = usePlatform();

  const ad = adPlacements.find((a) => a.placement === placement && a.is_active);
  if (!ad) return null;

  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white overflow-hidden text-xs shadow-subtle ${className}`}
    >
      {/* Explicit Third-Party Ad Notice - Required by Advertising Network Standards */}
      <div className="bg-slate-100/80 px-2.5 py-1 text-[10px] text-slate-500 flex items-center justify-between border-b border-slate-200/60">
        <span className="font-semibold uppercase tracking-wider text-[9px] text-slate-400">
          Sponsored Display Ad
        </span>
        <span className="flex items-center gap-1 text-[9px] text-slate-400">
          <Info className="w-2.5 h-2.5" />
          <span>Non-Incentivized</span>
        </span>
      </div>

      <a
        href={ad.target_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordAdClick(ad.id)}
        className="block p-3 group hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex gap-3 items-center">
          {ad.image_url && (
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-100 group-hover:scale-105 transition-transform"
            />
          )}
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-xs">
              {ad.title}
            </h5>
            <span className="text-[11px] text-slate-400 block mt-0.5">{ad.sponsor_name}</span>
            <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium mt-1">
              <span>Visit Partner</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};
