import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  House, MagicWand, User, SignOut, Bell, CaretLeft, CaretRight,
  CalendarBlank, Users, Globe, ChartBar, Queue, ShieldCheck, RssSimple, Translate
} from '@phosphor-icons/react';


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const LANGUAGES = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

function LangSwitcher({ collapsed }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        className="sidebar-nav-item w-full text-[var(--text-muted)]"
        onClick={() => setOpen(o => !o)}
        title={collapsed ? current.flag : ''}
        style={collapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}
      >
        <Translate size={18} />
        {!collapsed && <span className="text-sm flex-1 text-left">{current.flag} {current.label}</span>}
      </button>
      {open && (
        <div
          className="absolute z-50 rounded-lg shadow-xl border border-[var(--border)] overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            bottom: '100%',
            left: collapsed ? '100%' : 0,
            marginBottom: 4,
            minWidth: 160,
          }}
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2"
              style={{ color: lang.code === i18n.language ? 'var(--accent-purple)' : 'var(--text-primary)' }}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ activeView, setActiveView, isProjectView }) {
  const { user, logout, api } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications/unread-count').then(r => setUnread(r.data.unread)).catch(() => {});
  }, [api]);

  const isAdmin = user?.role === 'admin';
  const w = collapsed ? 68 : 220;

  if (isMobile) {
    const mobileItems = isProjectView
      ? [
          { id: 'dashboard', icon: House, label: t('nav.dashboard') },
          { id: 'project', icon: CalendarBlank, label: t('nav.content') },
          { id: 'personas', icon: Users, label: t('nav.personas') },
          { id: 'social', icon: Globe, label: t('nav.social') },
          { id: 'feeds', icon: RssSimple, label: t('nav.feeds') },
          { id: 'profile', icon: User, label: t('nav.profile') },
        ]
      : [
          { id: 'dashboard', icon: House, label: t('nav.dashboard') },
          { id: 'wizard', icon: MagicWand, label: t('nav.newProject') },
          { id: 'notifications', icon: Bell, label: t('nav.notifications') },
          ...(isAdmin ? [{ id: 'admin', icon: ShieldCheck, label: t('nav.admin') }] : []),
          { id: 'profile', icon: User, label: t('nav.profile') },
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

  const mainNav = [
    { id: 'dashboard', icon: House, label: t('nav.dashboard') },
    { id: 'wizard', icon: MagicWand, label: t('nav.newProject') },
  ];

  const projectNav = [
    { id: 'calendar', icon: CalendarBlank, label: t('nav.calendar') },
    { id: 'personas', icon: Users, label: t('nav.personas') },
    { id: 'social', icon: Globe, label: t('nav.social') },
    { id: 'analytics', icon: ChartBar, label: t('nav.analytics') },
  ];

  return (
    <div className="sidebar flex flex-col" style={{ width: w, minWidth: w, padding: collapsed ? '1.25rem 0.5rem' : '1.25rem', transition: 'width 0.2s ease, min-width 0.2s ease, padding 0.2s ease' }}>
      {/* Logo + Collapse */}
      <div className="flex items-center gap-2 mb-6" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        {collapsed
          ? <img src="/assets/favicon.jpg" alt="Sketchario" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
          : <img src="/assets/LOGO-sketchario.jpg" alt="Sketchario" style={{ height: 32, maxWidth: '140px', objectFit: 'contain', flexShrink: 0 }} />
        }
        {!collapsed && (
          <button data-testid="sidebar-toggle" className="ml-auto p-1 rounded hover:bg-[var(--bg-card)] transition-colors" onClick={() => setCollapsed(true)}>
            <CaretLeft size={14} />
          </button>
        )}
      </div>
      {collapsed && (
        <button data-testid="sidebar-toggle" className="flex items-center justify-center w-full mb-2 p-1 rounded hover:bg-[var(--bg-card)] transition-colors" onClick={() => setCollapsed(false)}>
          <CaretRight size={14} />
        </button>
      )}

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
          {!collapsed && <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase px-2 mb-1">{t('nav.project')}</p>}
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
          title={collapsed ? t('nav.admin') : ''}
          style={collapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}
        >
          <ShieldCheck weight={activeView === 'admin' ? 'fill' : 'regular'} size={20} />
          {!collapsed && <span>{t('nav.admin')}</span>}
        </div>
      )}

      <div className="flex-1" />

      {/* Notifications bell */}
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
        {!collapsed && <span>{t('nav.notifications')}</span>}
      </button>

      {/* Language switcher */}
      <LangSwitcher collapsed={collapsed} />

      {/* User Profile */}
      <div
        data-testid="nav-profile"
        className="user-profile-card cursor-pointer hover:border-[var(--gradient-start)] transition-colors mt-2"
        onClick={() => setActiveView('profile')}
        style={collapsed ? { justifyContent: 'center', padding: '0.5rem', flexDirection: 'column', alignItems: 'center', gap: 0 } : {}}
      >
        <div className="user-avatar" style={{ width: collapsed ? 28 : 32, height: collapsed ? 28 : 32, flexShrink: 0 }}>
          <User weight="fill" size={collapsed ? 12 : 14} color="white" />
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
        title={collapsed ? t('nav.logout') : ''}
        style={collapsed ? { justifyContent: 'center', padding: '0.75rem' } : {}}
      >
        <SignOut size={18} />
        {!collapsed && <span className="text-sm">{t('nav.logout')}</span>}
      </button>
    </div>
  );
}
