import React from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { WebsiteContentItem, ContentPlacement } from '../../types/database';
import { parseYouTubeVideo } from '../../lib/youtube';
import { Volume2, Film, Image as ImageIcon, MessageSquare, Play } from 'lucide-react';

interface ContentElementRendererProps {
  placement: ContentPlacement;
  className?: string;
}

export const ContentElementRenderer: React.FC<ContentElementRendererProps> = ({
  placement,
  className = '',
}) => {
  const { websiteContent } = usePlatform();

  // Filter items for this placement, ensure enabled, and sort by display_order
  const items = (websiteContent || [])
    .filter((item) => item.placement === placement && item.enabled)
    .sort((a, b) => a.display_order - b.display_order);

  if (items.length === 0) return null;

  return (
    <div className={`space-y-4 w-full ${className}`}>
      {items.map((item) => (
        <SingleContentBlock key={item.id} item={item} />
      ))}
    </div>
  );
};

export const SingleContentBlock: React.FC<{ item: WebsiteContentItem }> = ({ item }) => {
  const { type, title, description, content_url, desktop_visible, mobile_visible, layout_config } = item;

  // Responsive Visibility
  if (!desktop_visible && !mobile_visible) return null;
  const visibilityClass =
    desktop_visible && !mobile_visible
      ? 'hidden md:block'
      : !desktop_visible && mobile_visible
      ? 'block md:hidden'
      : 'block';

  // Layout Width Dictionary
  const widthClasses: Record<string, string> = {
    full: 'w-full',
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-lg',
    xl: 'w-full max-w-xl',
    '2xl': 'w-full max-w-2xl',
    '4xl': 'w-full max-w-4xl',
  };
  const widthClass = widthClasses[layout_config?.width || 'full'] || 'w-full';

  // Layout Alignment Dictionary
  const alignClasses: Record<string, string> = {
    left: 'mr-auto text-left',
    center: 'mx-auto text-center',
    right: 'ml-auto text-right',
  };
  const alignClass = alignClasses[layout_config?.alignment || 'center'] || 'mx-auto text-center';

  // Padding Dictionary
  const paddingClasses: Record<string, string> = {
    none: 'p-0',
    sm: 'p-2 sm:p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  };
  const padClass = paddingClasses[layout_config?.padding || 'md'] || 'p-4';

  // Margin Dictionary
  const marginClasses: Record<string, string> = {
    none: 'my-0',
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
  };
  const marClass = marginClasses[layout_config?.margin || 'md'] || 'my-4';

  // Border Radius Dictionary
  const radiusClasses: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[2rem]',
    full: 'rounded-full',
  };
  const radClass = radiusClasses[layout_config?.borderRadius || 'xl'] || 'rounded-2xl';

  return (
    <div className={`${visibilityClass} ${alignClass} ${widthClass} ${marClass}`}>
      {/* 1. BANNER / IMAGE */}
      {type === 'banner' && (
        <div className={`overflow-hidden border border-slate-200/80 bg-white shadow-sm ${radClass} ${padClass}`}>
          {title && <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">{title}</h3>}
          {description && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{description}</p>}
          <div className="overflow-hidden rounded-xl bg-slate-100">
            <img
              src={content_url}
              alt={title || 'Banner'}
              className="w-full h-auto object-cover max-h-96 mx-auto"
              loading="lazy"
              onError={(e) => {
                // Fallback graceful broken image styling
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* 2. TEXT / ANNOUNCEMENT */}
      {type === 'text' && (
        <div className={`border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 shadow-sm ${radClass} ${padClass} text-left`}>
          {title && (
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
              <h3 className="text-sm sm:text-base font-black text-slate-900">{title}</h3>
            </div>
          )}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {content_url || description}
          </p>
          {description && content_url && description !== content_url && (
            <p className="text-xs text-slate-500 mt-2 italic">{description}</p>
          )}
        </div>
      )}

      {/* 3. YOUTUBE VIDEO */}
      {type === 'youtube' && (() => {
        const parsed = parseYouTubeVideo(content_url);
        if (!parsed.isYouTube || !parsed.embedUrl) {
          return (
            <div className={`p-4 bg-slate-100 rounded-2xl text-xs text-slate-500 text-center border border-slate-200`}>
              <span>YouTube Video Unavailable</span>
            </div>
          );
        }

        return (
          <div className={`overflow-hidden border border-slate-200 bg-slate-950 text-white shadow-md ${radClass} p-3 sm:p-4`}>
            {title && <h3 className="text-sm font-bold text-white mb-1 text-left">{title}</h3>}
            {description && <p className="text-xs text-slate-400 mb-3 text-left leading-relaxed">{description}</p>}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
              <iframe
                src={`${parsed.embedUrl}?enablejsapi=1&rel=0&modestbranding=1`}
                title={title || 'YouTube Video Player'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        );
      })()}

      {/* 4. DIRECT VIDEO (HTML5) */}
      {type === 'video' && (
        <div className={`overflow-hidden border border-slate-200 bg-slate-950 text-white shadow-md ${radClass} p-3 sm:p-4`}>
          {title && <h3 className="text-sm font-bold text-white mb-1 text-left">{title}</h3>}
          {description && <p className="text-xs text-slate-400 mb-3 text-left leading-relaxed">{description}</p>}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <video
              src={content_url}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 5. AUDIO PLAYER (HTML5) */}
      {type === 'audio' && (
        <div className={`border border-slate-200 bg-white shadow-sm ${radClass} ${padClass} text-left`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title || 'Audio Broadcast'}</h3>
              {description && <p className="text-xs text-slate-500 leading-snug">{description}</p>}
            </div>
          </div>
          <audio controls src={content_url} className="w-full h-10 rounded-lg">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};
