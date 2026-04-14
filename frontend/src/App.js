import { useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House,
  Folder,
  CalendarBlank,
  MagicWand,
  Users,
  Palette,
  Lightning,
  ArrowRight,
  Plus,
  Eye,
  PencilSimple,
  Check,
  InstagramLogo,
  LinkedinLogo,
  FacebookLogo,
  TiktokLogo,
  PinterestLogo,
  User,
  SignOut,
  GoogleLogo,
  EnvelopeSimple,
  Lock,
  Sparkle,
  Image,
  Video,
  Article,
  ChartLineUp,
  Target,
  Clock,
  MagnifyingGlass
} from '@phosphor-icons/react';

// Auth Screen Component
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-box"
      >
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Sketchario
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Content Strategy Engine
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            data-testid="auth-tab-login"
            className={isLogin ? 'btn-gradient flex-1' : 'btn-ghost flex-1'}
            onClick={() => setIsLogin(true)}
          >
            Accedi
          </button>
          <button
            data-testid="auth-tab-register"
            className={!isLogin ? 'btn-gradient flex-1' : 'btn-ghost flex-1'}
            onClick={() => setIsLogin(false)}
          >
            Registrati
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input
                  data-testid="auth-name-input"
                  type="text"
                  className="input-dark"
                  placeholder="Il tuo nome"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
            <div className="relative">
              <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input
                data-testid="auth-email-input"
                type="email"
                className="input-dark"
                placeholder="email@esempio.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input
                data-testid="auth-password-input"
                type="password"
                className="input-dark"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            data-testid="auth-submit-btn"
            className="btn-gradient w-full mt-6"
            onClick={onLogin}
          >
            {isLogin ? 'Accedi' : 'Crea Account'}
            <ArrowRight weight="bold" size={18} />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-xs font-medium text-[var(--text-muted)]">oppure continua con</span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        {/* Social Login */}
        <div className="flex gap-3">
          <button data-testid="auth-google-btn" className="btn-ghost flex-1">
            <GoogleLogo weight="bold" size={20} />
            Google
          </button>
          <button data-testid="auth-facebook-btn" className="btn-ghost flex-1">
            <FacebookLogo weight="fill" size={20} color="#1877F2" />
            Facebook
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ activeView, setActiveView, onLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: House, label: 'Dashboard' },
    { id: 'projects', icon: Folder, label: 'Progetti' },
    { id: 'calendar', icon: CalendarBlank, label: 'Calendario' },
    { id: 'wizard', icon: MagicWand, label: 'Nuovo Progetto' },
  ];

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="mb-8">
        <h2 className="text-xl font-bold gradient-text">Sketchario</h2>
        <span className="badge purple text-[10px] mt-2">v2.0</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => (
          <div
            key={item.id}
            data-testid={`nav-${item.id}`}
            className={`sidebar-nav-item relative ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <item.icon weight={activeView === item.id ? 'fill' : 'regular'} size={20} />
            {item.label}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="user-profile-card mb-3">
          <div className="user-avatar">
            <User weight="fill" size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">Mario Rossi</p>
            <p className="text-xs text-[var(--text-muted)]">Piano Creator</p>
          </div>
        </div>
        <button
          data-testid="logout-btn"
          className="btn-ghost w-full text-sm"
          onClick={onLogout}
        >
          <SignOut size={16} />
          Esci
        </button>
      </div>
    </div>
  );
};

// Dashboard View
const DashboardView = ({ setActiveView }) => {
  const projects = [
    { id: 1, name: 'Strategia Gennaio 2026', sector: 'Fotografo Ritrattista', contents: 30, status: 'active' },
    { id: 2, name: 'Lancio Corso Online', sector: 'Life Coach', contents: 15, status: 'draft' },
    { id: 3, name: 'Personal Brand Q1', sector: 'Nutrizionista', contents: 22, status: 'completed' },
  ];

  const stats = [
    { label: 'Progetti Attivi', value: '3', icon: Lightning, color: 'blue' },
    { label: 'Contenuti Totali', value: '67', icon: ChartLineUp, color: 'green' },
    { label: 'Pubblicati', value: '42', icon: Target, color: 'purple' },
    { label: 'In Coda', value: '25', icon: Clock, color: 'orange' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">Gestisci i tuoi progetti editoriali</p>
        </div>
        <button
          data-testid="new-project-btn"
          className="btn-gradient"
          onClick={() => setActiveView('wizard')}
        >
          <Plus weight="bold" size={18} />
          Crea Progetto
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <div>
              <p className="text-[var(--text-secondary)] text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon weight="fill" size={24} color="white" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">I Tuoi Progetti</h2>
          <div className="search-input-wrapper">
            <MagnifyingGlass size={16} />
            <input
              type="text"
              className="input-dark text-sm py-2"
              placeholder="Cerca progetti..."
              style={{ width: '200px' }}
            />
          </div>
        </div>

        {projects.length > 0 ? (
          <div className="projects-grid">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                data-testid={`project-card-${project.id}`}
                className="card project-card cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">{project.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{project.sector}</p>
                  </div>
                  <span className={`badge ${
                    project.status === 'active' ? 'green' :
                    project.status === 'completed' ? 'purple' : 'orange'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-4">
                  <span className="flex items-center gap-1">
                    <Article size={14} /> {project.contents} contenuti
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost text-sm py-2 px-3 flex-1">
                    <Eye size={14} /> Apri
                  </button>
                  <button className="btn-ghost text-sm py-2 px-3">
                    <PencilSimple size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Lightning size={64} className="empty-state-icon" />
            <h3 className="text-lg font-semibold mb-2 text-[var(--text-secondary)]">Nessun progetto</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">Crea il tuo primo progetto per iniziare</p>
            <button className="btn-gradient" onClick={() => setActiveView('wizard')}>
              <Plus size={18} />
              Crea il Tuo Primo Progetto
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Wizard View
const WizardView = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { id: 0, label: 'Personas', icon: Users },
    { id: 1, label: 'Tono', icon: Palette },
    { id: 2, label: 'Hook', icon: Lightning },
    { id: 3, label: 'Contenuti', icon: Sparkle },
  ];

  const personas = [
    { name: 'Marco, 35', role: 'Imprenditore', pain: 'Poco tempo per i social', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    { name: 'Sara, 28', role: 'Freelance', pain: 'Non sa cosa pubblicare', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
    { name: 'Luca, 42', role: 'Consulente', pain: 'Vuole più autorevolezza', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="wizard-progress mb-8">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div
              data-testid={`wizard-step-${step.id}`}
              className={`wizard-step-item ${
                currentStep === step.id ? 'active' :
                currentStep > step.id ? 'completed' : ''
              }`}
              onClick={() => setCurrentStep(step.id)}
            >
              <div className="wizard-step-number">
                {currentStep > step.id ? (
                  <Check weight="bold" size={14} />
                ) : (
                  i + 1
                )}
              </div>
              <span className="text-sm">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`wizard-step-line ${currentStep > step.id ? 'active' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mb-8">
        <div
          className="progress-fill"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <motion.div
            key="personas"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-2xl font-bold mb-2">Buyer Personas</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-sm">
              L'AI ha generato 3 personas basate sul tuo settore. Modificale o approvale.
            </p>

            <div className="personas-grid mb-8">
              {personas.map((persona, i) => (
                <motion.div
                  key={persona.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card persona-card"
                >
                  <img
                    src={persona.avatar}
                    alt={persona.name}
                    className="persona-avatar"
                  />
                  <h3 className="font-semibold text-lg mb-1">{persona.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{persona.role}</p>
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-sm">
                    <span className="text-[var(--text-muted)]">Pain point:</span>
                    <p className="text-[var(--text-primary)] mt-1">{persona.pain}</p>
                  </div>
                  <button className="btn-ghost text-sm mt-4 w-full">
                    <PencilSimple size={14} /> Modifica
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              data-testid="wizard-next-btn"
              className="btn-gradient"
              onClick={() => setCurrentStep(1)}
            >
              Approva e Continua
              <ArrowRight weight="bold" size={18} />
            </button>
          </motion.div>
        )}

        {currentStep === 1 && (
          <motion.div
            key="tone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-2xl font-bold mb-2">Tono di Voce</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-sm">
              Definisci come vuoi comunicare con il tuo pubblico.
            </p>

            {/* Presets */}
            <div className="flex gap-2 mb-8 flex-wrap">
              {['Professionale', 'Amichevole', 'Ispirazionale', 'Provocatorio', 'Educativo'].map((preset, i) => (
                <button
                  key={preset}
                  className={`preset-btn ${i === 0 ? 'active' : ''}`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="card mb-8">
              {[
                { label: 'Formalità', hint: 'Casual ↔ Formale' },
                { label: 'Energia', hint: 'Quieto ↔ Energico' },
                { label: 'Empatia', hint: 'Neutro ↔ Empatico' },
                { label: 'Umorismo', hint: 'Serio ↔ Divertente' },
              ].map((slider) => (
                <div key={slider.label} className="tone-slider-row">
                  <div className="tone-slider-label">
                    <span className="font-medium">{slider.label}</span>
                    <span>{slider.hint}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="slider-dark"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                className="btn-ghost"
                onClick={() => setCurrentStep(0)}
              >
                Indietro
              </button>
              <button
                data-testid="wizard-next-btn"
                className="btn-gradient"
                onClick={() => setCurrentStep(2)}
              >
                Salva e Genera Hook
                <ArrowRight weight="bold" size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="hooks"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-2xl font-bold mb-2">Hook Generati</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-sm">
              7 hook distribuiti sulla campagna. Clicca per modificare.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { day: 'Lun 13', hook: '3 errori che fanno tutti i fotografi alle prime armi', format: 'Reel' },
                { day: 'Mar 14', hook: 'Il segreto per foto ritratto che emozionano', format: 'Carousel' },
                { day: 'Mer 15', hook: 'Come ho guadagnato i miei primi 1000€ con la fotografia', format: 'Reel' },
                { day: 'Gio 16', hook: 'La luce naturale: guida pratica in 5 passi', format: 'Carousel' },
                { day: 'Ven 17', hook: 'Perché il tuo portfolio non converte', format: 'Reel' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hook-item"
                >
                  <div className="w-16 text-center">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{item.day}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{item.hook}</p>
                  </div>
                  <span className={`badge ${item.format === 'Reel' ? 'pink' : 'blue'}`}>
                    {item.format === 'Reel' ? <Video size={12} /> : <Image size={12} />}
                    <span className="ml-1">{item.format}</span>
                  </span>
                  <button className="btn-ghost p-2">
                    <PencilSimple size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                className="btn-ghost"
                onClick={() => setCurrentStep(1)}
              >
                Indietro
              </button>
              <button
                data-testid="wizard-next-btn"
                className="btn-gradient"
                onClick={() => setCurrentStep(3)}
              >
                Approva e Genera Contenuti
                <ArrowRight weight="bold" size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
              <Sparkle weight="fill" size={40} color="white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Generazione in Corso...</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-sm">
              L'AI sta creando script, caption e hashtag per tutti i contenuti.
            </p>

            <div className="max-w-md mx-auto mb-8">
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-3">5 di 7 contenuti generati</p>
            </div>

            <div className="card max-w-lg mx-auto text-left">
              <p className="text-sm font-mono text-[var(--text-secondary)] leading-relaxed">
                <span className="text-[var(--accent-green)]">✓</span> Generato: "3 errori che fanno tutti..."<br />
                <span className="text-[var(--accent-green)]">✓</span> Generato: "Il segreto per foto ritratto..."<br />
                <span className="text-[var(--accent-green)]">✓</span> Generato: "Come ho guadagnato..."<br />
                <span className="text-[var(--accent-green)]">✓</span> Generato: "La luce naturale..."<br />
                <span className="text-[var(--gradient-start)]">⏳</span> In corso: "Perché il tuo portfolio..."
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Calendar View
const CalendarView = () => {
  const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const contents = [
    { day: 13, title: '3 errori fotografi', type: 'reel' },
    { day: 14, title: 'Foto che emozionano', type: 'carousel' },
    { day: 15, title: 'Primi 1000€', type: 'reel' },
    { day: 16, title: 'Guida luce naturale', type: 'carousel' },
    { day: 17, title: 'Portfolio fix', type: 'reel' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Calendario</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">Gennaio 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">← Prev</button>
          <button className="btn-ghost">Next →</button>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-grid">
          {/* Headers */}
          {days.map((day) => (
            <div key={day} className="calendar-header">{day}</div>
          ))}

          {/* Cells */}
          {Array.from({ length: 35 }, (_, i) => {
            const dayNum = i - 5 + 1;
            const content = contents.find((c) => c.day === dayNum);
            const isCurrentMonth = dayNum > 0 && dayNum <= 31;

            return (
              <div
                key={i}
                className={`calendar-cell ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                {isCurrentMonth && (
                  <>
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{dayNum}</span>
                    {content && (
                      <div className={`content-chip ${content.type}`}>
                        {content.type === 'reel' ? <Video size={12} /> : <Image size={12} />}
                        <span className="ml-1 truncate">{content.title}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Social Targets */}
      <div className="mt-8">
        <h3 className="font-semibold mb-4">Social Collegati</h3>
        <div className="flex gap-3">
          <div className="social-icon-btn connected">
            <InstagramLogo weight="fill" size={24} color="#E4405F" />
          </div>
          <div className="social-icon-btn connected">
            <LinkedinLogo weight="fill" size={24} color="#0A66C2" />
          </div>
          <div className="social-icon-btn">
            <FacebookLogo weight="fill" size={24} color="#1877F2" />
          </div>
          <div className="social-icon-btn">
            <TiktokLogo weight="fill" size={24} />
          </div>
          <div className="social-icon-btn">
            <PinterestLogo weight="fill" size={24} color="#E60023" />
          </div>
          <div className="social-icon-btn" style={{ borderStyle: 'dashed' }}>
            <Plus size={24} className="text-[var(--text-muted)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView setActiveView={setActiveView} />;
      case 'wizard':
        return <WizardView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <DashboardView setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              !isLoggedIn ? (
                <AuthScreen onLogin={() => setIsLoggedIn(true)} />
              ) : (
                <div className="main-layout">
                  <Sidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onLogout={() => setIsLoggedIn(false)}
                  />
                  <main className="main-content">
                    {renderView()}
                  </main>
                </div>
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
