import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, ChevronRight, HelpCircle, Menu, UserCircle } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { AppLogo } from '../components/AppLogo.jsx';
import { QuickCreateMenu } from '../components/QuickCreateMenu.jsx';
import { RecentHistoryMenu } from '../components/RecentHistoryMenu.jsx';
import { SidebarNav } from '../components/SidebarNav.jsx';
import { TopbarSearch } from '../components/TopbarSearch.jsx';
import { activeGroupFor, flattenNav, resolveRouteMeta } from '../components/navigation.js';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, tenant, user } = useAuth();
  const accountRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => window.localStorage.getItem('warelyn.sidebarCollapsed') === 'true');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const navItems = useMemo(() => flattenNav(user?.role), [user?.role]);
  const [openGroup, setOpenGroup] = useState(() => activeGroupFor(location.pathname, user?.role));
  const [history, setHistory] = useState(() => JSON.parse(window.localStorage.getItem('warelyn.recentPages') || '[]'));
  const current = useMemo(() => resolveRouteMeta(location.pathname, user?.role), [location.pathname, user?.role]);

  useEffect(() => setOpenGroup(activeGroupFor(location.pathname, user?.role)), [location.pathname, user?.role]);
  useEffect(() => {
    window.localStorage.setItem('warelyn.sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);
  useEffect(() => {
    const entry = { label: current.label, path: location.pathname, section: current.section };
    setHistory((items) => {
      const next = [entry, ...items.filter((item) => item.path !== entry.path)].slice(0, 8);
      window.localStorage.setItem('warelyn.recentPages', JSON.stringify(next));
      return next;
    });
  }, [current.label, current.section, location.pathname]);
  useEffect(() => {
    function handlePointerDown(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) setIsAccountOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <header className="topbar">
        <div className="topbar-left">
          <Button aria-label="Open navigation menu" className="topbar-icon-btn lg:hidden" onClick={() => setIsSidebarOpen(true)} title="Open menu" type="button" variant="ghost">
            <Menu size={20} />
          </Button>
          <Link className="topbar-brand" to="/dashboard">
            <AppLogo size="topbar" variant="full" />
          </Link>
        </div>

        <TopbarSearch navItems={navItems} />

        <div className="topbar-actions">
          <QuickCreateMenu role={user?.role} />
          <RecentHistoryMenu history={history} />
          <Button
            aria-label="View low stock alerts"
            className="topbar-icon-btn topbar-icon-btn-quiet"
            onClick={() => navigate('/reports/low-stock')}
            title="Low stock alerts"
            type="button"
            variant="ghost"
          >
            <Bell size={18} />
          </Button>
          <Button
            aria-label="Open reports help"
            className="topbar-icon-btn topbar-icon-btn-quiet"
            onClick={() => navigate('/reports')}
            title="Open reports"
            type="button"
            variant="ghost"
          >
            <HelpCircle size={18} />
          </Button>
          <div className="topbar-popover-anchor" ref={accountRef}>
            <button className="workspace-chip" onClick={() => setIsAccountOpen((currentState) => !currentState)} type="button">
              <UserCircle size={20} />
              <span>
                <strong>{user?.name ?? 'Warehouse user'}</strong>
                <small>{tenant?.company_name ?? user?.role ?? 'Workspace'}</small>
              </span>
              <ChevronDown size={15} />
            </button>
            {isAccountOpen ? (
              <div className="topbar-popover topbar-popover-right">
                <h3>{tenant?.company_name ?? 'Warelyn workspace'}</h3>
                <p>{user?.role ?? 'Authenticated user'}</p>
                <div className="topbar-popover-list">
                  <button
                    className="popover-row"
                    onClick={() => {
                      navigate('/dashboard');
                      setIsAccountOpen(false);
                    }}
                    type="button"
                  >
                    <UserCircle size={16} />
                    <span>
                      <strong>Workspace home</strong>
                      <small>Return to dashboard</small>
                    </span>
                  </button>
                  <button
                    className="popover-row"
                    onClick={async () => {
                      setIsAccountOpen(false);
                      await logout();
                    }}
                    type="button"
                  >
                    <HelpCircle size={16} />
                    <span>
                      <strong>Sign out</strong>
                      <small>End this session</small>
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <div className="shell-body">
        <div className="hidden lg:block">
          <SidebarNav
            collapsed={isCollapsed}
            onCollapse={() => setIsCollapsed((value) => !value)}
            onNavigate={() => undefined}
            openGroup={openGroup}
            setOpenGroup={setOpenGroup}
            userRole={user?.role}
          />
        </div>

        {isSidebarOpen ? (
          <div className="mobile-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} role="presentation">
            <div className="mobile-sidebar" onClick={(event) => event.stopPropagation()} role="presentation">
              <SidebarNav
                collapsed={false}
                mobile
                onCollapse={() => setIsSidebarOpen(false)}
                onNavigate={() => setIsSidebarOpen(false)}
                openGroup={openGroup}
                setOpenGroup={setOpenGroup}
                userRole={user?.role}
              />
            </div>
          </div>
        ) : null}

        <main className="shell-main">
          <div className="shell-content">
            <div className="content-scroll">
              <div className="content-inner">
                <div className="breadcrumbs">
                  <Link to="/dashboard">Home</Link>
                  <ChevronRight size={14} />
                  <span>{current.section}</span>
                  <ChevronRight size={14} />
                  <strong>{current.label}</strong>
                </div>
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
