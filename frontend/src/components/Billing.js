import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Check, Sparkle, Lightning, Crown } from '@phosphor-icons/react';

export default function Billing() {
  const { api, user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    api.get('/billing/plans').then(r => setPlans(r.data)).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      pollStatus(sessionId);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [api]);

  const pollStatus = async (sessionId, attempt = 0) => {
    if (attempt >= 5) return;
    try {
      const { data } = await api.get(`/billing/status/${sessionId}`);
      if (data.payment_status === 'paid') return;
    } catch {}
    setTimeout(() => pollStatus(sessionId, attempt + 1), 2000);
  };

  const subscribe = async (planId) => {
    setLoading(planId);
    try {
      const origin = window.location.origin;
      const { data } = await api.post('/billing/checkout', { plan_id: planId, origin_url: origin });
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert('Errore: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(null);
    }
  };

  const freePlan = {
    id: 'free', name: 'Free', amount: 0, features: [
      '1 progetto', '7 contenuti per progetto', 'Generazione AI base', 'Export JSON'
    ]
  };

  const planFeatures = {
    creator: ['5 progetti', '30 contenuti per progetto', 'AI illimitata', 'Feed RSS', 'Export CSV + JSON', 'Social profiles'],
    strategist: ['Progetti illimitati', 'Contenuti illimitati', 'AI illimitata', 'Feed RSS + AI alt', 'Publishing Queue', 'Tutto Creator +', 'Admin console', 'Supporto prioritario'],
  };

  const planIcons = { creator: Lightning, strategist: Crown };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold gradient-text mb-2" data-testid="billing-title">Piani e Prezzi</h1>
        <p className="text-[var(--text-secondary)] text-sm">Scegli il piano che fa per te. Upgrade in qualsiasi momento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="mb-6">
            <Sparkle size={32} className="mb-3 text-[var(--text-muted)]" />
            <h3 className="text-xl font-bold">Free</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">0</span>
              <span className="text-[var(--text-muted)]">/mese</span>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            {freePlan.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Check size={16} color="var(--accent-green)" /> {f}
              </li>
            ))}
          </ul>
          <button className={`btn-ghost w-full ${user?.plan === 'free' ? '' : 'opacity-50'}`} disabled>
            {user?.plan === 'free' ? 'Piano attuale' : 'Downgrade'}
          </button>
        </motion.div>

        {/* Paid Plans */}
        {plans.map((plan, i) => {
          const PlanIcon = planIcons[plan.id] || Lightning;
          const features = planFeatures[plan.id] || [];
          const isCurrent = user?.plan === plan.id;
          const isPopular = plan.id === 'strategist';

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 1) * 0.1 }}
              className="card relative"
              style={isPopular ? { border: '2px solid var(--gradient-start)', background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(236,72,153,0.05) 100%)' } : {}}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge purple text-[10px]">Popolare</span>
                </div>
              )}
              <div className="mb-6">
                <PlanIcon size={32} className="mb-3" weight="fill" style={{ color: 'var(--gradient-start)' }} />
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.amount}</span>
                  <span className="text-[var(--text-muted)]">EUR/mese</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Check size={16} color="var(--accent-green)" /> {f}
                  </li>
                ))}
              </ul>
              <button
                data-testid={`subscribe-${plan.id}-btn`}
                className={isCurrent ? 'btn-ghost w-full' : 'btn-gradient w-full'}
                onClick={() => !isCurrent && subscribe(plan.id)}
                disabled={isCurrent || loading === plan.id}
              >
                {loading === plan.id ? 'Reindirizzamento...' : isCurrent ? 'Piano attuale' : `Attiva ${plan.name}`}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
