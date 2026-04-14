import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  House, MagicWand, User, SignOut, Bell, CaretLeft, CaretRight,
  CalendarBlank, Users, Globe, ChartBar, Queue, ShieldCheck
} from '@phosphor-icons/react';

const LOGO = 'https://customer-assets.emergentagent.com/job_editorial-flow-v4/artifacts/oyv8tqit_favicon-invert.jpg';

export default function Sidebar({ activeView, setActiveView, isProjectView }) {
  const { user, logout, api } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications/unread-count').then(r => setUnread(r.data.unread)).catch(() => {});
  }, [api]);

  const mainNav = [
    { id: 'dashboard', icon: House, label: 'Dashboard' },
    { id: 'wizard', icon: MagicWand, label: 'Nuovo Progetto' },
  ];

  const projectNav = [
    { id: 'calendar', icon: CalendarBlank, label: 'Calendario' },
    { id: 'personas', icon: Users, label: 'Personas' },
    { id: 'social', icon: Globe, label: 'Social' },
  ];

  const isAdmin = user?.role === 'admin';
  const w = collapsed ? 64 : 220;

  return (
    <div className="sidebar flex flex-col" style={{ width: w, minWidth: w, transition: 'width 0.2s ease, min-width 0.2s ease' }}>
      {/* Logo + Collapse */}
      <div className="flex items-center gap-2 mb-6" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <img src={LOGO} alt="S" style={{ height: 32, borderRadius: 6 }} />
        {!collapsed && <h2 className="text-base font-bold gradient-text">Sketchario</h2>}
        <button
          data-testid="sidebar-toggle"
          className="ml-auto p-1 rounded hover:bg-[var(--bg-card)] transition-colors"
          onClick={() => setCollapsed(c => !c)}
          style={collapsed ? { marginLeft: 0 } : {}}
        >
          {collapsed ? <CaretRight size={14} /> : <CaretLeft size={14} />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="space-y-1 mb-3">
        {mainNav.map(item => (
          <div
            key={item.id}
            data-testid={`nav-${item.id}`}
            className={`sidebar-nav-item relative ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            title={collapsed ? item.label : ''}
            style={collapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}
          >
            <item.icon weight={activeView === item.id ? 'fill' : 'regular'} size={20} />
            {!collapsed && <span>{item.label}</span>}
          </div>
        ))}
      </nav>

      {/* Project Nav — only visible in project view */}
      {isProjectView && (
        <div className="rounded-lg p-2 mb-3 space-y-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {!collapsed && <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase px-2 mb-1">Progetto</p>}
          {projectNav.map(item => (
            <div
              key={item.id}
              data-testid={`nav-${item.id}`}
              className={`sidebar-nav-item relative ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              title={collapsed ? item.label : ''}
              style={collapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}
            >
              <item.icon weight={activeView === item.id ? 'fill' : 'regular'} size={18} />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Admin */}
      {isAdmin && (
        <div
          data-testid="nav-admin"
          className={`sidebar-nav-item relative ${activeView === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveView('admin')}
          title={collapsed ? 'Admin' : ''}
          style={collapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}
        >
          <ShieldCheck weight={activeView === 'admin' ? 'fill' : 'regular'} size={20} />
          {!collapsed && <span>Admin</span>}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bell */}
      <button
        data-testid="notifications-bell"
        className="sidebar-nav-item relative"
        onClick={() => { setActiveView('notifications'); api.post('/notifications/mark-read').then(() => setUnread(0)).catch(() => {}); }}
        style={collapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}
      >
        <div className="relative">
          <Bell size={20} weight={unread > 0 ? 'fill' : 'regular'} />
          {unread > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--accent-pink)] text-[8px] font-bold flex items-center justify-center">{unread}</span>}
        </div>
        {!collapsed && <span>Novita</span>}
      </button>

      {/* User Profile — clickable to open profile */}
      <div
        data-testid="nav-profile"
        className="user-profile-card cursor-pointer hover:border-[var(--gradient-start)] transition-colors mt-2"
        onClick={() => setActiveView('profile')}
        style={collapsed ? { justifyContent: 'center', padding: '0.5rem' } : {}}
      >
        <div className="user-avatar" style={{ width: 32, height: 32, flexShrink: 0 }}>
          <User weight="fill" size={14} color="white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs truncate">{user?.name || 'Utente'}</p>
            <p className="text-[10px] text-[var(--text-muted)] capitalize">{user?.plan || 'free'}</p>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        data-testid="logout-btn"
        className="sidebar-nav-item mt-2 text-[var(--text-muted)]"
        onClick={logout}
        style={collapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}
      >
        <SignOut size={18} />
        {!collapsed && <span className="text-sm">Esci</span>}
      </button>
    </div>
  );
}
