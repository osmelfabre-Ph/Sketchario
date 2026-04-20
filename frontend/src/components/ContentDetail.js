import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import usePostNitro from './usePostNitro';
import {
  X, Plus, Video, Image, Sparkle, ArrowClockwise, Download,
  InstagramLogo, LinkedinLogo, FacebookLogo, TiktokLogo, PinterestLogo, Globe,
  CalendarBlank, PaperPlaneTilt, Copy, FloppyDisk, Eye, CheckCircle, Check
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

const PostNitroIcon = ({ size = 16 }) => (
  <img src="https://postnitro.ai/favicon.ico" alt="PostNitro" style={{ width: size, height: size, borderRadius: 3, objectFit: 'cover' }} />
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
  const { openEditor: openPostNitro } = usePostNitro();
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
  const [publishing, setPublishing] = useState(false);
  const [mobileTab, setMobileTab] = useState('editor');
  const [inputModal, setInputModal] = useState(null); // { title, placeholder, value, multiline, onConfirm }
  const [generatingImage, setGeneratingImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [fluxStyle, setFluxStyle] = useState('fotorealistico');
  const [imageModel, setImageModel] = useState('flux');

  useEffect(() => {
    api.get('/social/profiles').then(r => setSocialProfiles(r.data)).catch(() => {});
    api.get(`/social/project/${project.id}`).then(r => setProjectSocials(r.data)).catch(() => {});
  }, [api, project.id]);

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
    try {
      const { data } = await api.post('/contents/regenerate', { content_id: content.id, project_id: project.id });
      setEditScript(data.script || ''); setEditCaption(data.caption || ''); setEditHashtags(String(data.hashtags || ''));
      setEditOpeningHook(data.opening_hook || ''); setEditVisualDirection(data.visual_direction || '');
      setContent(data); onUpdate?.(data);
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
    setSaving(false);
  };

  const convert = async (targetOverride) => {
    const target = targetOverride || (content.format === 'reel' ? 'carousel' : 'reel');
    if (!window.confirm(`Convertire in ${target}?`)) return;
    setSaving(true);
    try {
      const { data } = await api.post('/contents/convert', { content_id: content.id, project_id: project.id, target_format: target });
      setEditScript(data.script || ''); setEditCaption(data.caption || ''); setEditHashtags(String(data.hashtags || ''));
      setEditOpeningHook(data.opening_hook || ''); setEditVisualDirection(data.visual_direction || '');
      setContent(data); onUpdate?.(data);
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
    setSaving(false);
  };

  const publish = async () => {
    if (selectedSocials.length === 0) { alert('Seleziona almeno un social dalla colonna sinistra.'); return; }
    setPublishing(true);
    try {
      await save();
      const now = new Date().toISOString();
      await api.post('/publish/schedule', { content_id: content.id, project_id: project.id, social_profile_ids: selectedSocials, scheduled_at: now });
      await api.post(`/publish/mark-published/${content.id}`);
      const updated = { ...content, status: 'published' };
      setContent(updated); onUpdate?.(updated);
      alert('Contenuto pubblicato!');
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
    setPublishing(false);
  };

  const schedule = async () => {
    if (!scheduleDate || selectedSocials.length === 0) { alert('Seleziona data e almeno un social.'); return; }
    try {
      await save();
      await api.post('/publish/schedule', { content_id: content.id, project_id: project.id, social_profile_ids: selectedSocials, scheduled_at: `${scheduleDate}T${scheduleTime}:00Z` });
      const updated = { ...content, status: 'scheduled' };
      setContent(updated); onUpdate?.(updated);
      setShowSchedule(false);
      alert('Contenuto programmato!');
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
  };

  const uploadMedia = async (file) => {
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post(`/media/upload/${content.id}`, fd);
      const updated = { ...content, media: [...(content.media || []), data] };
      setContent(updated); onUpdate?.(updated);
    } catch (e) { alert('Errore upload: ' + (e.response?.data?.detail || e.message)); }
  };

  const deleteMedia = async (mediaId) => {
    await api.delete(`/media/${content.id}/${mediaId}`);
    const updated = { ...content, media: (content.media || []).filter(m => m.id !== mediaId) };
    setContent(updated); onUpdate?.(updated);
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
        <label className="block p-4 md:p-6 rounded-lg border border-dashed border-[var(--border-color)] text-center cursor-pointer hover:border-[var(--gradient-start)] transition-colors mb-3">
          <p className="font-medium text-sm">Allega un media</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Max 400 MB</p>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={e => { if (e.target.files[0]) uploadMedia(e.target.files[0]); }} />
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
                <button className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-pink)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteMedia(m.id)}>
                  <X size={8} color="white" />
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
            navigator.clipboard.writeText(avatarScript); alert('Script avatar copiato!');
          }}>
            🤖 Copia Script Avatar
          </button>
        ) : (
          <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => { navigator.clipboard.writeText(`${editScript}\n\n${editCaption}\n\n${editHashtags}`); alert('Copiato!'); }}>
            <Copy size={14} /> Copia
          </button>
        )}
        {content.format === 'prompted_reel' ? (
          <>
            <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => convert('reel')}><Video size={14} /> Reel</button>
            <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => convert('carousel')}><Image size={14} /> Carousel</button>
          </>
        ) : (
          <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => convert()}>
            {content.format === 'reel' ? <><Image size={14} /> Carousel</> : <><Video size={14} /> Reel</>}
          </button>
        )}
        <button className="btn-ghost text-xs py-1.5 px-3" onClick={regenerate} disabled={saving}>
          <ArrowClockwise size={14} /> Rigenera
        </button>
        <div className="flex gap-1 items-center" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 8 }}>
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title="FLUX AI" onClick={() => {
            setInputModal({ title: 'Genera immagine con FLUX AI', placeholder: "Descrivi l'immagine che vuoi generare...", value: content.hook_text || '', multiline: true, isFlux: true,
              onConfirm: async (prompt) => {
                setGeneratingImage(true);
                try { const { data } = await api.post('/media/generate-dalle', { content_id: content.id, prompt, project_id: project.id, model: imageModel }); const updated = { ...content, media: [...(content.media||[]), data] }; setContent(updated); onUpdate?.(updated); } catch(e) { alert('Errore generazione immagine: ' + (e.response?.data?.detail || e.message)); }
                setGeneratingImage(false);
              },

            });
          }}>
            <Sparkle size={16} weight="fill" color="#a855f7" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title="Canva" onClick={async () => {
            const popup = window.open('about:blank', 'canva_oauth', 'width=600,height=700,left=200,top=100');
            try {
              const { data } = await api.get('/canva/auth-url');
              if (!data.auth_url) { popup?.close(); return; }
              popup.location.href = data.auth_url;
              const handler = async (e) => {
                if (e.data?.type === 'canva_success') {
                  window.removeEventListener('message', handler);
                  popup?.close();
                } else if (e.data?.type === 'canva_error') {
                  window.removeEventListener('message', handler);
                  popup?.close();
                  alert('Errore Canva: ' + e.data.error);
                }
              };
              window.addEventListener('message', handler);
            } catch(e) { popup?.close(); alert('Errore Canva: ' + (e.response?.data?.detail || e.message)); }
          }}>
            <CanvaIcon size={16} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title="PostNitro" onClick={async () => {
            const result = await openPostNitro(content.id, project.id, content.hook_text);
            if (result?.success) { const { data } = await api.get(`/contents/${project.id}`); const u = data.find(c => c.id === content.id); if (u) { setContent(u); onUpdate?.(u); } }
          }}>
            <PostNitroIcon size={16} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title="Google Drive" onClick={() => {
            setInputModal({ title: 'Importa da Google Drive', placeholder: 'Incolla qui il link diretto al file...', value: '', multiline: false,
              onConfirm: async (url) => {
                try { const { data } = await api.post('/media/import-drive', { content_id: content.id, file_url: url }); const updated = { ...content, media: [...(content.media||[]), data] }; setContent(updated); onUpdate?.(updated); } catch(e) { alert('Errore'); }
              }
            });
          }}>
            <Download size={16} color="#34a853" />
          </button>
        </div>
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
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">{previewCaption}</p>
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
            {mobileTab === 'social' && <SocialColumn />}
            {mobileTab === 'editor' && <EditorColumn />}
            {mobileTab === 'preview' && <PreviewColumn />}
          </div>
        ) : (
          <>
            <SocialColumn />
            <EditorColumn />
            <PreviewColumn />
          </>
        )}
      </div>

      {/* Bottom Bar */}
      <div className={`flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3 border-t border-[var(--border-color)] flex-shrink-0 ${isMobile ? 'flex-wrap gap-2' : ''}`} style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${content.status === 'published' ? 'text-[var(--accent-green)]' : content.status === 'scheduled' ? 'text-[var(--accent-orange)]' : 'text-[var(--accent-purple)]'}`}>
            {content.status === 'published' ? 'Pubblicato' : content.status === 'scheduled' ? 'Programmato' : 'Bozza'}
          </span>
          {selectedSocials.length > 0 && <span className="text-[10px] text-[var(--text-muted)]">{selectedSocials.length} social</span>}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs py-1.5" onClick={save} disabled={saving} data-testid="save-draft-btn">
            <FloppyDisk size={14} /> {saving ? '...' : 'Salva'}
          </button>
          <button className="btn-ghost text-xs py-1.5" onClick={publish} disabled={publishing || selectedSocials.length === 0} data-testid="publish-btn"
            style={selectedSocials.length === 0 ? { opacity: 0.4 } : {}}>
            <PaperPlaneTilt size={14} /> Pubblica
          </button>
          <button className="btn-gradient text-xs py-1.5" onClick={() => setShowSchedule(!showSchedule)} data-testid="schedule-btn"
            disabled={selectedSocials.length === 0} style={selectedSocials.length === 0 ? { opacity: 0.5 } : {}}>
            <CalendarBlank size={14} /> Programma
          </button>
        </div>
      </div>

      {/* Schedule Popup */}
      {showSchedule && (
        <div className={`absolute ${isMobile ? 'bottom-14 left-3 right-3' : 'bottom-16 right-6'} z-10 card w-auto md:w-72 p-4`} style={{ background: 'var(--bg-card)' }}>
          <p className="text-sm font-semibold mb-3">Programma Pubblicazione</p>
          <p className="text-[10px] text-[var(--text-muted)] mb-3">Su {selectedSocials.length} social selezionati</p>
          <div className="flex gap-2 mb-3">
            <input type="date" className="input-dark text-sm py-1.5 flex-1" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ paddingLeft: '0.5rem' }} />
            <input type="time" className="input-dark text-sm py-1.5 w-24" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ paddingLeft: '0.5rem' }} />
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 text-xs" onClick={() => setShowSchedule(false)}>Annulla</button>
            <button className="btn-gradient flex-1 text-xs" onClick={schedule}>Conferma</button>
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
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'fotorealistico', label: '📷 Fotorealistico', suffix: 'photorealistic, high quality photography, 8k, detailed, realistic lighting' },
                  { id: 'pittorico', label: '🎨 Pittorico', suffix: 'oil painting, artistic painterly style, expressive brushstrokes' },
                  { id: 'cartoon', label: '🖼️ Cartoon', suffix: 'cartoon illustration, vibrant colors, flat design, animated style' },
                  { id: 'sketch', label: '✏️ Sketch', suffix: 'pencil sketch, hand drawn, black and white, detailed linework' },
                ].map(s => (
                  <button key={s.id} className={`preset-btn text-xs py-1 px-2 ${fluxStyle === s.id ? 'active' : ''}`}
                    onClick={() => setFluxStyle(s.id)}>{s.label}</button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setInputModal(null)}>Annulla</button>
            <button className="btn-gradient flex-1" onClick={() => {
              const val = document.getElementById('input-modal-field').value.trim();
              if (!val) return;
              const styleMap = {
                fotorealistico: 'photorealistic, high quality photography, 8k, detailed, realistic lighting',
                pittorico: 'oil painting, artistic painterly style, expressive brushstrokes',
                cartoon: 'cartoon illustration, vibrant colors, flat design, animated style',
                sketch: 'pencil sketch, hand drawn, black and white, detailed linework',
              };
              const finalVal = inputModal.isFlux ? `${val}, ${styleMap[fluxStyle]}` : val;
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
