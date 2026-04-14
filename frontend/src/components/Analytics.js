import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartBar, Article, Video, Image, Target, Clock, CheckCircle, XCircle, Queue
} from '@phosphor-icons/react';

const COLORS = {
  reel: '#ec4899', carousel: '#6366f1',
  awareness: '#3b82f6', education: '#22c55e', monetizing: '#f97316', unknown: '#6b7280',
  draft: '#a855f7', scheduled: '#f97316', published: '#22c55e', failed: '#ef4444',
  queued: '#3b82f6', processing: '#f97316',
};

function StatBar({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize">{label}</span>
        <span className="text-[var(--text-muted)]">{value} ({Math.round(pct)}%)</span>
      </div>
      <div className="w-full h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

export default function Analytics({ project, compact }) {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project?.id) return;
    api.get(`/analytics/${project.id}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [api, project?.id]);

  if (loading) return <p className="text-[var(--text-muted)] text-center py-4 text-xs">Caricamento...</p>;
  if (!data) return <p className="text-[var(--text-muted)] text-center py-4 text-xs">--</p>;

  if (compact) {
    return (
      <div>
        <div className="flex justify-between text-xs mb-2"><span>Contenuti</span><span className="font-bold">{data.total_contents}/{data.target_contents}</span></div>
        <div className="w-full h-2 rounded-full bg-[var(--bg-card)] overflow-hidden mb-3">
          <div className="h-full rounded-full" style={{ width: `${data.completion_pct}%`, background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))' }} />
        </div>
        {Object.entries(data.by_format).map(([k, v]) => (
          <StatBar key={k} label={k} value={v} total={data.total_contents} color={COLORS[k] || '#6b7280'} />
        ))}
        {Object.entries(data.by_status).map(([k, v]) => (
          <StatBar key={k} label={k} value={v} total={data.total_contents} color={COLORS[k] || '#6b7280'} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h3 className="font-semibold mb-6" data-testid="analytics-title">Content Analytics</h3>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Contenuti', value: data.total_contents, target: data.target_contents, icon: Article, color: 'var(--gradient-start)' },
          { label: 'Completamento', value: `${data.completion_pct}%`, icon: Target, color: '#22c55e' },
          { label: 'Media', value: data.media_count, icon: Image, color: '#f97316' },
          { label: 'In Coda', value: data.queue_total, icon: Queue, color: '#a855f7' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
            <div>
              <p className="text-[var(--text-secondary)] text-xs mb-1">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}{s.target ? <span className="text-sm text-[var(--text-muted)] font-normal">/{s.target}</span> : null}</p>
            </div>
            <s.icon size={28} weight="fill" style={{ color: s.color }} />
          </motion.div>
        ))}
      </div>

      {/* Completion Bar */}
      <div className="card mb-6">
        <h4 className="text-sm font-semibold mb-3">Completamento Campagna</h4>
        <div className="w-full h-5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${data.completion_pct}%` }} transition={{ duration: 1 }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))' }} />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">{data.total_contents} di {data.target_contents} contenuti creati</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Format */}
        <div className="card">
          <h4 className="text-sm font-semibold mb-4">Per Formato</h4>
          {Object.entries(data.by_format).map(([k, v]) => (
            <StatBar key={k} label={k} value={v} total={data.total_contents} color={COLORS[k] || '#6b7280'} />
          ))}
        </div>

        {/* By Pillar */}
        <div className="card">
          <h4 className="text-sm font-semibold mb-4">Per Pillar</h4>
          {Object.entries(data.by_pillar).map(([k, v]) => (
            <StatBar key={k} label={k} value={v} total={data.total_contents} color={COLORS[k] || '#6b7280'} />
          ))}
        </div>

        {/* By Status */}
        <div className="card">
          <h4 className="text-sm font-semibold mb-4">Per Stato</h4>
          {Object.entries(data.by_status).map(([k, v]) => (
            <StatBar key={k} label={k} value={v} total={data.total_contents} color={COLORS[k] || '#6b7280'} />
          ))}
        </div>

        {/* Queue Stats */}
        <div className="card">
          <h4 className="text-sm font-semibold mb-4">Publishing Queue</h4>
          {Object.keys(data.queue_by_status).length > 0 ? (
            Object.entries(data.queue_by_status).map(([k, v]) => (
              <StatBar key={k} label={k} value={v} total={data.queue_total} color={COLORS[k] || '#6b7280'} />
            ))
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Nessun elemento in coda</p>
          )}
          {Object.keys(data.queue_by_platform).length > 0 && (
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
