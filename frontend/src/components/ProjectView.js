import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarBlank, List, Users as UsersIcon, Palette, Video, Image, PencilSimple, X,
  Plus, ArrowLeft, InstagramLogo, LinkedinLogo, FacebookLogo, TiktokLogo, PinterestLogo,
  Eye, Sparkle, Link as LinkIcon, Trash, WifiHigh, Globe,
  RssSimple, Queue, Clock, CheckCircle, XCircle, ArrowClockwise, PaperPlaneTilt,
  BookOpen, Download, CanvaLogo, ChartBar
} from '@phosphor-icons/react';
import Analytics from './Analytics';
import TeamPanel from './TeamPanel';

const TABS = [
  { id: 'calendar', label: 'Calendario', icon: CalendarBlank },
  { id: 'list', label: 'Tutti', icon: List },
  { id: 'analytics', label: 'Analytics', icon: ChartBar },
  { id: 'feed', label: 'Feed', icon: RssSimple },
  { id: 'queue', label: 'Queue', icon: Queue },
  { id: 'personas', label: 'Personas', icon: UsersIcon },
  { id: 'tov', label: 'Tono', icon: Palette },
  { id: 'tov-library', label: 'ToV Library', icon: BookOpen },
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

  // Feed
  const [feeds, setFeeds] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedName, setNewFeedName] = useState('');
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedGenLoading, setFeedGenLoading] = useState(null);

  // Publish Queue
  const [queueItems, setQueueItems] = useState([]);
  const [showSchedule, setShowSchedule] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [scheduleProfiles, setScheduleProfiles] = useState([]);
  const [queueFilter, setQueueFilter] = useState('all');

  // ToV Library
  const [tovLibrary, setTovLibrary] = useState([]);
  const [showTovSave, setShowTovSave] = useState(false);
  const [tovSaveName, setTovSaveName] = useState('');

  // Plan limits
  const [planLimits, setPlanLimits] = useState(null);

  useEffect(() => {
    if (!project?.id) return;
    Promise.all([
      api.get(`/contents/${project.id}`).then(r => setContents(r.data)).catch(() => {}),
      api.get(`/personas/${project.id}`).then(r => setPersonas(r.data)).catch(() => {}),
      api.get(`/tov/${project.id}`).then(r => setTov(r.data || {})).catch(() => {}),
      api.get('/social/platforms').then(r => setPlatforms(r.data)).catch(() => {}),
      api.get('/social/profiles').then(r => setSocialProfiles(r.data)).catch(() => {}),
      api.get(`/social/project/${project.id}`).then(r => setProjectSocials(r.data)).catch(() => {}),
      api.get(`/feeds/${project.id}`).then(r => setFeeds(r.data)).catch(() => {}),
      api.get(`/feeds/${project.id}/items`).then(r => setFeedItems(r.data)).catch(() => {}),
      api.get(`/publish/queue/${project.id}`).then(r => setQueueItems(r.data)).catch(() => {}),
      api.get('/tov-library').then(r => setTovLibrary(r.data)).catch(() => {}),
      api.get('/plan/limits').then(r => setPlanLimits(r.data)).catch(() => {}),
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

  // Feed functions
  const addFeed = async () => {
    if (!newFeedUrl.trim()) return;
    setFeedLoading(true);
    try {
      const { data } = await api.post('/feeds/add', { project_id: project.id, feed_url: newFeedUrl, feed_name: newFeedName || newFeedUrl });
      setFeeds(prev => [...prev, data]);
      setNewFeedUrl(''); setNewFeedName('');
      const { data: items } = await api.get(`/feeds/${project.id}/items`);
      setFeedItems(items);
    } catch (e) { alert('Errore aggiunta feed'); }
    finally { setFeedLoading(false); }
  };

  const refreshFeeds = async () => {
    setFeedLoading(true);
    try {
      await api.post(`/feeds/refresh/${project.id}`);
      const { data } = await api.get(`/feeds/${project.id}/items`);
      setFeedItems(data);
    } catch {}
    finally { setFeedLoading(false); }
  };

  const removeFeed = async (id) => {
    await api.delete(`/feeds/${id}`);
    setFeeds(prev => prev.filter(f => f.id !== id));
    setFeedItems(prev => prev.filter(i => i.feed_id !== id));
  };

  const generateFromFeed = async (item) => {
    setFeedGenLoading(item.id);
    try {
      const { data } = await api.post('/feeds/generate-content', { project_id: project.id, feed_item_title: item.title, feed_item_summary: item.summary });
      setContents(prev => [...prev, data]);
      openContentDetail(data);
    } catch (e) { alert('Errore generazione: ' + (e.response?.data?.detail || e.message)); }
    finally { setFeedGenLoading(null); }
  };

  // Queue functions
  const scheduleContent = async (contentId) => {
    if (!scheduleDate || scheduleProfiles.length === 0) { alert('Seleziona data e almeno un profilo social'); return; }
    try {
      const scheduledAt = `${scheduleDate}T${scheduleTime}:00Z`;
      const { data } = await api.post('/publish/schedule', { content_id: contentId, project_id: project.id, social_profile_ids: scheduleProfiles, scheduled_at: scheduledAt });
      setQueueItems(prev => [...prev, ...data.items]);
      setShowSchedule(null); setScheduleDate(''); setScheduleProfiles([]);
      const updatedContents = await api.get(`/contents/${project.id}`);
      setContents(updatedContents.data);
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
  };

  const cancelQueueItem = async (id) => {
    await api.delete(`/publish/queue/${id}`);
    setQueueItems(prev => prev.filter(q => q.id !== id));
  };

  const filteredQueue = queueFilter === 'all' ? queueItems : queueItems.filter(q => q.status === queueFilter);

  // ToV Library functions
  const saveToTovLibrary = async () => {
    if (!tovSaveName.trim() || !tov) return;
    const { data } = await api.post('/tov-library', { name: tovSaveName, ...tov });
    setTovLibrary(prev => [...prev, data]);
    setShowTovSave(false); setTovSaveName('');
  };

  const applyTovTemplate = async (itemId) => {
    await api.post(`/tov-library/${itemId}/apply/${project.id}`);
    const { data } = await api.get(`/tov/${project.id}`);
    setTov(data || {});
  };

  const deleteTovItem = async (id) => {
    await api.delete(`/tov-library/${id}`);
    setTovLibrary(prev => prev.filter(t => t.id !== id));
  };

  const exportCSV = () => {
    window.open(`${process.env.REACT_APP_BACKEND_URL}/api/export/${project.id}/csv`, '_blank');
  };

  const openCanva = async () => {
    try {
      const { data } = await api.get('/canva/auth-url');
      if (data.auth_url) window.open(data.auth_url, '_blank', 'width=800,height=600');
    } catch (e) { alert('Canva non disponibile'); }
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
        <button className="btn-ghost" onClick={exportCSV} data-testid="export-csv-btn">
          <Download size={18} /> CSV
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
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hook-item cursor-pointer">
              <div className="w-14 text-center"><span className="text-xs font-semibold text-[var(--text-muted)]">G{(c.day_offset || 0) + 1}</span></div>
              <div className="flex-1" onClick={() => openContentDetail(c)}>
                <p className="text-sm font-medium mb-1">{c.hook_text}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{(c.caption || '').slice(0, 80)}...</p>
              </div>
              <span className={`badge ${c.format === 'reel' ? 'pink' : 'blue'}`}>{c.format}</span>
              <span className={`badge ${c.status === 'published' ? 'green' : c.status === 'scheduled' ? 'orange' : 'purple'}`}>{c.status || 'draft'}</span>
              <button className="btn-ghost p-1.5 text-xs" onClick={() => { setShowSchedule(c); setScheduleProfiles([]); }}><PaperPlaneTilt size={14} /></button>
              <button className="btn-ghost p-1.5" onClick={() => openContentDetail(c)}><Eye size={14} /></button>
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

      {/* Analytics Tab */}
      {tab === 'analytics' && <Analytics project={project} />}

      {/* Feed Tab */}
      {tab === 'feed' && (
        <div className="max-w-3xl">
          <h3 className="font-semibold mb-2">Feeding Bar</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">Aggiungi feed RSS per ispirarti e generare contenuti.</p>

          {/* Add Feed */}
          <div className="card mb-6">
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">URL Feed RSS</label>
                <input className="input-dark text-sm py-2" placeholder="https://example.com/feed.xml" value={newFeedUrl} onChange={e => setNewFeedUrl(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nome</label>
                <input className="input-dark text-sm py-2" placeholder="Nome feed" value={newFeedName} onChange={e => setNewFeedName(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
              </div>
              <button className="btn-gradient text-sm py-2" onClick={addFeed} disabled={feedLoading} data-testid="add-feed-btn">
                <Plus size={16} /> Aggiungi
              </button>
            </div>
          </div>

          {/* Active Feeds */}
          {feeds.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {feeds.map(f => (
                <div key={f.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <RssSimple size={14} />
                  <span className="text-sm">{f.feed_name}</span>
                  <button onClick={() => removeFeed(f.id)} className="text-[var(--accent-pink)] hover:opacity-80"><X size={12} /></button>
                </div>
              ))}
              <button className="btn-ghost text-xs py-1.5" onClick={refreshFeeds} disabled={feedLoading}>
                <ArrowClockwise size={14} className={feedLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          )}

          {/* Feed Items */}
          {feedItems.length > 0 ? (
            <div className="space-y-3">
              {feedItems.map(item => (
                <div key={item.id} className="card" data-testid={`feed-item-${item.id}`}>
                  <div className="flex gap-4">
                    {item.image && (
                      <img src={item.image} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" onError={e => e.target.style.display = 'none'} />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">{item.summary?.replace(/<[^>]*>/g, '').slice(0, 150)}</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-[var(--text-muted)]">{item.feed_name}</span>
                        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--gradient-start)] hover:underline">Leggi</a>}
                      </div>
                    </div>
                    <button
                      className="btn-gradient text-xs py-1.5 px-3 self-start flex-shrink-0"
                      onClick={() => generateFromFeed(item)}
                      disabled={feedGenLoading === item.id}
                    >
                      {feedGenLoading === item.id ? '...' : <><Sparkle size={14} /> Genera</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : feeds.length > 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8">Nessun articolo trovato. Prova a refreshare.</p>
          ) : (
            <p className="text-center text-[var(--text-muted)] py-8">Aggiungi un feed RSS per iniziare.</p>
          )}
        </div>
      )}

      {/* Queue Tab */}
      {tab === 'queue' && (
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Publishing Queue</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">{queueItems.length} elementi in coda</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'queued', 'processing', 'published', 'failed'].map(f => (
              <button key={f} className={`preset-btn text-xs ${queueFilter === f ? 'active' : ''}`} onClick={() => setQueueFilter(f)}>
                {f === 'all' ? 'Tutti' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && <span className="ml-1 opacity-60">({queueItems.filter(q => q.status === f).length})</span>}
              </button>
            ))}
          </div>

          {/* Queue Items */}
          {filteredQueue.length > 0 ? (
            <div className="space-y-3">
              {filteredQueue.map(item => {
                const pi = PLATFORM_ICONS[item.platform] || { Icon: Globe, color: '#fff' };
                const content = contents.find(c => c.id === item.content_id);
                return (
                  <div key={item.id} className="hook-item" data-testid={`queue-item-${item.id}`}>
                    <div className="social-icon-btn" style={{ width: 36, height: 36, flexShrink: 0 }}>
                      <pi.Icon weight="fill" size={18} color={pi.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{content?.hook_text || 'Contenuto'}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {item.profile_name} | {new Date(item.scheduled_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`badge ${
                      item.status === 'queued' ? 'blue' :
                      item.status === 'published' ? 'green' :
                      item.status === 'failed' ? 'pink' : 'orange'
                    }`}>
                      {item.status === 'queued' && <Clock size={12} />}
                      {item.status === 'published' && <CheckCircle size={12} />}
                      {item.status === 'failed' && <XCircle size={12} />}
                      <span className="ml-1">{item.status}</span>
                    </span>
                    {item.status === 'queued' && (
                      <button className="btn-ghost p-1.5 text-xs" onClick={() => cancelQueueItem(item.id)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Queue size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
              <p className="text-[var(--text-muted)] mb-2">Nessun elemento in coda</p>
              <p className="text-xs text-[var(--text-muted)]">Vai alla lista contenuti e clicca l'icona di invio per programmare la pubblicazione.</p>
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

      {/* ToV Library Tab */}
      {tab === 'tov-library' && (
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Libreria Tono di Voce</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Template personali riutilizzabili tra progetti.</p>
            </div>
            <button className="btn-gradient text-sm" onClick={() => setShowTovSave(true)} data-testid="save-tov-template-btn">
              <Plus size={16} /> Salva ToV attuale
            </button>
          </div>

          {showTovSave && (
            <div className="card mb-6">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nome template</label>
                  <input className="input-dark text-sm py-2" placeholder="Es. Professionale Standard" value={tovSaveName} onChange={e => setTovSaveName(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
                </div>
                <button className="btn-gradient text-sm py-2" onClick={saveToTovLibrary}>Salva</button>
                <button className="btn-ghost text-sm py-2" onClick={() => setShowTovSave(false)}>Annulla</button>
              </div>
            </div>
          )}

          {tovLibrary.length > 0 ? (
            <div className="space-y-3">
              {tovLibrary.map(item => (
                <div key={item.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{item.name}</h4>
                    <div className="flex gap-2">
                      <button className="btn-gradient text-xs py-1.5 px-3" onClick={() => applyTovTemplate(item.id)}>
                        Applica al progetto
                      </button>
                      <button className="btn-ghost p-1.5" onClick={() => deleteTovItem(item.id)}><Trash size={14} /></button>
                    </div>
                  </div>
                  <div className="flex gap-4 flex-wrap text-sm text-[var(--text-secondary)]">
                    <span>Formalita: {item.formality}</span>
                    <span>Energia: {item.energy}</span>
                    <span>Empatia: {item.empathy}</span>
                    <span>Humor: {item.humor}</span>
                    <span>Story: {item.storytelling}</span>
                  </div>
                  {item.custom_instructions && <p className="text-xs text-[var(--text-muted)] mt-2">{item.custom_instructions}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
              <p className="text-[var(--text-muted)] mb-2">Nessun template salvato</p>
              <p className="text-xs text-[var(--text-muted)]">Configura il Tono di Voce nel tab "Tono", poi salvalo qui come template riutilizzabile.</p>
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

          {/* Team Collaboration */}
          <div className="card mt-6">
            <TeamPanel projectId={project.id} />
          </div>
        </div>
      )}

      {/* ── SCHEDULE MODAL ── */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowSchedule(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="card w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Programma Pubblicazione</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4 truncate">{showSchedule.hook_text}</p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Data</label>
                    <input type="date" className="input-dark text-sm py-2" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
                  </div>
                  <div className="w-28">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ora</label>
                    <input type="time" className="input-dark text-sm py-2" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Profili social</label>
                  {socialProfiles.length > 0 ? (
                    <div className="space-y-2">
                      {socialProfiles.map(sp => {
                        const pi = PLATFORM_ICONS[sp.platform] || { Icon: Globe, color: '#fff' };
                        const isSelected = scheduleProfiles.includes(sp.id);
                        return (
                          <div
                            key={sp.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border ${isSelected ? 'border-[var(--gradient-start)]' : 'border-[var(--border-color)]'}`}
                            style={isSelected ? { background: 'rgba(99,102,241,0.1)' } : {}}
                            onClick={() => setScheduleProfiles(prev => isSelected ? prev.filter(id => id !== sp.id) : [...prev, sp.id])}
                          >
                            <pi.Icon weight="fill" size={20} color={pi.color} />
                            <span className="text-sm flex-1">{sp.profile_name}</span>
                            {isSelected && <CheckCircle size={18} color="var(--accent-green)" weight="fill" />}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">Nessun profilo social collegato. Vai al tab Social per aggiungerne.</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="btn-ghost flex-1" onClick={() => setShowSchedule(null)}>Annulla</button>
                  <button className="btn-gradient flex-1" onClick={() => scheduleContent(showSchedule.id)} data-testid="schedule-publish-btn" disabled={!scheduleDate || scheduleProfiles.length === 0}>
                    <PaperPlaneTilt size={16} /> Programma
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

                {/* Media Section */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Media</label>
                  {/* Existing media */}
                  {selectedContent.media && selectedContent.media.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {selectedContent.media.map(m => (
                        <div key={m.id} className="relative group">
                          {m.type === 'image' ? (
                            <img src={`${process.env.REACT_APP_BACKEND_URL}${m.url}`} alt="" className="w-20 h-20 object-cover rounded-lg" />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center"><Video size={24} /></div>
                          )}
                          <button
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-pink)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={async () => {
                              await api.delete(`/media/${selectedContent.id}/${m.id}`);
                              setSelectedContent(prev => ({...prev, media: prev.media.filter(x => x.id !== m.id)}));
                              setContents(prev => prev.map(c => c.id === selectedContent.id ? {...c, media: c.media.filter(x => x.id !== m.id)} : c));
                            }}
                          ><X size={10} color="white" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {/* Upload */}
                    <label className="btn-ghost text-xs py-1.5 px-3 cursor-pointer" data-testid="upload-media-btn">
                      <Plus size={14} /> Upload
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files[0]; if (!file) return;
                        const fd = new FormData(); fd.append('file', file);
                        try {
                          const { data } = await api.post(`/media/upload/${selectedContent.id}`, fd);
                          setSelectedContent(prev => ({...prev, media: [...(prev.media||[]), data]}));
                          setContents(prev => prev.map(c => c.id === selectedContent.id ? {...c, media: [...(c.media||[]), data]} : c));
                        } catch(err) { alert('Errore upload: ' + (err.response?.data?.detail || err.message)); }
                      }} />
                    </label>
                    {/* DALL-E */}
                    <button className="btn-ghost text-xs py-1.5 px-3" data-testid="dalle-generate-btn" onClick={async () => {
                      const prompt = window.prompt('Descrivi l\'immagine da generare:', selectedContent.hook_text);
                      if (!prompt) return;
                      try {
                        const { data } = await api.post('/media/generate-dalle', { content_id: selectedContent.id, prompt, project_id: project.id });
                        setSelectedContent(prev => ({...prev, media: [...(prev.media||[]), data]}));
                        setContents(prev => prev.map(c => c.id === selectedContent.id ? {...c, media: [...(c.media||[]), data]} : c));
                      } catch(err) { alert('Errore DALL-E: ' + (err.response?.data?.detail || err.message)); }
                    }}>
                      <Sparkle size={14} /> DALL-E
                    </button>
                    {/* Canva */}
                    <button className="btn-ghost text-xs py-1.5 px-3" onClick={openCanva} data-testid="canva-btn">
                      <Palette size={14} /> Canva
                    </button>
                    {/* Google Drive */}
                    <button className="btn-ghost text-xs py-1.5 px-3" onClick={async () => {
                      const url = window.prompt('URL diretto del file da Google Drive:');
                      if (!url) return;
                      try {
                        const { data } = await api.post('/media/import-drive', { content_id: selectedContent.id, file_url: url });
                        setSelectedContent(prev => ({...prev, media: [...(prev.media||[]), data]}));
                        setContents(prev => prev.map(c => c.id === selectedContent.id ? {...c, media: [...(c.media||[]), data]} : c));
                      } catch(err) { alert('Errore: ' + (err.response?.data?.detail || err.message)); }
                    }}>
                      <Download size={14} /> Drive
                    </button>
                    {/* Dropbox */}
                    <button className="btn-ghost text-xs py-1.5 px-3" onClick={async () => {
                      const url = window.prompt('URL diretto del file da Dropbox:');
                      if (!url) return;
                      try {
                        const { data } = await api.post('/media/import-cloud', { content_id: selectedContent.id, file_url: url, source: 'dropbox' });
                        setSelectedContent(prev => ({...prev, media: [...(prev.media||[]), data]}));
                        setContents(prev => prev.map(c => c.id === selectedContent.id ? {...c, media: [...(c.media||[]), data]} : c));
                      } catch(err) { alert('Errore: ' + (err.response?.data?.detail || err.message)); }
                    }}>
                      <Download size={14} /> Dropbox
                    </button>
                    {/* OneDrive */}
                    <button className="btn-ghost text-xs py-1.5 px-3" onClick={async () => {
                      const url = window.prompt('URL diretto del file da OneDrive:');
                      if (!url) return;
                      try {
                        const { data } = await api.post('/media/import-cloud', { content_id: selectedContent.id, file_url: url, source: 'onedrive' });
                        setSelectedContent(prev => ({...prev, media: [...(prev.media||[]), data]}));
                        setContents(prev => prev.map(c => c.id === selectedContent.id ? {...c, media: [...(c.media||[]), data]} : c));
                      } catch(err) { alert('Errore: ' + (err.response?.data?.detail || err.message)); }
                    }}>
                      <Download size={14} /> OneDrive
                    </button>
                    {/* PostNitro */}
                    <button className="btn-ghost text-xs py-1.5 px-3" data-testid="postnitro-btn" onClick={async () => {
                      try {
                        const { data: pnStatus } = await api.get('/postnitro/status');
                        if (!pnStatus.ready) {
                          const missing = pnStatus.missing_config?.join(', ') || 'configurazione';
                          alert(`PostNitro richiede configurazione:\n\nCampi mancanti: ${missing}\n\n1. Accedi a postnitro.ai/app/embed\n2. Copia Preset ID (e Template ID se disponibile)\n3. Inseriscili nel backend .env`);
                          return;
                        }
                        const mode = window.confirm('Generare carousel con AI dal contenuto?\n\nOK = AI automatico\nAnnulla = Importa slide manuali') ? 'ai' : 'import';
                        const { data } = await api.post('/postnitro/generate', { content_id: selectedContent.id, project_id: project.id, mode });
                        if (data.embed_post_id) {
                          alert(`Carousel in generazione! ID: ${data.embed_post_id}\nControlla lo stato tra qualche secondo.`);
                          const poll = async (attempts = 0) => {
                            if (attempts > 10) return;
                            try {
                              const { data: status } = await api.get(`/postnitro/status/${data.embed_post_id}`);
                              if (status.status === 'COMPLETED' || status.status === 'completed') {
                                const { data: output } = await api.get(`/postnitro/output/${data.embed_post_id}`);
                                if (output.slide_urls?.length) {
                                  const updatedContent = await api.get(`/contents/${project.id}`);
                                  const updated = updatedContent.data.find(c => c.id === selectedContent.id);
                                  if (updated) { setSelectedContent(updated); setContents(updatedContent.data); }
                                  alert(`Carousel completato! ${output.slide_urls.length} slide importate.`);
                                }
                              } else if (status.status !== 'error') {
                                setTimeout(() => poll(attempts + 1), 3000);
                              }
                            } catch {}
                          };
                          setTimeout(() => poll(), 3000);
                        }
                      } catch(err) { alert('Errore PostNitro: ' + (err.response?.data?.detail || err.message)); }
                    }}>
                      <Image size={14} /> PostNitro
                    </button>
                  </div>
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
