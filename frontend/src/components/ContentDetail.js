import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  X, Plus, Video, Image, Sparkle, ArrowClockwise, Download,
  InstagramLogo, LinkedinLogo, FacebookLogo, TiktokLogo, PinterestLogo, Globe,
  CalendarBlank, PaperPlaneTilt, Copy, FloppyDisk, Eye, CheckCircle, Check,
  XCircle, Images, CaretLeft, CaretRight, PencilSimple,
  TextB, TextItalic, TextUnderline, ListBullets
} from '@phosphor-icons/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { richTextToPlainText, normalizeRichTextForEditor } from '../lib/utils';

function RichCaption({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: normalizeRichTextForEditor(value || ''),
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    const normalized = normalizeRichTextForEditor(value || '');
    if (editor && normalized !== editor.getHTML()) {
      editor.commands.setContent(normalized, false);
    }
  }, [value, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;
  const btn = (active, action, Icon, title) => (
    <button type="button" title={title} onMouseDown={e => { e.preventDefault(); action(); }}
      className="p-1.5 rounded transition-colors"
      style={{ background: active ? 'rgba(99,102,241,0.25)' : 'transparent', color: active ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
      <Icon size={14} weight={active ? 'fill' : 'regular'} />
    </button>
  );
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b" style={{ borderColor: 'var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), TextB, 'Grassetto')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), TextItalic, 'Corsivo')}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), TextUnderline, 'Sottolineato')}
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border-color)' }} />
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), ListBullets, 'Elenco puntato')}
      </div>
      <EditorContent editor={editor} className="rich-caption-editor" />
    </div>
  );
}

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

const MONTH_IT  = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MONTH_ABB = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const DAY_IT    = ['L','M','M','G','V','S','D'];
const DAY_FULL  = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
const DOW_IT    = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];

function calDays(monthStart) {
  const y = monthStart.getFullYear(), m = monthStart.getMonth();
  const pad = (new Date(y, m, 1).getDay() + 6) % 7;
  const total = new Date(y, m + 1, 0).getDate();
  const cells = Array(pad).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function calDaysExtended(monthStart) {
  const y = monthStart.getFullYear(), m = monthStart.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevY = m === 0 ? y - 1 : y, prevM = m === 0 ? 11 : m - 1;
  const daysInPrev = new Date(prevY, prevM + 1, 0).getDate();
  const nextY = m === 11 ? y + 1 : y, nextM = m === 11 ? 0 : m + 1;
  const cells = [];
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, month: prevM, year: prevY, isPrev: true });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, month: m, year: y, isCurrent: true });
  let nd = 1;
  while (cells.length % 7 !== 0)
    cells.push({ day: nd++, month: nextM, year: nextY, isNext: true });
  return cells;
}

