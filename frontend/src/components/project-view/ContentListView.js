import { CaretDown, CaretUp, Video, Image, Flag, Trash } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export default function ContentListView({
  groups,
  collapsedGroups,
  toggleGroupCollapse,
  queueItems,
  openContentDetail,
  toggleUrgent,
  deletingContentId,
  deleteContent,
}) {
  const { t, i18n } = useTranslation();
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)] mb-4">{t('project.content.noContent')}</p>
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-5">
      {groups.map(group => (
        <div key={group.key}>
          <button
            className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 hover:text-white transition-colors w-full text-left"
            onClick={() => toggleGroupCollapse(group.key)}
          >
            {collapsedGroups.has(group.key) ? <CaretDown size={11} /> : <CaretUp size={11} />}
            {group.label}
            <span className="font-normal opacity-60 ml-0.5">({group.items.length})</span>
          </button>
          {!collapsedGroups.has(group.key) && (
            <div className="space-y-0.5">
              {group.items.map(c => {
                const hasContent = !!(c.script || c.caption);
                const dotColor = c.status === 'published' ? '#22c55e'
                  : (c.status === 'scheduled' || hasContent) ? '#f97316'
                  : '#6b7280';
                const queueItem = queueItems.find(q => q.content_id === c.id);
                let dateLabel;
                if (c.status === 'published') dateLabel = group.label;
                else if (queueItem?.scheduled_at) dateLabel = new Date(queueItem.scheduled_at).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                else dateLabel = `${t('project.content.dayShort')}${(c.day_offset || 0) + 1}`;
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer group hover:bg-[var(--bg-card)] transition-colors"
                    style={c.status === 'published' ? { background: 'rgba(34,197,94,0.07)', borderLeft: '2px solid rgba(34,197,94,0.5)' } : {}}
                    onClick={() => openContentDetail(c)}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                    <div className="flex-shrink-0 text-[var(--text-muted)]">
                      {c.format === 'reel' ? <Video size={13} /> : c.format === 'prompted_reel' ? <span style={{ fontSize: 12 }}>🤖</span> : <Image size={13} />}
                    </div>
                    <p className="flex-1 text-sm truncate min-w-0">
                      {c.hook_text || <span className="text-[var(--text-muted)] italic text-xs">{t('project.content.untitled')}</span>}
                    </p>
                    <span className={`badge text-[9px] flex-shrink-0 hidden sm:inline-flex ${c.format === 'reel' ? 'pink' : c.format === 'prompted_reel' ? 'purple' : 'blue'}`}>
                      {c.format === 'prompted_reel' ? t('project.content.promptedShort') : t(`format.${c.format}`)}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 w-20 text-right">{dateLabel}</span>
                    <button
                      className="flex-shrink-0 transition-opacity opacity-40 group-hover:opacity-100"
                      style={{ color: c.urgent ? '#ef4444' : 'var(--text-muted)' }}
                      onClick={e => { e.stopPropagation(); toggleUrgent(c); }}
                      title={c.urgent ? t('project.content.unmarkUrgent') : t('project.content.markUrgent')}
                    >
                      <Flag size={14} weight={c.urgent ? 'fill' : 'regular'} />
                    </button>
                    <button
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-pink)]"
                      disabled={deletingContentId === c.id}
                      onClick={e => { e.stopPropagation(); deleteContent(c.id); }}
                    >
                      {deletingContentId === c.id
                        ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        : <Trash size={13} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
