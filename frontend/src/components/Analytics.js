import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartBar, Article, Video, Image, Target, Queue,
  ArrowClockwise, Sparkle, TrendUp, Heart, ChatCircle,
  Eye, InstagramLogo, FacebookLogo, LinkedinLogo, Star, Lightning
} from '@phosphor-icons/react';

const COLORS = {
  reel: '#ec4899', carousel: '#6366f1', prompted_reel: '#a855f7',
  awareness: '#3b82f6', education: '#22c55e', monetizing: '#f97316', unknown: '#6b7280',
  draft: '#a855f7', scheduled: '#f97316', published: '#22c55e', failed: '#ef4444',
  queued: '#3b82f6',
  facebook: '#1877F2', instagram: '#E4405F', linkedin: '#0A66C2',
};

const PLATFORM_ICONS = {
  facebook: FacebookLogo, instagram: InstagramLogo, linkedin: LinkedinLogo,
};

function StatBar({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize">{label}</span>
        <span className="text-[var(--text-muted)]">{value} ({Math.round(pct)}%)</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

function MetricChip({ label, value, icon: Icon, color }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <Icon size={20} weight="fill" style={{ color, marginBottom: 4 }} />
      <p className="text-lg font-bold">{typeof value === 'number' ? value.toLocaleString('it-IT') : value}</p>
      <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">{label}</p>
    </div>
  );
}

export default function Analytics({ project, compact }) {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [postMetrics, setPostMetrics] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const load = useCallback(() => {
    if (!project?.id) return;
    setLoading(true);
    Promise.all([
      api.get(`/analytics/${project.id}`),
      api.get(`/analytics/${project.id}/post-metrics`),
    ]).then(([r1, r2]) => {
      setData(r1.data);
      setPostMetrics(r2.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [api, project?.id]);

  useEffect(() => { load(); }, [load]);

  const syncMetrics = async () => {
    setSyncing(true); setSyncMsg('');
    try {
      const { data: res } = await api.post(`/analytics/${project.id}/sync`);
      setSyncMsg(`Sincronizzati ${res.synced} post${res.errors?.length ? ` (${res.errors.length} errori)` : ''}`);
      const r2 = await api.get(`/analytics/${project.id}/post-metrics`);
      setPostMetrics(r2.data || []);
    } catch (e) {
      setSyncMsg('Errore nella sincronizzazione');
    } finally { setSyncing(false); }
  };

  const loadAiInsights = async () => {
    setLoadingAi(true);
    try {
      const { data: ins } = await api.get(`/analytics/${project.id}/ai-insights`);
      setAiInsights(ins);
    } catch { } finally { setLoadingAi(false); }
  };

  if (loading) return <p className="text-[var(--text-muted)] text-center py-4 text-xs">Caricamento...</p>;
  if (!data) return <p className="text-[var(--text-muted)] text-center py-4 text-xs">--</p>;

  if (compact) {
    return (
      <div>
        <div className="flex justify-between text-xs mb-2">
          <span>Contenuti</span>
          <span className="font-bold">{data.total_contents}/{data.target_contents}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--bg-card)] overflow-hidden mb-3">
          <div className="h-full rounded-full" style={{ width: `${data.completion_pct}%`, background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))' }} />
        </div>
        {Object.entries(data.by_format).map(([k, v]) => (
          <StatBar key={k} label={k} value={v} total={data.total_contents} color={COLORS[k] || '#6b7280'} />
        ))}
        {postMetrics.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold mb-2">Engagement reale</p>
            <div className="flex gap-3 text-center">
              <div><p className="text-sm font-bold">{postMetrics.reduce((s, m) => s + (m.metrics?.reach || m.metrics?.impressions || 0), 0).toLocaleString('it-IT')}</p><p className="text-[9px] text-[var(--text-muted)]">Reach</p></div>
              <div><p className="text-sm font-bold">{postMetrics.reduce((s, m) => s + (m.metrics?.likes || 0), 0).toLocaleString('it-IT')}</p><p className="text-[9px] text-[var(--text-muted)]">Like</p></div>
              <div><p className="text-sm font-bold">{postMetrics.reduce((s, m) => s + (m.metrics?.comments || 0), 0).toLocaleString('it-IT')}</p><p className="text-[9px] text-[var(--text-muted)]">Commenti</p></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const totalReach = postMetrics.reduce((s, m) => s + (m.metrics?.reach || m.metrics?.impressions || 0), 0);
  const totalLikes = postMetrics.reduce((s, m) => s + (m.metrics?.likes || 0), 0);
  const totalComments = postMetrics.reduce((s, m) => s + (m.metrics?.comments || 0), 0);
  const engagementRate = totalReach > 0 ? (((totalLikes + totalComments) / totalReach) * 100).toFixed(1) : '—';
  const hasMetrics = postMetrics.length > 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" data-testid="analytics-title">Analytics</h3>
        <button className="btn-ghost text-xs flex items-center gap-1" onClick={load}>
          <ArrowClockwise size={13} /> Aggiorna
        </button>
      </div>

      {/* Internal Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Contenuti', value: `${data.total_contents}/${data.target_contents}`, icon: Article, color: 'var(--gradient-start)' },
          { label: 'Completamento', value: `${data.completion_pct}%`, icon: Target, color: '#22c55e' },
          { label: 'Media', value: data.media_count, icon: Image, color: '#f97316' },
          { label: 'Pubblicati', value: data.queue_by_status?.published || 0, icon: Queue, color: '#a855f7' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
            <div>
              <p className="text-[var(--text-secondary)] text-xs mb-1">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
            <s.icon size={24} weight="fill" style={{ color: s.color }} />
          </motion.div>
        ))}
      </div>

      {/* Completion Bar */}
      <div className="card">
        <h4 className="text-sm font-semibold mb-3">Completamento Campagna</h4>
        <div className="w-full h-4 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${data.completion_pct}%` }} transition={{ duration: 1 }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))' }} />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">{data.total_contents} di {data.target_contents} contenuti creati</p>
      </div>

      {/* ENGAGEMENT REALE */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2"><TrendUp size={16} weight="fill" color="var(--gradient-start)" /> Engagement Reale</h4>
          <div className="flex items-center gap-2">
            {syncMsg && <span className="text-[10px] text-[var(--text-muted)]">{syncMsg}</span>}
            <button className="btn-gradient text-xs flex items-center gap-1" onClick={syncMetrics} disabled={syncing}>
              <ArrowClockwise size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizzando...' : 'Sincronizza metriche'}
            </button>
          </div>
        </div>

        {hasMetrics ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <MetricChip label="Reach" value={totalReach} icon={Eye} color="#6366f1" />
              <MetricChip label="Like" value={totalLikes} icon={Heart} color="#ec4899" />
              <MetricChip label="Commenti" value={totalComments} icon={ChatCircle} color="#22c55e" />
              <MetricChip label="Eng. Rate" value={`${engagementRate}%`} icon={TrendUp} color="#f97316" />
            </div>

            {/* Top Posts */}
            <h5 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-3">Top Post per Engagement</h5>
            <div className="space-y-2">
              {[...postMetrics]
                .sort((a, b) => {
                  const engA = Object.values(a.metrics || {}).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
                  const engB = Object.values(b.metrics || {}).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
                  return engB - engA;
                })
                .slice(0, 5)
                .map((m, i) => {
                  const PlatIcon = PLATFORM_ICONS[m.platform] || ChartBar;
                  const eng = Object.values(m.metrics || {}).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                      <span className="text-xs font-bold text-[var(--text-muted)] w-4">#{i + 1}</span>
                      <PlatIcon size={16} weight="fill" color={COLORS[m.platform]} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{m.hook_text || '—'}</p>
                        <p className="text-[10px] text-[var(--text-muted)] capitalize">{m.format} · {m.pillar}</p>
                      </div>
                      <div className="flex gap-3 text-[11px] text-[var(--text-muted)] flex-shrink-0">
                        {m.metrics?.reach != null && <span><Eye size={10} className="inline mr-0.5" />{(m.metrics.reach || m.metrics.impressions || 0).toLocaleString('it-IT')}</span>}
                        {m.metrics?.likes != null && <span><Heart size={10} className="inline mr-0.5" />{m.metrics.likes}</span>}
                        {m.metrics?.comments != null && <span><ChatCircle size={10} className="inline mr-0.5" />{m.metrics.comments}</span>}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Per Format / Per Pillar engagement */}
            {aiInsights && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { label: 'Miglior Formato', value: aiInsights.best_format, color: 'var(--gradient-start)' },
                  { label: 'Miglior Pillar', value: aiInsights.best_pillar, color: '#22c55e' },
                ].map(s => s.value && (
                  <div key={s.label} className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold mb-1">{s.label}</p>
                    <p className="text-sm font-medium" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <TrendUp size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)] mb-1">Nessuna metrica disponibile</p>
            <p className="text-xs text-[var(--text-muted)]">Pubblica dei contenuti su Facebook, Instagram o LinkedIn, poi clicca "Sincronizza metriche"</p>
          </div>
        )}
      </div>

      {/* AI INSIGHTS */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Sparkle size={16} weight="fill" color="#a855f7" /> AI Insights</h4>
          <button className="btn-ghost text-xs flex items-center gap-1" onClick={loadAiInsights} disabled={loadingAi}>
            <Lightning size={12} weight="fill" /> {loadingAi ? 'Analizzando...' : 'Analizza'}
          </button>
        </div>

        {aiInsights ? (
          <div className="space-y-4">
            {aiInsights.insights && (
              <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p className="text-sm leading-relaxed">{aiInsights.insights}</p>
              </div>
            )}
            {aiInsights.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Raccomandazioni</p>
                <div className="space-y-2">
                  {aiInsights.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-2 items-start p-2.5 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                      <Star size={14} weight="fill" color="#f97316" className="flex-shrink-0 mt-0.5" />
                      <p className="text-xs">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            {hasMetrics ? 'Clicca "Analizza" per ottenere insights AI sui tuoi dati di performance' : 'Sincronizza prima le metriche per ottenere insights AI'}
          </p>
        )}
      </div>

      {/* Internal breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h4 className="text-sm font-semibold mb-4">Contenuti per Formato</h4>
          {Object.entries(data.by_format).map(([k, v]) => (
            <StatBar key={k} label={k} value={v} total={data.total_contents} color={COLORS[k] || '#6b7280'} />
          ))}
        </div>
        <div className="card">
          <h4 className="text-sm font-semibold mb-4">Contenuti per Pillar</h4>
          {Object.entries(data.by_pillar).map(([k, v]) => (
            <StatBar key={k} label={k} value={v} total={data.total_contents} color={COLORS[k] || '#6b7280'} />
          ))}
        </div>
        <div className="card">
          <h4 className="text-sm font-semibold mb-4">Per Stato</h4>
          {Object.entries(data.by_status).map(([k, v]) => (
            <StatBar key={k} label={k} value={v} total={data.total_contents} color={COLORS[k] || '#6b7280'} />
          ))}
        </div>
        <div className="card">
          <h4 className="text-sm font-semibold mb-4">Publishing Queue</h4>
          {Object.keys(data.queue_by_status).length > 0 ? (
            Object.entries(data.queue_by_status).map(([k, v]) => (
              <StatBar key={k} label={k} value={v} total={data.queue_total} color={COLORS[k] || '#6b7280'} />
            ))
          ) : <p className="text-sm text-[var(--text-muted)]">Nessun elemento in coda</p>}
          {Object.keys(data.queue_by_platform || {}).length > 0 && (
            <>
              <h4 className="text-sm font-semibold mb-3 mt-4">Per Piattaforma</h4>
              {Object.entries(data.queue_by_platform).map(([k, v]) => (
                <StatBar key={k} label={k} value={v} total={data.queue_total} color={COLORS[k] || '#6b7280'} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
