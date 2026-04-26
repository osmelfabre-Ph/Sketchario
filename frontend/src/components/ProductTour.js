import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Joyride, STATUS, EVENTS, ACTIONS } from 'react-joyride';

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
  beaconInner: {
    backgroundColor: '#fbcfe8',
  },
  beaconOuter: {
    backgroundColor: 'rgba(251, 207, 232, 0.36)',
    border: '2px solid rgba(251, 207, 232, 0.95)',
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

export function shouldShowTour(status) {
  if (status?.product_tour_completed) return false;
  return !localStorage.getItem(TOUR_KEY);
}

export function markTourDone() {
  localStorage.setItem(TOUR_KEY, '1');
}

export default function ProductTour({ api, onFinish }) {
  const { t } = useTranslation();
  const [run, setRun] = useState(false);
  const didFinishRef = useRef(false);

  const steps = STEPS.map((s, i) => ({
    ...s,
    title: t(`tour.step${i + 1}Title`, s.title),
    content: t(`tour.step${i + 1}`, s.content),
  }));

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const startWhenReady = () => {
      if (cancelled) return;
      const firstTarget = document.querySelector(STEPS[0].target);
      if (firstTarget) {
        setRun(true);
        return;
      }
      attempts += 1;
      if (attempts < 40) {
        window.setTimeout(startWhenReady, 150);
      }
    };

    startWhenReady();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishTour = useCallback(async () => {
    if (didFinishRef.current) return;
    didFinishRef.current = true;
    markTourDone();
    setRun(false);
    if (api) {
      await api.post('/onboarding/product-tour').catch(() => {});
    }
    onFinish?.();
  }, [api, onFinish]);

  const handleCallback = useCallback((data) => {
    const { status, type, action } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) ||
        type === EVENTS.TOUR_END ||
        action === ACTIONS.CLOSE) {
      finishTour();
    }
  }, [finishTour]);

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep={false}
      disableScrolling
      locale={{
        back: t('tour.back'),
        close: t('tour.close'),
        last: t('tour.last'),
        next: t('tour.next'),
        open: t('tour.next'),
        skip: t('tour.skip'),
      }}
      styles={JOYRIDE_STYLES}
      callback={handleCallback}
      floaterProps={{ disableAnimation: false }}
    />
  );
}
