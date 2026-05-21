import { Link, NavLink, Outlet } from 'react-router-dom';

import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Catalog', to: '/catalog' },
  { label: 'Products', to: '/catalog/products' },
  { label: 'Categories', to: '/catalog/categories' },
  { label: 'Brands', to: '/catalog/brands' },
  { label: 'Vendors', to: '/catalog/vendors' },
  { label: 'Customers', to: '/catalog/customers' },
  { label: 'Warehouses', to: '/warehouses' },
  { label: 'Purchases', to: '/purchases', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF', 'VIEWER'] },
];

export function MainLayout() {
  const { logout, user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-warelyn-background text-warelyn-text">
      <header className="border-b border-warelyn-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link className="flex items-center gap-3" to="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warelyn-primary text-sm font-bold text-white">WI</span>
            <span>
              <span className="block text-base font-bold tracking-tight">Warelyn Inventory</span>
              <span className="block text-xs text-warelyn-muted">Inventory that moves with your business.</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-xs text-warelyn-muted sm:block">
              <span className="block font-semibold text-warelyn-text">{user?.name}</span>
              <span>{user?.role}</span>
            </span>
            <Button variant="secondary" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-warelyn-border bg-white p-3 shadow-sm">
          <nav className="space-y-1">
            {navItems.filter((item) => !item.roles || item.roles.includes(user?.role)).map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive ? 'bg-blue-50 text-warelyn-primary' : 'text-warelyn-muted hover:bg-slate-50 hover:text-warelyn-text'
                  }`
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
            {isSuperAdmin ? (
              <NavLink
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive ? 'bg-blue-50 text-warelyn-primary' : 'text-warelyn-muted hover:bg-slate-50 hover:text-warelyn-text'
                  }`
                }
                to="/admin"
              >
                Platform Admin
              </NavLink>
            ) : null}
          </nav>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