function formatScheduleHeader(dateStr) {
  if (!dateStr) return 'Seleziona una data';
  const d = new Date(dateStr + 'T12:00:00');
  return `${DOW_IT[d.getDay()]}, ${MONTH_ABB[d.getMonth()]} ${d.getDate()}º`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function SocialMockup({ prof, format, caption, hashtags, media, backendUrl }) {
  const pi = PLATFORM_ICONS[prof.platform] || { Icon: Globe, color: '#888', name: prof.platform };
  const firstImg = (media || []).find(m => m.type === 'image');
  const isReel = format === 'reel' || format === 'prompted_reel' || prof.platform === 'tiktok';
  const short = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;
  const initials = (prof.profile_name || '?')[0].toUpperCase();
  const captionText = richTextToPlainText(caption);

  /* ── REEL / TIKTOK ── */
  if (isReel) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 160, height: 284, borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#000', border: '2px solid #333', flexShrink: 0 }}>
          {firstImg
            ? <img src={`${backendUrl}${firstImg.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#1a1535,#2d1f5e)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />
          {/* Right actions */}
          <div style={{ position: 'absolute', right: 6, bottom: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {['♡','💬','↗'].map((ic, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16 }}>{ic}</div>
                {i < 2 && <div style={{ color: 'white', fontSize: 8 }}>0</div>}
              </div>
            ))}
          </div>
          {/* Bottom left */}
          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `linear-gradient(135deg,${pi.color},#ec4899)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: 8, fontWeight: 700 }}>{initials}</span>
              </div>
              <span style={{ color: 'white', fontSize: 9, fontWeight: 600 }}>@{short(prof.profile_name, 14)}</span>
            </div>
            <p style={{ color: 'white', fontSize: 9, lineHeight: 1.35, margin: 0, whiteSpace: 'pre-line' }}>{short(captionText, 80)}</p>
            {hashtags && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 8, margin: '2px 0 0' }}>{short(hashtags, 40)}</p>}
          </div>
          {/* Platform watermark */}
          <div style={{ position: 'absolute', top: 6, right: 6 }}>
            <pi.Icon size={12} color="white" weight="fill" />
          </div>
        </div>
      </div>
    );
  }

  /* ── PINTEREST ── */
  if (prof.platform === 'pinterest') {
    return (
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', color: '#111', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ position: 'relative', aspectRatio: '2/3', background: '#f0f0f0' }}>
          {firstImg
            ? <img src={`${backendUrl}${firstImg.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PinterestLogo size={32} color="#ccc" />
              </div>}
          <button style={{ position: 'absolute', top: 8, right: 8, background: '#e60023', color: 'white', border: 'none', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'default' }}>Salva</button>
        </div>
        <div style={{ padding: '8px 10px 10px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{short(captionText, 60)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#e60023', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 8, fontWeight: 700 }}>{initials}</span>
            </div>
            <span style={{ fontSize: 10, color: '#555' }}>{prof.profile_name}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── LINKEDIN ── */
  if (prof.platform === 'linkedin') {
    return (
      <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', color: '#000', fontFamily: 'system-ui,sans-serif', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '10px 12px 6px', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{prof.profile_name}</p>
            <p style={{ fontSize: 10, color: '#666', margin: 0 }}>1 ora fa · 🌐</p>
          </div>
          <span style={{ color: '#666', fontSize: 16, cursor: 'default' }}>···</span>
        </div>
        <div style={{ padding: '0 12px 8px' }}>
          <p style={{ fontSize: 11, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>{short(captionText, 180)}</p>
          {hashtags && <p style={{ fontSize: 10, color: '#0a66c2', margin: '4px 0 0' }}>{short(hashtags, 80)}</p>}
        </div>
        {firstImg && (
          <div style={{ aspectRatio: '1.91/1', overflow: 'hidden' }}>
            <img src={`${backendUrl}${firstImg.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ padding: '6px 12px', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 2, fontSize: 13, marginBottom: 4 }}>👍💡❤️<span style={{ fontSize: 10, color: '#666', marginLeft: 4, lineHeight: '20px' }}>43</span></div>
          <div style={{ display: 'flex', borderTop: '1px solid #eee', paddingTop: 5 }}>
            {['👍 Mi piace', '💬 Commenta', '↗ Condividi'].map((a, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#666', padding: '3px 0' }}>{a}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── FACEBOOK ── */
  if (prof.platform === 'facebook') {
    return (
      <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', color: '#000', fontFamily: 'system-ui,sans-serif', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px 6px', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{prof.profile_name}</p>
            <p style={{ fontSize: 10, color: '#65676b', margin: 0 }}>1 ora fa · 🌐</p>
          </div>
          <span style={{ color: '#606770', fontSize: 16, cursor: 'default' }}>···</span>
        </div>
        <div style={{ padding: '0 12px 8px' }}>
          <p style={{ fontSize: 11, lineHeight: 1.5, margin: 0, color: '#050505', whiteSpace: 'pre-line' }}>{short(captionText, 180)}</p>
          {hashtags && <p style={{ fontSize: 10, color: '#1877f2', margin: '4px 0 0' }}>{short(hashtags, 80)}</p>}
        </div>
        {firstImg && (
          <div style={{ aspectRatio: '1.91/1', overflow: 'hidden' }}>
            <img src={`${backendUrl}${firstImg.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ padding: '4px 12px', borderTop: '1px solid #ddd' }}>
          <div style={{ display: 'flex', borderTop: '1px solid #ddd', paddingTop: 6, marginTop: 4 }}>
            {['👍 Mi piace', '💬 Commenta', '↗ Condividi'].map((a, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#65676b', padding: '3px 0' }}>{a}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── INSTAGRAM FEED (default) ── */
  return (
    <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', color: '#262626', fontFamily: 'system-ui,sans-serif', border: '1px solid #dbdbdb' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{initials}</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>{prof.profile_name}</p>
        </div>
        <span style={{ fontSize: 18, color: '#262626' }}>···</span>
      </div>
      <div style={{ aspectRatio: '1/1', background: '#f3f4f6', overflow: 'hidden' }}>
        {firstImg
          ? <img src={`${backendUrl}${firstImg.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <InstagramLogo size={28} color="#dbdbdb" />
            </div>}
      </div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>♡</span>
          <span style={{ fontSize: 18 }}>🗨</span>
          <span style={{ fontSize: 18 }}>✈</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 18 }}>🔖</span>
        </div>
        <p style={{ fontSize: 11, margin: '0 0 3px' }}>
          <span style={{ fontWeight: 700 }}>{prof.profile_name} </span>
          {short(captionText, 120)}
        </p>
        {hashtags && <p style={{ fontSize: 10, color: '#00376b', margin: '2px 0 0' }}>{short(hashtags, 80)}</p>}
        <p style={{ fontSize: 10, color: '#8e8e8e', margin: '4px 0 0' }}>1 ORA FA</p>
      </div>
    </div>
  );
}

export default function ContentDetail({ content: initialContent, project, onClose, onUpdate }) {
  const { api } = useAuth();
  const { t } = useTranslation();
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
  const [customPerSocial, setCustomPerSocial] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState(null);
  const [mobileTab, setMobileTab] = useState('editor');
  const [inputModal, setInputModal] = useState(null); // { title, placeholder, value, multiline, onConfirm }
  const [generatingImage, setGeneratingImage] = useState(false);
  const [optimizingPrompt, setOptimizingPrompt] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [calViewDate, setCalViewDate] = useState(null);
  const [fluxStyle, setFluxStyle] = useState('fotorealistico');
  const [fluxComposition, setFluxComposition] = useState('wide');
  const [imageModel, setImageModel] = useState('flux');
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryItems, setLibraryItems] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [socialTimes, setSocialTimes] = useState({});

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    api.get('/social/profiles').then(r => setSocialProfiles((r.data || []).filter(p => p.platform !== 'google_slides'))).catch(() => {});
    api.get(`/social/project/${project.id}`).then(r => setProjectSocials(r.data)).catch(() => {});
    api.get('/canva/status').then(r => setCanvaConnected(r.data.connected)).catch(() => {});
    api.get(`/publish/queue/${project.id}`).then(r => {
      const items = r.data.filter(q => q.content_id === initialContent.id && q.status === 'queued');
      setContentQueueItems(items);
      if (items.length > 0) {
        // Use local time methods so the popup shows the user's intended local time
        const dt = new Date(items[0].scheduled_at);
        const pad = n => String(n).padStart(2, '0');
        setScheduleDate(`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`);
        setScheduleTime(`${pad(dt.getHours())}:${pad(dt.getMinutes())}`);
        setSelectedSocials(items.map(q => q.social_profile_id).filter(Boolean));
        const times = {};
        items.forEach(q => {
          const d = new Date(q.scheduled_at);
          times[q.social_profile_id] = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        });
        setSocialTimes(times);
      }
    }).catch(() => {});
  }, [api, project.id, initialContent.id]);

  useEffect(() => {
    if (content.status !== 'scheduled') return;

    const refreshStatus = async () => {
      try {
        const [{ data: queueData }, { data: contentsData }] = await Promise.all([
          api.get(`/publish/queue/${project.id}`),
          api.get(`/contents/${project.id}`),
        ]);

        const queueItems = (queueData || []).filter(q => q.content_id === content.id);
        const queuedItems = queueItems.filter(q => q.status === 'queued' || q.status === 'processing');
        setContentQueueItems(queuedItems);

        const latestContent = (contentsData || []).find(c => c.id === content.id);
        if (latestContent && latestContent.status && latestContent.status !== content.status) {
          setContent(prev => {
            const updated = { ...prev, status: latestContent.status };
            onUpdate?.(updated);
            return updated;
          });
        }
      } catch {}
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [api, project.id, content.id, content.status, onUpdate]);

  useEffect(() => {
    if (showSchedule) {
      const base = scheduleDate ? new Date(scheduleDate + 'T12:00:00') : new Date();
      setCalViewDate(new Date(base.getFullYear(), base.getMonth(), 1));
      const times = {};
      selectedSocials.forEach(id => { times[id] = socialTimes[id] || scheduleTime; });
      setSocialTimes(times);
    }
  }, [showSchedule]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CANVA ─────────────────────────────────────────────
  const openCanvaEditor = async () => {
    setCanvaLoading(true);
    const tid = toast.loading(t('canva.creating'));
    // Open named popup immediately (synchronous) to bypass popup blockers
    const popup = window.open('about:blank', 'canva_editor', 'width=1280,height=820,left=100,top=60');
    try {
      const { data } = await api.post('/canva/create-design', { content_id: content.id, format: content.format });
      const { edit_url, design_id } = data;
      if (popup && !popup.closed) popup.location.href = edit_url;
      else window.open(edit_url, 'canva_editor', 'width=1280,height=820,left=100,top=60');
      toast.success(t('canva.opened'), { id: tid, duration: 10000 });

      let importing = false;
      const doImport = async () => {
        if (importing) return;
        importing = true;
        const importTid = toast.loading('Avvio export Canva...');
        try {
          // Step 1: create export job (fast, instant response)
          const { data: jobData } = await api.post(`/canva/export-design/${content.id}`, { design_id });
          const { job_id } = jobData;

          // Step 2: poll for completion (frontend-driven, every 3s, max 20 tries)
          toast.loading(t('canva.exporting'), { id: importTid });
          let urls = [];
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const { data: statusData } = await api.get(`/canva/export-status/${job_id}`);
            if (statusData.status === 'success') { urls = statusData.urls || []; break; }
            if (statusData.status === 'failed') throw new Error('Export Canva fallito');
          }

          if (urls.length === 0) { toast.info(t('canva.noImages'), { id: importTid }); return; }

          // Step 3: download client-side (browser→CDN, no Railway timeout) then upload via FormData
          toast.loading(t('canva.downloading'), { id: importTid });
          const newMedia = [];
          for (let i = 0; i < urls.length; i++) {
            const resp = await fetch(urls[i]);
            if (!resp.ok) continue;
            const blob = await resp.blob();
            const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
            const file = new File([blob], `canva_export_${i + 1}.${ext}`, { type: blob.type || 'image/png' });
            const fd = new FormData();
            fd.append('file', file);
            const { data: mediaDoc } = await api.post(`/media/upload/${content.id}`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            newMedia.push(mediaDoc);
          }
          if (newMedia.length > 0) {
            const updated = { ...content, media: [...(content.media || []), ...newMedia] };
            setContent(updated); onUpdate?.(updated);
            toast.success(t('canva.importSuccess_other', { count: newMedia.length }), { id: importTid, duration: 5000 });
          } else {
            toast.info(t('canva.noImages'), { id: importTid });
          }
        } catch (e) {
          if (e.response?.status === 401) {
            setCanvaConnected(false);
            toast.error(t('canva.expired'), { id: importTid, duration: 7000 });
          } else {
            const status = e.response?.status ? ` (${e.response.status})` : '';
            const detail = e.response?.data?.detail || e.message;
            toast.error(t('canva.errorImporting', { status, message: detail }), { id: importTid });
          }
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
      toast.error(t('canva.errorCreating', { message: e.response?.data?.detail || e.message }), { id: tid });
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
    const tid = toast.loading(t('drive.opening'));
    try {
      const { data } = await api.get('/google/picker-token');
      if (!data.connected) {
        const msg = data.reason === 'scope_upgrade'
          ? t('drive.scopeExpired')
          : t('drive.notConnected');
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
          const importTid = toast.loading(t('drive.downloading', { name: doc.name }));
          try {
            // Download client-side with the picker token (avoids server-side scope issues)
            const dlResp = await fetch(
              `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
              { headers: { Authorization: `Bearer ${pickerToken}` } }
            );
            if (!dlResp.ok) {
              if (dlResp.status === 403 || dlResp.status === 404) throw new Error(t('drive.errorPermissions'));
              throw new Error(`Google Drive ha rifiutato il download (${dlResp.status})`);
            }
            const blob = await dlResp.blob();
            const file = new File([blob], doc.name, { type: doc.mimeType || blob.type });
            const fd = new FormData();
            fd.append('file', file);
            const { data: media } = await api.post(`/media/upload/${content.id}`, fd);
            const updated = { ...content, media: [...(content.media || []), media] };
            setContent(updated); onUpdate?.(updated);
            toast.success(t('drive.importSuccess', { name: doc.name }), { id: importTid });
          } catch (e) { toast.error('Errore importazione: ' + e.message, { id: importTid }); }
        })
        .build()
        .setVisible(true);
    } catch (e) {
      toast.error(t('drive.error', { message: e.response?.data?.detail || e.message }), { id: tid });
    }
  };

  const openLibrary = async () => {
    setShowLibrary(true);
    if (libraryItems.length > 0) return;
    setLibraryLoading(true);
    try {
      const { data } = await api.get(`/media/library/${project.id}`);
      setLibraryItems(data);
    } catch { toast.error(t('library.errorLoading')); }
    setLibraryLoading(false);
  };

  const addFromLibrary = async (item) => {
    try {
      const { data } = await api.post(`/media/library/add/${content.id}`, { media: item });
      const updated = { ...content, media: [...(content.media || []), data] };
      setContent(updated); onUpdate?.(updated);
      toast.success(t('library.addToContent'));
    } catch { toast.error(t('library.errorAdding')); }
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
    const tid = toast.loading(t('editor.publishing'));
    try {
      await save();
      const now = new Date().toISOString();
      const { data } = await api.post('/publish/schedule', { content_id: content.id, project_id: project.id, social_profile_ids: selectedSocials, scheduled_at: now });
      const queuedItems = data?.items || [];
      setContentQueueItems(queuedItems);
      const updated = { ...content, status: 'scheduled' };
      setContent(updated); onUpdate?.(updated);
      toast.success('Pubblicazione avviata. Controlla la queue per lo stato finale.', { id: tid });
    } catch (e) { toast.error('Errore pubblicazione: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    setPublishing(false);
  };

  const cancelSchedule = async () => {
    if (contentQueueItems.length === 0) return;
    setCancellingSchedule(true);
    const tid = toast.loading(t('editor.cancellingSchedule'));
    try {
      await Promise.all(contentQueueItems.map(item => api.delete(`/publish/queue/${item.id}`).catch(() => {})));
      setContentQueueItems([]);
      const updated = { ...content, status: 'draft' };
      setContent(updated); onUpdate?.(updated);
      toast.success(t('editor.cancelScheduleSuccess'), { id: tid });
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
      // Treat input times as local timezone, convert to UTC for storage
      const toUtcIso = (date, time) => new Date(`${date}T${time}:00`).toISOString();
      const socialSchedules = selectedSocials.map(id => ({
        social_profile_id: id,
        scheduled_at: toUtcIso(scheduleDate, (customPerSocial ? socialTimes[id] : null) || scheduleTime),
      }));
      await api.post('/publish/schedule', {
        content_id: content.id,
        project_id: project.id,
        social_profile_ids: selectedSocials,
        scheduled_at: toUtcIso(scheduleDate, scheduleTime),
        social_schedules: socialSchedules,
      });
      const { data: queueData } = await api.get(`/publish/queue/${project.id}`);
      const newItems = queueData.filter(q => q.content_id === content.id && q.status === 'queued');
      setContentQueueItems(newItems);
      const updated = { ...content, status: 'scheduled' };
      setContent(updated); onUpdate?.(updated);
      setShowSchedule(false);
      toast.success(t('editor.scheduleSuccess', { date: scheduleDate, time: scheduleTime }), { id: tid });
      onClose?.();
    } catch (e) { toast.error('Errore programmazione: ' + (e.response?.data?.detail || e.message), { id: tid }); }
    setScheduling(false);
  };

  const uploadMedia = async (file) => {
    const fd = new FormData(); fd.append('file', file);
    setUploadingMedia(true);
    const tid = toast.loading(t('editor.uploading'));
    try {
      const { data } = await api.post(`/media/upload/${content.id}`, fd);
      setContent(prev => {
        const updated = { ...prev, media: [...(prev.media || []), data] };
        onUpdate?.(updated);
        return updated;
      });
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
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-3">{t('project.social.publishOn')}</p>
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
      {socialProfiles.length === 0 && <p className="text-xs text-[var(--text-muted)]">{t('project.social.noSocialConnected')}</p>}
    </div>
  );

  const EditorColumn = () => (
    <div className={isMobile ? 'p-4' : 'flex-1 overflow-y-auto p-6'}>
      {content.format === 'prompted_reel' && (
        <>
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#a855f7' }}>{`⚡ ${t('editor.openingHook').toUpperCase()}`}</p>
            <textarea className="input-dark w-full text-sm" rows={2} value={editOpeningHook} onChange={e => setEditOpeningHook(e.target.value)}
              placeholder="Testo di apertura ad impatto..." style={{ paddingLeft: '1rem', lineHeight: 1.7 }} />
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">{t('editor.avatarScript')}</p>
            <textarea className="input-dark w-full text-sm" rows={isMobile ? 6 : 8} value={editScript} onChange={e => setEditScript(e.target.value)}
              placeholder="Script per l'avatar (usa [pausa], [enfasi], [veloce]...)..." style={{ paddingLeft: '1rem', lineHeight: 1.7 }} />
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">{t('editor.visualDirection')}</p>
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
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">{t('editor.caption')}</p>
        <RichCaption value={editCaption} onChange={setEditCaption} />
      </div>
      <div className="mb-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">{t('editor.hashtags')}</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {hashtagList.map((h, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>{h}</span>
          ))}
        </div>
        <input className="input-dark w-full text-sm" value={editHashtags} onChange={e => setEditHashtags(e.target.value)}
          placeholder="#hashtag1 #hashtag2..." style={{ paddingLeft: '1rem' }} />
      </div>
      <div className="mb-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">{t('editor.media')}</p>
        <label className="block p-4 md:p-6 rounded-lg border border-dashed border-[var(--border-color)] text-center cursor-pointer hover:border-[var(--gradient-start)] transition-colors mb-3" style={uploadingMedia ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
          {uploadingMedia ? (
            <>
              <div className="w-5 h-5 border-2 border-[var(--gradient-start)] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
              <p className="font-medium text-sm text-[var(--accent-purple)]">{t('editor.uploading')}</p>
            </>
          ) : (
            <>
              <p className="font-medium text-sm">{t('editor.uploadMedia')}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{t('editor.uploadMax')}</p>
            </>
          )}
          <input type="file" accept="image/*,video/*" multiple className="hidden" disabled={uploadingMedia} onChange={async e => { const files = Array.from(e.target.files); e.target.value = ''; for (const f of files) await uploadMedia(f); }} />
        </label>
        {generatingImage && (
          <div className="flex items-center gap-3 p-3 rounded-lg mb-3" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <div className="w-4 h-4 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-xs text-[var(--accent-purple)]">Generazione immagine in corso...</p>
          </div>
        )}
        {content.media && content.media.length > 0 && (() => {
          const imgMedia = content.media.filter(m => m.type === 'image');
          return (
          <div className="flex gap-2 flex-wrap mb-3">
            {content.media.map(m => (
              <div key={m.id} className="relative group w-14 h-14 md:w-16 md:h-16">
                {m.type === 'image' ? (
                  <img src={`${process.env.REACT_APP_BACKEND_URL}${m.url}`} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-full rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center"><Video size={20} /></div>
                )}
                {m.type === 'image' && (
                  <button className="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setLightboxIdx(imgMedia.findIndex(im => im.id === m.id))}>
                    <Eye size={18} color="white" />
                    {imgMedia.length > 1 && <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/60 rounded px-1">{imgMedia.findIndex(im => im.id === m.id) + 1}/{imgMedia.length}</span>}
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
          );
        })()}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        {content.format === 'prompted_reel' ? (
          <button className="btn-gradient text-xs py-1.5 px-3" onClick={() => {
            const avatarScript = `OPENING:\n${editOpeningHook}\n\nSCRIPT:\n${editScript}\n\nREGIA:\n${editVisualDirection}`;
            navigator.clipboard.writeText(avatarScript); toast.success('Script avatar copiato!');
          }}>
            🤖 {t('editor.copyAvatarScript')}
          </button>
        ) : (
          <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => { navigator.clipboard.writeText(`${editScript}\n\n${richTextToPlainText(editCaption)}\n\n${editHashtags}`); toast.success('Copiato!'); }}>
            <Copy size={14} /> {t('common.copy')}
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
          <ArrowClockwise size={14} /> {t('editor.regenerate')}
        </button>
        <div className="flex gap-1 items-center" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 8 }}>
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title={t('editor.generateImage')} onClick={() => {
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
            title={t('editor.openCanva')}
            onClick={handleCanvaClick}
            disabled={canvaLoading}
          >
            {canvaLoading
              ? <div className="w-4 h-4 border-2 border-[#7D2AE8] border-t-transparent rounded-full animate-spin" />
              : <CanvaIcon size={16} />}
            {canvaConnected && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-[var(--bg-primary)]" />}
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title={t('editor.importDrive')} onClick={openDrivePicker}>
            <Download size={16} color="#34a853" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title={t('editor.mediaLibrary')} onClick={openLibrary}>
            <Images size={16} color="#a855f7" />
          </button>
        </div>
      </div>
    </div>
  );

  const PreviewColumn = () => (
    <div className={isMobile ? 'p-4' : 'w-80 border-l border-[var(--border-color)] p-4 overflow-y-auto flex-shrink-0'}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">{t('editor.preview')}</p>
        {selectedSocials.length > 0 && <span className="badge blue text-[10px]">{selectedSocials.length} social</span>}
      </div>
      {selectedProfiles.length > 0 ? selectedProfiles.map(prof => (
        <div key={prof.id} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            {(() => { const pi = PLATFORM_ICONS[prof.platform] || { Icon: Globe, color: '#888', name: prof.platform }; return <><pi.Icon size={12} color={pi.color} weight="fill" /><span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{pi.name}</span></>; })()}
          </div>
          <SocialMockup
            prof={prof}
            format={content.format}
            caption={editCaption}
            hashtags={editHashtags}
            media={content.media}
            backendUrl={process.env.REACT_APP_BACKEND_URL}
          />
        </div>
      )) : (
        <div className="text-center py-8 md:py-12">
          <Eye size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-xs text-[var(--text-muted)] mb-1">{t('editor.selectSocials')}</p>
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
            {content.status === 'published' ? t('editor.published') : content.status === 'scheduled' ? t('editor.scheduled') : t('editor.draft')}
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
            <FloppyDisk size={14} /> {saving ? '...' : t('common.save')}
          </button>
          <button className="btn-ghost text-xs py-1.5" onClick={publish} disabled={publishing || selectedSocials.length === 0} data-testid="publish-btn"
            style={selectedSocials.length === 0 ? { opacity: 0.4 } : {}}>
            {publishing ? <><span className="animate-spin inline-block">⏳</span> {t('editor.publishing_')}</> : <><PaperPlaneTilt size={14} /> {t('editor.publish')}</>}
          </button>
          {(content.status === 'scheduled' || contentQueueItems.length > 0) && (
            <button className="btn-ghost text-xs py-1.5" onClick={cancelSchedule} disabled={cancellingSchedule}
              style={{ color: 'var(--accent-pink)' }} title="Annulla programmazione e riporta a bozza">
              {cancellingSchedule
                ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                : <><XCircle size={14} /> {t('editor.cancelSchedule')}</>}
            </button>
          )}
          <button className="btn-gradient text-xs py-1.5" onClick={() => setShowSchedule(!showSchedule)} data-testid="schedule-btn"
            disabled={scheduling} style={{ opacity: scheduling ? 0.5 : 1 }}>
            <CalendarBlank size={14} /> {contentQueueItems.length > 0 ? t('editor.modifySchedule') : t('editor.scheduleBtn')}
          </button>
        </div>
      </div>

      {/* Schedule Popup — handled as fixed overlay below */}
    </motion.div>
    </motion.div>

    {/* Media Library Modal */}
    {showLibrary && (
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowLibrary(false)}>
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full sm:max-w-2xl max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-xl overflow-hidden" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0">
            <p className="font-semibold text-sm flex items-center gap-2"><Images size={16} color="#a855f7" /> {t('library.title')} — {project.name}</p>
            <button onClick={() => setShowLibrary(false)} className="btn-ghost p-1"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {libraryLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!libraryLoading && libraryItems.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-12">{t('library.empty')}</p>
            )}
            {!libraryLoading && libraryItems.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {libraryItems.map(item => (
                  <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={() => addFromLibrary(item)}>
                    {item.type === 'image' ? (
                      <img src={`${process.env.REACT_APP_BACKEND_URL}${item.url}`} alt={item.original_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <Video size={24} color="var(--text-muted)" />
                        <p className="text-[9px] text-[var(--text-muted)] text-center px-1 truncate w-full">{item.original_name}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(168,85,247,0.6)' }}>
                      <Plus size={24} color="white" weight="bold" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )}

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
            <button className="btn-ghost flex-1" onClick={() => setInputModal(null)}>{t('common.cancel')}</button>
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
    {/* Navigable lightbox */}
    {lightboxIdx !== null && (() => {
      const imgMedia = (content.media || []).filter(m => m.type === 'image');
      const cur = imgMedia[lightboxIdx];
      if (!cur) return null;
      return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }} onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 btn-ghost p-2" onClick={() => setLightboxIdx(null)}><X size={24} /></button>
          {imgMedia.length > 1 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 btn-ghost p-2 z-10" onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + imgMedia.length) % imgMedia.length); }}>
              <CaretLeft size={28} weight="bold" />
            </button>
          )}
          <img src={`${process.env.REACT_APP_BACKEND_URL}${cur.url}`} alt="" className="max-w-full max-h-full rounded-xl object-contain" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()} />
          {imgMedia.length > 1 && (
            <>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 btn-ghost p-2 z-10" onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % imgMedia.length); }}>
                <CaretRight size={28} weight="bold" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imgMedia.map((_, i) => (
                  <div key={i} onClick={e => { e.stopPropagation(); setLightboxIdx(i); }} className="w-2 h-2 rounded-full cursor-pointer transition-all" style={{ background: i === lightboxIdx ? 'white' : 'rgba(255,255,255,0.35)' }} />
                ))}
              </div>
            </>
          )}
        </div>
      );
    })()}

    {/* Schedule overlay — centered */}
    {showSchedule && calViewDate && (() => {
      const todayD = new Date();
      return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => { setShowSchedule(false); setCustomPerSocial(false); }}>
        <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: 400, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
          <div className="p-5 pb-0">
            {/* Date header */}
            <p className="text-sm text-[var(--text-muted)] mb-0.5">{calViewDate.getFullYear()}</p>
            <p className={`text-2xl font-bold ${scheduleDate ? 'mb-4' : 'mb-1'}`} style={{ color: scheduleDate ? 'var(--text-primary)' : 'var(--text-muted)' }}>{formatScheduleHeader(scheduleDate)}</p>
            {!scheduleDate && <p className="text-xs mb-4" style={{ color: '#f59e0b' }}>← Seleziona un giorno nel calendario</p>}

            {/* Calendar */}
            <div className="rounded-xl mb-4 p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-3 px-1">
                <button className="btn-ghost p-1" onClick={() => setCalViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}><CaretLeft size={16} /></button>
                <button className="btn-ghost p-1" onClick={() => setCalViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}><CaretRight size={16} /></button>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {DAY_FULL.map(d => <div key={d} className="text-center text-xs font-bold text-[var(--text-muted)] py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {calDaysExtended(calViewDate).map((cell, i) => {
                  const iso = `${cell.year}-${String(cell.month+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
                  const isSelected = scheduleDate === iso;
                  const isToday = cell.isCurrent && cell.day === todayD.getDate() && cell.month === todayD.getMonth() && cell.year === todayD.getFullYear();
                  const isPast = cell.isCurrent && new Date(cell.year, cell.month, cell.day) < new Date(todayD.getFullYear(), todayD.getMonth(), todayD.getDate());
                  const TEAL = '#14b8a6';
                  return (
                    <button key={i} onClick={() => !cell.isPrev && setScheduleDate(iso)}
                      className="flex flex-col items-center py-1 transition-all"
                      style={{ cursor: cell.isPrev ? 'default' : 'pointer' }}>
                      {isToday && <span style={{ fontSize: 8, color: TEAL, fontWeight: 700, lineHeight: 1.2 }}>Oggi</span>}
                      {cell.isNext && <span style={{ fontSize: 8, color: '#f59e0b', fontWeight: 700, lineHeight: 1.2 }}>{MONTH_ABB[cell.month]}</span>}
                      {!isToday && !cell.isNext && <span style={{ fontSize: 8, lineHeight: 1.2 }}>&nbsp;</span>}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: isToday || isSelected ? 700 : 500,
                        background: isToday || isSelected ? TEAL : 'transparent',
                        color: isToday || isSelected ? 'white' : cell.isPrev ? 'rgba(255,255,255,0.2)' : isPast ? 'rgba(255,255,255,0.35)' : 'var(--text-primary)',
                      }}>
                        {cell.day}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time section */}
            {!customPerSocial ? (
              <>
                <p className="text-sm text-[var(--text-muted)] mb-2">Time</p>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  className="w-full text-center text-xl font-semibold rounded-xl mb-4"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', padding: '14px', color: 'var(--text-primary)' }} />
                <button className="w-full text-center text-sm text-[var(--text-muted)] mb-4 hover:text-white transition-colors"
                  onClick={() => setCustomPerSocial(true)}>
                  Personalizza l'orario per ogni account social <span style={{ opacity: 0.6 }}>ⓘ</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--text-muted)] mb-3">Seleziona ora o fascia oraria <span style={{ opacity: 0.6 }}>ⓘ</span></p>
                {selectedProfiles.map(prof => {
                  const pi = PLATFORM_ICONS[prof.platform] || { Icon: Globe, color: '#888' };
                  return (
                    <div key={prof.id} className="flex items-center gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ background: `${pi.color}30`, border: `2px solid ${pi.color}60`, color: pi.color }}>
                          {(prof.profile_name || '?')[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: pi.color }}>
                          <pi.Icon size={10} color="white" weight="fill" />
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)' }}>
                        <input type="time" value={socialTimes[prof.id] || scheduleTime}
                          onChange={e => setSocialTimes(prev => ({ ...prev, [prof.id]: e.target.value }))}
                          className="text-base font-semibold bg-transparent border-0 outline-none flex-1 text-center"
                          style={{ color: 'var(--text-primary)', minWidth: 0 }} />
                      </div>
                      <button className="btn-ghost p-1.5 flex-shrink-0" onClick={() => setSocialTimes(prev => ({ ...prev, [prof.id]: scheduleTime }))}>
                        <PencilSimple size={14} />
                      </button>
                    </div>
                  );
                })}
                <button className="w-full text-center text-sm text-[var(--text-muted)] mb-4 hover:text-white transition-colors"
                  onClick={() => setCustomPerSocial(false)}>
                  Passa all'orario unificato
                </button>
              </>
            )}
          </div>

          {/* Selected socials indicator */}
          <div className="px-5 pb-3">
            {selectedProfiles.length === 0 ? (
              <p className="text-xs text-center py-2 rounded-xl" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                ⚠ Seleziona almeno un social dalla colonna sinistra
              </p>
            ) : (
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex -space-x-1.5">
                  {selectedProfiles.map(prof => {
                    const pi = PLATFORM_ICONS[prof.platform] || { Icon: Globe, color: '#888' };
                    return (
                      <div key={prof.id} className="w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-[var(--bg-card)]" style={{ background: pi.color }}>
                        <pi.Icon size={12} color="white" weight="fill" />
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs text-[var(--text-muted)]">{selectedProfiles.length} social selezionati</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 pb-5">
            <button className="btn-ghost flex-1" onClick={() => { setShowSchedule(false); setCustomPerSocial(false); }} disabled={scheduling}>{t('common.cancel')}</button>
            <button className="btn-gradient flex-1" onClick={schedule} disabled={scheduling || !scheduleDate || selectedSocials.length === 0}>
              {scheduling ? '...' : 'Programma'}
            </button>
          </div>
        </div>
      </div>
      );
    })()}
    </>
  );
}
