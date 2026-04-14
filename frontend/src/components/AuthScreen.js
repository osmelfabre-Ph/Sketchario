import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  EnvelopeSimple, Lock, User, ArrowRight, GoogleLogo, FacebookLogo
} from '@phosphor-icons/react';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(e => e.msg || '').join(' ') : 'Errore. Riprova.');
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
          <img
            src="https://customer-assets.emergentagent.com/job_editorial-flow-v4/artifacts/8xtbp3ac_LOGO-sketchario.jpg"
            alt="Sketchario"
            data-testid="auth-logo"
            style={{ height: 50, margin: '0 auto 12px', borderRadius: 8 }}
          />
          <p className="text-[var(--text-secondary)] text-sm">Content Strategy Engine</p>
        </div>

        <div className="flex gap-2 mb-8">
          <button data-testid="auth-tab-login" className={isLogin ? 'btn-gradient flex-1' : 'btn-ghost flex-1'} onClick={() => { setIsLogin(true); setError(''); }}>Accedi</button>
          <button data-testid="auth-tab-register" className={!isLogin ? 'btn-gradient flex-1' : 'btn-ghost flex-1'} onClick={() => { setIsLogin(false); setError(''); }}>Registrati</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input data-testid="auth-name-input" type="text" className="input-dark" placeholder="Il tuo nome" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
            <div className="relative">
              <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input data-testid="auth-email-input" type="email" className="input-dark" placeholder="email@esempio.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input data-testid="auth-password-input" type="password" className="input-dark" placeholder="Min 8 caratteri" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
          </div>

          {error && <p data-testid="auth-error" className="text-sm text-[var(--accent-pink)]">{error}</p>}

          <button data-testid="auth-submit-btn" className="btn-gradient w-full mt-6" type="submit" disabled={loading}>
            {loading ? 'Caricamento...' : isLogin ? 'Accedi' : 'Crea Account'}
            {!loading && <ArrowRight weight="bold" size={18} />}
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-xs font-medium text-[var(--text-muted)]">oppure</span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        <div className="flex gap-3">
          <button data-testid="auth-google-btn" className="btn-ghost flex-1"><GoogleLogo weight="bold" size={20} /> Google</button>
          <button data-testid="auth-facebook-btn" className="btn-ghost flex-1"><FacebookLogo weight="fill" size={20} color="#1877F2" /> Facebook</button>
        </div>
      </motion.div>
    </div>
  );
}
