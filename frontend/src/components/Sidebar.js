import { useAuth } from '../contexts/AuthContext';
import {
  House, Folder, CalendarBlank, MagicWand, User, SignOut, Gear
} from '@phosphor-icons/react';

const LOGO_DARK = 'https://customer-assets.emergentagent.com/job_editorial-flow-v4/artifacts/oyv8tqit_favicon-invert.jpg';

export default function Sidebar({ activeView, setActiveView }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', icon: House, label: 'Dashboard' },
    { id: 'wizard', icon: MagicWand, label: 'Nuovo Progetto' },
    { id: 'profile', icon: Gear, label: 'Profilo' },
  ];

  return (
    <div className="sidebar">
      <div className="mb-8 flex items-center gap-3">
        <img src={LOGO_DARK} alt="Sketchario" style={{ height: 36, borderRadius: 8 }} />
        <div>
          <h2 className="text-lg font-bold gradient-text">Sketchario</h2>
          <span className="badge purple text-[10px]">v2.0</span>
        </div>
      </div>

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

      <div className="absolute bottom-6 left-6 right-6">
        <div className="user-profile-card mb-3">
          <div className="user-avatar">
            <User weight="fill" size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user?.name || 'Utente'}</p>
            <p className="text-xs text-[var(--text-muted)]">{user?.plan || 'free'}</p>
          </div>
        </div>
        <button data-testid="logout-btn" className="btn-ghost w-full text-sm" onClick={logout}>
          <SignOut size={16} /> Esci
        </button>
      </div>
    </div>
  );
}
