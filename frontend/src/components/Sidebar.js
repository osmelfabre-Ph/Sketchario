import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  House, Folder, CalendarBlank, MagicWand, User, SignOut, Gear, ShieldCheck, Bell, CreditCard
} from '@phosphor-icons/react';

const LOGO_DARK = 'https://customer-assets.emergentagent.com/job_editorial-flow-v4/artifacts/oyv8tqit_favicon-invert.jpg';

export default function Sidebar({ activeView, setActiveView }) {
  const { user, logout, api } = useAuth();
  const [unread, setUnread] = useState(0);

  const navItems = [
    { id: 'dashboard', icon: House, label: 'Dashboard' },
    { id: 'wizard', icon: MagicWand, label: 'Nuovo Progetto' },
    { id: 'profile', icon: Gear, label: 'Profilo' },
    { id: 'billing', icon: CreditCard, label: 'Piani' },
  ];

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    api.get('/notifications/unread-count').then(r => setUnread(r.data.unread)).catch(() => {});
  }, [api]);

  return (
    <div className="sidebar">
      <div className="mb-8 flex items-center gap-3">
        <img src={LOGO_DARK} alt="Sketchario" style={{ height: 36, borderRadius: 8 }} />
        <div className="flex-1">
          <h2 className="text-lg font-bold gradient-text">Sketchario</h2>
          <span className="badge purple text-[10px]">v2.0</span>
        </div>
        <button
          data-testid="notifications-bell"
          className="relative p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          onClick={() => {
            setActiveView('notifications');
            api.post('/notifications/mark-read').then(() => setUnread(0)).catch(() => {});
          }}
        >
          <Bell size={20} weight={unread > 0 ? 'fill' : 'regular'} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--accent-pink)] text-[9px] font-bold flex items-center justify-center">{unread}</span>
          )}
        </button>
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
        {isAdmin && (
          <div
            data-testid="nav-admin"
            className={`sidebar-nav-item relative ${activeView === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveView('admin')}
          >
            <ShieldCheck weight={activeView === 'admin' ? 'fill' : 'regular'} size={20} />
            Admin
          </div>
        )}
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
