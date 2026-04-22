import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { User, Lock, Trash, Check, Warning } from '@phosphor-icons/react';

export default function Profile() {
  const { user, updateProfile, api, logout } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || '');
  const [sector, setSector] = useState(user?.sector || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const [showDelete, setShowDelete] = useState(false);

  const saveProfile = async () => {
    try {
      await updateProfile({ name, sector });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.response?.data?.detail || t('common.error'));
    }
  };

  const changePassword = async () => {
    setPwMsg('');
    try {
      await api.post('/profile/change-password', { current_password: currentPw, new_password: newPw });
      setPwMsg('Password cambiata con successo');
      setCurrentPw(''); setNewPw('');
    } catch (e) {
      setPwMsg(e.response?.data?.detail || t('common.error'));
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm(t('profile.deleteAccountConfirm'))) return;
    const confirm = window.prompt('Digita ELIMINA per confermare:');
    if (confirm !== 'ELIMINA') return;
    try {
      await api.delete('/profile/delete-account');
      logout();
    } catch (e) {
      setError(e.response?.data?.detail || t('common.error'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-2" data-testid="profile-title">{t('profile.title')}</h1>
      <p className="text-[var(--text-secondary)] mb-8 text-sm">Gestisci le impostazioni del tuo account.</p>

      {/* Profile Info */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><User size={20} /> {t('profile.name')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('profile.name')}</label>
            <input data-testid="profile-name" className="input-dark" value={name} onChange={e => setName(e.target.value)} style={{ paddingLeft: '1rem' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('profile.email')}</label>
            <input className="input-dark opacity-50 cursor-not-allowed" value={user?.email || ''} disabled style={{ paddingLeft: '1rem' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('wizard.sector')}</label>
            <input data-testid="profile-sector" className="input-dark" value={sector} onChange={e => setSector(e.target.value)} placeholder="Es. Fotografo, Life Coach..." style={{ paddingLeft: '1rem' }} />
          </div>
          {error && <p className="text-sm text-[var(--accent-pink)]">{error}</p>}
          <button data-testid="profile-save-btn" className="btn-gradient" onClick={saveProfile}>
            {saved ? <><Check size={16} /> {t('common.save')}!</> : t('profile.saveChanges')}
          </button>
        </div>
      </div>

      {/* Plan */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-2">{t('profile.plan')}</h3>
        <div className="flex items-center gap-3">
          <span className="badge purple uppercase">{user?.plan || 'free'}</span>
          <p className="text-sm text-[var(--text-muted)]">Upgrade disponibile nella prossima versione.</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Lock size={20} /> {t('profile.currentPassword')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('profile.currentPassword')}</label>
            <input type="password" className="input-dark" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={{ paddingLeft: '1rem' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('profile.newPassword')}</label>
            <input type="password" className="input-dark" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8" style={{ paddingLeft: '1rem' }} />
          </div>
          {pwMsg && <p className="text-sm" style={{ color: pwMsg.includes('successo') ? 'var(--accent-green)' : 'var(--accent-pink)' }}>{pwMsg}</p>}
          <button className="btn-ghost" onClick={changePassword}>{t('profile.saveChanges')}</button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="card" style={{ borderColor: 'rgba(236,72,153,0.3)' }}>
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-[var(--accent-pink)]"><Warning size={20} /> {t('profile.dangerZone')}</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          L'eliminazione dell'account rimuovera tutti i dati in modo irreversibile: profilo, progetti, contenuti, media.
        </p>
        <button data-testid="delete-account-btn" className="btn-ghost" style={{ borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }} onClick={deleteAccount}>
          <Trash size={16} /> {t('profile.deleteAccount')}
        </button>
      </div>
    </div>
  );
}
