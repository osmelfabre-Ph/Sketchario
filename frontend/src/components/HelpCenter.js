import React, { useState, useMemo } from 'react';
import {
  X, MagnifyingGlass, ArrowLeft, CaretRight,
  House, Sparkle, Article, PencilSimple, PaperPlaneTilt,
  ShareNetwork, Users, Question, CheckCircle, Warning, Lightbulb,
  CalendarBlank, Images, FileText, MagicWand, Queue, CreditCard,
  ChartBar, BookOpen, Clock, Palette, InstagramLogo, FacebookLogo,
  LinkedinLogo, TiktokLogo, PinterestLogo
} from '@phosphor-icons/react';

// ─── CATEGORIE ───────────────────────────────────────────────
const CATEGORIES = [
  { id: 'start',        Icon: House,          color: '#6366f1', title: 'Primi Passi',         desc: 'Panoramica e setup iniziale' },
  { id: 'wizard',       Icon: Sparkle,        color: '#a855f7', title: 'Creare un Progetto',  desc: 'Il Wizard guidato passo per passo' },
  { id: 'content',      Icon: Article,        color: '#3b82f6', title: 'Gestione Contenuti',  desc: 'Lista, calendario e stati' },
  { id: 'editor',       Icon: PencilSimple,   color: '#ec4899', title: 'Editor dei Post',     desc: 'Scrivere, media e ottimizzazione' },
  { id: 'publish',      Icon: PaperPlaneTilt, color: '#22c55e', title: 'Pubblicazione',       desc: 'Social, scheduling e coda' },
  { id: 'integrations', Icon: ShareNetwork,   color: '#f97316', title: 'Integrazioni',        desc: 'Drive, Canva, Feed RSS' },
  { id: 'account',      Icon: Users,          color: '#06b6d4', title: 'Account e Team',      desc: 'Profilo, piani e collaboratori' },
];

// ─── ARTICOLI (per ora vuoti, verranno riempiti per area) ────
export const ARTICLES = [];

