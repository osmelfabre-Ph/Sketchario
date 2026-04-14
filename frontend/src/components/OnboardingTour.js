import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkle, MagicWand, Users, Palette, CalendarBlank, ArrowRight, X, Check
} from '@phosphor-icons/react';

const STEPS = [
  { icon: Sparkle, title: 'Benvenuto su Sketchario!', desc: 'Il tuo motore strategico per contenuti social. Ti guidiamo in 5 passi per creare il tuo primo progetto.' },
  { icon: MagicWand, title: '1. Crea un Progetto', desc: 'Vai su "Nuovo Progetto" nella sidebar. Inserisci nome, settore e obiettivi della tua campagna.' },
  { icon: Users, title: '2. Genera Personas', desc: 'L\'AI creera buyer personas dettagliate per il tuo settore. Modificale o approvale.' },
  { icon: Palette, title: '3. Definisci il Tono', desc: 'Imposta il tono di voce con preset e slider. Salva come template nella ToV Library per riutilizzarlo.' },
  { icon: CalendarBlank, title: '4. Genera Contenuti', desc: 'L\'AI genera hook, script, caption e hashtag. Modifica, aggiungi media e programma la pubblicazione!' },
];

export default function OnboardingTour({ onComplete }) {
  const { api } = useAuth();
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(true);

  const next = async () => {
    await api.post('/onboarding/complete-step', { step }).catch(() => {});
    if (step >= STEPS.length - 1) {
      setShow(false);
      onComplete?.();
    } else {
      setStep(s => s + 1);
    }
  };

  const skip = async () => {
    await api.post('/onboarding/skip').catch(() => {});
    setShow(false);
    onComplete?.();
  };

  if (!show) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          key={step}
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card w-full max-w-md text-center relative"
        >
          <button onClick={skip} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"><X size={18} /></button>

          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))' }}>
            <Icon size={32} weight="fill" color="white" />
          </div>

          <h2 className="text-xl font-bold mb-3">{current.title}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">{current.desc}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full transition-all" style={{
                background: i === step ? 'var(--gradient-start)' : i < step ? 'var(--accent-green)' : 'var(--bg-secondary)',
                width: i === step ? 20 : 10
              }} />
            ))}
          </div>

          <div className="flex gap-3">
            <button className="btn-ghost flex-1 text-sm" onClick={skip}>Salta Tour</button>
            <button className="btn-gradient flex-1 text-sm" onClick={next} data-testid="onboarding-next-btn">
              {step >= STEPS.length - 1 ? <><Check size={16} /> Inizia!</> : <>Avanti <ArrowRight size={16} /></>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
