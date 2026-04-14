import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import usePostNitro from './usePostNitro';
import {
  X, Plus, Trash, Video, Image, Sparkle, PencilSimple, ArrowClockwise, Download, Palette,
  InstagramLogo, LinkedinLogo, FacebookLogo, TiktokLogo, PinterestLogo, Globe,
  CalendarBlank, PaperPlaneTilt, Copy, FloppyDisk, Eye, CheckCircle
} from '@phosphor-icons/react';

const PLATFORM_ICONS = {
  instagram: { Icon: InstagramLogo, color: '#E4405F', name: 'Instagram' },
  facebook: { Icon: FacebookLogo, color: '#1877F2', name: 'Facebook' },
  linkedin: { Icon: LinkedinLogo, color: '#0A66C2', name: 'LinkedIn' },
  tiktok: { Icon: TiktokLogo, color: '#ffffff', name: 'TikTok' },
  pinterest: { Icon: PinterestLogo, color: '#E60023', name: 'Pinterest' },
};

export default function ContentDetail({ content: initialContent, project, onClose, onUpdate }) {
  const { api } = useAuth();
  const { openEditor: openPostNitro } = usePostNitro();
  const [content, setContent] = useState(initialContent);
  const [editScript, setEditScript] = useState(initialContent.script || '');
  const [editCaption, setEditCaption] = useState(initialContent.caption || '');
  const [editHashtags, setEditHashtags] = useState(String(initialContent.hashtags || ''));
  const [socialProfiles, setSocialProfiles] = useState([]);
  const [projectSocials, setProjectSocials] = useState([]);
  const [previewFilter, setPreviewFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [scheduleProfiles, setScheduleProfiles] = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    api.get('/social/profiles').then(r => setSocialProfiles(r.data)).catch(() => {});
    api.get(`/social/project/${project.id}`).then(r => setProjectSocials(r.data)).catch(() => {});
  }, [api, project.id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/contents/${content.id}`, { script: editScript, caption: editCaption, hashtags: editHashtags });
      const updated = { ...content, script: editScript, caption: editCaption, hashtags: editHashtags };
      setContent(updated);
      onUpdate?.(updated);
    } catch {}
    setSaving(false);
  };

  const regenerate = async () => {
    if (!window.confirm('Rigenerare questo contenuto?')) return;
    setSaving(true);
    try {
      const { data } = await api.post('/contents/regenerate', { content_id: content.id, project_id: project.id });
      setEditScript(data.script || ''); setEditCaption(data.caption || ''); setEditHashtags(data.hashtags || '');
      setContent(data); onUpdate?.(data);
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
    setSaving(false);
  };

  const convert = async () => {
    const target = content.format === 'reel' ? 'carousel' : 'reel';
    if (!window.confirm(`Convertire in ${target}?`)) return;
    setSaving(true);
    try {
      const { data } = await api.post('/contents/convert', { content_id: content.id, project_id: project.id, target_format: target });
      setEditScript(data.script || ''); setEditCaption(data.caption || ''); setEditHashtags(data.hashtags || '');
      setContent(data); onUpdate?.(data);
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
    setSaving(false);
  };

  const publish = async () => {
    if (projectSocials.length === 0) { alert('Collega almeno un profilo social prima.'); return; }
    setPublishing(true);
    try {
      await save();
      const now = new Date().toISOString();
      await api.post('/publish/schedule', {
        content_id: content.id, project_id: project.id,
        social_profile_ids: projectSocials.map(p => p.id), scheduled_at: now
      });
      await api.post(`/publish/mark-published/${content.id}`);
      const updated = { ...content, status: 'published' };
      setContent(updated); onUpdate?.(updated);
      alert('Contenuto pubblicato!');
    } catch (e) { alert('Errore: ' + (e.response?.data?.detail || e.message)); }
    setPublishing(false);
  };

  const schedule = async () => {
    if (!scheduleDate || scheduleProfiles.length === 0) { alert('Seleziona data e profili social.'); return; }
    try {
      await save();
      const scheduledAt = `${scheduleDate}T${scheduleTime}:00Z`;
      await api.post('/publish/schedule', { content_id: content.id, project_id: project.id, social_profile_ids: scheduleProfiles, scheduled_at: scheduledAt });
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

  const hashtagList = String(editHashtags || '').split(/[\s,]+/).filter(h => h.startsWith('#') || h.length > 0).map(h => h.startsWith('#') ? h : `#${h}`);
  const filteredPreviews = previewFilter === 'all' ? projectSocials : projectSocials.filter(p => p.platform === previewFilter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <span className={`badge ${content.format === 'reel' ? 'pink' : 'blue'}`}>
            {content.format === 'reel' ? <Video size={12} /> : <Image size={12} />}
            <span className="ml-1">{content.format}</span>
          </span>
          <h2 className="font-semibold text-sm truncate max-w-[400px]">{content.hook_text}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${content.status === 'published' ? 'green' : content.status === 'scheduled' ? 'orange' : 'purple'}`}>
            {content.status || 'draft'}
          </span>
          <button onClick={onClose} className="btn-ghost p-2" data-testid="close-content-detail"><X size={20} /></button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex h-[calc(100vh-120px)] overflow-hidden">

        {/* LEFT: Social Profiles */}
        <div className="w-52 border-r border-[var(--border-color)] p-4 overflow-y-auto flex-shrink-0">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-3">Social Collegati</p>
          {projectSocials.map(prof => {
            const pi = PLATFORM_ICONS[prof.platform] || { Icon: Globe, color: '#fff', name: prof.platform };
            return (
              <div key={prof.id} className="flex items-center gap-2 p-2 rounded-lg mb-2 hover:bg-[var(--bg-card)] transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${pi.color}20` }}>
                  <pi.Icon weight="fill" size={16} color={pi.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{prof.profile_name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{pi.name}</p>
                </div>
              </div>
            );
          })}
          {projectSocials.length === 0 && <p className="text-xs text-[var(--text-muted)]">Nessun social collegato</p>}
          <button className="btn-ghost text-xs w-full mt-3 py-1.5"><Plus size={12} /> Aggiungi social</button>
        </div>

        {/* CENTER: Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Script */}
          <div className="mb-5">
            <textarea className="input-dark w-full text-sm" rows={6} value={editScript} onChange={e => setEditScript(e.target.value)}
              placeholder="Script del contenuto..." style={{ paddingLeft: '1rem', lineHeight: 1.7 }} />
          </div>

          {/* Caption */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Caption</p>
            <textarea className="input-dark w-full text-sm" rows={5} value={editCaption} onChange={e => setEditCaption(e.target.value)}
              placeholder="Caption del post..." style={{ paddingLeft: '1rem', lineHeight: 1.7 }} />
          </div>

          {/* Hashtags */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Hashtag</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {hashtagList.filter(h => h.length > 1).map((h, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>{h}</span>
              ))}
            </div>
            <input className="input-dark w-full text-sm" value={editHashtags} onChange={e => setEditHashtags(e.target.value)}
              placeholder="#hashtag1 #hashtag2..." style={{ paddingLeft: '1rem' }} />
          </div>

          {/* Media */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Carica qui il contenuto</p>
            <label className="block p-6 rounded-lg border border-dashed border-[var(--border-color)] text-center cursor-pointer hover:border-[var(--gradient-start)] transition-colors mb-3">
              <p className="font-medium text-sm">Sostituisci o allega un nuovo media</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">URL esterno, libreria o file dal dispositivo - Max 400 MB</p>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={e => { if (e.target.files[0]) uploadMedia(e.target.files[0]); }} />
            </label>
            {content.media && content.media.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {content.media.map(m => (
                  <div key={m.id} className="relative group w-16 h-16">
                    {m.type === 'image' ? (
                      <img src={`${process.env.REACT_APP_BACKEND_URL}${m.url}`} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center"><Video size={20} /></div>
                    )}
                    <button className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-pink)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteMedia(m.id)}>
                      <X size={8} color="white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <button className="btn-ghost text-[10px] py-1 px-2" onClick={() => { const url = window.prompt('URL media:'); if (url) uploadMedia(new File([], '')) }}><Download size={12} /> Rimuovi media</button>
              <label className="btn-ghost text-[10px] py-1 px-2 cursor-pointer"><Plus size={12} /> Allega media<input type="file" accept="image/*,video/*" className="hidden" onChange={e => { if (e.target.files[0]) uploadMedia(e.target.files[0]); }} /></label>
              <span className="badge blue text-[10px]">{(content.media || []).length} media</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => { navigator.clipboard.writeText(`${editScript}\n\n${editCaption}\n\n${editHashtags}`); alert('Copiato!'); }}><Copy size={14} /> Copia tutto</button>
            <button className="btn-ghost text-xs py-1.5 px-3" onClick={convert}>
              {content.format === 'reel' ? <><Image size={14} /> Converti in Carousel</> : <><Video size={14} /> Converti in Reel</>}
            </button>
            <button className="btn-ghost text-xs py-1.5 px-3" onClick={regenerate} disabled={saving}><ArrowClockwise size={14} /> Rigenera</button>
            {/* Editor icons */}
            <button className="btn-ghost text-xs py-1.5 px-2" title="DALL-E" onClick={async () => {
              const prompt = window.prompt("Descrivi l'immagine:", content.hook_text); if (!prompt) return;
              try { const { data } = await api.post('/media/generate-dalle', { content_id: content.id, prompt, project_id: project.id }); const updated = { ...content, media: [...(content.media||[]), data] }; setContent(updated); onUpdate?.(updated); } catch(e) { alert('Errore DALL-E'); }
            }}><Sparkle size={14} /></button>
            <button className="btn-ghost text-xs py-1.5 px-2" title="Canva" onClick={async () => {
              try { const { data } = await api.get('/canva/auth-url'); if (data.auth_url) window.open(data.auth_url, '_blank'); } catch {}
            }}><Palette size={14} /></button>
            <button className="btn-ghost text-xs py-1.5 px-2" title="PostNitro" onClick={async () => {
              const result = await openPostNitro(content.id, project.id, content.hook_text);
              if (result?.success) { const { data } = await api.get(`/contents/${project.id}`); const u = data.find(c => c.id === content.id); if (u) { setContent(u); onUpdate?.(u); } }
            }}><Image size={14} /></button>
          </div>
        </div>

        {/* RIGHT: Post Preview */}
        <div className="w-80 border-l border-[var(--border-color)] p-4 overflow-y-auto flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Anteprima Post</p>
            <select className="input-dark text-xs py-1 px-2" value={previewFilter} onChange={e => setPreviewFilter(e.target.value)} style={{ paddingLeft: '0.5rem', width: 'auto' }}>
              <option value="all">Tutto</option>
              {Object.entries(PLATFORM_ICONS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </div>

          {filteredPreviews.length > 0 ? filteredPreviews.map(prof => {
            const pi = PLATFORM_ICONS[prof.platform] || { Icon: Globe, color: '#fff', name: prof.platform };
            const previewCaption = editCaption.length > 120 ? editCaption.slice(0, 120) + '...' : editCaption;
            return (
              <div key={prof.id} className="mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <pi.Icon weight="fill" size={16} color={pi.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{prof.profile_name} · {pi.name}</p>
                  </div>
                  <span className="badge text-[9px]" style={{ background: `${pi.color}20`, color: pi.color }}>{pi.name.toUpperCase()}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">{previewCaption}</p>
                {content.media && content.media[0] && content.media[0].type === 'image' && (
                  <img src={`${process.env.REACT_APP_BACKEND_URL}${content.media[0].url}`} alt="" className="w-full h-40 object-cover rounded-lg mb-2" />
                )}
                {content.media && content.media[0] && content.media[0].type === 'video' && (
                  <div className="w-full h-40 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center mb-2"><Video size={32} className="text-[var(--text-muted)]" /></div>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <Eye size={32} className="mx-auto mb-2 text-[var(--text-muted)] opacity-40" />
              <p className="text-xs text-[var(--text-muted)]">Collega social al progetto per vedere l'anteprima.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border-color)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2">
          <p className="text-xs text-[var(--text-muted)]">STATO</p>
          <span className={`text-xs font-semibold ${content.status === 'published' ? 'text-[var(--accent-green)]' : content.status === 'scheduled' ? 'text-[var(--accent-orange)]' : 'text-[var(--accent-purple)]'}`}>
            {content.status === 'published' ? 'Pubblicato' : content.status === 'scheduled' ? 'Programmato' : 'Bozza'}
          </span>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost text-sm" onClick={save} disabled={saving} data-testid="save-draft-btn">
            <FloppyDisk size={16} /> {saving ? 'Salvando...' : 'Salva bozza'}
          </button>
          <button className="btn-ghost text-sm" onClick={publish} disabled={publishing} data-testid="publish-btn">
            <PaperPlaneTilt size={16} /> {publishing ? 'Pubblicando...' : 'Pubblica'}
          </button>
          <button className="btn-gradient text-sm" onClick={() => setShowSchedule(!showSchedule)} data-testid="schedule-btn">
            <CalendarBlank size={16} /> Programma
          </button>
        </div>
      </div>

      {/* Schedule Dropdown */}
      {showSchedule && (
        <div className="absolute bottom-16 right-6 z-10 card w-80 p-4" style={{ background: 'var(--bg-card)' }}>
          <p className="text-sm font-semibold mb-3">Programma Pubblicazione</p>
          <div className="flex gap-2 mb-3">
            <input type="date" className="input-dark text-sm py-1.5 flex-1" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ paddingLeft: '0.5rem' }} />
            <input type="time" className="input-dark text-sm py-1.5 w-24" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ paddingLeft: '0.5rem' }} />
          </div>
          <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
            {socialProfiles.map(sp => {
              const pi = PLATFORM_ICONS[sp.platform] || { Icon: Globe, color: '#fff' };
              const sel = scheduleProfiles.includes(sp.id);
              return (
                <div key={sp.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${sel ? 'border-[var(--gradient-start)]' : 'border-transparent'}`}
                  style={sel ? { background: 'rgba(99,102,241,0.1)' } : {}} onClick={() => setScheduleProfiles(prev => sel ? prev.filter(id => id !== sp.id) : [...prev, sp.id])}>
                  <pi.Icon weight="fill" size={14} color={pi.color} />
                  <span className="text-xs flex-1">{sp.profile_name}</span>
                  {sel && <CheckCircle size={14} color="var(--accent-green)" weight="fill" />}
                </div>
              );
            })}
          </div>
          <button className="btn-gradient w-full text-sm" onClick={schedule}>Conferma</button>
        </div>
      )}
    </motion.div>
  );
}
