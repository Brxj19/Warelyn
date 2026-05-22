import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const navGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', to: '/dashboard' }] },
  { label: 'Catalog', items: [{ label: 'Catalog home', to: '/catalog' }, { label: 'Products', to: '/catalog/products' }, { label: 'Categories', to: '/catalog/categories' }, { label: 'Brands', to: '/catalog/brands' }, { label: 'Vendors', to: '/catalog/vendors' }, { label: 'Customers', to: '/catalog/customers' }] },
  { label: 'Warehousing', items: [{ label: 'Warehouses', to: '/warehouses' }, { label: 'Picking queue', to: '/pick-tasks', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF', 'VIEWER'] }] },
  { label: 'Workflows', items: [{ label: 'Purchases', to: '/purchases', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF', 'VIEWER'] }, { label: 'Sales orders', to: '/sales', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF', 'VIEWER'] }, { label: 'Returns QC', to: '/returns', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF', 'VIEWER'] }] },
  { label: 'Visibility', items: [{ label: 'Reports', to: '/reports', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'VIEWER'] }] },
];

function isItemVisible(item, role) {
  return !item.roles || item.roles.includes(role);
}

function Sidebar({ isSuperAdmin, onNavigate, user }) {
  return (
    <aside className="flex h-full flex-col border-r border-warelyn-border bg-white">
      <div className="border-b border-warelyn-border px-5 py-5">
        <Link className="flex items-center gap-3" onClick={onNavigate} to="/dashboard">
          <img alt="Warelyn" className="h-10 w-10 rounded-xl object-contain ring-1 ring-slate-200" src="/warelyn-logo.png" />
          <span>
            <span className="block text-sm font-bold tracking-tight text-warelyn-text">Warelyn</span>
            <span className="block text-xs text-warelyn-muted">Inventory operations</span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => isItemVisible(item, user?.role));
          if (!visibleItems.length) return null;
          return (
            <div key={group.label}>
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
              <div className="mt-2 space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    className={({ isActive }) => `block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-blue-50 text-warelyn-primary ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-warelyn-text'}`}
                    key={item.to}
                    onClick={onNavigate}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
        {isSuperAdmin ? <NavLink className={({ isActive }) => `block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-blue-50 text-warelyn-primary ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-warelyn-text'}`} onClick={onNavigate} to="/admin">Platform Admin</NavLink> : null}
      </nav>
      <div className="border-t border-warelyn-border p-4">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="truncate text-sm font-semibold text-warelyn-text">{user?.name}</p>
          <p className="mt-1 truncate text-xs text-warelyn-muted">{user?.role}</p>
        </div>
      </div>
    </aside>
  );
}

export function MainLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-warelyn-background text-warelyn-text lg:grid lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block"><Sidebar isSuperAdmin={isSuperAdmin} user={user} /></div>
      {isSidebarOpen ? <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} role="presentation"><div className="h-full w-[min(86vw,280px)]" onClick={(event) => event.stopPropagation()} role="presentation"><Sidebar isSuperAdmin={isSuperAdmin} onNavigate={() => setIsSidebarOpen(false)} user={user} /></div></div> : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-white shadow-lg shadow-slate-950/10">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button className="px-3 py-2 text-white hover:bg-white/10 lg:hidden" onClick={() => setIsSidebarOpen(true)} variant="ghost">Menu</Button>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold">Operational clarity over decoration</p>
                <p className="truncate text-xs text-slate-400">{location.pathname}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
              <Button className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800" onClick={logout} variant="secondary">Logout</Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
