import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarBlank, List, Users as UsersIcon, Palette, Video, Image, PencilSimple, X,
  Plus, ArrowLeft, InstagramLogo, LinkedinLogo, FacebookLogo, TiktokLogo, PinterestLogo,
  Eye, Sparkle, Link as LinkIcon, Trash, Warning, WifiHigh, Globe
} from '@phosphor-icons/react';

const TABS = [
  { id: 'calendar', label: 'Calendario', icon: CalendarBlank },
  { id: 'list', label: 'Tutti', icon: List },
  { id: 'personas', label: 'Personas', icon: UsersIcon },
  { id: 'tov', label: 'Tono', icon: Palette },
  { id: 'social', label: 'Social', icon: Globe },
];

const PLATFORM_ICONS = {
  instagram: { Icon: InstagramLogo, color: '#E4405F' },
  facebook: { Icon: FacebookLogo, color: '#1877F2' },
  linkedin: { Icon: LinkedinLogo, color: '#0A66C2' },
  tiktok: { Icon: TiktokLogo, color: '#ffffff' },
  pinterest: { Icon: PinterestLogo, color: '#E60023' },
};

export default function ProjectView({ project, setActiveView }) {
  const { api } = useAuth();
  const [tab, setTab] = useState('calendar');
  const [contents, setContents] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [tov, setTov] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [editScript, setEditScript] = useState('');
  const [editHashtags, setEditHashtags] = useState('');

  // New Post modal
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostHook, setNewPostHook] = useState('');
  const [newPostFormat, setNewPostFormat] = useState('reel');
  const [newPostUseAi, setNewPostUseAi] = useState(false);
  const [newPostLoading, setNewPostLoading] = useState(false);

  // Social
  const [platforms, setPlatforms] = useState([]);
  const [socialProfiles, setSocialProfiles] = useState([]);
  const [projectSocials, setProjectSocials] = useState([]);
  const [showAddManual, setShowAddManual] = useState(null);
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    if (!project?.id) return;
    Promise.all([
      api.get(`/contents/${project.id}`).then(r => setContents(r.data)).catch(() => {}),
      api.get(`/personas/${project.id}`).then(r => setPersonas(r.data)).catch(() => {}),
      api.get(`/tov/${project.id}`).then(r => setTov(r.data || {})).catch(() => {}),
      api.get('/social/platforms').then(r => setPlatforms(r.data)).catch(() => {}),
      api.get('/social/profiles').then(r => setSocialProfiles(r.data)).catch(() => {}),
      api.get(`/social/project/${project.id}`).then(r => setProjectSocials(r.data)).catch(() => {}),
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

  const deleteContent = async (id) => {
    if (!window.confirm('Eliminare questo contenuto?')) return;
    await api.delete(`/contents/${id}`);
    setContents(prev => prev.filter(c => c.id !== id));
    setSelectedContent(null);
  };

  // New Post
  const createNewPost = async () => {
    if (!newPostHook.trim()) return;
    setNewPostLoading(true);
    try {
      const { data } = await api.post('/content/create-post', {
        project_id: project.id,
        hook_text: newPostHook,
        format: newPostFormat,
        use_ai: newPostUseAi
      });
      setContents(prev => [...prev, data]);
      setShowNewPost(false);
      setNewPostHook('');
      setNewPostFormat('reel');
      setNewPostUseAi(false);
      if (data.caption || data.script) openContentDetail(data);
    } catch (e) {
      alert('Errore: ' + (e.response?.data?.detail || e.message));
    } finally {
      setNewPostLoading(false);
    }
  };

  // Social
  const connectSocial = (platform) => {
    if (platform.auth_url) {
      window.open(platform.auth_url, '_blank', 'width=600,height=700');
    }
  };

  const addManualProfile = async (platformId) => {
    if (!manualName.trim()) return;
    try {
      const { data } = await api.post('/social/profiles', {
        platform: platformId,
        profile_name: manualName,
        connection_mode: 'manual'
      });
      setSocialProfiles(prev => [...prev, data]);
      setShowAddManual(null);
      setManualName('');
    } catch (e) {
      alert('Errore');
    }
  };

  const removeSocialProfile = async (id) => {
    await api.delete(`/social/profiles/${id}`);
    setSocialProfiles(prev => prev.filter(p => p.id !== id));
  };

  const toggleProjectLink = async (profileId) => {
    const isLinked = projectSocials.some(p => p.id === profileId);
    let newIds;
    if (isLinked) {
      newIds = projectSocials.filter(p => p.id !== profileId).map(p => p.id);
    } else {
      newIds = [...projectSocials.map(p => p.id), profileId];
    }
    await api.post('/social/project/link', { project_id: project.id, social_profile_ids: newIds });
    const { data } = await api.get(`/social/project/${project.id}`);
    setProjectSocials(data);
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
        <button data-testid="new-post-btn" className="btn-gradient" onClick={() => setShowNewPost(true)}>
          <Plus weight="bold" size={18} /> Nuovo Post
        </button>
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
          {contents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)] mb-4">Nessun contenuto generato.</p>
              <button className="btn-gradient" onClick={() => setShowNewPost(true)}><Plus size={16} /> Crea il primo post</button>
            </div>
          )}
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
                  {(Array.isArray(p.pain_points) ? p.pain_points : [p.pain_points]).map((pp, j) => <p key={j} className="text-sm mt-1">- {pp}</p>)}
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

      {/* Social Tab */}
      {tab === 'social' && (
        <div className="max-w-3xl">
          <h3 className="font-semibold mb-2">Piattaforme disponibili</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Collega i tuoi profili social. L'OAuth richiede il dominio <strong>sketchario.app</strong> per i callback.
          </p>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {platforms.map(platform => {
              const pi = PLATFORM_ICONS[platform.id] || { Icon: Globe, color: '#fff' };
              const connected = socialProfiles.filter(p => p.platform === platform.id);
              return (
                <div key={platform.id} className="card" data-testid={`social-platform-${platform.id}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="social-icon-btn" style={{ width: 44, height: 44 }}>
                      <pi.Icon weight="fill" size={22} color={pi.color} />
                    </div>
                    <div>
                      <p className="font-semibold">{platform.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{connected.length} profili collegati</p>
                    </div>
                  </div>

                  {/* Connected profiles */}
                  {connected.map(prof => (
                    <div key={prof.id} className="flex items-center justify-between py-2 px-3 rounded-lg mb-2" style={{ background: 'rgba(34,197,94,0.1)' }}>
                      <div className="flex items-center gap-2">
                        <WifiHigh size={14} color="var(--accent-green)" />
                        <span className="text-sm font-medium">{prof.profile_name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-[var(--text-muted)] hover:text-white"
                          onClick={() => toggleProjectLink(prof.id)}
                        >
                          {projectSocials.some(p => p.id === prof.id) ?
                            <span className="badge green text-[10px]">Collegato</span> :
                            <span className="badge orange text-[10px]">Collega</span>
                          }
                        </button>
                        <button className="text-[var(--accent-pink)] hover:opacity-80" onClick={() => removeSocialProfile(prof.id)}>
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {platform.configured && (
                      <button className="btn-ghost text-xs py-1.5 px-3 flex-1" onClick={() => connectSocial(platform)}>
                        <LinkIcon size={14} /> OAuth
                      </button>
                    )}
                    <button
                      className="btn-ghost text-xs py-1.5 px-3 flex-1"
                      onClick={() => { setShowAddManual(platform.id); setManualName(''); }}
                    >
                      <Plus size={14} /> Manuale
                    </button>
                  </div>

                  {/* Manual add form */}
                  {showAddManual === platform.id && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                      <input
                        className="input-dark text-sm py-2 mb-2"
                        placeholder="Nome profilo (es. @mio_brand)"
                        value={manualName}
                        onChange={e => setManualName(e.target.value)}
                        style={{ paddingLeft: '0.75rem' }}
                      />
                      <div className="flex gap-2">
                        <button className="btn-ghost text-xs py-1.5 flex-1" onClick={() => setShowAddManual(null)}>Annulla</button>
                        <button className="btn-gradient text-xs py-1.5 flex-1" onClick={() => addManualProfile(platform.id)}>Aggiungi</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Project linked socials summary */}
          {projectSocials.length > 0 && (
            <div className="card">
              <h4 className="font-semibold mb-3">Social collegati a questo progetto</h4>
              <div className="flex gap-3 flex-wrap">
                {projectSocials.map(prof => {
                  const pi = PLATFORM_ICONS[prof.platform] || { Icon: Globe, color: '#fff' };
                  return (
                    <div key={prof.id} className="flex items-center gap-2 py-2 px-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)' }}>
                      <pi.Icon weight="fill" size={16} color={pi.color} />
                      <span className="text-sm">{prof.profile_name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NEW POST MODAL ── */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => !newPostLoading && setShowNewPost(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Nuovo Post</h3>
                <button onClick={() => setShowNewPost(false)} className="btn-ghost p-2" disabled={newPostLoading}><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Idea / Hook del post *</label>
                  <textarea
                    data-testid="new-post-hook"
                    className="input-dark"
                    rows={3}
                    placeholder="Es. 3 errori che fanno tutti i fotografi alle prime armi"
                    value={newPostHook}
                    onChange={e => setNewPostHook(e.target.value)}
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Formato</label>
                  <div className="flex gap-2">
                    <button
                      className={`preset-btn flex-1 ${newPostFormat === 'reel' ? 'active' : ''}`}
                      onClick={() => setNewPostFormat('reel')}
                    >
                      <Video size={16} /> Reel
                    </button>
                    <button
                      className={`preset-btn flex-1 ${newPostFormat === 'carousel' ? 'active' : ''}`}
                      onClick={() => setNewPostFormat('carousel')}
                    >
                      <Image size={16} /> Carousel
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Modalita</label>
                  <div className="flex gap-2">
                    <button
                      data-testid="new-post-mode-manual"
                      className={`preset-btn flex-1 ${!newPostUseAi ? 'active' : ''}`}
                      onClick={() => setNewPostUseAi(false)}
                    >
                      <PencilSimple size={16} /> Da zero
                    </button>
                    <button
                      data-testid="new-post-mode-ai"
                      className={`preset-btn flex-1 ${newPostUseAi ? 'active' : ''}`}
                      onClick={() => setNewPostUseAi(true)}
                    >
                      <Sparkle size={16} /> Con AI
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    {newPostUseAi ? "L'AI generera script, caption e hashtag basati sul tuo hook e ToV." : "Creerai un post vuoto da compilare manualmente."}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="btn-ghost flex-1" onClick={() => setShowNewPost(false)} disabled={newPostLoading}>Annulla</button>
                  <button
                    data-testid="create-post-btn"
                    className="btn-gradient flex-1"
                    onClick={createNewPost}
                    disabled={newPostLoading || !newPostHook.trim()}
                  >
                    {newPostLoading ? 'Creazione...' : newPostUseAi ? 'Genera con AI' : 'Crea Post'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT DETAIL MODAL ── */}
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
                <div className="flex gap-2">
                  <button onClick={() => deleteContent(selectedContent.id)} className="btn-ghost p-2" style={{ borderColor: 'var(--accent-pink)' }}>
                    <Trash size={18} color="var(--accent-pink)" />
                  </button>
                  <button onClick={() => setSelectedContent(null)} className="btn-ghost p-2"><X size={20} /></button>
                </div>
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
