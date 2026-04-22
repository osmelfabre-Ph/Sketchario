import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  X, Plus, Video, Image, Sparkle, ArrowClockwise, Download,
  InstagramLogo, LinkedinLogo, FacebookLogo, TiktokLogo, PinterestLogo, Globe,
  CalendarBlank, PaperPlaneTilt, Copy, FloppyDisk, Eye, CheckCircle, Check,
  XCircle
} from '@phosphor-icons/react';

const PLATFORM_ICONS = {
  instagram: { Icon: InstagramLogo, color: '#E4405F', name: 'Instagram' },
  facebook: { Icon: FacebookLogo, color: '#1877F2', name: 'Facebook' },
  linkedin: { Icon: LinkedinLogo, color: '#0A66C2', name: 'LinkedIn' },
  tiktok: { Icon: TiktokLogo, color: '#ffffff', name: 'TikTok' },
  pinterest: { Icon: PinterestLogo, color: '#E60023', name: 'Pinterest' },
};

const CanvaIcon = ({ size = 16 }) => (
  <img src="https://www.canva.com/favicon.ico" alt="Canva" style={{ width: size, height: size, borderRadius: 3, objectFit: 'cover' }} />
);


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function ContentDetail({ content: initialContent, project, onClose, onUpdate }) {
  const { api } = useAuth();
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [canvaLoading, setCanvaLoading] = useState(false);
  const isMobile = useIsMobile();
  const [content, setContent] = useState(initialContent);
  const [editScript, setEditScript] = useState(initialContent.script || '');
  const [editOpeningHook, setEditOpeningHook] = useState(initialContent.opening_hook || '');
  const [editVisualDirection, setEditVisualDirection] = useState(initialContent.visual_direction || '');
  const [editCaption, setEditCaption] = useState(initialContent.caption || '');
  const [editHashtags, setEditHashtags] = useState(String(initialContent.hashtags || ''));
  const [socialProfiles, setSocialProfiles] = useState([]);
  const [projectSocials, setProjectSocials] = useState([]);
  const [selectedSocials, setSelectedSocials] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [scheduling, setScheduling] = useState(false);
  const [cancellingSchedule, setCancellingSchedule] = useState(false);
  const [contentQueueItems, setContentQueueItems] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState(null);
  const [mobileTab, setMobileTab] = useState('editor');
  const [inputModal, setInputModal] = useState(null); // { title, placeholder, value, multiline, onConfirm }
  const [generatingImage, setGeneratingImage] = useState(false);
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [optimizingPrompt, setOptimizingPrompt] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [fluxStyle, setFluxStyle] = useState('fotorealistico');
  const [fluxComposition, setFluxComposition] = useState('wide');
  const [imageModel, setImageModel] = useState('flux');

  useEffect(() => {
    api.get('/social/profiles').then(r => setSocialProfiles((r.data || []).filter(p => p.platform !== 'google_slides'))).catch(() => {});
    api.get(`/social/project/${project.id}`).then(r => setProjectSocials(r.data)).catch(() => {});
    api.get('/canva/status').then(r => setCanvaConnected(r.data.connected)).catch(() => {});
    api.get(`/publish/queue/${project.id}`).then(r => {
      const items = r.data.filter(q => q.content_id === initialContent.id && q.status === 'queued');
      setContentQueueItems(items);
      if (items.length > 0) {
        const dt = new Date(items[0].scheduled_at);
        setScheduleDate(dt.toISOString().slice(0, 10));
        setScheduleTime(dt.toISOString().slice(11, 16));
        // Pre-select the social profiles that are already scheduled
        setSelectedSocials(items.map(q => q.social_profile_id).filter(Boolean));
      }
    }).catch(() => {});
  }, [api, project.id, initialContent.id]);

  // ── CANVA ─────────────────────────────────────────────
  const openCanvaEditor = async () => {
    setCanvaLoading(true);
    const tid = toast.loading('Creazione design Canva...');
    // Open named popup immediately (synchronous) to bypass popup blockers
    const popup = window.open('about:blank', 'canva_editor', 'width=1280,height=820,left=100,top=60');
    try {
      const { data } = await api.post('/canva/create-design', { content_id: content.id, format: content.format });
      const { edit_url, design_id } = data;
      if (popup && !popup.closed) popup.location.href = edit_url;
      else window.open(edit_url, 'canva_editor', 'width=1280,height=820,left=100,top=60');
      toast.success('Design aperto in Canva — premi "Torna a Sketchario" per importare', { id: tid, duration: 10000 });

      let importing = false;
      const doImport = async () => {
        if (importing) return;
        importing = true;
        const importTid = toast.loading('Importazione da Canva in corso...');
        try {
          const { data: imp } = await api.post(`/canva/export-design/${content.id}`, { design_id });
          if (imp.count > 0) {
            const added = imp.media || [];
            const updated = { ...content, media: [...(content.media || []), ...added] };
            setContent(updated); onUpdate?.(updated);
            toast.success(`${imp.count} immagin${imp.count > 1 ? 'i importate' : 'e importata'} da Canva!`, { id: importTid, duration: 5000 });
          } else {
            toast.info('Nessuna immagine esportata da Canva', { id: importTid });
          }
        } catch (e) {
          const detail = e.response?.data?.detail || e.message;
          toast.error('Errore importazione Canva: ' + detail, { id: importTid });
        }
      };

      // Poll for popup closure or same-origin navigation ("Torna a Sketchario")
      const interval = setInterval(() => {
        // When Canva redirects back to our domain, popup.location is accessible (same-origin)
        try {
          if (popup && !popup.closed && popup.location.hostname === window.location.hostname) {
            clearInterval(interval);
            popup.close();
            doImport();
            return;
          }
        } catch (_) { /* popup still on Canva (cross-origin) — expected */ }

        if (!popup || popup.closed) {
          clearInterval(interval);
          doImport();
        }
      }, 800);
    } catch (e) {
      if (popup && !popup.closed) popup.close();
      if (e.response?.status === 401) { setCanvaConnected(false); }
      toast.error('Errore Canva: ' + (e.response?.data?.detail || e.message), { id: tid });
    }
    setCanvaLoading(false);
  };

  const handleCanvaClick = async () => {
    if (canvaConnected) { await openCanvaEditor(); return; }
    setCanvaLoading(true);
    const popup = window.open('about:blank', 'canva_oauth', 'width=600,height=700,left=200,top=100');
    try {
      const { data } = await api.get('/canva/auth-url');
      if (!data.auth_url) { popup?.close(); setCanvaLoading(false); return; }
      popup.location.href = data.auth_url;
      const handler = async (e) => {
        if (e.data?.type === 'canva_success') {
          window.removeEventListener('message', handler);
          popup?.close();
          setCanvaConnected(true);
          setCanvaLoading(false);
          await openCanvaEditor();
        } else if (e.data?.type === 'canva_error') {
          window.removeEventListener('message', handler);
          popup?.close();
          toast.error('Errore connessione Canva: ' + e.data.error);
          setCanvaLoading(false);
        }
      };
      window.addEventListener('message', handler);
    } catch (e) {
      popup?.close();
      toast.error('Errore Canva: ' + (e.response?.data?.detail || e.message));
      setCanvaLoading(false);
    }
  };

  // ── GOOGLE DRIVE PICKER ───────────────────────────────
  const loadGooglePickerApi = () => new Promise((resolve, reject) => {
    if (window.google?.picker) { resolve(); return; }
    if (document.getElementById('gapi-script')) {
      const poll = setInterval(() => { if (window.google?.picker) { clearInterval(poll); resolve(); } }, 100);
      setTimeout(() => { clearInterval(poll); reject(new Error('Timeout')); }, 10000);
      return;
    }
    const script = document.createElement('script');
    script.id = 'gapi-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => window.gapi.load('picker', resolve);
    script.onerror = () => reject(new Error('Impossibile caricare Google API'));
    document.head.appendChild(script);
  });

  const openDrivePicker = async () => {
    const tid = toast.loading('Apertura Google Drive...');
    try {
      const { data } = await api.get('/google/picker-token');
      if (!data.connected) {
        const msg = data.reason === 'scope_upgrade'
          ? 'Le autorizzazioni Google Drive sono scadute. Riconnetti Google Drive nella sezione Social del progetto.'
          : 'Collega il tuo account Google nella sezione Social del progetto.';
        toast.error(msg, { id: tid, duration: 7000 });
        return;
      }
      toast.dismiss(tid);
      await loadGooglePickerApi();
      const { PickerBuilder, Action } = window.google.picker;
      // No MIME filter: filtering causes flat global search instead of tree navigation.
      // Users see the full folder tree and can navigate normally.
      const view = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false)
        .setParent('root');
      const pickerToken = data.token;
      new PickerBuilder()
        .addView(view)
        .setOAuthToken(pickerToken)
        .setCallback(async (pickerData) => {
          if (pickerData.action !== Action.PICKED) return;
          const doc = pickerData.docs[0];
          // Only accept images and videos
          const allowed = ['image/', 'video/'];
          if (!allowed.some(t => (doc.mimeType || '').startsWith(t))) {
            toast.error('Seleziona un\'immagine o un video, non un documento.');
            return;
          }
          const importTid = toast.loading(`Download di "${doc.name}" in corso...`);
          try {
            // Download client-side with the picker token (avoids server-side scope issues)
            const dlResp = await fetch(
              `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
              { headers: { Authorization: `Bearer ${pickerToken}` } }
            );
            if (!dlResp.ok) {
              if (dlResp.status === 403 || dlResp.status === 404) throw new Error('Autorizzazioni insufficienti. Disconnetti e riconnetti Google Drive nella sezione Social.');
              throw new Error(`Google Drive ha rifiutato il download (${dlResp.status})`);
            }
            const blob = await dlResp.blob();
            const file = new File([blob], doc.name, { type: doc.mimeType || blob.type });
            const fd = new FormData();
            fd.append('file', file);
            const { data: media } = await api.post(`/media/upload/${content.id}`, fd);
            const updated = { ...content, media: [...(content.media || []), media] };
            setContent(updated); onUpdate?.(updated);
            toast.success(`"${doc.name}" importato da Drive`, { id: importTid });
          } catch (e) { toast.error('Errore importazione: ' + e.message, { id: importTid }); }
        })
        .build()
        .setVisible(true);
    } catch (e) {
      toast.error('Errore Google Drive: ' + (e.response?.data?.detail || e.message), { id: tid });
    }
  };

  const toggleSocial = (profId) => {
    setSelectedSocials(prev => prev.includes(profId) ? prev.filter(id => id !== profId) : [...prev, profId]);
  };

  const selectedProfiles = socialProfiles.filter(p => selectedSocials.includes(p.id));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/contents/${content.id}`, { script: editScript, caption: editCaption, hashtags: editHashtags, opening_hook: editOpeningHook, visual_direction: editVisualDirection });
      const updated = { ...content, script: editScript, caption: editCaption, hashtags: editHashtags, opening_hook: editOpeningHook, visual_direction: editVisualDirection };
      setContent(updated); onUpdate?.(updated);
    } catch {}
    setSaving(false);
  };

  const regenerate = async () => {
    if (!window.confirm('Rigenerare questo contenuto?')) return;
    setSaving(true);
    const tid = toast.loading('Rigenerazione in corso...');
    try {
      const { data } = await api.post('/contents/regenerate', { content_id: content.id, project_id: project.id });
      setEditScript(data.script || ''); setEditCaption(data.caption || ''); setEditHashtags(String(data.hashtags || ''));
      setEditOpeningHook(data.opening_hook || ''); setEditVisualDirection(data.visual_direction || '');
      setContent(data); onUpdate?.(data);
      toast.success('Contenuto rigenerato', { id: tid });
    } catch (e) { toast.error('Errore: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    setSaving(false);
  };

  const convert = async (targetOverride) => {
    const target = targetOverride || (content.format === 'reel' ? 'carousel' : 'reel');
    if (!window.confirm(`Convertire in ${target}?`)) return;
    setSaving(true);
    const tid = toast.loading(`Conversione in ${target}...`);
    try {
      const { data } = await api.post('/contents/convert', { content_id: content.id, project_id: project.id, target_format: target });
      setEditScript(data.script || ''); setEditCaption(data.caption || ''); setEditHashtags(String(data.hashtags || ''));
      setEditOpeningHook(data.opening_hook || ''); setEditVisualDirection(data.visual_direction || '');
      setContent(data); onUpdate?.(data);
      toast.success(`Convertito in ${target}`, { id: tid });
    } catch (e) { toast.error('Errore: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    setSaving(false);
  };

  const publish = async () => {
    if (selectedSocials.length === 0) { toast.warning('Seleziona almeno un social dalla colonna sinistra.'); return; }
    setPublishing(true);
    const tid = toast.loading('Pubblicazione in corso...');
    try {
      await save();
      const now = new Date().toISOString();
      await api.post('/publish/schedule', { content_id: content.id, project_id: project.id, social_profile_ids: selectedSocials, scheduled_at: now });
      await api.post(`/publish/mark-published/${content.id}`);
      const updated = { ...content, status: 'published' };
      setContent(updated); onUpdate?.(updated);
      toast.success('Contenuto pubblicato con successo!', { id: tid });
    } catch (e) { toast.error('Errore pubblicazione: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    setPublishing(false);
  };

  const cancelSchedule = async () => {
    if (contentQueueItems.length === 0) return;
    setCancellingSchedule(true);
    const tid = toast.loading('Annullamento programmazione...');
    try {
      await Promise.all(contentQueueItems.map(item => api.delete(`/publish/queue/${item.id}`).catch(() => {})));
      setContentQueueItems([]);
      const updated = { ...content, status: 'draft' };
      setContent(updated); onUpdate?.(updated);
      toast.success('Programmazione annullata', { id: tid });
    } catch (e) { toast.error('Errore: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    setCancellingSchedule(false);
  };

  const schedule = async () => {
    if (!scheduleDate || selectedSocials.length === 0) { toast.warning('Seleziona data e almeno un social.'); return; }
    setScheduling(true);
    const tid = toast.loading(contentQueueItems.length > 0 ? 'Riprogrammazione in corso...' : 'Programmazione in corso...');
    try {
      await save();
      if (contentQueueItems.length > 0) {
        await Promise.all(contentQueueItems.map(item => api.delete(`/publish/queue/${item.id}`).catch(() => {})));
      }
      await api.post('/publish/schedule', { content_id: content.id, project_id: project.id, social_profile_ids: selectedSocials, scheduled_at: `${scheduleDate}T${scheduleTime}:00Z` });
      const { data: queueData } = await api.get(`/publish/queue/${project.id}`);
      const newItems = queueData.filter(q => q.content_id === content.id && q.status === 'queued');
      setContentQueueItems(newItems);
      const updated = { ...content, status: 'scheduled' };
      setContent(updated); onUpdate?.(updated);
      setShowSchedule(false);
      toast.success(`Programmato per il ${scheduleDate} alle ${scheduleTime}`, { id: tid });
    } catch (e) { toast.error('Errore programmazione: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    setScheduling(false);
  };

  const uploadMedia = async (file) => {
    const fd = new FormData(); fd.append('file', file);
    setUploadingMedia(true);
    const tid = toast.loading('Upload in corso...');
    try {
      const { data } = await api.post(`/media/upload/${content.id}`, fd);
      const updated = { ...content, media: [...(content.media || []), data] };
      setContent(updated); onUpdate?.(updated);
      toast.success('File caricato', { id: tid });
    } catch (e) { toast.error('Errore upload: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    setUploadingMedia(false);
  };

  const deleteMedia = async (mediaId) => {
    setDeletingMediaId(mediaId);
    try {
      await api.delete(`/media/${content.id}/${mediaId}`);
      const updated = { ...content, media: (content.media || []).filter(m => m.id !== mediaId) };
      setContent(updated); onUpdate?.(updated);
      toast.success('File eliminato');
    } catch (e) { toast.error('Errore eliminazione'); }
    setDeletingMediaId(null);
  };

  const hashtagList = String(editHashtags || '').split(/[\s,]+/).filter(h => h.length > 1).map(h => h.startsWith('#') ? h : `#${h}`);

  /* Shared components */
  const SocialColumn = () => (
    <div className={isMobile ? 'p-4' : 'w-52 border-r border-[var(--border-color)] p-4 overflow-y-auto flex-shrink-0'}>
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-3">Pubblica su</p>
      {socialProfiles.map(prof => {
        const pi = PLATFORM_ICONS[prof.platform] || { Icon: Globe, color: '#fff', name: prof.platform };
        const isSelected = selectedSocials.includes(prof.id);
        return (
          <div key={prof.id} data-testid={`social-toggle-${prof.platform}`}
            className="flex items-center gap-2 p-2 rounded-lg mb-2 cursor-pointer transition-all"
            style={{ background: isSelected ? `${pi.color}15` : 'transparent', border: isSelected ? `1.5px solid ${pi.color}` : '1.5px solid transparent', opacity: isSelected ? 1 : 0.5 }}
            onClick={() => toggleSocial(prof.id)}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${pi.color}20` }}>
              <pi.Icon weight="fill" size={16} color={pi.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{prof.profile_name}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{pi.name}</p>
            </div>
            {isSelected && <Check size={14} weight="bold" color={pi.color} />}
          </div>
        );
      })}
      {socialProfiles.length === 0 && <p className="text-xs text-[var(--text-muted)]">Nessun social connesso. Vai su Social per collegare i tuoi account.</p>}
    </div>
  );

  const EditorColumn = () => (
    <div className={isMobile ? 'p-4' : 'flex-1 overflow-y-auto p-6'}>
      {content.format === 'prompted_reel' && (
        <>
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#a855f7' }}>⚡ OPENING HOOK (primi 3-5 secondi)</p>
            <textarea className="input-dark w-full text-sm" rows={2} value={editOpeningHook} onChange={e => setEditOpeningHook(e.target.value)}
              placeholder="Testo di apertura ad impatto..." style={{ paddingLeft: '1rem', lineHeight: 1.7 }} />
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Script Avatar</p>
            <textarea className="input-dark w-full text-sm" rows={isMobile ? 6 : 8} value={editScript} onChange={e => setEditScript(e.target.value)}
              placeholder="Script per l'avatar (usa [pausa], [enfasi], [veloce]...)..." style={{ paddingLeft: '1rem', lineHeight: 1.7 }} />
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Regia Visiva</p>
            <textarea className="input-dark w-full text-sm" rows={isMobile ? 3 : 4} value={editVisualDirection} onChange={e => setEditVisualDirection(e.target.value)}
              placeholder="Sfondo, gesti, abbigliamento, stile..." style={{ paddingLeft: '1rem', lineHeight: 1.7 }} />
          </div>
        </>
      )}
      {content.format !== 'prompted_reel' && (
        <div className="mb-4">
          <textarea className="input-dark w-full text-sm" rows={isMobile ? 4 : 6} value={editScript} onChange={e => setEditScript(e.target.value)}
            placeholder="Script del contenuto..." style={{ paddingLeft: '1rem', lineHeight: 1.7 }} />
        </div>
      )}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Caption</p>
        <textarea className="input-dark w-full text-sm" rows={isMobile ? 3 : 5} value={editCaption} onChange={e => setEditCaption(e.target.value)}
          placeholder="Caption del post..." style={{ paddingLeft: '1rem', lineHeight: 1.7 }} />
      </div>
      <div className="mb-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Hashtag</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {hashtagList.map((h, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>{h}</span>
          ))}
        </div>
        <input className="input-dark w-full text-sm" value={editHashtags} onChange={e => setEditHashtags(e.target.value)}
          placeholder="#hashtag1 #hashtag2..." style={{ paddingLeft: '1rem' }} />
      </div>
      <div className="mb-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Media</p>
        <label className="block p-4 md:p-6 rounded-lg border border-dashed border-[var(--border-color)] text-center cursor-pointer hover:border-[var(--gradient-start)] transition-colors mb-3" style={uploadingMedia ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
          {uploadingMedia ? (
            <>
              <div className="w-5 h-5 border-2 border-[var(--gradient-start)] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
              <p className="font-medium text-sm text-[var(--accent-purple)]">Upload in corso...</p>
            </>
          ) : (
            <>
              <p className="font-medium text-sm">Allega un media</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Max 400 MB</p>
            </>
          )}
          <input type="file" accept="image/*,video/*" className="hidden" disabled={uploadingMedia} onChange={e => { if (e.target.files[0]) uploadMedia(e.target.files[0]); }} />
        </label>
        {generatingImage && (
          <div className="flex items-center gap-3 p-3 rounded-lg mb-3" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <div className="w-4 h-4 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-xs text-[var(--accent-purple)]">Generazione immagine in corso...</p>
          </div>
        )}
        {content.media && content.media.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {content.media.map(m => (
              <div key={m.id} className="relative group w-14 h-14 md:w-16 md:h-16">
                {m.type === 'image' ? (
                  <img src={`${process.env.REACT_APP_BACKEND_URL}${m.url}`} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-full rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center"><Video size={20} /></div>
                )}
                {m.type === 'image' && (
                  <button className="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setLightboxUrl(`${process.env.REACT_APP_BACKEND_URL}${m.url}`)}>
                    <Eye size={18} color="white" />
                  </button>
                )}
                <button className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-pink)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteMedia(m.id)} disabled={deletingMediaId === m.id}>
                  {deletingMediaId === m.id
                    ? <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin" />
                    : <X size={8} color="white" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        {content.format === 'prompted_reel' ? (
          <button className="btn-gradient text-xs py-1.5 px-3" onClick={() => {
            const avatarScript = `OPENING:\n${editOpeningHook}\n\nSCRIPT:\n${editScript}\n\nREGIA:\n${editVisualDirection}`;
            navigator.clipboard.writeText(avatarScript); toast.success('Script avatar copiato!');
          }}>
            🤖 Copia Script Avatar
          </button>
        ) : (
          <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => { navigator.clipboard.writeText(`${editScript}\n\n${editCaption}\n\n${editHashtags}`); toast.success('Copiato!'); }}>
            <Copy size={14} /> Copia
          </button>
        )}
        {content.format === 'prompted_reel' ? (
          <>
            <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => convert('reel')}><Video size={14} /> Reel</button>
            <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => convert('carousel')}><Image size={14} /> Carousel</button>
          </>
        ) : (
          <>
            <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => convert()}>
              {content.format === 'reel' ? <><Image size={14} /> Carousel</> : <><Video size={14} /> Reel</>}
            </button>
            <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => convert('prompted_reel')}>
              🤖 Prompted Reel
            </button>
          </>
        )}
        <button className="btn-ghost text-xs py-1.5 px-3" onClick={regenerate} disabled={saving}>
          <ArrowClockwise size={14} /> Rigenera
        </button>
        <div className="flex gap-1 items-center" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 8 }}>
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title="FLUX AI" onClick={() => {
            setInputModal({ title: 'Genera immagine con FLUX AI', placeholder: "Descrivi il soggetto e l'ambientazione...", value: editVisualDirection || editScript || '', multiline: true, isFlux: true,
              onConfirm: async (prompt) => {
                setGeneratingImage(true);
                try { const { data } = await api.post('/media/generate-dalle', { content_id: content.id, prompt, project_id: project.id, model: imageModel }); const updated = { ...content, media: [...(content.media||[]), data] }; setContent(updated); onUpdate?.(updated); toast.success('Immagine generata!'); } catch(e) { toast.error('Errore generazione immagine: ' + (e.response?.data?.detail || e.message)); }
                setGeneratingImage(false);
              },

            });
          }}>
            <Sparkle size={16} weight="fill" color="#a855f7" />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors relative"
            title={canvaConnected ? 'Apri in Canva' : 'Connetti Canva e apri editor'}
            onClick={handleCanvaClick}
            disabled={canvaLoading}
          >
            {canvaLoading
              ? <div className="w-4 h-4 border-2 border-[#7D2AE8] border-t-transparent rounded-full animate-spin" />
              : <CanvaIcon size={16} />}
            {canvaConnected && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-[var(--bg-primary)]" />}
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title="Importa da Google Drive" onClick={openDrivePicker}>
            <Download size={16} color="#34a853" />
          </button>
        </div>
        <button
          className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
          style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 12, color: renderingVideo ? 'var(--text-muted)' : 'var(--accent-purple)' }}
          disabled={renderingVideo}
          title="Genera video animato con HyperFrames"
          onClick={async () => {
            setRenderingVideo(true);
            const tid = toast.loading('Rendering video in corso… (1-2 min)');
            try {
              const { data } = await api.post('/media/render-video', { content_id: content.id });
              const updated = { ...content, media: [...(content.media || []), data] };
              setContent(updated); onUpdate?.(updated);
              toast.success('Video generato e aggiunto ai media!', { id: tid, duration: 6000 });
            } catch (e) {
              toast.error('Errore rendering: ' + (e.response?.data?.detail || e.message), { id: tid });
            }
            setRenderingVideo(false);
          }}
        >
          {renderingVideo
            ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Rendering...</>
            : <>🎬 Genera Video</>}
        </button>
      </div>
    </div>
  );

  const PreviewColumn = () => (
    <div className={isMobile ? 'p-4' : 'w-80 border-l border-[var(--border-color)] p-4 overflow-y-auto flex-shrink-0'}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Anteprima Post</p>
        {selectedSocials.length > 0 && <span className="badge blue text-[10px]">{selectedSocials.length} social</span>}
      </div>
      {selectedProfiles.length > 0 ? selectedProfiles.map(prof => {
        const pi = PLATFORM_ICONS[prof.platform] || { Icon: Globe, color: '#fff', name: prof.platform };
        const previewCaption = editCaption.length > 150 ? editCaption.slice(0, 150) + '...' : editCaption;
        return (
          <div key={prof.id} className="mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${pi.color}20` }}>
                <pi.Icon weight="fill" size={14} color={pi.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{prof.profile_name} · {pi.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{project.sector}</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: `${pi.color}20`, color: pi.color }}>{pi.name.toUpperCase()}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2" style={{ whiteSpace: 'pre-wrap' }}>{previewCaption}</p>
            {content.media && content.media[0] && content.media[0].type === 'image' && (
              <img src={`${process.env.REACT_APP_BACKEND_URL}${content.media[0].url}`} alt="" className="w-full h-32 md:h-40 object-cover rounded-lg mb-2" />
            )}
          </div>
        );
      }) : (
        <div className="text-center py-8 md:py-12">
          <Eye size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-xs text-[var(--text-muted)] mb-1">Seleziona i social{!isMobile && ' dalla colonna sinistra'}</p>
        </div>
      )}
    </div>
  );

  return (
    <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: isMobile ? 0 : 24 }}
      onClick={onClose}>
    <motion.div initial={{ scale: isMobile ? 1 : 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
      className={`${isMobile ? 'w-full h-full' : 'w-full max-w-[1400px] h-[85vh] rounded-xl'} overflow-hidden flex flex-col`}
      style={{ background: 'var(--bg-primary)', border: isMobile ? 'none' : '1px solid var(--border-color)' }}
      onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--border-color)] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`badge text-[10px] ${content.format === 'reel' ? 'pink' : content.format === 'prompted_reel' ? 'purple' : 'blue'}`}>
            {content.format === 'reel' ? <Video size={10} /> : content.format === 'prompted_reel' ? <span>🤖</span> : <Image size={10} />}
            <span className="ml-1">{content.format === 'prompted_reel' ? 'prompted reel' : content.format}</span>
          </span>
          <h2 className="font-semibold text-xs md:text-sm truncate">{content.hook_text}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge text-[10px] ${content.status === 'published' ? 'green' : content.status === 'scheduled' ? 'orange' : 'purple'}`}>
            {content.status || 'draft'}
          </span>
          <button onClick={onClose} className="btn-ghost p-1.5" data-testid="close-content-detail"><X size={18} /></button>
        </div>
      </div>

      {/* Mobile Tabs */}
      {isMobile && (
        <div className="flex border-b border-[var(--border-color)] flex-shrink-0">
          {[
            { id: 'editor', label: 'Editor' },
            { id: 'social', label: `Social${selectedSocials.length > 0 ? ` (${selectedSocials.length})` : ''}` },
            { id: 'preview', label: 'Anteprima' },
          ].map(t => (
            <button key={t.id} className={`flex-1 text-xs font-medium py-2.5 transition-colors ${mobileTab === t.id ? 'text-white border-b-2 border-[var(--gradient-start)]' : 'text-[var(--text-muted)]'}`}
              onClick={() => setMobileTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content - Desktop: 3 cols, Mobile: tabbed single column */}
      <div className="flex flex-1 overflow-hidden">
        {isMobile ? (
          <div className="flex-1 overflow-y-auto">
            {mobileTab === 'social' && SocialColumn()}
            {mobileTab === 'editor' && EditorColumn()}
            {mobileTab === 'preview' && PreviewColumn()}
          </div>
        ) : (
          <>
            {SocialColumn()}
            {EditorColumn()}
            {PreviewColumn()}
          </>
        )}
      </div>

      {/* Bottom Bar */}
      <div className={`flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3 border-t border-[var(--border-color)] flex-shrink-0 ${isMobile ? 'flex-wrap gap-2' : ''}`} style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold ${content.status === 'published' ? 'text-[var(--accent-green)]' : content.status === 'scheduled' ? 'text-[var(--accent-orange)]' : 'text-[var(--accent-purple)]'}`}>
            {content.status === 'published' ? 'Pubblicato' : content.status === 'scheduled' ? 'Programmato' : 'Bozza'}
          </span>
          {content.status === 'scheduled' && contentQueueItems[0]?.scheduled_at && (
            <span className="text-[10px] font-medium" style={{ color: 'var(--accent-orange)' }}>
              {new Date(contentQueueItems[0].scheduled_at).toLocaleString('it', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {selectedSocials.length > 0 && <span className="text-[10px] text-[var(--text-muted)]">{selectedSocials.length} social</span>}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button className="btn-ghost text-xs py-1.5" onClick={save} disabled={saving} data-testid="save-draft-btn">
            <FloppyDisk size={14} /> {saving ? '...' : 'Salva'}
          </button>
          <button className="btn-ghost text-xs py-1.5" onClick={publish} disabled={publishing || selectedSocials.length === 0} data-testid="publish-btn"
            style={selectedSocials.length === 0 ? { opacity: 0.4 } : {}}>
            {publishing ? <><span className="animate-spin inline-block">⏳</span> Invio...</> : <><PaperPlaneTilt size={14} /> Pubblica</>}
          </button>
          {(content.status === 'scheduled' || contentQueueItems.length > 0) && (
            <button className="btn-ghost text-xs py-1.5" onClick={cancelSchedule} disabled={cancellingSchedule}
              style={{ color: 'var(--accent-pink)' }} title="Annulla programmazione e riporta a bozza">
              {cancellingSchedule
                ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                : <><XCircle size={14} /> Annulla prog.</>}
            </button>
          )}
          <button className="btn-gradient text-xs py-1.5" onClick={() => setShowSchedule(!showSchedule)} data-testid="schedule-btn"
            disabled={scheduling} style={{ opacity: scheduling ? 0.5 : 1 }}>
            <CalendarBlank size={14} /> {contentQueueItems.length > 0 ? 'Modifica' : 'Programma'}
          </button>
        </div>
      </div>

      {/* Schedule Popup */}
      {showSchedule && (
        <div className={`absolute ${isMobile ? 'bottom-14 left-3 right-3' : 'bottom-16 right-6'} z-10 card w-auto md:w-72 p-4`} style={{ background: 'var(--bg-card)' }}>
          <p className="text-sm font-semibold mb-3">{contentQueueItems.length > 0 ? 'Modifica Programmazione' : 'Programma Pubblicazione'}</p>
          <p className="text-[10px] text-[var(--text-muted)] mb-3">Su {selectedSocials.length} social selezionati</p>
          <div className="flex gap-2 mb-3">
            <input type="date" className="input-dark text-sm py-1.5 flex-1" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ paddingLeft: '0.5rem' }} />
            <input type="time" className="input-dark text-sm py-1.5 w-24" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ paddingLeft: '0.5rem' }} />
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 text-xs" onClick={() => setShowSchedule(false)} disabled={scheduling}>Annulla</button>
            <button className="btn-gradient flex-1 text-xs" onClick={schedule} disabled={scheduling}>
              {scheduling ? <><span className="animate-spin inline-block mr-1">⏳</span>Invio...</> : 'Conferma'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
    </motion.div>

    {/* Input Modal (replaces window.prompt) */}
    {inputModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setInputModal(null)}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
          <h3 className="font-semibold text-base mb-3">{inputModal.title}</h3>
          {inputModal.isFlux && (
            <button
              className="btn-ghost text-xs py-1 px-2 mb-2 w-full"
              disabled={optimizingPrompt}
              onClick={async () => {
                const el = document.getElementById('input-modal-field');
                const current = el.value.trim();
                if (!current) return;
                setOptimizingPrompt(true);
                try {
                  const { data } = await api.post('/media/optimize-prompt', {
                    visual_direction: current,
                    script: editScript || '',
                    project_id: project.id,
                  });
                  el.value = data.prompt;
                } catch(e) { toast.error('Errore ottimizzazione: ' + (e.response?.data?.detail || e.message)); }
                setOptimizingPrompt(false);
              }}
            >
              {optimizingPrompt ? '...' : '🤖 Ottimizza per AI'}
            </button>
          )}
          {inputModal.multiline
            ? <textarea className="input-dark w-full mb-3" rows={4} placeholder={inputModal.placeholder}
                defaultValue={inputModal.value}
                id="input-modal-field"
                style={{ paddingLeft: '0.75rem', paddingTop: '0.5rem', resize: 'vertical' }} />
            : <input className="input-dark w-full mb-3" placeholder={inputModal.placeholder}
                defaultValue={inputModal.value}
                id="input-modal-field"
                style={{ paddingLeft: '0.75rem' }} />
          }
          {inputModal.isFlux && (
            <div className="mb-4">
              <p className="text-xs text-[var(--text-muted)] mb-2">Motore</p>
              <div className="flex gap-2 mb-3">
                <button className={`preset-btn flex-1 text-xs py-1 ${imageModel === 'flux' ? 'active' : ''}`} onClick={() => setImageModel('flux')}>⚡ FLUX</button>
                <button className={`preset-btn flex-1 text-xs py-1 ${imageModel === 'gemini' ? 'active' : ''}`} onClick={() => setImageModel('gemini')}>🍌 Nano Banana</button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-2">Stile</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { id: 'fotorealistico', label: '📷 Fotorealistico' },
                  { id: 'pittorico', label: '🎨 Pittorico' },
                  { id: 'cartoon', label: '🖼️ Cartoon' },
                  { id: 'ink', label: '✒️ Ink & Pen' },
                ].map(s => (
                  <button key={s.id} className={`preset-btn text-xs py-1 px-2 ${fluxStyle === s.id ? 'active' : ''}`}
                    onClick={() => setFluxStyle(s.id)}>{s.label}</button>
                ))}
              </div>
              {fluxStyle === 'fotorealistico' && (
                <>
                  <p className="text-xs text-[var(--text-muted)] mb-2">Inquadratura</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'wide', label: '🌄 Wide shot' },
                      { id: 'full', label: '🧍 Full body' },
                      { id: 'medium', label: '👤 Medium shot' },
                      { id: 'closeup', label: '🎭 Close-up' },
                      { id: 'macro', label: '🔬 Macro' },
                    ].map(c => (
                      <button key={c.id} className={`preset-btn text-xs py-1 px-2 ${fluxComposition === c.id ? 'active' : ''}`}
                        onClick={() => setFluxComposition(c.id)}>{c.label}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setInputModal(null)}>Annulla</button>
            <button className="btn-gradient flex-1" onClick={() => {
              const soggetto = document.getElementById('input-modal-field').value.trim();
              if (!soggetto) return;
              const compositionMap = { wide: 'Wide shot', full: 'Full body', medium: 'Medium shot / Waist-up', closeup: 'Close-up / Portrait', macro: 'Macro' };
              const stylePrompts = {
                fotorealistico: `A professional high-fidelity photograph of ${soggetto}. Composition: ${compositionMap[fluxComposition] || 'Wide shot'}. Lighting: natural light with accurate global illumination and realistic ray-traced reflections. Camera: shot on full-frame sensor, sharp focus, deep dynamic range. Technical: 8k UHD, highly detailed textures, masterpiece, color graded for a cinematic look, no digital noise, no artificial sharpening. Authentic atmosphere, hyper-realistic details.`,
                pittorico: `${soggetto}. Fine art oil painting, expressive visible brushstrokes, rich impasto texture, chiaroscuro dramatic lighting inspired by Caravaggio, canvas texture, masterpiece, no photorealism.`,
                cartoon: `${soggetto}. Professional 2D vector illustration, clean flat design, bold outlines, solid colors, modern cel-shaded animation style, high contrast, sharp edges.`,
                ink: `${soggetto}. Professional ink pen drawing, clean black ink lines, stippling and crosshatch linework for depth, high contrast, elegant hand-drawn style, white background.`,
              };
              const finalVal = inputModal.isFlux ? stylePrompts[fluxStyle] : soggetto;
              setInputModal(null);
              inputModal.onConfirm(finalVal);
            }}>Genera</button>
          </div>
        </motion.div>
      </div>
    )}
    {lightboxUrl && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={() => setLightboxUrl(null)}>
        <button className="absolute top-4 right-4 btn-ghost p-2" onClick={() => setLightboxUrl(null)}><X size={24} /></button>
        <img src={lightboxUrl} alt="" className="max-w-full max-h-full rounded-xl object-contain" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()} />
      </div>
    )}
    </>
  );
}
