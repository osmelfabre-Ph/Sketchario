import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

function AppContent() {
  const { user, loading, api } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && api) {
      api.get('/onboarding/status').then(r => {
        if (!r.data.completed) setShowOnboarding(true);
      }).catch(() => {});
    }
  }, [user, api]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] animate-pulse" />
          <p className="text-[var(--text-secondary)] text-sm">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const isProjectView = ['project', 'calendar', 'personas', 'social'].includes(activeView);

  const handleSetActiveView = (view) => {
    // If switching to project sub-views, keep the project context
    if (['calendar', 'personas', 'social'].includes(view) && !selectedProject) {
      return; // Can't navigate to project sub-views without a project
    }
    setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} setSelectedProject={setSelectedProject} />;
      case 'wizard':
        return <Wizard setActiveView={setActiveView} setSelectedProject={setSelectedProject} />;
      case 'project':
      case 'calendar':
      case 'personas':
      case 'social':
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
      <Sidebar activeView={activeView} setActiveView={handleSetActiveView} isProjectView={isProjectView} />
      <main className="main-content">
        <div className={isProjectView ? '' : 'p-8'}>{renderView()}</div>
      </main>
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
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
    </div>
  );
}

export default App;
