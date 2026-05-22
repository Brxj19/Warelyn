import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { AppLogo } from './AppLogo.jsx';
import { getVisibleNavGroups } from './navigation.js';

export function SidebarNav({ collapsed, mobile = false, onCollapse, onNavigate, openGroup, setOpenGroup, userRole }) {
  const location = useLocation();
  const visibleGroups = getVisibleNavGroups(userRole);

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobile ? 'is-mobile' : ''}`}>
      <div className="sidebar-brand">
        <Link className="sidebar-brand-link" onClick={onNavigate} title="Dashboard" to="/dashboard">
          <AppLogo size={collapsed ? 'sidebar-collapsed' : 'sidebar'} variant={collapsed ? 'collapsed' : 'full'} />
        </Link>
      </div>

      <nav className="sidebar-nav">
        {visibleGroups.map((group) => {
          const isGroupOpen = collapsed || openGroup === group.label;
          return (
            <section className="sidebar-group" key={group.label}>
              {!collapsed ? (
                <button
                  aria-expanded={isGroupOpen}
                  className="sidebar-group-toggle"
                  onClick={() => setOpenGroup(isGroupOpen ? '' : group.label)}
                  type="button"
                >
                  <span>{group.label}</span>
                  {isGroupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : null}

              {isGroupOpen ? (
                <div className="sidebar-group-items">
                  {group.items.map((item) => (
                    <NavLink
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'is-active' : ''}`}
                      key={`${group.label}-${item.label}`}
                      onClick={onNavigate}
                      title={item.label}
                      to={item.to}
                    >
                      <span className="sidebar-nav-item-icon">
                        <item.icon size={18} />
                      </span>
                      <span className="sidebar-nav-item-label">{item.label}</span>
                      {!collapsed && matchesPath(item.to, location.pathname) ? <span className="sidebar-nav-item-dot" /> : null}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </nav>

      <button className="sidebar-collapse" onClick={onCollapse} type="button">
        {mobile ? <PanelLeftClose size={18} /> : collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        <span>{mobile ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
      </button>
    </aside>
  );
}

function matchesPath(basePath, pathname) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}
