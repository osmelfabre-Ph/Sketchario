import { ArrowClockwise, RssSimple, Sparkle } from '@phosphor-icons/react';

export default function FeedStrips({
  isMobile,
  project,
  feedItems,
  aiFeedItems,
  pinnedItemIds,
  refreshingFeeds,
  refreshingAi,
  refreshFeeds,
  refreshAiSuggestions,
  setSelectedFeedItem,
  t,
}) {
  if (isMobile) return null;

  return (
    <div className="flex-shrink-0 border-t border-[var(--border-color)]" style={{ background: 'var(--bg-secondary)' }}>
      <div className="px-4 md:px-6 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1 truncate"><RssSimple size={12} /> News & Reddit — {project.sector}</p>
          <button className="text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 flex-shrink-0" disabled={refreshingFeeds} onClick={refreshFeeds}>
            <ArrowClockwise size={10} className={refreshingFeeds ? 'animate-spin' : ''} /> {refreshingFeeds ? '...' : t('project.feeds.refresh')}
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
          {feedItems.slice(0, 6).map(item => (
            <div
              key={item.id}
              className="flex-shrink-0 w-44 md:w-52 p-2.5 md:p-3 rounded-lg cursor-pointer hover:border-[var(--gradient-start)] transition-colors relative"
              style={{ background: 'var(--bg-card)', border: `1px solid ${pinnedItemIds.has(item.id) ? 'var(--gradient-start)' : 'var(--border-color)'}` }}
              onClick={() => setSelectedFeedItem({ ...item, _type: 'rss' })}
            >
              {pinnedItemIds.has(item.id) && <span className="absolute top-1 right-1 text-[9px]">📌</span>}
              <p className="text-xs font-medium line-clamp-2 mb-1 pr-3">{item.title}</p>
              <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{item.feed_name}</p>
            </div>
          ))}
          {feedItems.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">{t('project.feeds.noFeeds')}</p>}
        </div>
      </div>

      <div className="px-4 md:px-6 pt-1 pb-3 border-t border-[var(--border-color)]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1 truncate"><Sparkle size={12} weight="fill" /> Idee AI — {project.sector}</p>
          <button className="text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 flex-shrink-0" disabled={refreshingAi} onClick={refreshAiSuggestions}>
            <ArrowClockwise size={10} className={refreshingAi ? 'animate-spin' : ''} /> {refreshingAi ? '...' : t('editor.regenerate')}
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
          {aiFeedItems.map(item => (
            <div
              key={item.id}
              className="flex-shrink-0 w-44 md:w-52 p-2.5 md:p-3 rounded-lg cursor-pointer hover:border-[var(--accent-purple)] transition-colors relative"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(236,72,153,0.08) 100%)', border: `1px solid ${pinnedItemIds.has(item.id) ? 'rgba(168,85,247,0.6)' : 'rgba(99,102,241,0.15)'}` }}
              onClick={() => setSelectedFeedItem({ ...item, _type: 'ai' })}
            >
              {pinnedItemIds.has(item.id) && <span className="absolute top-1 right-1 text-[9px]">📌</span>}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${item.format === 'reel' ? 'bg-[var(--accent-pink)]' : 'bg-[var(--gradient-start)]'}`} />
                <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase">{item.format || 'reel'}</span>
                {item.trend_tag && <span className="text-[9px] text-[var(--accent-purple)]">#{item.trend_tag}</span>}
              </div>
              <p className="text-xs font-medium line-clamp-2 mb-1 pr-3">{item.title}</p>
              <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{item.summary}</p>
            </div>
          ))}
          {aiFeedItems.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">Generazione idee AI...</p>}
        </div>
      </div>
    </div>
  );
}
