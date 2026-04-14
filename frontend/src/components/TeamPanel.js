import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  UsersThree, Plus, Trash, EnvelopeSimple, Check, X, Eye, PencilSimple, Crown
} from '@phosphor-icons/react';

export default function TeamPanel({ projectId }) {
  const { api, user } = useAuth();
  const [team, setTeam] = useState({ owner: null, members: [] });
  const [invites, setInvites] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('editor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/team/${projectId}`).then(r => setTeam(r.data)).catch(() => {}),
      api.get('/team/my-invites').then(r => setInvites(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [api, projectId]);

  const invite = async () => {
    if (!invEmail.trim()) return;
    try {
      await api.post('/team/invite', { project_id: projectId, email: invEmail, role: invRole });
      const { data } = await api.get(`/team/${projectId}`);
      setTeam(data);
      setInvEmail(''); setShowInvite(false);
    } catch (e) { alert(e.response?.data?.detail || 'Errore'); }
  };

  const remove = async (email) => {
    if (!window.confirm(`Rimuovere ${email} dal team?`)) return;
    await api.delete(`/team/${projectId}/${email}`);
    setTeam(prev => ({ ...prev, members: prev.members.filter(m => m.email !== email) }));
  };

  const accept = async (inviteId) => {
    await api.post(`/team/accept/${inviteId}`);
    setInvites(prev => prev.filter(i => i.id !== inviteId));
  };

  const isOwner = team.owner?.id === user?.id || team.owner?.email === user?.email;

  if (loading) return <p className="text-[var(--text-muted)] text-sm">Caricamento team...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-2"><UsersThree size={20} /> Team</h4>
        {isOwner && (
          <button className="btn-gradient text-xs py-1.5" onClick={() => setShowInvite(!showInvite)} data-testid="invite-team-btn">
            <Plus size={14} /> Invita
          </button>
        )}
      </div>

      {/* Pending invites for current user */}
      {invites.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Inviti Ricevuti</p>
          {invites.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg mb-2" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid var(--gradient-start)' }}>
              <div className="flex-1">
                <p className="text-sm font-medium">{inv.project_name}</p>
                <p className="text-xs text-[var(--text-muted)]">Ruolo: {inv.role}</p>
              </div>
              <button className="btn-gradient text-xs py-1 px-3" onClick={() => accept(inv.id)}><Check size={12} /> Accetta</button>
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <div className="card mb-4 p-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email</label>
              <input className="input-dark text-sm py-2" placeholder="collaboratore@email.com" value={invEmail} onChange={e => setInvEmail(e.target.value)} style={{ paddingLeft: '0.75rem' }} />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Ruolo</label>
              <select className="input-dark text-sm py-2" value={invRole} onChange={e => setInvRole(e.target.value)} style={{ paddingLeft: '0.75rem' }}>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button className="btn-gradient text-xs py-2" onClick={invite}>Invita</button>
          </div>
        </div>
      )}

      {/* Owner */}
      {team.owner && (
        <div className="flex items-center gap-3 p-3 rounded-lg mb-2" style={{ background: 'rgba(34,197,94,0.1)' }}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center flex-shrink-0">
            <Crown size={14} color="white" weight="fill" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{team.owner.name || team.owner.email}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{team.owner.email}</p>
          </div>
          <span className="badge green text-[10px]">Owner</span>
        </div>
      )}

      {/* Members */}
      {team.members.map(member => (
        <div key={member.id || member.email} className="flex items-center gap-3 p-3 rounded-lg mb-2" style={{ background: 'var(--bg-secondary)' }}>
          <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0">
            {member.role === 'editor' ? <PencilSimple size={14} /> : <Eye size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{member.email}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{member.status === 'pending' ? 'In attesa' : 'Accettato'}</p>
          </div>
          <span className={`badge ${member.role === 'editor' ? 'blue' : 'purple'} text-[10px]`}>{member.role}</span>
          {isOwner && (
            <button className="text-[var(--accent-pink)] hover:opacity-80" onClick={() => remove(member.email)}><Trash size={14} /></button>
          )}
        </div>
      ))}

      {team.members.length === 0 && !showInvite && (
        <p className="text-xs text-[var(--text-muted)] mt-2">Nessun collaboratore. Invita qualcuno per lavorare insieme!</p>
      )}
    </div>
  );
}
