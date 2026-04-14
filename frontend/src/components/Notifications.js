import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Check } from '@phosphor-icons/react';

export default function Notifications() {
  const { api } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications/release-notes')
      .then(r => setNotes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.post('/notifications/mark-read').catch(() => {});
  }, [api]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-2" data-testid="notifications-title">Novita</h1>
      <p className="text-[var(--text-secondary)] mb-8 text-sm">Le ultime novita e aggiornamenti di Sketchario.</p>

      {loading ? (
        <p className="text-[var(--text-muted)] text-center py-8">Caricamento...</p>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
          <p className="text-[var(--text-muted)]">Nessuna novita al momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
              style={!note.read ? { borderColor: 'var(--gradient-start)', borderWidth: '1px' } : {}}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {!note.read && <span className="w-2 h-2 rounded-full bg-[var(--gradient-start)]" />}
                    <h3 className="font-semibold">{note.title}</h3>
                  </div>
                  {note.version && <span className="badge purple text-[10px]">{note.version}</span>}
                </div>
                <span className="text-xs text-[var(--text-muted)]">{new Date(note.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{note.body}</p>
              {note.read && <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1"><Check size={12} /> Letta</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
