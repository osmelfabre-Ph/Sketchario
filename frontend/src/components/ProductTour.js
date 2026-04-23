import React, { useState, useCallback } from 'react';
import { Joyride, STATUS, EVENTS } from 'react-joyride';
import { X, ArrowRight } from '@phosphor-icons/react';

const TOUR_KEY = 'sketchario_tour_done';

const STEPS = [
  {
    target: '[data-testid="nav-dashboard"]',
    placement: 'right',
    title: '🏠 Dashboard',
    content: 'La home principale con tutti i tuoi progetti. Da qui puoi aprire, archiviare o eliminare i progetti, e vedere in un colpo d\'occhio quanti contenuti hai generato.',
    disableBeacon: true,
  },
  {
    target: '[data-testid="nav-wizard"]',
    placement: 'right',
    title: '✨ Nuovo Progetto',
    content: 'Clicca qui per avviare il Wizard guidato. In 5 step l\'AI genera per te: buyer personas, tone of voice, hook e tutti i contenuti pronti per i social.',
    disableBeacon: true,
  },
  {
    target: '[data-testid="help-btn"]',
    placement: 'right',
    title: '📖 Guida',
    content: 'La documentazione completa di Sketchario: editor, pubblicazione, integrazioni, team e molto altro. Sempre disponibile da qui.',
    disableBeacon: true,
  },
  {
    target: '[data-testid="notifications-bell"]',
    placement: 'right',
    title: '🔔 Notifiche',
    content: 'Release notes e aggiornamenti di Sketchario. Il pallino rosso indica messaggi non letti.',
    disableBeacon: true,
  },
  {
    target: '[data-testid="nav-profile"]',
    placement: 'right',
    title: '👤 Il tuo Profilo',
    content: 'Modifica nome, settore e password. Gestisci il tuo piano di abbonamento e visualizza le opzioni di upgrade.',
    disableBeacon: true,
  },
];

const JOYRIDE_STYLES = {
  options: {
    zIndex: 10000,
    primaryColor: '#f472b6',
    backgroundColor: '#151d2e',
    textColor: '#ffffff',
    arrowColor: '#151d2e',
    overlayColor: 'rgba(0, 0, 0, 0.55)',
  },
  tooltip: {
    borderRadius: '1rem',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '1.25rem',
    maxWidth: 300,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  tooltipTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: '#ffffff',
  },
  tooltipContent: {
    fontSize: '0.85rem',
    lineHeight: 1.65,
    color: '#8b95a5',
    padding: 0,
  },
  buttonNext: {
    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
    borderRadius: '0.625rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.5rem 1rem',
    border: 'none',
    color: '#fff',
  },
  buttonSkip: {
    color: '#5c6370',
    fontSize: '0.8rem',
    fontWeight: 500,
    background: 'transparent',
  },
  buttonBack: {
    color: '#8b95a5',
    fontSize: '0.8rem',
    fontWeight: 500,
    marginRight: '0.5rem',
  },
  buttonClose: {
    color: '#5c6370',
    top: 10,
    right: 10,
  },
};

export function shouldShowTour() {
  return !localStorage.getItem(TOUR_KEY);
}

export function markTourDone() {
  localStorage.setItem(TOUR_KEY, '1');
}

export default function ProductTour({ onFinish }) {
  const [run, setRun] = useState(true);

  const handleCallback = useCallback((data) => {
    const { status, type } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) ||
        type === EVENTS.TOUR_END) {
      markTourDone();
      setRun(false);
      onFinish?.();
    }
  }, [onFinish]);

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep={false}
      disableScrolling
      locale={{
        back: '← Indietro',
        close: 'Chiudi',
        last: 'Fine',
        next: 'Prossimo →',
        open: 'Apri',
        skip: 'Salta tour',
      }}
      styles={JOYRIDE_STYLES}
      callback={handleCallback}
      floaterProps={{ disableAnimation: false }}
    />
  );
}
