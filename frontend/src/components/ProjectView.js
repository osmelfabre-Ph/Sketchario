import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Video, Image, X,
  Plus, ArrowLeft,
  Sparkle, Trash, Globe,
  RssSimple, ArrowClockwise,
  BookOpen, Download, ChartBar,
  SquaresFour, ListBullets
} from '@phosphor-icons/react';
import TeamPanel from './TeamPanel';
import ContentDetail from './ContentDetail';
import { PLATFORM_ICONS } from './project-view/constants';
import ContentCardsView from './project-view/ContentCardsView';
import ContentListView from './project-view/ContentListView';
import ContentCalendarView from './project-view/ContentCalendarView';
import FeedStrips from './project-view/FeedStrips';
import RightPanelContent from './project-view/RightPanelContent';

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
  const { t } = useTranslation();
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
  const [refreshingFeeds, setRefreshingFeeds] = useState(false);
  const [refreshingAi, setRefreshingAi] = useState(false);

  // Action loading states
  const [deletingContentId, setDeletingContentId] = useState(null);
  const [cancellingQueueId, setCancellingQueueId] = useState(null);
  const [connectingPlatformId, setConnectingPlatformId] = useState(null);
  const [removingProfileId, setRemovingProfileId] = useState(null);
  const [savingTovLibrary, setSavingTovLibrary] = useState(false);
  const [applyingTovId, setApplyingTovId] = useState(null);

  // List view
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  // Feed item modal + pinning
  const [selectedFeedItem, setSelectedFeedItem] = useState(null);
  const [pinnedItemIds, setPinnedItemIds] = useState(new Set());
  const [pinningItemId, setPinningItemId] = useState(null);

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

  // Calendar month navigation
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-based

  useEffect(() => {
    if (activeTab === 'analytics') {
      setShowRightPanel(true);
    } else if (activeTab) {
      setTab(activeTab);
    }
  }, [activeTab]);

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
      api.get(`/feeds/${project.id}/pinned`).then(r => setPinnedItemIds(new Set(r.data.map(p => p.item_id)))).catch(() => {}),
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
    if (!window.confirm('Eliminare questo contenuto?')) return;
    setDeletingContentId(id);
    const tid = toast.loading('Eliminazione in corso...');
    try {
      await api.delete(`/contents/${id}`);
      setContents(prev => prev.filter(c => c.id !== id));
      toast.success('Contenuto eliminato', { id: tid });
    } catch (e) { toast.error('Errore eliminazione', { id: tid }); }
    setDeletingContentId(null);
  };

  const createNewPost = async () => {
    if (!newPostHook.trim()) return;
    setNewPostLoading(true);
    const tid = toast.loading('Creazione post in corso...');
    try {
      const { data } = await api.post('/content/create-post', { project_id: project.id, hook_text: newPostHook, format: newPostFormat, use_ai: newPostUseAi });
      setContents(prev => [...prev, data]);
      setShowNewPost(false); setNewPostHook('');
      toast.success('Post creato!', { id: tid });
      openContentDetail(data);
    } catch (e) { toast.error('Errore: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    finally { setNewPostLoading(false); }
  };

  const feedToPost = async (item) => {
    setFeedLoading(true);
    const tid = toast.loading('Generazione contenuto dal feed...');
    try {
      const { data } = await api.post('/feeds/generate-content', { project_id: project.id, feed_item_title: item.title, feed_item_summary: item.summary });
      setContents(prev => [...prev, data]);
      toast.success('Contenuto generato!', { id: tid });
      openContentDetail(data);
    } catch (e) { toast.error('Errore: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    finally { setFeedLoading(false); }
  };

  const handleDrop = async (dayOffset, e) => {
    e.preventDefault();
    if (!dragContent) return;
    await api.put(`/contents/${dragContent.id}`, { ...dragContent, day_offset: dayOffset });
    setContents(prev => prev.map(c => c.id === dragContent.id ? { ...c, day_offset: dayOffset } : c));
    setDragContent(null);
  };

  const connectSocial = async (platform) => {
    setConnectingPlatformId(platform.id);
    const tid = toast.loading(`Connessione ${platform.name} in corso...`);
    try {
      const { data } = await api.get(`/social/oauth/start/${platform.id}`);
      const popup = window.open(data.auth_url, 'oauth_popup', 'width=600,height=700,left=200,top=100');
      const handler = (e) => {
        if (e.data?.type === 'oauth_success') {
          window.removeEventListener('message', handler);
          popup?.close();
          api.get('/social/profiles').then(r => setSocialProfiles(r.data)).catch(() => {});
          toast.success(`${e.data.name} collegato con successo!`, { id: tid });
          setConnectingPlatformId(null);
        } else if (e.data?.type === 'oauth_error') {
          window.removeEventListener('message', handler);
          popup?.close();
          toast.error(`Errore connessione: ${e.data.error}`, { id: tid });
          setConnectingPlatformId(null);
        }
      };
      window.addEventListener('message', handler);
    } catch (e) {
      toast.error('Errore: ' + (e.response?.data?.detail || e.message), { id: tid });
      setConnectingPlatformId(null);
    }
  };
  const addManualProfile = async (platformId) => {
    if (!manualName.trim()) return;
    const tid = toast.loading('Aggiunta profilo...');
    try {
      const { data } = await api.post('/social/profiles', { platform: platformId, profile_name: manualName, connection_mode: 'manual' });
      setSocialProfiles(prev => [...prev, data]); setShowAddManual(null); setManualName('');
      toast.success('Profilo aggiunto', { id: tid });
    } catch (e) { toast.error('Errore aggiunta profilo', { id: tid }); }
  };
  const removeSocialProfile = async (id) => {
    setRemovingProfileId(id);
    const tid = toast.loading('Rimozione profilo...');
    try {
      await api.delete(`/social/profiles/${id}`);
      setSocialProfiles(prev => prev.filter(p => p.id !== id));
      toast.success('Profilo rimosso', { id: tid });
    } catch (e) { toast.error('Errore rimozione profilo', { id: tid }); }
    setRemovingProfileId(null);
  };
  const toggleProjectLink = async (profileId) => {
    try {
      const isLinked = projectSocials.some(p => p.id === profileId);
      const newIds = isLinked ? projectSocials.filter(p => p.id !== profileId).map(p => p.id) : [...projectSocials.map(p => p.id), profileId];
      await api.post('/social/project/link', { project_id: project.id, social_profile_ids: newIds });
      const { data } = await api.get(`/social/project/${project.id}`);
      setProjectSocials(data);
    } catch (e) { toast.error('Errore aggiornamento link'); }
  };

  const saveToTovLibrary = async () => {
    if (!tovSaveName.trim()) return;
    setSavingTovLibrary(true);
    const tid = toast.loading('Salvataggio template...');
    try {
      const { data } = await api.post('/tov-library', { name: tovSaveName, ...tov });
      setTovLibrary(prev => [...prev, data]); setShowTovSave(false); setTovSaveName('');
      toast.success('Template salvato nella libreria', { id: tid });
    } catch (e) { toast.error('Errore salvataggio template', { id: tid }); }
    setSavingTovLibrary(false);
  };
  const applyTovTemplate = async (itemId) => {
    setApplyingTovId(itemId);
    const tid = toast.loading('Applicazione template...');
    try {
      await api.post(`/tov-library/${itemId}/apply/${project.id}`);
      const { data } = await api.get(`/tov/${project.id}`);
      setTov(data || {});
      toast.success('Template applicato', { id: tid });
    } catch (e) { toast.error('Errore applicazione template', { id: tid }); }
    setApplyingTovId(null);
  };

  const cancelQueueItem = async (id) => {
    setCancellingQueueId(id);
    const tid = toast.loading('Annullamento programmazione...');
    try {
      await api.delete(`/publish/queue/${id}`);
      setQueueItems(prev => prev.filter(q => q.id !== id));
      toast.success('Programmazione annullata', { id: tid });
    } catch (e) { toast.error('Errore annullamento', { id: tid }); }
    setCancellingQueueId(null);
  };

  const toggleUrgent = async (c) => {
    const newVal = !c.urgent;
    setContents(prev => prev.map(x => x.id === c.id ? { ...x, urgent: newVal } : x));
    try { await api.put(`/contents/${c.id}`, { urgent: newVal }); }
    catch { setContents(prev => prev.map(x => x.id === c.id ? { ...x, urgent: c.urgent } : x)); }
  };

  const toggleGroupCollapse = (status) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  };

  const pinFeedItem = async (item, itemType) => {
    const itemId = item.id;
    setPinningItemId(itemId);
    try {
      const { data } = await api.post(`/feeds/items/${itemId}/pin`, {
        project_id: project.id,
        item_data: item,
        item_type: itemType
      });
      setPinnedItemIds(prev => {
        const next = new Set(prev);
        if (data.pinned) { next.add(itemId); toast.success('Salvato — sopravvive alla rigenerazione'); }
        else { next.delete(itemId); toast.success('Pin rimosso'); }
        return next;
      });
    } catch { toast.error('Errore pin'); }
    setPinningItemId(null);
  };

  const refreshFeeds = async () => {
    setRefreshingFeeds(true);
    const tid = toast.loading('Aggiornamento feed...');
    try {
      await api.post(`/feeds/refresh/${project.id}`);
      const response = await api.get(`/feeds/${project.id}/items`);
      setFeedItems(response.data);
      toast.success('Feed aggiornati', { id: tid });
    } catch {
      toast.error('Errore aggiornamento feed', { id: tid });
    }
    setRefreshingFeeds(false);
  };

  const refreshAiSuggestions = async () => {
    setRefreshingAi(true);
    const tid = toast.loading('Generazione idee AI...');
    try {
      const response = await api.post(`/feeds/ai-suggestions/${project.id}/refresh`);
      setAiFeedItems(response.data || []);
      toast.success('Idee AI aggiornate', { id: tid });
    } catch {
      toast.error('Errore generazione idee AI', { id: tid });
    }
    setRefreshingAi(false);
  };

  const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const listGroups = [
    { key: 'published', label: t('status.published'), items: contents.filter(c => c.status === 'published') },
    { key: 'scheduled', label: t('status.scheduled'), items: contents.filter(c => c.status === 'scheduled') },
    { key: 'draft', label: t('status.draft'), items: contents.filter(c => !c.status || c.status === 'draft') },
  ].filter(group => group.items.length > 0);

  if (loading) return <p className="text-[var(--text-muted)] text-center py-12">{t('common.loading')}</p>;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]" style={{ paddingBottom: isMobile ? 56 : 0 }}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[var(--border-color)] flex-shrink-0 ${isMobile ? 'flex-wrap' : ''}`}>
        <button className="btn-ghost p-1.5" onClick={() => setActiveView('dashboard')} data-testid="back-to-dashboard"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-bold gradient-text truncate" data-testid="project-title">{project.name}</h1>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)]">{project.sector} | {contents.length} {t('dashboard.contents')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button data-testid="new-post-btn" className="btn-gradient text-xs md:text-sm" onClick={() => setShowNewPost(true)}>
            <Plus weight="bold" size={14} /> <span className="hidden sm:inline">Nuovo</span> Post
          </button>
          <button className="btn-ghost text-xs md:text-sm" onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}/api/export/${project.id}/csv`, '_blank')} data-testid="export-csv-btn">
            <Download size={14} /> <span className="hidden sm:inline">CSV</span>
          </button>
          <button className="btn-ghost text-xs p-1.5" onClick={() => setShowRightPanel(!showRightPanel)} data-testid="toggle-right-panel">
            <ChartBar size={16} />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Center: Tab Content + Feed Strip */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Buttons */}
          <div className="flex gap-1 px-4 md:px-6 pt-3 pb-2 flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'list', label: t('project.tabs.list') },
              { id: 'calendar', label: t('project.tabs.calendar') },
              { id: 'personas', label: t('project.tabs.personas') },
              { id: 'social', label: t('project.tabs.social') },
            ].map(tab_ => (
              <button key={tab_.id} data-testid={`tab-${tab_.id}`} className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${tab === tab_.id ? 'bg-[var(--bg-card)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`} onClick={() => setTab(tab_.id)}>
                {tab_.label}
            </button>
            ))}
            <button
              data-testid="tab-analytics"
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${showRightPanel ? 'bg-[var(--bg-card)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
              onClick={() => setShowRightPanel(v => !v)}
            >
              {t('nav.analytics')}
            </button>
            {tab === 'list' && (
              <div className="flex items-center gap-0.5 ml-2 border-l border-[var(--border-color)] pl-2 flex-shrink-0">
                <button
                  className={`p-1.5 rounded transition-colors ${viewMode === 'cards' ? 'bg-[var(--bg-card)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
                  onClick={() => setViewMode('cards')}
                  title="Vista schede"
                >
                  <SquaresFour size={15} />
                </button>
                <button
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[var(--bg-card)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
                  onClick={() => setViewMode('list')}
                  title="Vista elenco"
                >
                  <ListBullets size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4">

            {/* LIST VIEW — CARDS */}
            {tab === 'list' && viewMode === 'cards' && (
              <ContentCardsView
                contents={contents}
                openContentDetail={openContentDetail}
                deletingContentId={deletingContentId}
                deleteContent={deleteContent}
                setShowNewPost={setShowNewPost}
              />
            )}

            {/* LIST VIEW — COMPACT LIST */}
            {tab === 'list' && viewMode === 'list' && (
              <ContentListView
                groups={listGroups}
                collapsedGroups={collapsedGroups}
                toggleGroupCollapse={toggleGroupCollapse}
                queueItems={queueItems}
                openContentDetail={openContentDetail}
                toggleUrgent={toggleUrgent}
                deletingContentId={deletingContentId}
                deleteContent={deleteContent}
              />
            )}

            {/* CALENDAR — real date grid */}
            {tab === 'calendar' && (
              <ContentCalendarView
                contents={contents}
                queueItems={queueItems}
                calYear={calYear}
                calMonth={calMonth}
                setCalYear={setCalYear}
                setCalMonth={setCalMonth}
                days={days}
                handleDrop={handleDrop}
                setDragContent={setDragContent}
                openContentDetail={openContentDetail}
              />
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
                        <button className="btn-gradient text-xs py-2" onClick={saveToTovLibrary} disabled={savingTovLibrary}>
                          {savingTovLibrary ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1" />Salvataggio...</> : 'Salva'}
                        </button>
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
                        <button className="btn-gradient text-[10px] py-1 px-2" onClick={() => applyTovTemplate(item.id)} disabled={applyingTovId === item.id}>
                          {applyingTovId === item.id ? <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" /> : 'Applica'}
                        </button>
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
                {/* Social publishing platforms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
                  {platforms.filter(p => !p.is_tool).map(platform => {
                    const pi = PLATFORM_ICONS[platform.id] || { Icon: Globe, color: '#fff' };
                    const connected = socialProfiles.filter(p => p.platform === platform.id);
                    return (
                      <div key={platform.id} className="card" data-testid={`social-platform-${platform.id}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <pi.Icon weight="fill" size={22} color={pi.color} />
                          <div>
                            <p className="font-semibold text-sm">{platform.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{connected.length} {t('project.social.connected')}</p>
                          </div>
                        </div>
                        {connected.map(prof => (
                          <div key={prof.id} className="flex items-center justify-between py-1.5 px-2 rounded mb-1" style={{ background: 'rgba(34,197,94,0.1)' }}>
                            <span className="text-xs truncate">{prof.profile_name}</span>
                            <div className="flex gap-1 flex-shrink-0">
                              <span className="badge green text-[8px]">{t('common.active')}</span>
                              <button className="text-[var(--accent-pink)]" disabled={removingProfileId === prof.id} onClick={() => removeSocialProfile(prof.id)}>
                                {removingProfileId === prof.id ? <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" /> : <Trash size={10} />}
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-1 mt-2">
                          {platform.configured && <button className="btn-ghost text-[10px] py-1 px-2 flex-1" onClick={() => connectSocial(platform)}>{t('common.oauth')}</button>}
                          <button className="btn-ghost text-[10px] py-1 px-2 flex-1" onClick={() => { setShowAddManual(platform.id); setManualName(''); }}><Plus size={10} /> {t('common.manuale')}</button>
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

                {/* Tool integrations (Google Drive etc.) */}
                {platforms.some(p => p.is_tool) && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-3">{t('project.social.integrations')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {platforms.filter(p => p.is_tool).map(platform => {
                        const pi = PLATFORM_ICONS[platform.id] || { Icon: Globe, color: '#34a853' };
                        const connected = socialProfiles.filter(p => p.platform === platform.id);
                        const isConnected = connected.length > 0;
                        return (
                          <div key={platform.id} className="card" style={{ border: isConnected ? '1px solid rgba(52,168,83,0.4)' : undefined }}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,168,83,0.1)' }}>
                                <pi.Icon size={22} color={pi.color} />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{platform.name}</p>
                                <p className="text-[10px]" style={{ color: isConnected ? '#34a853' : 'var(--text-muted)' }}>
                                  {isConnected ? t('common.connected') : t('common.notConnected')}
                                </p>
                              </div>
                            </div>
                            {isConnected ? (
                              <div className="flex gap-1">
                                <button className="btn-ghost text-[10px] py-1 px-2 flex-1" onClick={() => connectSocial(platform)}>{t('common.reconnect')}</button>
                                <button className="text-[var(--accent-pink)] text-[10px] py-1 px-2 flex-1 rounded btn-ghost" onClick={() => removeSocialProfile(connected[0].id)}>
                                  <Trash size={10} className="inline mr-1" />{t('common.disconnect')}
                                </button>
                              </div>
                            ) : (
                              platform.configured && (
                                <button className="btn-gradient text-[10px] py-1.5 px-3 w-full" onClick={() => connectSocial(platform)}>
                                  {t('common.connect')} {platform.name}
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="card"><TeamPanel projectId={project.id} /></div>
              </div>
            )}

            {/* FEEDS TAB — mobile full-page view */}
            {tab === 'feeds' && (
              <div className="pt-2 space-y-6">
                {/* News & Reddit */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold flex items-center gap-2"><RssSimple size={16} /> News & Reddit — {project.sector}</p>
                    <button className="text-xs text-[var(--text-muted)] hover:text-white flex items-center gap-1" disabled={refreshingFeeds} onClick={refreshFeeds}>
                      <ArrowClockwise size={12} className={refreshingFeeds ? 'animate-spin' : ''} /> {refreshingFeeds ? '...' : t('project.feeds.refresh')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {feedItems.slice(0, 8).map(item => (
                      <div key={item.id} className="card cursor-pointer hover:border-[var(--gradient-start)] transition-colors relative" onClick={() => setSelectedFeedItem({ ...item, _type: 'rss' })}>
                        {pinnedItemIds.has(item.id) && <span className="absolute top-2 right-2 text-[10px]">📌</span>}
                        <p className="text-sm font-medium mb-1 pr-5">{item.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">{item.feed_name}</p>
                      </div>
                    ))}
                    {feedItems.length === 0 && <p className="text-sm text-[var(--text-muted)]">{t('project.feeds.noFeeds')}</p>}
                  </div>
                </div>
                {/* AI Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold flex items-center gap-2"><Sparkle size={16} weight="fill" /> Idee AI — {project.sector}</p>
                    <button className="text-xs text-[var(--text-muted)] hover:text-white flex items-center gap-1" disabled={refreshingAi} onClick={refreshAiSuggestions}>
                      <ArrowClockwise size={12} className={refreshingAi ? 'animate-spin' : ''} /> {refreshingAi ? '...' : t('editor.regenerate')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {aiFeedItems.map(item => (
                      <div key={item.id} className="card cursor-pointer hover:border-[var(--accent-purple)] transition-colors relative"
                        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(236,72,153,0.08) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}
                        onClick={() => setSelectedFeedItem({ ...item, _type: 'ai' })}>
                        {pinnedItemIds.has(item.id) && <span className="absolute top-2 right-2 text-[10px]">📌</span>}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.format === 'reel' ? 'bg-[var(--accent-pink)]' : 'bg-[var(--gradient-start)]'}`} />
                          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">{item.format || 'reel'}</span>
                          {item.trend_tag && <span className="text-[10px] text-[var(--accent-purple)]">#{item.trend_tag}</span>}
                        </div>
                        <p className="text-sm font-medium mb-1 pr-5">{item.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">{item.summary}</p>
                      </div>
                    ))}
                    {aiFeedItems.length === 0 && <p className="text-sm text-[var(--text-muted)]">Generazione idee AI...</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <FeedStrips
            isMobile={isMobile}
            project={project}
            feedItems={feedItems}
            aiFeedItems={aiFeedItems}
            pinnedItemIds={pinnedItemIds}
            refreshingFeeds={refreshingFeeds}
            refreshingAi={refreshingAi}
            refreshFeeds={refreshFeeds}
            refreshAiSuggestions={refreshAiSuggestions}
            setSelectedFeedItem={setSelectedFeedItem}
            t={t}
          />
        </div>

        {/* RIGHT PANEL — Overlay drawer (desktop + mobile) */}
        <AnimatePresence>
          {showRightPanel && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }}
              onClick={() => setShowRightPanel(false)} />
          )}
        </AnimatePresence>

        <motion.div
          animate={{ x: showRightPanel ? 0 : rightPanelWidth - 24 }}
          initial={false}
          transition={{ type: 'tween', duration: 0.25 }}
          className="fixed top-0 right-0 bottom-0 z-50 flex"
          style={{ width: rightPanelWidth }}
        >
          {/* Handle tab */}
          <div
            className="flex flex-col items-center justify-center w-6 cursor-pointer flex-shrink-0 select-none"
            style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', borderRadius: '8px 0 0 8px' }}
            onClick={() => setShowRightPanel(!showRightPanel)}
            onMouseDown={e => {
              if (e.button !== 0) return;
              e.preventDefault();
              const startX = e.clientX;
              const startW = rightPanelWidth;
              const onMove = (ev) => { const diff = startX - ev.clientX; setRightPanelWidth(Math.max(220, Math.min(600, startW + diff))); };
              const onUp = () => { document.body.style.cursor = ''; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
              document.body.style.cursor = 'col-resize';
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          >
            <div className="flex flex-col gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full" style={{ background: 'var(--text-muted)' }} />
              ))}
            </div>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4" style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Queue & Analytics</h3>
              <button className="btn-ghost p-1.5" onClick={() => setShowRightPanel(false)}><X size={16} /></button>
            </div>
            <RightPanelContent queueItems={queueItems} contents={contents} cancelQueueItem={cancelQueueItem} cancellingQueueId={cancellingQueueId} project={project} />
          </div>
        </motion.div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => !newPostLoading && setShowNewPost(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">{t('project.content.generate')}</h3>
              <div className="space-y-4">
                <textarea data-testid="new-post-hook" className="input-dark" rows={3} placeholder="Hook/idea del post..." value={newPostHook} onChange={e => setNewPostHook(e.target.value)} style={{ paddingLeft: '1rem' }} />
                <div className="flex gap-2">
                  <button className={`preset-btn flex-1 ${newPostFormat === 'reel' ? 'active' : ''}`} onClick={() => setNewPostFormat('reel')}><Video size={14} /> Reel</button>
                  <button className={`preset-btn flex-1 ${newPostFormat === 'carousel' ? 'active' : ''}`} onClick={() => setNewPostFormat('carousel')}><Image size={14} /> Carousel</button>
                  <button className={`preset-btn flex-1 ${newPostFormat === 'prompted_reel' ? 'active' : ''}`} onClick={() => setNewPostFormat('prompted_reel')}>🤖 Prompted Reel</button>
                </div>
                <div className="flex gap-2">
                  <button className={`preset-btn flex-1 ${!newPostUseAi ? 'active' : ''}`} onClick={() => setNewPostUseAi(false)}>Da zero</button>
                  <button className={`preset-btn flex-1 ${newPostUseAi ? 'active' : ''}`} onClick={() => setNewPostUseAi(true)}><Sparkle size={14} /> Con AI</button>
                </div>
                <div className="flex gap-3">
                  <button className="btn-ghost flex-1" onClick={() => setShowNewPost(false)}>{t('common.cancel')}</button>
                  <button data-testid="create-post-btn" className="btn-gradient flex-1" onClick={createNewPost} disabled={newPostLoading || !newPostHook.trim()}>
                    {newPostLoading ? '...' : t('common.save')}
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

        {/* Feed Item Modal */}
        {selectedFeedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedFeedItem(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', maxHeight: '85vh' }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-start justify-between p-4 md:p-5 border-b border-[var(--border-color)] flex-shrink-0">
                <div className="flex-1 min-w-0 pr-3">
                  {selectedFeedItem._type === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge purple text-[10px]">✨ Idea AI</span>
                      {selectedFeedItem.format && <span className="badge text-[10px]" style={{ background: 'var(--bg-card)' }}>{selectedFeedItem.format}</span>}
                      {selectedFeedItem.trend_tag && <span className="text-[10px] text-[var(--accent-purple)]">#{selectedFeedItem.trend_tag}</span>}
                    </div>
                  )}
                  {selectedFeedItem._type === 'rss' && selectedFeedItem.feed_name && (
                    <p className="text-[10px] text-[var(--text-muted)] mb-1 uppercase font-semibold">{selectedFeedItem.feed_name}</p>
                  )}
                  <h2 className="text-base font-bold leading-snug">{selectedFeedItem.title}</h2>
                </div>
                <button className="btn-ghost p-1.5 flex-shrink-0" onClick={() => setSelectedFeedItem(null)}><X size={18} /></button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5">
                {selectedFeedItem.summary && (
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4" style={{ whiteSpace: 'pre-wrap' }}>{selectedFeedItem.summary}</p>
                )}
                {selectedFeedItem.link && (
                  <a href={selectedFeedItem.link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[var(--accent-purple)] hover:underline flex items-center gap-1 mb-4">
                    <Globe size={12} /> Leggi articolo originale →
                  </a>
                )}
                {selectedFeedItem.published && (
                  <p className="text-[10px] text-[var(--text-muted)]">Pubblicato: {selectedFeedItem.published}</p>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex items-center gap-3 p-4 border-t border-[var(--border-color)] flex-shrink-0" style={{ background: 'var(--bg-secondary)' }}>
                <button
                  className={`btn-ghost text-xs py-2 px-3 flex items-center gap-1.5 ${pinnedItemIds.has(selectedFeedItem.id) ? 'text-[var(--accent-purple)]' : ''}`}
                  disabled={pinningItemId === selectedFeedItem.id}
                  onClick={() => pinFeedItem(selectedFeedItem, selectedFeedItem._type)}
                  title={pinnedItemIds.has(selectedFeedItem.id) ? 'Rimuovi pin' : 'Salva (sopravvive alla rigenerazione)'}
                >
                  {pinningItemId === selectedFeedItem.id
                    ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <span>{pinnedItemIds.has(selectedFeedItem.id) ? '📌' : '📍'}</span>}
                  {pinnedItemIds.has(selectedFeedItem.id) ? 'Salvato' : 'Salva'}
                </button>
                <button
                  className="btn-gradient flex-1 text-sm py-2"
                  disabled={feedLoading}
                  onClick={() => { setSelectedFeedItem(null); feedToPost(selectedFeedItem); }}
                >
                  {feedLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />Generazione...</> : '✦ Crea Post →'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
