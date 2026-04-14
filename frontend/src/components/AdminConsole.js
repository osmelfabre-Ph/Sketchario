import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  ShieldCheck, Plus, Trash, ToggleLeft, ToggleRight, Megaphone, PencilSimple, X
} from '@phosphor-icons/react';

export default function AdminConsole() {
  const { api, user } = useAuth();
  const [powerUsers, setPowerUsers] = useState([]);
  const [releaseNotes, setReleaseNotes] = useState([]);
  const [puEmail, setPuEmail] = useState('');
  const [puPlan, setPuPlan] = useState('strategist');
  const [puDays, setPuDays] = useState(30);
  const [puNotes, setPuNotes] = useState('');
  const [rnTitle, setRnTitle] = useState('');
  const [rnBody, setRnBody] = useState('');
  const [rnVersion, setRnVersion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/power-users').then(r => setPowerUsers(r.data)).catch(() => {}),
      api.get('/release-notes').then(r => setReleaseNotes(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [api]);

  const addPowerUser = async () => {
    if (!puEmail.trim()) return;
    await api.post('/admin/power-users', { email: puEmail, plan: puPlan, days: puDays, notes: puNotes });
    const { data } = await api.get('/admin/power-users');
    setPowerUsers(data);
    setPuEmail(''); setPuNotes('');
  };

  const togglePu = async (email) => {
    await api.post(`/admin/power-users/${email}/toggle`);
    const { data } = await api.get('/admin/power-users');
    setPowerUsers(data);
  };

  const deletePu = async (email) => {
    await api.delete(`/admin/power-users/${email}`);
    setPowerUsers(prev => prev.filter(p => p.email !== email));
  };

  const createNote = async () => {
    if (!rnTitle.trim() || !rnBody.trim()) return;
    const { data } = await api.post('/admin/release-notes', { title: rnTitle, body: rnBody, version: rnVersion });
    setReleaseNotes(prev => [data, ...prev]);
    setRnTitle(''); setRnBody(''); setRnVersion('');
  };

  const deleteNote = async (id) => {
    await api.delete(`/admin/release-notes/${id}`);
    setReleaseNotes(prev => prev.filter(n => n.id !== id));
  };

  if (user?.role !== 'admin') return <p className="text-center text-[var(--text-muted)] py-12">Accesso riservato agli amministratori.</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-2" data-testid="admin-title">Admin Console</h1>
      <p className="text-[var(--text-secondary)] mb-8 text-sm">Gestisci power users e note di rilascio.</p>

      {/* Power Users */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><ShieldCheck size={20} /> Power Users</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <input className="input-dark text-sm py-2" placeholder="Email utente" value={puEmail} onChange={e => setPuEmail(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
          <select className="input-dark text-sm py-2" value={puPlan} onChange={e => setPuPlan(e.target.value)} style={{ paddingLeft: '0.75rem' }}>
            <option value="creator">Creator</option>
            <option value="strategist">Strategist</option>
            <option value="custom">Custom</option>
          </select>
          <select className="input-dark text-sm py-2" value={puDays} onChange={e => setPuDays(Number(e.target.value))} style={{ paddingLeft: '0.75rem' }}>
            <option value={7}>7 giorni</option>
            <option value={14}>14 giorni</option>
            <option value={30}>30 giorni</option>
          </select>
          <input className="input-dark text-sm py-2" placeholder="Note" value={puNotes} onChange={e => setPuNotes(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
        </div>
        <button className="btn-gradient text-sm" onClick={addPowerUser} data-testid="add-power-user-btn"><Plus size={16} /> Aggiungi</button>

        {powerUsers.length > 0 && (
          <div className="mt-4 space-y-2">
            {powerUsers.map(pu => (
              <div key={pu.email} className="hook-item">
                <div className="flex-1">
                  <p className="text-sm font-medium">{pu.email}</p>
                  <p className="text-xs text-[var(--text-muted)]">{pu.plan} | Scade: {new Date(pu.expires_at).toLocaleDateString('it-IT')}</p>
                </div>
                <span className={`badge ${pu.active ? 'green' : 'orange'}`}>{pu.active ? 'Attivo' : 'Disattivo'}</span>
                <button className="btn-ghost p-1.5" onClick={() => togglePu(pu.email)}>
                  {pu.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button className="btn-ghost p-1.5" onClick={() => deletePu(pu.email)}><Trash size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Release Notes */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Megaphone size={20} /> Release Notes</h3>
        <div className="space-y-3 mb-4">
          <div className="flex gap-3">
            <input className="input-dark text-sm py-2 flex-1" placeholder="Titolo" value={rnTitle} onChange={e => setRnTitle(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
            <input className="input-dark text-sm py-2 w-32" placeholder="Versione" value={rnVersion} onChange={e => setRnVersion(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
          </div>
          <textarea className="input-dark text-sm py-2" rows={3} placeholder="Contenuto della nota..." value={rnBody} onChange={e => setRnBody(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
          <button className="btn-gradient text-sm" onClick={createNote} data-testid="create-release-note-btn"><Plus size={16} /> Pubblica Nota</button>
        </div>

        {releaseNotes.length > 0 && (
          <div className="space-y-3 mt-4 pt-4 border-t border-[var(--border-color)]">
            {releaseNotes.map(note => (
              <motion.div key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">{note.title}</h4>
                    {note.version && <span className="badge purple text-[10px] mt-1">{note.version}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)]">{new Date(note.created_at).toLocaleDateString('it-IT')}</span>
                    <button onClick={() => deleteNote(note.id)} className="text-[var(--accent-pink)]"><Trash size={14} /></button>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{note.body}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
