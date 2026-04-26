import { useTranslation } from 'react-i18next';
import { ChartBar, Globe, Queue, X } from '@phosphor-icons/react';
import Analytics from '../Analytics';
import { PLATFORM_ICONS } from './constants';

export default function RightPanelContent({ queueItems, contents, cancelQueueItem, cancellingQueueId, project }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-3 flex items-center gap-1"><Queue size={12} /> Publishing Queue <span className="badge blue text-[8px] ml-1">{queueItems.length}</span></p>
        {queueItems.slice(0, 8).map(item => {
          const platformInfo = PLATFORM_ICONS[item.platform] || { Icon: Globe, color: '#fff' };
          const isFailed = item.status === 'failed';
          return (
            <div key={item.id} className="py-1.5 px-2 rounded mb-1" style={{ background: isFailed ? 'rgba(239,68,68,0.08)' : 'var(--bg-card)', border: isFailed ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
              <div className="flex items-center gap-2">
                <platformInfo.Icon weight="fill" size={12} color={platformInfo.color} />
                <p className="text-[10px] flex-1 truncate">{contents.find(c => c.id === item.content_id)?.hook_text?.slice(0, 30) || '...'}</p>
                <span className={`text-[8px] font-semibold ${item.status === 'queued' ? 'text-[var(--accent-blue)]' : item.status === 'published' ? 'text-[var(--accent-green)]' : isFailed ? 'text-red-400' : 'text-[var(--accent-orange)]'}`}>{item.status}</span>
                {item.status === 'queued' && (
                  <button onClick={() => cancelQueueItem(item.id)} disabled={cancellingQueueId === item.id}>
                    {cancellingQueueId === item.id
                      ? <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                      : <X size={10} />}
                  </button>
                )}
              </div>
              {isFailed && item.error_message && (
                <p className="text-[9px] mt-0.5 text-red-400 leading-tight">{item.error_message.slice(0, 120)}</p>
              )}
            </div>
          );
        })}
        {queueItems.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">{t('project.queue.empty')}</p>}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-3 flex items-center gap-1"><ChartBar size={12} /> Analytics</p>
        <Analytics project={project} compact />
      </div>
    </>
  );
}
