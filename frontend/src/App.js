import { useState, useEffect, useRef } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Toaster, toast } from 'sonner';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Wizard from './components/Wizard';
import ProjectView from './components/ProjectView';
import Profile from './components/Profile';
import AdminConsole from './components/AdminConsole';
import Billing from './components/Billing';
import Notifications from './components/Notifications';
import OnboardingTour from './components/OnboardingTour';
import HelpCenter from './components/HelpCenter';
import ProductTour, { shouldShowTour } from './components/ProductTour';

const PROJECT_VIEWS = ['project', 'calendar', 'personas', 'social', 'analytics', 'feeds'];
const RESTORABLE_VIEWS = ['dashboard', 'wizard', 'project', 'calendar', 'personas', 'social', 'analytics', 'feeds', 'profile', 'admin', 'billing', 'notifications'];

function AppContent() {
  const { user, loading, api } = useAuth();
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [wizardResumeData, setWizardResumeData] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const hydratedUserKeyRef = useRef(null);
  const userStorageKey = user?._id || user?.email || null;

  const getNavStorageKey = (suffix) => {
    return `sketchario:${userStorageKey}:${suffix}`;
  };

  useEffect(() => {
    if (!userStorageKey || hydratedUserKeyRef.current === userStorageKey) return;
    hydratedUserKeyRef.current = userStorageKey;
    try {
      const storedView = localStorage.getItem(getNavStorageKey('activeView'));
      const storedProject = localStorage.getItem(getNavStorageKey('selectedProject'));
      if (storedProject) {
        setSelectedProject(JSON.parse(storedProject));
      }
      if (storedView && RESTORABLE_VIEWS.includes(storedView)) {
        setActiveView(storedView);
      }
    } catch {}
  }, [userStorageKey]);

  useEffect(() => {
    if (!userStorageKey || hydratedUserKeyRef.current !== userStorageKey) return;
    try {
      localStorage.setItem(getNavStorageKey('activeView'), activeView);
      if (selectedProject) {
        localStorage.setItem(getNavStorageKey('selectedProject'), JSON.stringify(selectedProject));
      } else {
        localStorage.removeItem(getNavStorageKey('selectedProject'));
      }
    } catch {}
  }, [userStorageKey, activeView, selectedProject]);

  useEffect(() => {
    if (!hydratedUserKeyRef.current) return;
    if (PROJECT_VIEWS.includes(activeView) && !selectedProject) {
      setActiveView('dashboard');
    }
  }, [activeView, selectedProject]);

  useEffect(() => {
    if (user && api) {
      api.get('/onboarding/status').then(r => {
        if (!r.data.completed) setShowOnboarding(true);
        if (shouldShowTour(r.data)) setShowTour(true);
      }).catch(() => {});
    }
  }, [user, api]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      const plan = user.plan || 'creator';
      const planLabel = plan === 'strategist' ? 'Strategist' : plan === 'creator' ? 'Creator' : 'base';
      toast.success(`🎉 Benvenuto in Sketchario ${planLabel}! Il tuo piano è attivo.`, {
        duration: 8000,
        description: 'Sei pronto a creare contenuti. Inizia dal Wizard!',
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] animate-pulse" />
          <p className="text-[var(--text-secondary)] text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const isProjectView = PROJECT_VIEWS.includes(activeView);

  const handleSetActiveView = (view) => {
    if (PROJECT_VIEWS.filter(v => v !== 'project').includes(view) && !selectedProject) {
      return;
    }
    setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} setSelectedProject={setSelectedProject} setWizardResumeData={setWizardResumeData} />;
      case 'wizard':
        return <Wizard setActiveView={setActiveView} setSelectedProject={setSelectedProject} resumeData={wizardResumeData} setWizardResumeData={setWizardResumeData} />;
      case 'project':
      case 'calendar':
      case 'personas':
      case 'social':
      case 'analytics':
      case 'feeds':
        return <ProjectView project={selectedProject} setActiveView={setActiveView} activeTab={activeView === 'project' ? 'list' : activeView} />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return <AdminConsole />;
      case 'billing':
        return <Billing />;
      case 'notifications':
        return <Notifications />;
      default:
        return <Dashboard setActiveView={setActiveView} setSelectedProject={setSelectedProject} />;
    }
  };

  return (
    <div className="main-layout">
      <Sidebar activeView={activeView} setActiveView={handleSetActiveView} isProjectView={isProjectView} onHelpOpen={() => setShowHelp(true)} />
      <main className="main-content flex flex-col">
        <div className={`flex-1 ${isProjectView ? '' : 'p-4 md:p-8 overflow-y-auto'}`}>{renderView()}</div>
        {!isProjectView && (
          <footer className="flex-shrink-0 px-4 md:px-8 py-3 md:py-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-2" style={{ background: 'var(--bg-secondary)' }}>
            <p className="text-[10px] md:text-[11px] text-[var(--text-muted)]">&copy; {new Date().getFullYear()} Sketchario. Tutti i diritti riservati.</p>
            <div className="flex gap-3 md:gap-4">
              <a href="/legal/termini-e-condizioni.html" target="_blank" rel="noopener" className="text-[10px] md:text-[11px] text-[var(--text-muted)] hover:text-white transition-colors">Termini</a>
              <a href="/legal/privacy-policy.html" target="_blank" rel="noopener" className="text-[10px] md:text-[11px] text-[var(--text-muted)] hover:text-white transition-colors">Privacy</a>
              <a href="/legal/cookie-policy.html" target="_blank" rel="noopener" className="text-[10px] md:text-[11px] text-[var(--text-muted)] hover:text-white transition-colors">Cookie</a>
            </div>
          </footer>
        )}
      </main>
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
      {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
      {showTour && !showHelp && !showOnboarding && activeView === 'dashboard' && (
        <ProductTour api={api} onFinish={() => setShowTour(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="top-right"
        richColors
        toastOptions={{ duration: 4000 }}
      />
    </div>
  );
}

export default App;
