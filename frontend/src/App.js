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
  Trash,
  Check,
  InstagramLogo,
  LinkedinLogo,
  FacebookLogo,
  TiktokLogo,
  PinterestLogo,
  User,
  Gear,
  SignOut,
  GoogleLogo,
  EnvelopeSimple,
  Lock,
  CaretRight,
  Sparkle,
  Image,
  Video,
  Article,
  ChartBar
} from '@phosphor-icons/react';

// Auth Screen Component
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-split">
      {/* Left Visual */}
      <div className="auth-visual">
        <img
          src="https://images.pexels.com/photos/4834952/pexels-photo-4834952.jpeg"
          alt="Creative abstract"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#C1A3FF]/30 to-transparent" />
      </div>

      {/* Right Form */}
      <div className="auth-form-side">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-12">
            <h1 className="text-5xl font-black tracking-tight">
              SKETCHARIO
            </h1>
            <p className="text-[var(--text-secondary)] mt-2 text-lg font-medium">
              Content Strategy Engine
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              data-testid="auth-tab-login"
              className={`btn-brutal ${isLogin ? '' : 'ghost'} flex-1`}
              onClick={() => setIsLogin(true)}
            >
              Accedi
            </button>
            <button
              data-testid="auth-tab-register"
              className={`btn-brutal ${!isLogin ? '' : 'ghost'} flex-1`}
              onClick={() => setIsLogin(false)}
            >
              Registrati
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold mb-2">Nome</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
                  <input
                    data-testid="auth-name-input"
                    type="text"
                    className="input-brutal pl-12"
                    placeholder="Il tuo nome"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
                <input
                  data-testid="auth-email-input"
                  type="email"
                  className="input-brutal pl-12"
                  placeholder="email@esempio.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
                <input
                  data-testid="auth-password-input"
                  type="password"
                  className="input-brutal pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              data-testid="auth-submit-btn"
              className="btn-brutal w-full mt-6"
              onClick={onLogin}
            >
              {isLogin ? 'Accedi' : 'Crea Account'}
              <ArrowRight weight="bold" size={20} />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-0.5 bg-black/10" />
            <span className="text-sm font-semibold text-[var(--text-secondary)]">oppure continua con</span>
            <div className="flex-1 h-0.5 bg-black/10" />
          </div>

          {/* Social Login */}
          <div className="flex gap-3">
            <button data-testid="auth-google-btn" className="btn-brutal ghost flex-1">
              <GoogleLogo weight="bold" size={24} />
              Google
            </button>
            <button data-testid="auth-facebook-btn" className="btn-brutal ghost flex-1 social-facebook">
              <FacebookLogo weight="fill" size={24} />
              Facebook
            </button>
          </div>
        </motion.div>
      </div>
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
        <h2 className="text-2xl font-black">SKETCHARIO</h2>
        <span className="badge-brutal bg-[var(--secondary)] text-xs mt-2">v2.0</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems.map((item) => (
          <div
            key={item.id}
            data-testid={`nav-${item.id}`}
            className={`sidebar-nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <item.icon weight={activeView === item.id ? 'fill' : 'regular'} size={22} />
            {item.label}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="card-brutal p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] border-2 border-black flex items-center justify-center">
              <User weight="fill" size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Mario Rossi</p>
              <p className="text-xs text-[var(--text-secondary)]">Piano Creator</p>
            </div>
          </div>
        </div>
        <button
          data-testid="logout-btn"
          className="btn-brutal ghost w-full text-sm"
          onClick={onLogout}
        >
          <SignOut size={18} />
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
    { label: 'Progetti Attivi', value: '3', icon: Folder, color: 'var(--primary)' },
    { label: 'Contenuti Totali', value: '67', icon: Article, color: 'var(--secondary)' },
    { label: 'Pubblicati', value: '42', icon: Check, color: 'var(--success)' },
    { label: 'In Coda', value: '25', icon: ChartBar, color: 'var(--accent)' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1">Bentornato! Ecco i tuoi progetti.</p>
        </div>
        <button
          data-testid="new-project-btn"
          className="btn-brutal"
          onClick={() => setActiveView('wizard')}
        >
          <Plus weight="bold" size={20} />
          Nuovo Progetto
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-brutal"
            style={{ backgroundColor: stat.color }}
          >
            <stat.icon weight="fill" size={32} className="mb-2" />
            <p className="text-3xl font-black">{stat.value}</p>
            <p className="text-sm font-semibold mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Projects Grid */}
      <h2 className="text-2xl font-bold mb-4">I Tuoi Progetti</h2>
      <div className="bento-grid">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            data-testid={`project-card-${project.id}`}
            className="card-brutal project-card cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{project.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{project.sector}</p>
              </div>
              <span className={`badge-brutal ${
                project.status === 'active' ? 'bg-[var(--success)]' :
                project.status === 'completed' ? 'bg-[var(--primary)]' : 'bg-gray-200'
              }`}>
                {project.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Article size={16} /> {project.contents} contenuti
              </span>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-brutal ghost text-sm py-2 px-3">
                <Eye size={16} /> Apri
              </button>
              <button className="btn-brutal ghost text-sm py-2 px-3">
                <PencilSimple size={16} />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Create New Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          data-testid="create-project-card"
          className="card-brutal cursor-pointer flex flex-col items-center justify-center min-h-[200px] border-dashed hover:bg-[var(--secondary)]/20"
          onClick={() => setActiveView('wizard')}
        >
          <div className="w-16 h-16 rounded-full bg-[var(--secondary)] border-2 border-black flex items-center justify-center mb-4">
            <Plus weight="bold" size={32} />
          </div>
          <p className="font-bold">Crea Nuovo Progetto</p>
        </motion.div>
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
    { name: 'Marco, 35', role: 'Imprenditore', pain: 'Poco tempo per i social', avatar: 'https://images.unsplash.com/photo-1682827814857-827f37ec55da?w=200' },
    { name: 'Sara, 28', role: 'Freelance', pain: 'Non sa cosa pubblicare', avatar: 'https://images.pexels.com/photos/15093015/pexels-photo-15093015.jpeg?w=200' },
    { name: 'Luca, 42', role: 'Consulente', pain: 'Vuole più autorevolezza', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div
                data-testid={`wizard-step-${step.id}`}
                className={`wizard-step ${
                  currentStep === step.id ? 'active' :
                  currentStep > step.id ? 'completed' : ''
                }`}
                onClick={() => setCurrentStep(step.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center ${
                  currentStep >= step.id ? 'bg-[var(--primary)]' : 'bg-white'
                }`}>
                  {currentStep > step.id ? (
                    <Check weight="bold" size={20} />
                  ) : (
                    <step.icon weight="bold" size={20} />
                  )}
                </div>
                <span className="font-bold">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-1 w-16 mx-2 border-t-2 border-black ${
                  currentStep > step.id ? 'bg-[var(--primary)]' : 'bg-white'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
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
            <h2 className="text-3xl font-black mb-2">Buyer Personas</h2>
            <p className="text-[var(--text-secondary)] mb-8">
              L'AI ha generato 3 personas basate sul tuo settore. Modificale o approvale.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8">
              {personas.map((persona, i) => (
                <motion.div
                  key={persona.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card-brutal persona-card text-center"
                >
                  <img
                    src={persona.avatar}
                    alt={persona.name}
                    className="persona-avatar mx-auto mb-4"
                  />
                  <h3 className="font-bold text-lg">{persona.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{persona.role}</p>
                  <div className="mt-4 p-3 bg-[var(--accent)]/30 rounded-lg border border-black">
                    <p className="text-sm font-medium">Pain point:</p>
                    <p className="text-sm">{persona.pain}</p>
                  </div>
                  <button className="btn-brutal ghost text-sm mt-4 w-full">
                    <PencilSimple size={16} /> Modifica
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              data-testid="wizard-next-btn"
              className="btn-brutal"
              onClick={() => setCurrentStep(1)}
            >
              Approva e Continua
              <ArrowRight weight="bold" size={20} />
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
            <h2 className="text-3xl font-black mb-2">Tono di Voce</h2>
            <p className="text-[var(--text-secondary)] mb-8">
              Definisci come vuoi comunicare con il tuo pubblico.
            </p>

            {/* Presets */}
            <div className="flex gap-3 mb-8 flex-wrap">
              {['Professionale', 'Amichevole', 'Ispirazionale', 'Provocatorio', 'Educativo'].map((preset) => (
                <button
                  key={preset}
                  className="btn-brutal ghost text-sm"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="card-brutal space-y-6 mb-8">
              {[
                { label: 'Formalità', hint: 'Casual ↔ Formale' },
                { label: 'Energia', hint: 'Quieto ↔ Energico' },
                { label: 'Empatia', hint: 'Neutro ↔ Empatico' },
                { label: 'Umorismo', hint: 'Serio ↔ Divertente' },
              ].map((slider) => (
                <div key={slider.label}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">{slider.label}</span>
                    <span className="text-sm text-[var(--text-secondary)]">{slider.hint}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="slider-brutal"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                className="btn-brutal ghost"
                onClick={() => setCurrentStep(0)}
              >
                Indietro
              </button>
              <button
                data-testid="wizard-next-btn"
                className="btn-brutal"
                onClick={() => setCurrentStep(2)}
              >
                Salva e Genera Hook
                <ArrowRight weight="bold" size={20} />
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
            <h2 className="text-3xl font-black mb-2">Hook Generati</h2>
            <p className="text-[var(--text-secondary)] mb-8">
              7 hook distribuiti sulla campagna. Clicca per modificare.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { day: 'Lun 13', hook: '3 errori che fanno tutti i fotografi alle prime armi', format: 'Reel' },
                { day: 'Mar 14', hook: 'Il segreto per foto ritratto che emozionano', format: 'Carousel' },
                { day: 'Mer 15', hook: 'Come ho guadagnato i miei primi 1000€ con la fotografia', format: 'Reel' },
                { day: 'Gio 16', hook: 'La luce naturale: guida pratica in 5 passi', format: 'Carousel' },
                { day: 'Ven 17', hook: 'Perché il tuo portfolio non converte (e come sistemarlo)', format: 'Reel' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-brutal flex items-center gap-4"
                >
                  <div className="w-20 text-center">
                    <span className="font-bold text-sm">{item.day}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.hook}</p>
                  </div>
                  <span className={`badge-brutal ${
                    item.format === 'Reel' ? 'bg-[var(--accent)]' : 'bg-[var(--primary)]'
                  }`}>
                    {item.format === 'Reel' ? <Video size={14} /> : <Image size={14} />}
                    {item.format}
                  </span>
                  <button className="btn-brutal ghost p-2">
                    <PencilSimple size={18} />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                className="btn-brutal ghost"
                onClick={() => setCurrentStep(1)}
              >
                Indietro
              </button>
              <button
                data-testid="wizard-next-btn"
                className="btn-brutal"
                onClick={() => setCurrentStep(3)}
              >
                Approva e Genera Contenuti
                <ArrowRight weight="bold" size={20} />
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
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--success)] border-2 border-black flex items-center justify-center animate-pulse-border">
              <Sparkle weight="fill" size={48} />
            </div>
            <h2 className="text-3xl font-black mb-2">Generazione in Corso...</h2>
            <p className="text-[var(--text-secondary)] mb-8">
              L'AI sta creando script, caption e hashtag per tutti i contenuti.
            </p>

            <div className="max-w-md mx-auto mb-8">
              <div className="progress-track">
                <motion.div
                  className="progress-fill bg-[var(--success)]"
                  initial={{ width: '0%' }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-2">5 di 7 contenuti generati</p>
            </div>

            <div className="card-brutal max-w-lg mx-auto text-left">
              <p className="text-sm font-mono text-[var(--text-secondary)]">
                ✓ Generato: "3 errori che fanno tutti i fotografi..."<br />
                ✓ Generato: "Il segreto per foto ritratto..."<br />
                ✓ Generato: "Come ho guadagnato i miei primi..."<br />
                ✓ Generato: "La luce naturale: guida pratica..."<br />
                ⏳ In corso: "Perché il tuo portfolio non converte..."
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black">Calendario</h1>
          <p className="text-[var(--text-secondary)] mt-1">Gennaio 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-brutal ghost">← Prev</button>
          <button className="btn-brutal ghost">Next →</button>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Headers */}
        <div className="calendar-header">
          {days.map((day) => (
            <div key={day} className="calendar-header-cell">{day}</div>
          ))}
        </div>

        {/* Cells */}
        {Array.from({ length: 35 }, (_, i) => {
          const dayNum = i - 5 + 1; // Start from week with 13th
          const content = contents.find((c) => c.day === dayNum);
          const isCurrentMonth = dayNum > 0 && dayNum <= 31;

          return (
            <div
              key={i}
              className={`calendar-cell ${!isCurrentMonth ? 'opacity-30' : ''}`}
            >
              {isCurrentMonth && (
                <>
                  <span className="text-sm font-bold">{dayNum}</span>
                  {content && (
                    <div
                      className={`content-card-mini mt-2 ${
                        content.type === 'reel'
                          ? 'bg-[var(--accent)]'
                          : 'bg-[var(--primary)]'
                      }`}
                    >
                      {content.type === 'reel' ? <Video size={12} /> : <Image size={12} />}
                      <span className="truncate ml-1">{content.title}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Social Targets */}
      <div className="mt-8">
        <h3 className="font-bold mb-4">Social Collegati</h3>
        <div className="flex gap-3">
          <div className="social-btn social-instagram">
            <InstagramLogo weight="fill" size={28} />
          </div>
          <div className="social-btn social-linkedin">
            <LinkedinLogo weight="fill" size={28} />
          </div>
          <div className="social-btn social-facebook">
            <FacebookLogo weight="fill" size={28} />
          </div>
          <div className="social-btn social-tiktok">
            <TiktokLogo weight="fill" size={28} />
          </div>
          <div className="social-btn bg-white border-dashed">
            <Plus size={28} />
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
    <div className="min-h-screen bg-[var(--background)]">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              !isLoggedIn ? (
                <AuthScreen onLogin={() => setIsLoggedIn(true)} />
              ) : (
                <div className="flex">
                  <Sidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onLogout={() => setIsLoggedIn(false)}
                  />
                  <main className="flex-1 min-h-screen">
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
