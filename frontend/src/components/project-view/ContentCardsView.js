import { motion } from 'framer-motion';
import { Plus, Trash, Video, Image } from '@phosphor-icons/react';
import { richTextToPlainText } from '../../lib/utils';

export default function ContentCardsView({
  contents,
  openContentDetail,
  deletingContentId,
  deleteContent,
  setShowNewPost,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pt-2">
      {contents.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="card cursor-pointer group"
          onClick={() => openContentDetail(c)}
          style={c.status === 'published' ? { borderColor: 'rgba(34,197,94,0.45)', background: 'linear-gradient(135deg, var(--bg-card) 80%, rgba(34,197,94,0.06) 100%)' } : {}}
        >
          {c.media && c.media[0] && c.media[0].type === 'image' ? (
            <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-3 h-28 md:h-36 rounded-t-[0.9rem] overflow-hidden">
              <img src={`${process.env.REACT_APP_BACKEND_URL}${c.media[0].url}`} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-3 h-16 md:h-20 rounded-t-[0.9rem] flex items-center justify-center"
              style={{ background: c.format === 'reel' ? 'rgba(236,72,153,0.08)' : c.format === 'prompted_reel' ? 'rgba(168,85,247,0.08)' : 'rgba(99,102,241,0.08)' }}
            >
              {c.format === 'reel'
                ? <Video size={24} className="text-[var(--accent-pink)] opacity-40" />
                : c.format === 'prompted_reel'
                  ? <span style={{ fontSize: 24, opacity: 0.4 }}>🤖</span>
                  : <Image size={24} className="text-[var(--gradient-start)] opacity-40" />}
            </div>
          )}
          <div className="flex items-start gap-2 mb-2">
            <span className={`badge text-[9px] ${c.format === 'reel' ? 'pink' : c.format === 'prompted_reel' ? 'purple' : 'blue'}`}>{c.format === 'prompted_reel' ? '🤖 prompted reel' : c.format}</span>
            <span className={`badge text-[9px] ${c.status === 'published' ? 'green' : c.status === 'scheduled' ? 'orange' : 'purple'}`}>{c.status || 'draft'}</span>
          </div>
          <h4 className="text-sm font-semibold mb-1 line-clamp-2">{c.hook_text}</h4>
          <p className="text-xs text-[var(--text-muted)] line-clamp-2">{richTextToPlainText(c.caption || '').slice(0, 100)}</p>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)]">G{(c.day_offset || 0) + 1}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 rounded hover:bg-[var(--bg-secondary)]" disabled={deletingContentId === c.id} onClick={e => { e.stopPropagation(); deleteContent(c.id); }}>
                {deletingContentId === c.id ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Trash size={12} />}
              </button>
            </div>
          </div>
        </motion.div>
      ))}
      {contents.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-[var(--text-muted)] mb-4">Nessun contenuto disponibile</p>
          <button className="btn-gradient text-sm" onClick={() => setShowNewPost(true)}><Plus size={16} /> Crea il primo post</button>
        </div>
      )}
    </div>
  );
}