// ─── BLOCCHI RENDER ──────────────────────────────────────────
function Block({ b }) {
  if (b.type === 'para')
    return <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '0.75rem', fontSize: '0.9rem' }}>{b.text}</p>;
  if (b.type === 'h3')
    return <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', marginTop: '1.25rem' }}>{b.text}</h3>;
  if (b.type === 'bullets')
    return (
      <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>
        {b.items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    );
  if (b.type === 'steps')
    return (
      <ol style={{ paddingLeft: 0, marginBottom: '0.75rem', listStyle: 'none' }}>
        {b.items.map((it, i) => (
          <li key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ background: 'linear-gradient(135deg,var(--gradient-start),var(--gradient-end))', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>{i + 1}</span>
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.125rem' }}>{it.title}</p>
              {it.desc && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{it.desc}</p>}
            </div>
          </li>
        ))}
      </ol>
    );
  if (b.type === 'tip')
    return (
      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <CheckCircle size={16} color="#4ade80" weight="fill" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ color: '#4ade80', fontSize: '0.85rem', lineHeight: 1.6 }}>{b.text}</p>
      </div>
    );
  if (b.type === 'warn')
    return (
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <Warning size={16} color="#f59e0b" weight="fill" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ color: '#f59e0b', fontSize: '0.85rem', lineHeight: 1.6 }}>{b.text}</p>
      </div>
    );
  if (b.type === 'note')
    return (
      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <Lightbulb size={16} color="#a5b4fc" weight="fill" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ color: '#a5b4fc', fontSize: '0.85rem', lineHeight: 1.6 }}>{b.text}</p>
      </div>
    );
  if (b.type === 'grid')
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${b.cols || 2}, 1fr)`, gap: '0.75rem', marginBottom: '0.75rem' }}>
        {b.items.map((it, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '0.875rem' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{it.title}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>{it.desc}</p>
          </div>
        ))}
      </div>
    );
  return null;
}

// ─── COMPONENTE PRINCIPALE ───────────────────────────────────
export default function HelpCenter({ onClose }) {
  const [catId, setCatId]       = useState(null);
  const [articleId, setArticleId] = useState(null);
  const [search, setSearch]     = useState('');

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ARTICLES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q) ||
      a.content.some(b =>
        b.text?.toLowerCase().includes(q) ||
        b.items?.some(i => (typeof i === 'string' ? i : (i.title || '') + ' ' + (i.desc || '')).toLowerCase().includes(q))
      )
    );
  }, [search]);

  const currentCat     = CATEGORIES.find(c => c.id === catId);
  const currentArticle = ARTICLES.find(a => a.id === articleId);
  const catArticles    = ARTICLES.filter(a => a.categoryId === catId);

  const goHome = () => { setCatId(null); setArticleId(null); setSearch(''); };

  // ── LAYOUT ──
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        <img src="/assets/favicon.jpg" alt="Sketchario" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Guida di Sketchario</span>
        <div style={{ flex: 1, position: 'relative', maxWidth: 480 }}>
          <MagnifyingGlass size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCatId(null); setArticleId(null); }}
            placeholder="Cerca nella guida..."
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.625rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}>
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Sidebar categorie */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflowY: 'auto', padding: '1.25rem 0.75rem' }}>
          <button onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '1rem', padding: '0.25rem 0.5rem' }}>
            <House size={14} /> Home
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCatId(cat.id); setArticleId(null); setSearch(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%', textAlign: 'left',
                padding: '0.625rem 0.75rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer',
                marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s',
                background: catId === cat.id ? `${cat.color}18` : 'transparent',
                color: catId === cat.id ? cat.color : 'var(--text-secondary)',
              }}
            >
              <cat.Icon size={16} color={cat.color} weight={catId === cat.id ? 'fill' : 'regular'} />
              {cat.title}
            </button>
          ))}
        </div>

        {/* Contenuto principale */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

          {/* RICERCA */}
          {search.trim() && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {searchResults.length} risultati per "<strong style={{ color: 'var(--text-secondary)' }}>{search}</strong>"
              </p>
              {searchResults.length === 0
                ? <p style={{ color: 'var(--text-muted)' }}>Nessun risultato trovato.</p>
                : searchResults.map(a => <ArticleCard key={a.id} article={a} categories={CATEGORIES} onClick={() => { setCatId(a.categoryId); setArticleId(a.id); setSearch(''); }} />)
              }
            </div>
          )}

          {/* HOME */}
          {!search.trim() && !catId && (
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Come possiamo aiutarti?</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Esplora la guida completa di Sketchario per imparare a usare tutte le funzionalità.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCatId(cat.id)}
                    style={{ background: 'var(--bg-card)', border: `1px solid ${cat.color}30`, borderRadius: '1rem', padding: '1.25rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = cat.color + '70'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = cat.color + '30'}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '0.625rem', background: cat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <cat.Icon size={20} color={cat.color} weight="duotone" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{cat.title}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.desc}</p>
                    <p style={{ fontSize: '0.75rem', color: cat.color, marginTop: '0.5rem' }}>{ARTICLES.filter(a => a.categoryId === cat.id).length} articoli</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LISTA ARTICOLI categoria */}
          {!search.trim() && catId && !articleId && currentCat && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: currentCat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <currentCat.Icon size={20} color={currentCat.color} weight="duotone" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{currentCat.title}</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{currentCat.desc}</p>
                </div>
              </div>
              {catArticles.length === 0
                ? <p style={{ color: 'var(--text-muted)' }}>Articoli in arrivo presto.</p>
                : catArticles.map(a => <ArticleCard key={a.id} article={a} categories={CATEGORIES} onClick={() => setArticleId(a.id)} />)
              }
            </div>
          )}

          {/* ARTICOLO */}
          {!search.trim() && articleId && currentArticle && (
            <div style={{ maxWidth: 720 }}>
              <button
                onClick={() => setArticleId(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '1.5rem' }}
              >
                <ArrowLeft size={14} /> Torna a {currentCat?.title}
              </button>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{currentArticle.title}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>{currentArticle.desc}</p>
              <hr style={{ borderColor: 'var(--border-color)', marginBottom: '1.75rem' }} />
              {currentArticle.content.map((b, i) => <Block key={i} b={b} />)}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article, categories, onClick }) {
  const cat = categories.find(c => c.id === article.categoryId);
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '0.5rem', cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      {cat && (
        <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: cat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <cat.Icon size={18} color={cat.color} weight="duotone" />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{article.title}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{article.desc}</p>
      </div>
      <CaretRight size={16} color="var(--text-muted)" />
    </button>
  );
}
