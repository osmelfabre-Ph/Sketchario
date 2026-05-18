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
  canRssFeeds,
  t,
}) {
  if (isMobile) return null;
  const lockedFeedPlaceholders = [1, 2, 3];

  return (
    <div className="relative flex-shrink-0 border-t border-[var(--border-color)]" style={{ background: 'var(--bg-secondary)' }}>
      {!canRssFeeds && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div className="rounded-full border border-[var(--gradient-start)]/40 bg-[rgba(8,10,18,0.88)] px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm">
            {t('project.feeds.proOnly')}
          </div>
        </div>
      )}
      <div className={`px-4 md:px-6 pt-3 pb-2 ${!canRssFeeds ? 'opacity-40 pointer-events-none select-none' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1 truncate"><RssSimple size={12} /> {t('project.feeds.newsReddit')} — {project.sector}</p>
          <button className="text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 flex-shrink-0" disabled={!canRssFeeds || refreshingFeeds} onClick={refreshFeeds}>
            <ArrowClockwise size={10} className={refreshingFeeds ? 'animate-spin' : ''} /> {refreshingFeeds ? '...' : t('project.feeds.refresh')}
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
          {(canRssFeeds ? feedItems.slice(0, 6) : lockedFeedPlaceholders).map(item => (
            <div
              key={item.id || `rss-strip-placeholder-${item}`}
              className="flex-shrink-0 w-44 md:w-52 p-2.5 md:p-3 rounded-lg cursor-pointer hover:border-[var(--gradient-start)] transition-colors relative"
              style={{ background: 'var(--bg-card)', border: `1px solid ${canRssFeeds && pinnedItemIds.has(item.id) ? 'var(--gradient-start)' : 'var(--border-color)'}` }}
              onClick={() => canRssFeeds && setSelectedFeedItem({ ...item, _type: 'rss' })}
            >
              {canRssFeeds && pinnedItemIds.has(item.id) && <span className="absolute top-1 right-1 text-[9px]">📌</span>}
              <p className="text-xs font-medium line-clamp-2 mb-1 pr-3">{canRssFeeds ? item.title : t('project.feeds.lockedTitle')}</p>
              <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{canRssFeeds ? item.feed_name : t('project.feeds.lockedSubtitle')}</p>
            </div>
          ))}
          {canRssFeeds && feedItems.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">{t('project.feeds.noFeeds')}</p>}
        </div>
      </div>

      <div className={`px-4 md:px-6 pt-1 pb-3 border-t border-[var(--border-color)] ${!canRssFeeds ? 'opacity-40 pointer-events-none select-none' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1 truncate"><Sparkle size={12} weight="fill" /> {t('project.feeds.aiSuggestions')} — {project.sector}</p>
          <button className="text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 flex-shrink-0" disabled={!canRssFeeds || refreshingAi} onClick={refreshAiSuggestions}>
            <ArrowClockwise size={10} className={refreshingAi ? 'animate-spin' : ''} /> {refreshingAi ? '...' : t('editor.regenerate')}
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
          {(canRssFeeds ? aiFeedItems : lockedFeedPlaceholders).map(item => (
            <div
              key={item.id || `ai-strip-placeholder-${item}`}
              className="flex-shrink-0 w-44 md:w-52 p-2.5 md:p-3 rounded-lg cursor-pointer hover:border-[var(--accent-purple)] transition-colors relative"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(236,72,153,0.08) 100%)', border: `1px solid ${canRssFeeds && pinnedItemIds.has(item.id) ? 'rgba(168,85,247,0.6)' : 'rgba(99,102,241,0.15)'}` }}
              onClick={() => canRssFeeds && setSelectedFeedItem({ ...item, _type: 'ai' })}
            >
              {canRssFeeds && pinnedItemIds.has(item.id) && <span className="absolute top-1 right-1 text-[9px]">📌</span>}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${canRssFeeds && item.format === 'reel' ? 'bg-[var(--accent-pink)]' : 'bg-[var(--gradient-start)]'}`} />
                <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase">{canRssFeeds && item.format ? t(`format.${item.format}`) : t('format.reel')}</span>
                {canRssFeeds && item.trend_tag && <span className="text-[9px] text-[var(--accent-purple)]">#{item.trend_tag}</span>}
              </div>
              <p className="text-xs font-medium line-clamp-2 mb-1 pr-3">{canRssFeeds ? item.title : t('project.feeds.lockedAiTitle')}</p>
              <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{canRssFeeds ? item.summary : t('project.feeds.lockedAiSubtitle')}</p>
            </div>
          ))}
          {canRssFeeds && aiFeedItems.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">{t('project.feeds.aiEmpty')}</p>}
        </div>
      </div>
    </div>
  );
}
