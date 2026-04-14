import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  House, MagicWand, User, SignOut, Bell, CaretLeft, CaretRight,
  CalendarBlank, Users, Globe, ChartBar, Queue, ShieldCheck
} from '@phosphor-icons/react';

const LOGO = 'https://customer-assets.emergentagent.com/job_editorial-flow-v4/artifacts/oyv8tqit_favicon-invert.jpg';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Sidebar({ activeView, setActiveView, isProjectView }) {
  const { user, logout, api } = useAuth();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications/unread-count').then(r => setUnread(r.data.unread)).catch(() => {});
  }, [api]);

  const isAdmin = user?.role === 'admin';
  const w = collapsed ? 50 : 220;

  // Mobile: show context-aware navigation
  if (isMobile) {
    const mobileItems = isProjectView
      ? [
          { id: 'dashboard', icon: House, label: 'Home' },
          { id: 'project', icon: CalendarBlank, label: 'Contenuti' },
          { id: 'personas', icon: Users, label: 'Personas' },
          { id: 'social', icon: Globe, label: 'Social' },
          { id: 'profile', icon: User, label: 'Profilo' },
        ]
      : [
          { id: 'dashboard', icon: House, label: 'Home' },
          { id: 'wizard', icon: MagicWand, label: 'Nuovo' },
          { id: 'notifications', icon: Bell, label: 'Novita' },
          ...(isAdmin ? [{ id: 'admin', icon: ShieldCheck, label: 'Admin' }] : []),
          { id: 'profile', icon: User, label: 'Profilo' },
        ];

    return (
      <div className="sidebar" data-testid="mobile-bottom-nav">
        <nav>
          {mobileItems.map(item => (
            <div
              key={item.id}
              data-testid={`nav-${item.id}`}
              className={`sidebar-nav-item relative ${activeView === item.id || (item.id === 'project' && ['project', 'calendar'].includes(activeView)) ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'notifications') {
                  setActiveView('notifications');
                  api.post('/notifications/mark-read').then(() => setUnread(0)).catch(() => {});
                } else {
                  setActiveView(item.id);
                }
              }}
            >
              <div className="relative">
                <item.icon weight={activeView === item.id ? 'fill' : 'regular'} size={20} />
                {item.id === 'notifications' && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--accent-pink)] text-[7px] font-bold flex items-center justify-center">{unread}</span>
                )}
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
    );
  }

  // Desktop sidebar
  const mainNav = [
    { id: 'dashboard', icon: House, label: 'Dashboard' },
    { id: 'wizard', icon: MagicWand, label: 'Nuovo Progetto' },
  ];

  const projectNav = [
    { id: 'calendar', icon: CalendarBlank, label: 'Calendario' },
    { id: 'personas', icon: Users, label: 'Personas' },
    { id: 'social', icon: Globe, label: 'Social' },
  ];

  return (
    <div className="sidebar flex flex-col" style={{ width: w, minWidth: w, transition: 'width 0.2s ease, min-width 0.2s ease' }}>
      {/* Logo + Collapse */}
      <div className="flex items-center gap-2 mb-6" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <img src={LOGO} alt="S" style={{ height: collapsed ? 28 : 32, borderRadius: 6 }} />
        {!collapsed && <h2 className="text-base font-bold gradient-text flex-1">Sketchario</h2>}
        {!collapsed && (
          <button data-testid="sidebar-toggle" className="p-1 rounded hover:bg-[var(--bg-card)] transition-colors" onClick={() => setCollapsed(true)}>
            <CaretLeft size={14} />
          </button>
        )}
        {collapsed && (
          <button data-testid="sidebar-toggle" className="absolute top-3 left-1/2 -translate-x-1/2 mt-10 p-0.5 rounded hover:bg-[var(--bg-card)] transition-colors" onClick={() => setCollapsed(false)}>
            <CaretRight size={12} />
          </button>
        )}
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

      {/* Project Nav */}
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

      {/* User Profile */}
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
