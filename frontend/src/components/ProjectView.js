import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarBlank, List, Users as UsersIcon, Palette, Lightning, Video, Image, PencilSimple, X,
  Plus, ArrowLeft, InstagramLogo, LinkedinLogo, FacebookLogo, TiktokLogo, PinterestLogo,
  Article, Eye, Sparkle
} from '@phosphor-icons/react';

const TABS = [
  { id: 'calendar', label: 'Calendario', icon: CalendarBlank },
  { id: 'list', label: 'Tutti', icon: List },
  { id: 'personas', label: 'Personas', icon: UsersIcon },
  { id: 'tov', label: 'Tono', icon: Palette },
];

export default function ProjectView({ project, setActiveView }) {
  const { api } = useAuth();
  const [tab, setTab] = useState('calendar');
  const [contents, setContents] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [hooks, setHooks] = useState([]);
  const [tov, setTov] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [editScript, setEditScript] = useState('');
  const [editHashtags, setEditHashtags] = useState('');

  useEffect(() => {
    if (!project?.id) return;
    Promise.all([
      api.get(`/contents/${project.id}`).then(r => setContents(r.data)).catch(() => {}),
      api.get(`/personas/${project.id}`).then(r => setPersonas(r.data)).catch(() => {}),
      api.get(`/hooks/${project.id}`).then(r => setHooks(r.data)).catch(() => {}),
      api.get(`/tov/${project.id}`).then(r => setTov(r.data || {})).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [api, project?.id]);

  const openContentDetail = (c) => {
    setSelectedContent(c);
    setEditCaption(c.caption || '');
    setEditScript(c.script || '');
    setEditHashtags(c.hashtags || '');
  };

  const saveContent = async () => {
    await api.put(`/contents/${selectedContent.id}`, { caption: editCaption, script: editScript, hashtags: editHashtags });
    setContents(prev => prev.map(c => c.id === selectedContent.id ? { ...c, caption: editCaption, script: editScript, hashtags: editHashtags } : c));
    setSelectedContent(null);
  };

  const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  if (loading) return <p className="text-[var(--text-muted)] text-center py-12">Caricamento progetto...</p>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button className="btn-ghost" onClick={() => setActiveView('dashboard')} data-testid="back-to-dashboard">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold gradient-text" data-testid="project-title">{project.name}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{project.sector} | {contents.length} contenuti</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} data-testid={`tab-${t.id}`} className={`preset-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {tab === 'calendar' && (
        <div className="calendar-container">
          <div className="calendar-grid">
            {days.map(d => <div key={d} className="calendar-header">{d}</div>)}
            {Array.from({ length: 35 }, (_, i) => {
              const dayNum = i - 5 + 1;
              const dayContents = contents.filter(c => (c.day_offset || 0) === dayNum - 1);
              const isMonth = dayNum > 0 && dayNum <= 31;
              return (
                <div key={i} className={`calendar-cell ${!isMonth ? 'opacity-30' : ''}`}>
                  {isMonth && (
                    <>
                      <span className="text-sm font-medium text-[var(--text-secondary)]">{dayNum}</span>
                      {dayContents.map(c => (
                        <div key={c.id} className={`content-chip ${c.format}`} onClick={() => openContentDetail(c)}>
                          {c.format === 'reel' ? <Video size={10} /> : <Image size={10} />}
                          <span className="ml-1 truncate">{(c.hook_text || '').slice(0, 25)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {tab === 'list' && (
        <div className="space-y-3">
          {contents.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hook-item cursor-pointer" onClick={() => openContentDetail(c)}>
              <div className="w-14 text-center"><span className="text-xs font-semibold text-[var(--text-muted)]">G{(c.day_offset || 0) + 1}</span></div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">{c.hook_text}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{(c.caption || '').slice(0, 80)}...</p>
              </div>
              <span className={`badge ${c.format === 'reel' ? 'pink' : 'blue'}`}>{c.format}</span>
              <Eye size={16} className="text-[var(--text-muted)]" />
            </motion.div>
          ))}
          {contents.length === 0 && <p className="text-center text-[var(--text-muted)] py-8">Nessun contenuto generato.</p>}
        </div>
      )}

      {/* Personas */}
      {tab === 'personas' && (
        <div className="personas-grid">
          {personas.map((p, i) => (
            <div key={i} className="card persona-card">
              <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">{p.role}</p>
              {p.pain_points && (
                <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(236,72,153,0.1)' }}>
                  {(Array.isArray(p.pain_points) ? p.pain_points : [p.pain_points]).map((pp, j) => (
                    <p key={j} className="text-sm mt-1">- {pp}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ToV */}
      {tab === 'tov' && (
        <div className="card max-w-xl">
          <h3 className="font-semibold mb-4">Tono di Voce</h3>
          {['formality', 'energy', 'empathy', 'humor', 'storytelling'].map(k => (
            <div key={k} className="flex justify-between items-center py-2 border-b border-[var(--border-color)]">
              <span className="text-sm capitalize">{k}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]" style={{ width: `${(tov[k] || 5) * 10}%` }} />
                </div>
                <span className="text-sm font-semibold w-6 text-right">{tov[k] || 5}</span>
              </div>
            </div>
          ))}
          {tov.custom_instructions && (
            <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Istruzioni</p>
              <p>{tov.custom_instructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Social Section */}
      <div className="mt-8">
        <h3 className="font-semibold mb-4">Social Collegati</h3>
        <div className="flex gap-3">
          {[
            { Icon: InstagramLogo, color: '#E4405F' },
            { Icon: LinkedinLogo, color: '#0A66C2' },
            { Icon: FacebookLogo, color: '#1877F2' },
            { Icon: TiktokLogo, color: '#ffffff' },
            { Icon: PinterestLogo, color: '#E60023' },
          ].map(({ Icon, color }, i) => (
            <div key={i} className="social-icon-btn"><Icon weight="fill" size={24} color={color} /></div>
          ))}
          <div className="social-icon-btn" style={{ borderStyle: 'dashed' }}><Plus size={24} className="text-[var(--text-muted)]" /></div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">Collegamento social disponibile nella prossima versione.</p>
      </div>

      {/* Content Detail Modal */}
      <AnimatePresence>
        {selectedContent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setSelectedContent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className={`badge ${selectedContent.format === 'reel' ? 'pink' : 'blue'} mb-2`}>{selectedContent.format}</span>
                  <h3 className="font-semibold text-lg">{selectedContent.hook_text}</h3>
                </div>
                <button onClick={() => setSelectedContent(null)} className="btn-ghost p-2"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Script</label>
                  <textarea className="input-dark" rows={6} value={editScript} onChange={e => setEditScript(e.target.value)} style={{ paddingLeft: '1rem' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Caption</label>
                  <textarea className="input-dark" rows={4} value={editCaption} onChange={e => setEditCaption(e.target.value)} style={{ paddingLeft: '1rem' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Hashtags</label>
                  <input className="input-dark" value={editHashtags} onChange={e => setEditHashtags(e.target.value)} style={{ paddingLeft: '1rem' }} />
                </div>
                <div className="flex gap-3 justify-end">
                  <button className="btn-ghost" onClick={() => setSelectedContent(null)}>Annulla</button>
                  <button className="btn-gradient" onClick={saveContent} data-testid="save-content-btn">Salva Modifiche</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
