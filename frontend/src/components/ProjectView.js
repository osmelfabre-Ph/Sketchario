import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarBlank, Video, Image, PencilSimple, X,
  Plus, ArrowLeft, InstagramLogo, LinkedinLogo, FacebookLogo, TiktokLogo, PinterestLogo,
  Eye, Sparkle, Trash, Globe,
  RssSimple, Queue, Clock, CheckCircle, XCircle, ArrowClockwise, PaperPlaneTilt,
  BookOpen, Download, ChartBar, Article, DotsSixVertical, CaretDown, CaretUp
} from '@phosphor-icons/react';
import Analytics from './Analytics';
import TeamPanel from './TeamPanel';
import ContentDetail from './ContentDetail';

const PLATFORM_ICONS = {
  instagram: { Icon: InstagramLogo, color: '#E4405F', name: 'Instagram' },
  facebook: { Icon: FacebookLogo, color: '#1877F2', name: 'Facebook' },
  linkedin: { Icon: LinkedinLogo, color: '#0A66C2', name: 'LinkedIn' },
  tiktok: { Icon: TiktokLogo, color: '#ffffff', name: 'TikTok' },
  pinterest: { Icon: PinterestLogo, color: '#E60023', name: 'Pinterest' },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function ProjectView({ project, setActiveView, activeTab }) {
  const { api } = useAuth();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState(activeTab || 'list');
  const [contents, setContents] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [tov, setTov] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);

  // New Post
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostHook, setNewPostHook] = useState('');
  const [newPostFormat, setNewPostFormat] = useState('reel');
  const [newPostUseAi, setNewPostUseAi] = useState(false);
  const [newPostLoading, setNewPostLoading] = useState(false);

  // Social
  const [socialProfiles, setSocialProfiles] = useState([]);
  const [projectSocials, setProjectSocials] = useState([]);
  const [showAddManual, setShowAddManual] = useState(null);
  const [manualName, setManualName] = useState('');
  const [platforms, setPlatforms] = useState([]);

  // Feed
  const [feeds, setFeeds] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [aiFeedItems, setAiFeedItems] = useState([]);

  // Queue + Analytics
  const [queueItems, setQueueItems] = useState([]);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // ToV Library
  const [tovLibrary, setTovLibrary] = useState([]);
  const [showTovSave, setShowTovSave] = useState(false);
  const [tovSaveName, setTovSaveName] = useState('');

  // Drag state for calendar
  const [dragContent, setDragContent] = useState(null);

  useEffect(() => { if (activeTab) setTab(activeTab); }, [activeTab]);

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
      api.post(`/feeds/ai-suggestions/${project.id}`).then(r => setAiFeedItems(r.data || [])).catch(() => {}),
      api.get(`/publish/queue/${project.id}`).then(r => setQueueItems(r.data)).catch(() => {}),
      api.get('/tov-library').then(r => setTovLibrary(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [api, project?.id]);

  // Auto-refresh feeds every 10 min
  useEffect(() => {
    if (!project?.id || loading) return;
    const interval = setInterval(() => {
      api.post(`/feeds/refresh/${project.id}`).then(() => {
        api.get(`/feeds/${project.id}/items`).then(r => setFeedItems(r.data)).catch(() => {});
      }).catch(() => {});
      api.post(`/feeds/ai-suggestions/${project.id}/refresh`).then(r => setAiFeedItems(r.data || [])).catch(() => {});
    }, 600000);
    // Auto-add default feeds if none exist
    if (feeds.length === 0 && project.sector) {
      const searchTerm = encodeURIComponent(project.sector);
      const defaultFeeds = [
        { url: `https://news.google.com/rss/search?q=${searchTerm}&hl=it&gl=IT&ceid=IT:it`, name: `Google News: ${project.sector}` },
        { url: `https://www.reddit.com/search.rss?q=${searchTerm}&sort=new&limit=10`, name: `Reddit: ${project.sector}` },
      ];
      Promise.all(defaultFeeds.map(f =>
        api.post('/feeds/add', { project_id: project.id, feed_url: f.url, feed_name: f.name }).catch(() => null)
      )).then(results => {
        const added = results.filter(Boolean);
        if (added.length > 0) {
          setFeeds(prev => [...prev, ...added.map(r => r.data)]);
          api.get(`/feeds/${project.id}/items`).then(r => setFeedItems(r.data)).catch(() => {});
        }
      });
    }
    return () => clearInterval(interval);
  }, [project?.id, loading]);

  const openContentDetail = (c) => setSelectedContent(c);
  const handleContentUpdate = (updated) => setContents(prev => prev.map(c => c.id === updated.id ? updated : c));

  const deleteContent = async (id) => {
    if (!window.confirm('Eliminare?')) return;
    await api.delete(`/contents/${id}`);
    setContents(prev => prev.filter(c => c.id !== id));
  };

  const createNewPost = async () => {
    if (!newPostHook.trim()) return;
    setNewPostLoading(true);
    try {
      const { data } = await api.post('/content/create-post', { project_id: project.id, hook_text: newPostHook, format: newPostFormat, use_ai: newPostUseAi });
      setContents(prev => [...prev, data]);
      setShowNewPost(false); setNewPostHook('');
      if (data.caption || data.script) openContentDetail(data);
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
    finally { setNewPostLoading(false); }
  };

  const feedToPost = async (item) => {
    setFeedLoading(true);
    try {
      const { data } = await api.post('/feeds/generate-content', { project_id: project.id, feed_item_title: item.title, feed_item_summary: item.summary });
      setContents(prev => [...prev, data]);
      openContentDetail(data);
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
    finally { setFeedLoading(false); }
  };

  const handleDrop = async (dayOffset, e) => {
    e.preventDefault();
    if (!dragContent) return;
    await api.put(`/contents/${dragContent.id}`, { ...dragContent, day_offset: dayOffset });
    setContents(prev => prev.map(c => c.id === dragContent.id ? { ...c, day_offset: dayOffset } : c));
    setDragContent(null);
  };

  const connectSocial = (platform) => { if (platform.auth_url) window.open(platform.auth_url, '_blank', 'width=600,height=700'); };
  const addManualProfile = async (platformId) => {
    if (!manualName.trim()) return;
    const { data } = await api.post('/social/profiles', { platform: platformId, profile_name: manualName, connection_mode: 'manual' });
    setSocialProfiles(prev => [...prev, data]); setShowAddManual(null); setManualName('');
  };
  const removeSocialProfile = async (id) => { await api.delete(`/social/profiles/${id}`); setSocialProfiles(prev => prev.filter(p => p.id !== id)); };
  const toggleProjectLink = async (profileId) => {
    const isLinked = projectSocials.some(p => p.id === profileId);
    const newIds = isLinked ? projectSocials.filter(p => p.id !== profileId).map(p => p.id) : [...projectSocials.map(p => p.id), profileId];
    await api.post('/social/project/link', { project_id: project.id, social_profile_ids: newIds });
    const { data } = await api.get(`/social/project/${project.id}`);
    setProjectSocials(data);
  };

  const saveToTovLibrary = async () => {
    if (!tovSaveName.trim()) return;
    const { data } = await api.post('/tov-library', { name: tovSaveName, ...tov });
    setTovLibrary(prev => [...prev, data]); setShowTovSave(false); setTovSaveName('');
  };
  const applyTovTemplate = async (itemId) => {
    await api.post(`/tov-library/${itemId}/apply/${project.id}`);
    const { data } = await api.get(`/tov/${project.id}`);
    setTov(data || {});
  };

  const cancelQueueItem = async (id) => {
    await api.delete(`/publish/queue/${id}`);
    setQueueItems(prev => prev.filter(q => q.id !== id));
  };

  const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  if (loading) return <p className="text-[var(--text-muted)] text-center py-12">Caricamento progetto...</p>;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]" style={{ paddingBottom: isMobile ? 56 : 0 }}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[var(--border-color)] flex-shrink-0 ${isMobile ? 'flex-wrap' : ''}`}>
        <button className="btn-ghost p-1.5" onClick={() => setActiveView('dashboard')} data-testid="back-to-dashboard"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-bold gradient-text truncate" data-testid="project-title">{project.name}</h1>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)]">{project.sector} | {contents.length} contenuti</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button data-testid="new-post-btn" className="btn-gradient text-xs md:text-sm" onClick={() => setShowNewPost(true)}>
            <Plus weight="bold" size={14} /> <span className="hidden sm:inline">Nuovo</span> Post
          </button>
          <button className="btn-ghost text-xs md:text-sm" onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}/api/export/${project.id}/csv`, '_blank')} data-testid="export-csv-btn">
            <Download size={14} /> <span className="hidden sm:inline">CSV</span>
          </button>
          {isMobile && (
            <button className="btn-ghost text-xs p-1.5" onClick={() => setShowRightPanel(!showRightPanel)} data-testid="toggle-right-panel">
              <ChartBar size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Center: Tab Content + Feed Strip */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Buttons */}
          <div className="flex gap-1 px-4 md:px-6 pt-3 pb-2 flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'list', label: 'Contenuti' },
              { id: 'calendar', label: 'Calendario' },
              { id: 'personas', label: 'Personas' },
              { id: 'social', label: 'Social' },
            ].map(t => (
              <button key={t.id} data-testid={`tab-${t.id}`} className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${tab === t.id ? 'bg-[var(--bg-card)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4">

            {/* LIST VIEW — CARDS */}
            {tab === 'list' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pt-2">
                {contents.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="card cursor-pointer group" onClick={() => openContentDetail(c)}>
                    {c.media && c.media[0] && c.media[0].type === 'image' ? (
                      <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-3 h-28 md:h-36 rounded-t-[0.9rem] overflow-hidden">
                        <img src={`${process.env.REACT_APP_BACKEND_URL}${c.media[0].url}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-3 h-16 md:h-20 rounded-t-[0.9rem] flex items-center justify-center" style={{ background: c.format === 'reel' ? 'rgba(236,72,153,0.08)' : 'rgba(99,102,241,0.08)' }}>
                        {c.format === 'reel' ? <Video size={24} className="text-[var(--accent-pink)] opacity-40" /> : <Image size={24} className="text-[var(--gradient-start)] opacity-40" />}
                      </div>
                    )}
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`badge text-[9px] ${c.format === 'reel' ? 'pink' : 'blue'}`}>{c.format}</span>
                      <span className={`badge text-[9px] ${c.status === 'published' ? 'green' : c.status === 'scheduled' ? 'orange' : 'purple'}`}>{c.status || 'draft'}</span>
                    </div>
                    <h4 className="text-sm font-semibold mb-1 line-clamp-2">{c.hook_text}</h4>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">{(c.caption || '').slice(0, 100)}</p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-muted)]">G{(c.day_offset || 0) + 1}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded hover:bg-[var(--bg-secondary)]" onClick={e => { e.stopPropagation(); deleteContent(c.id); }}><Trash size={12} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {contents.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-[var(--text-muted)] mb-4">Nessun contenuto generato.</p>
                    <button className="btn-gradient text-sm" onClick={() => setShowNewPost(true)}><Plus size={16} /> Crea il primo post</button>
                  </div>
                )}
              </div>
            )}

            {/* CALENDAR — with drag & drop */}
            {tab === 'calendar' && (
              <div className="calendar-container mt-2">
                <div className="calendar-grid">
                  {days.map(d => <div key={d} className="calendar-header">{d}</div>)}
                  {Array.from({ length: 35 }, (_, i) => {
                    const dayNum = i - 5 + 1;
                    const dayContents = contents.filter(c => (c.day_offset || 0) === dayNum - 1 && (c.status === 'scheduled' || c.status === 'published'));
                    const isMonth = dayNum > 0 && dayNum <= 31;
                    return (
                      <div key={i} className={`calendar-cell ${!isMonth ? 'opacity-30' : ''}`}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                        onDragLeave={e => { e.currentTarget.style.background = ''; }}
                        onDrop={e => { e.currentTarget.style.background = ''; handleDrop(dayNum - 1, e); }}>
                        {isMonth && (
                          <>
                            <span className="text-xs font-medium text-[var(--text-secondary)]">{dayNum}</span>
                            {dayContents.map(c => (
                              <div key={c.id} className={`content-chip ${c.format}`} draggable
                                onDragStart={() => setDragContent(c)} onClick={() => openContentDetail(c)}>
                                {c.format === 'reel' ? <Video size={10} /> : <Image size={10} />}
                                <span className="ml-1 truncate">{(c.hook_text || '').slice(0, 20)}</span>
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

            {/* PERSONAS + TOV LIBRARY */}
            {tab === 'personas' && (
              <div className="pt-2">
                <div className="personas-grid mb-8">
                  {personas.map((p, i) => (
                    <div key={i} className="card persona-card">
                      <h3 className="font-semibold text-base md:text-lg mb-1">{p.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-3">{p.role}</p>
                      {p.pain_points && (
                        <div className="p-3 rounded-lg text-sm mb-2" style={{ background: 'rgba(236,72,153,0.1)' }}>
                          <span className="text-[var(--text-muted)] text-xs font-semibold uppercase">Pain Points</span>
                          {(Array.isArray(p.pain_points) ? p.pain_points : [p.pain_points]).map((pp, j) => <p key={j} className="text-sm mt-1">- {pp}</p>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--border-color)] pt-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base"><BookOpen size={18} /> Libreria Tono di Voce</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Template riutilizzabili tra progetti</p>
                    </div>
                    <button className="btn-gradient text-xs" onClick={() => setShowTovSave(true)}><Plus size={14} /> Salva ToV attuale</button>
                  </div>
                  {showTovSave && (
                    <div className="card mb-4 p-4">
                      <div className="flex gap-2 items-end">
                        <input className="input-dark text-sm py-2 flex-1" placeholder="Nome template" value={tovSaveName} onChange={e => setTovSaveName(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
                        <button className="btn-gradient text-xs py-2" onClick={saveToTovLibrary}>Salva</button>
                        <button className="btn-ghost text-xs py-2" onClick={() => setShowTovSave(false)}>X</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {tovLibrary.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">F:{item.formality} E:{item.energy} Em:{item.empathy} H:{item.humor}</p>
                        </div>
                        <button className="btn-gradient text-[10px] py-1 px-2" onClick={() => applyTovTemplate(item.id)}>Applica</button>
                        <button className="text-[var(--accent-pink)]" onClick={() => { api.delete(`/tov-library/${item.id}`); setTovLibrary(prev => prev.filter(t => t.id !== item.id)); }}><Trash size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SOCIAL */}
            {tab === 'social' && (
              <div className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
                  {platforms.map(platform => {
                    const pi = PLATFORM_ICONS[platform.id] || { Icon: Globe, color: '#fff' };
                    const connected = socialProfiles.filter(p => p.platform === platform.id);
                    return (
                      <div key={platform.id} className="card" data-testid={`social-platform-${platform.id}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <pi.Icon weight="fill" size={22} color={pi.color} />
                          <div>
                            <p className="font-semibold text-sm">{platform.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{connected.length} collegati</p>
                          </div>
                        </div>
                        {connected.map(prof => (
                          <div key={prof.id} className="flex items-center justify-between py-1.5 px-2 rounded mb-1" style={{ background: 'rgba(34,197,94,0.1)' }}>
                            <span className="text-xs truncate">{prof.profile_name}</span>
                            <div className="flex gap-1 flex-shrink-0">
                              <button className="text-[10px]" onClick={() => toggleProjectLink(prof.id)}>
                                {projectSocials.some(p => p.id === prof.id) ? <span className="badge green text-[8px]">On</span> : <span className="badge orange text-[8px]">Off</span>}
                              </button>
                              <button className="text-[var(--accent-pink)]" onClick={() => removeSocialProfile(prof.id)}><Trash size={10} /></button>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-1 mt-2">
                          {platform.configured && <button className="btn-ghost text-[10px] py-1 px-2 flex-1" onClick={() => connectSocial(platform)}>OAuth</button>}
                          <button className="btn-ghost text-[10px] py-1 px-2 flex-1" onClick={() => { setShowAddManual(platform.id); setManualName(''); }}><Plus size={10} /> Manuale</button>
                        </div>
                        {showAddManual === platform.id && (
                          <div className="mt-2 p-2 rounded" style={{ background: 'var(--bg-secondary)' }}>
                            <input className="input-dark text-xs py-1.5 mb-1" placeholder="@nome" value={manualName} onChange={e => setManualName(e.target.value)} style={{ paddingLeft: '0.5rem' }} />
                            <div className="flex gap-1">
                              <button className="btn-ghost text-[10px] py-1 flex-1" onClick={() => setShowAddManual(null)}>X</button>
                              <button className="btn-gradient text-[10px] py-1 flex-1" onClick={() => addManualProfile(platform.id)}>Ok</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="card"><TeamPanel projectId={project.id} /></div>
              </div>
            )}
          </div>

          {/* FEED STRIPS — above footer */}
          <div className="flex-shrink-0 border-t border-[var(--border-color)]" style={{ background: 'var(--bg-secondary)' }}>
            {/* Strip 1: Google News / Reddit */}
            <div className="px-4 md:px-6 pt-3 pb-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1 truncate"><RssSimple size={12} /> News & Reddit — {project.sector}</p>
                <button className="text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 flex-shrink-0" onClick={() => { api.post(`/feeds/refresh/${project.id}`).then(() => api.get(`/feeds/${project.id}/items`).then(r => setFeedItems(r.data))).catch(() => {}); }}>
                  <ArrowClockwise size={10} /> Refresh
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
                {feedItems.slice(0, 6).map(item => (
                  <div key={item.id} className="flex-shrink-0 w-44 md:w-52 p-2.5 md:p-3 rounded-lg cursor-pointer hover:border-[var(--gradient-start)] transition-colors"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                    onClick={() => feedToPost(item)}>
                    <p className="text-xs font-medium line-clamp-2 mb-1">{item.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{item.feed_name}</p>
                  </div>
                ))}
                {feedItems.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">Feed in caricamento...</p>}
              </div>
            </div>

            {/* Strip 2: AI-Generated Suggestions */}
            <div className="px-4 md:px-6 pt-1 pb-3 border-t border-[var(--border-color)]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1 truncate"><Sparkle size={12} weight="fill" /> Idee AI — {project.sector}</p>
                <button className="text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 flex-shrink-0" onClick={() => {
                  api.post(`/feeds/ai-suggestions/${project.id}/refresh`).then(r => setAiFeedItems(r.data || [])).catch(() => {});
                }}>
                  <ArrowClockwise size={10} /> Rigenera
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
                {aiFeedItems.map(item => (
                  <div key={item.id} className="flex-shrink-0 w-44 md:w-52 p-2.5 md:p-3 rounded-lg cursor-pointer hover:border-[var(--accent-purple)] transition-colors"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(236,72,153,0.08) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}
                    onClick={() => feedToPost({ title: item.title, summary: item.summary })}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.format === 'reel' ? 'bg-[var(--accent-pink)]' : 'bg-[var(--gradient-start)]'}`} />
                      <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase">{item.format || 'reel'}</span>
                      {item.trend_tag && <span className="text-[9px] text-[var(--accent-purple)]">#{item.trend_tag}</span>}
                    </div>
                    <p className="text-xs font-medium line-clamp-2 mb-1">{item.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{item.summary}</p>
                  </div>
                ))}
                {aiFeedItems.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">Generazione idee AI...</p>}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Desktop: inline, Mobile: overlay */}
        {!isMobile && (
          <div className="flex flex-shrink-0 relative" style={{ width: rightPanelWidth, zIndex: 20, marginLeft: -(rightPanelWidth - 280) > 0 ? -(rightPanelWidth - 280) : 0 }}>
            <div className="w-1.5 cursor-col-resize hover:bg-[var(--gradient-start)] transition-colors flex-shrink-0"
              style={{ background: 'var(--border-color)' }}
              onMouseDown={e => {
                e.preventDefault();
                const startX = e.clientX;
                const startW = rightPanelWidth;
                const onMove = (ev) => { const diff = startX - ev.clientX; setRightPanelWidth(Math.max(200, Math.min(700, startW + diff))); };
                const onUp = () => { document.body.style.cursor = ''; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                document.body.style.cursor = 'col-resize';
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            />
            <div className="flex-1 overflow-y-auto p-4" style={{ background: 'var(--bg-secondary)' }}>
              <RightPanelContent queueItems={queueItems} contents={contents} cancelQueueItem={cancelQueueItem} project={project} />
            </div>
          </div>
        )}

        {/* Mobile Right Panel Overlay */}
        <AnimatePresence>
          {isMobile && showRightPanel && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowRightPanel(false)}>
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
                className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm overflow-y-auto p-4"
                style={{ background: 'var(--bg-secondary)' }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Queue & Analytics</h3>
                  <button className="btn-ghost p-1.5" onClick={() => setShowRightPanel(false)}><X size={16} /></button>
                </div>
                <RightPanelContent queueItems={queueItems} contents={contents} cancelQueueItem={cancelQueueItem} project={project} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => !newPostLoading && setShowNewPost(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Nuovo Post</h3>
              <div className="space-y-4">
                <textarea data-testid="new-post-hook" className="input-dark" rows={3} placeholder="Hook/idea del post..." value={newPostHook} onChange={e => setNewPostHook(e.target.value)} style={{ paddingLeft: '1rem' }} />
                <div className="flex gap-2">
                  <button className={`preset-btn flex-1 ${newPostFormat === 'reel' ? 'active' : ''}`} onClick={() => setNewPostFormat('reel')}><Video size={14} /> Reel</button>
                  <button className={`preset-btn flex-1 ${newPostFormat === 'carousel' ? 'active' : ''}`} onClick={() => setNewPostFormat('carousel')}><Image size={14} /> Carousel</button>
                </div>
                <div className="flex gap-2">
                  <button className={`preset-btn flex-1 ${!newPostUseAi ? 'active' : ''}`} onClick={() => setNewPostUseAi(false)}>Da zero</button>
                  <button className={`preset-btn flex-1 ${newPostUseAi ? 'active' : ''}`} onClick={() => setNewPostUseAi(true)}><Sparkle size={14} /> Con AI</button>
                </div>
                <div className="flex gap-3">
                  <button className="btn-ghost flex-1" onClick={() => setShowNewPost(false)}>Annulla</button>
                  <button data-testid="create-post-btn" className="btn-gradient flex-1" onClick={createNewPost} disabled={newPostLoading || !newPostHook.trim()}>
                    {newPostLoading ? '...' : 'Crea'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedContent && (
          <ContentDetail content={selectedContent} project={project} onClose={() => setSelectedContent(null)} onUpdate={handleContentUpdate} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* Extracted right panel content to reuse in desktop inline + mobile overlay */
function RightPanelContent({ queueItems, contents, cancelQueueItem, project }) {
  return (
    <>
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-3 flex items-center gap-1"><Queue size={12} /> Publishing Queue <span className="badge blue text-[8px] ml-1">{queueItems.length}</span></p>
        {queueItems.slice(0, 5).map(item => {
          const pi = PLATFORM_ICONS[item.platform] || { Icon: Globe, color: '#fff' };
          return (
            <div key={item.id} className="flex items-center gap-2 py-1.5 px-2 rounded mb-1" style={{ background: 'var(--bg-card)' }}>
              <pi.Icon weight="fill" size={12} color={pi.color} />
              <p className="text-[10px] flex-1 truncate">{contents.find(c => c.id === item.content_id)?.hook_text?.slice(0, 30) || '...'}</p>
              <span className={`text-[8px] font-semibold ${item.status === 'queued' ? 'text-[var(--accent-blue)]' : item.status === 'published' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-orange)]'}`}>{item.status}</span>
              {item.status === 'queued' && <button onClick={() => cancelQueueItem(item.id)}><X size={10} /></button>}
            </div>
          );
        })}
        {queueItems.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">Coda vuota</p>}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-3 flex items-center gap-1"><ChartBar size={12} /> Analytics</p>
        <Analytics project={project} compact />
      </div>
    </>
  );
}
