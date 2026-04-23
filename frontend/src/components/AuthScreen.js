import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  EnvelopeSimple, Lock, ArrowRight, GoogleLogo, FacebookLogo
} from '@phosphor-icons/react';

export default function AuthScreen() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialError] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('social_error') || '';
  });
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const rt = params.get('reset_token');
    if (rt) { setResetToken(rt); setShowForgot(true); }
  });

  const handleForgot = async () => {
    setForgotMsg('');
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/forgot-password`, { email: forgotEmail });
      setForgotMsg(data.message || 'Link di reset inviato.');
    } catch { setForgotMsg('Errore. Riprova.'); }
  };

  const handleReset = async () => {
    setResetMsg('');
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/reset-password`, { token: resetToken, new_password: newPassword });
      setResetMsg(data.message || 'Password aggiornata!');
      setResetToken(''); setShowForgot(false);
    } catch (e) { setResetMsg(e.response?.data?.detail || 'Errore. Riprova.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-box"
      >
        <div className="mb-10 text-center">
          <div data-testid="auth-logo" style={{ height: 50, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/assets/LOGO-sketchario.jpg" alt="Sketchario" style={{ height: 50, objectFit: 'contain', borderRadius: 8 }} />
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Content Strategy Engine</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('auth.email')}</label>
            <div className="relative">
              <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input data-testid="auth-email-input" type="email" className="input-dark" placeholder="email@esempio.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input data-testid="auth-password-input" type="password" className="input-dark" placeholder="Min 8 caratteri" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
          </div>

          {error && <p data-testid="auth-error" className="text-sm text-[var(--accent-pink)]">{error}</p>}

          <button data-testid="auth-submit-btn" className="btn-gradient w-full mt-6" type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('auth.login')}
            {!loading && <ArrowRight weight="bold" size={18} />}
          </button>

          <p className="text-center mt-3">
            <button type="button" data-testid="forgot-password-link" className="text-sm text-[var(--text-muted)] hover:text-[var(--gradient-start)] underline" onClick={() => setShowForgot(true)}>
              {t('auth.forgotPassword')}
            </button>
          </p>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-xs font-medium text-[var(--text-muted)]">oppure</span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        {socialError && (
          <p className="text-sm text-center mb-3" style={{ color: 'var(--accent-pink)' }}>
            {socialError === 'cancelled' ? 'Accesso annullato.' : 'Errore di accesso social. Riprova.'}
          </p>
        )}

        <div className="flex gap-3">
          <button
            data-testid="auth-google-btn"
            className="btn-ghost flex-1"
            onClick={() => { window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/google/login`; }}
          >
            <GoogleLogo weight="bold" size={20} /> Google
          </button>
          <button
            data-testid="auth-facebook-btn"
            className="btn-ghost flex-1"
            onClick={() => { window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/facebook/login`; }}
          >
            <FacebookLogo weight="fill" size={20} color="#1877F2" /> Facebook
          </button>
        </div>

        <p className="text-center mt-6 text-xs text-[var(--text-muted)]">
          Non hai un account?{' '}
          <a href="https://www.sketchario.app" className="underline hover:text-white transition-colors">
            Scopri i piani
          </a>
        </p>
      </motion.div>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowForgot(false)}>
          <div className="card w-full max-w-sm" onClick={e => e.stopPropagation()}>
            {resetToken ? (
              <>
                <h3 className="text-lg font-semibold mb-4">{t('auth.newPassword') || 'Nuova Password'}</h3>
                <input type="password" className="input-dark mb-3" placeholder={t('auth.newPassword')} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ paddingLeft: '1rem' }} />
                {resetMsg && <p className="text-sm mb-3" style={{ color: resetMsg.includes('aggiornata') ? 'var(--accent-green)' : 'var(--accent-pink)' }}>{resetMsg}</p>}
                <button className="btn-gradient w-full" onClick={handleReset} data-testid="reset-password-btn">{t('common.confirm')}</button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">{t('auth.forgotPassword')}</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">Inserisci la tua email per ricevere un link di reset.</p>
                <input type="email" className="input-dark mb-3" placeholder="email@esempio.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={{ paddingLeft: '1rem' }} />
                {forgotMsg && <p className="text-sm text-[var(--accent-green)] mb-3">{forgotMsg}</p>}
                <button className="btn-gradient w-full" onClick={handleForgot} data-testid="send-reset-btn">Invia Link Reset</button>
              </>
            )}
            <button className="btn-ghost w-full mt-3" onClick={() => { setShowForgot(false); setResetToken(''); }}>{t('common.close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
