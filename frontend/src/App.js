import { useState } from 'react';
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

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);

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

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} setSelectedProject={setSelectedProject} />;
      case 'wizard':
        return <Wizard setActiveView={setActiveView} setSelectedProject={setSelectedProject} />;
      case 'project':
        return <ProjectView project={selectedProject} setActiveView={setActiveView} />;
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
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="main-content">{renderView()}</main>
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
