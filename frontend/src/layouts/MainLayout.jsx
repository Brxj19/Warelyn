import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Clock,
  ClipboardList,
  HelpCircle,
  Layers,
  LayoutDashboard,
  ListChecks,
  Menu,
  Package,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Undo2,
  Upload,
  UserCircle,
  Users,
  Warehouse,
} from 'lucide-react';

import { AppLogo } from '../components/ui/AppLogo.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const writeRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER'];
const purchaseRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF', 'VIEWER'];
const salesRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF', 'VIEWER'];
const reportRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'VIEWER'];

const navGroups = [
  { label: 'Home', items: [{ icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' }] },
  { label: 'Catalog', items: [{ icon: Package, label: 'Products', to: '/catalog/products' }, { icon: Upload, label: 'Import Products', to: '/catalog/products/import', roles: writeRoles }, { icon: Layers, label: 'Categories', to: '/catalog/categories' }, { icon: ShieldCheck, label: 'Brands', to: '/catalog/brands' }, { icon: BriefcaseBusiness, label: 'Vendors', to: '/catalog/vendors' }, { icon: Users, label: 'Customers', to: '/catalog/customers' }] },
  { label: 'Warehousing', items: [{ icon: Warehouse, label: 'Warehouses', to: '/warehouses' }, { icon: Boxes, label: 'Inventory Stock', to: '/reports/warehouse-stock', roles: reportRoles }, { icon: Activity, label: 'Stock Ledger', to: '/reports/stock-movements', roles: reportRoles }, { icon: ShieldCheck, label: 'Reconciliation', to: '/reports/reconciliation', roles: reportRoles }, { icon: PackageCheck, label: 'Batch / Serial', to: '/reports/serial-status', roles: reportRoles }] },
  { label: 'Purchases', items: [{ icon: ClipboardList, label: 'Purchase Orders', to: '/purchases', roles: purchaseRoles }, { icon: Truck, label: 'Purchase Receipts', to: '/purchases', roles: purchaseRoles }] },
  { label: 'Sales', items: [{ icon: ShoppingCart, label: 'Sales Orders', to: '/sales', roles: salesRoles }, { icon: PackageCheck, label: 'Sales Fulfillments', to: '/sales', roles: salesRoles }] },
  { label: 'Operations', items: [{ icon: ListChecks, label: 'Pick Tasks', to: '/pick-tasks', roles: salesRoles }, { icon: Package, label: 'Packages', to: '/pick-tasks', roles: salesRoles }, { icon: Undo2, label: 'Returns', to: '/returns', roles: salesRoles }, { icon: ShieldCheck, label: 'Returns QC', to: '/returns', roles: salesRoles }] },
  { label: 'Reports', items: [{ icon: BarChart3, label: 'Reports', to: '/reports', roles: reportRoles }, { icon: Boxes, label: 'Inventory Summary', to: '/reports/inventory-summary', roles: reportRoles }, { icon: Warehouse, label: 'Warehouse Stock', to: '/reports/warehouse-stock', roles: reportRoles }, { icon: Activity, label: 'Stock Movements', to: '/reports/stock-movements', roles: reportRoles }, { icon: Bell, label: 'Low Stock', to: '/reports/low-stock', roles: reportRoles }, { icon: ClipboardList, label: 'Reorder Suggestions', to: '/reports/reorder-suggestions', roles: reportRoles }, { icon: BarChart3, label: 'Valuation', to: '/reports/product-valuation', roles: reportRoles }, { icon: Clock, label: 'Batch Expiry', to: '/reports/batch-expiry', roles: reportRoles }, { icon: PackageCheck, label: 'Serial Status', to: '/reports/serial-status', roles: reportRoles }, { icon: ShieldCheck, label: 'Blocked Stock', to: '/reports/blocked-stock', roles: reportRoles }, { icon: ShieldCheck, label: 'Reconciliation Report', to: '/reports/reconciliation', roles: reportRoles }] },
];

const quickCreateItems = [
  { icon: Package, label: 'New Product', roles: writeRoles, to: '/catalog/products' },
  { icon: ClipboardList, label: 'New Purchase Order', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF'], to: '/purchases/new' },
  { icon: ShoppingCart, label: 'New Sales Order', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'], to: '/sales/new' },
  { icon: Undo2, label: 'New Return', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'], to: '/returns/new' },
  { icon: Warehouse, label: 'New Warehouse', roles: writeRoles, to: '/warehouses' },
];

function canSee(item, role) {
  return !item.roles || item.roles.includes(role);
}

function flattenNav(role) {
  return navGroups.flatMap((group) => group.items.filter((item) => canSee(item, role)).map((item) => ({ ...item, section: group.label })));
}

function activeGroupFor(pathname, role) {
  return navGroups.find((group) => group.items.some((item) => canSee(item, role) && (pathname === item.to || pathname.startsWith(`${item.to}/`))))?.label ?? 'Home';
}

function useOutsideClose(ref, close) {
  useEffect(() => {
    function onPointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) close();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [close, ref]);
}

function TopbarSearch({ items }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  useOutsideClose(wrapperRef, () => setIsOpen(false));

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items.slice(0, 6);
    return items.filter((item) => `${item.label} ${item.section}`.toLowerCase().includes(value)).slice(0, 8);
  }, [items, query]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === 'Escape') setIsOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function openResult(item) {
    navigate(item.to);
    setIsOpen(false);
    setQuery('');
  }

  return (
    <div className="topbar-search" ref={wrapperRef}>
      <Search className="search-icon" size={17} />
      <input onFocus={() => setIsOpen(true)} onKeyDown={(event) => { if (event.key === 'Enter' && results[0]) openResult(results[0]); }} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, orders, vendors, customers, warehouses..." ref={inputRef} value={query} />
      <span className="search-shortcut">/</span>
      {isOpen ? <div className="topbar-popover search-popover"><h3>Global search</h3><p>Jump to records or app sections</p>{results.length ? <div className="mt-3 space-y-1">{results.map((item) => <button className="popover-row" key={`${item.section}-${item.label}`} onClick={() => openResult(item)} type="button"><item.icon size={16} /><span><strong>{item.label}</strong><small>{item.section}</small></span></button>)}</div> : <div className="popover-empty">No matching sections found.</div>}</div> : null}
    </div>
  );
}

function QuickCreateMenu({ user }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setIsOpen(false));
  const entries = quickCreateItems.filter((item) => canSee(item, user?.role));
  return <div className="relative" ref={ref}><Button className="topbar-icon-btn" onClick={() => setIsOpen((value) => !value)} variant="ghost"><Plus size={18} /><span className="hidden xl:inline">Quick Create</span></Button>{isOpen ? <div className="topbar-popover right-0"><h3>Quick Create</h3><p>Jump into common workflows.</p><div className="mt-3 space-y-1">{entries.map((entry) => <button className="popover-row" key={entry.label} onClick={() => { navigate(entry.to); setIsOpen(false); }} type="button"><entry.icon size={16} /><span><strong>{entry.label}</strong><small>Open workflow</small></span></button>)}</div></div> : null}</div>;
}

function RecentHistoryMenu({ history }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setIsOpen(false));
  return <div className="relative" ref={ref}><Button className="topbar-icon-btn" onClick={() => setIsOpen((value) => !value)} variant="ghost"><Clock size={18} /></Button>{isOpen ? <div className="topbar-popover right-0"><h3>Recent History</h3><p>Last visited Warelyn pages.</p>{history.length ? <div className="mt-3 space-y-1">{history.map((entry) => <button className="popover-row" key={entry.path} onClick={() => { navigate(entry.path); setIsOpen(false); }} type="button"><Clock size={16} /><span><strong>{entry.label}</strong><small>{entry.section}</small></span></button>)}</div> : <div className="popover-empty">Recent records will appear here as you navigate.</div>}</div> : null}</div>;
}

function Sidebar({ collapsed, onCollapse, onNavigate, openGroup, setOpenGroup, user }) {
  const location = useLocation();
  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <Link onClick={onNavigate} title="Dashboard" to="/dashboard"><AppLogo compact={collapsed} imageClassName={collapsed ? '' : 'h-12'} /></Link>
      </div>
      <nav className="sidebar-nav">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canSee(item, user?.role));
          if (!visibleItems.length) return null;
          const isOpen = collapsed || openGroup === group.label;
          return <div className="nav-group" key={group.label}><button className="nav-group-toggle" onClick={() => setOpenGroup(openGroup === group.label ? '' : group.label)} title={group.label} type="button"><span>{!collapsed ? group.label : group.label.slice(0, 1)}</span>{!collapsed ? isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : null}</button>{isOpen ? <div className="nav-items">{visibleItems.map((item) => <NavLink className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`} key={`${group.label}-${item.label}`} onClick={onNavigate} title={item.label} to={item.to}><item.icon size={18} /><span>{item.label}</span></NavLink>)}</div> : null}</div>;
        })}
      </nav>
      <button className="sidebar-collapse" onClick={onCollapse} type="button">{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}<span>{collapsed ? '' : 'Collapse sidebar'}</span></button>
    </aside>
  );
}

function labelForPath(pathname, navItems) {
  return navItems.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) ?? { label: 'Workspace', section: 'Warelyn', to: pathname };
}

export function MainLayout() {
  const location = useLocation();
  const { logout, tenant, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => window.localStorage.getItem('warelyn.sidebarCollapsed') === 'true');
  const navItems = useMemo(() => flattenNav(user?.role), [user?.role]);
  const [openGroup, setOpenGroup] = useState(() => activeGroupFor(location.pathname, user?.role));
  const [history, setHistory] = useState(() => JSON.parse(window.localStorage.getItem('warelyn.recentPages') || '[]'));
  const current = labelForPath(location.pathname, navItems);

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

  return (
    <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <header className="topbar">
        <div className="topbar-left"><Button className="topbar-icon-btn lg:hidden" onClick={() => setIsSidebarOpen(true)} variant="ghost"><Menu size={20} /></Button><Link className="topbar-logo" to="/dashboard"><AppLogo imageClassName="h-11" /><span><strong>{tenant?.company_name ?? 'Warelyn'}</strong><small>Inventory workspace</small></span></Link></div>
        <TopbarSearch items={navItems} />
        <div className="topbar-actions"><QuickCreateMenu user={user} /><RecentHistoryMenu history={history} /><Button className="topbar-icon-btn" variant="ghost"><Bell size={18} /></Button><Button className="topbar-icon-btn" variant="ghost"><HelpCircle size={18} /></Button><div className="workspace-chip"><UserCircle size={20} /><span><strong>{user?.name}</strong><small>{user?.role}</small></span><ChevronDown size={15} /></div><Button className="topbar-logout" onClick={logout} variant="secondary">Logout</Button></div>
      </header>
      <div className="shell-body">
        <div className="hidden lg:block"><Sidebar collapsed={isCollapsed} onCollapse={() => setIsCollapsed((value) => !value)} openGroup={openGroup} setOpenGroup={setOpenGroup} user={user} /></div>
        {isSidebarOpen ? <div className="mobile-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} role="presentation"><div className="mobile-sidebar" onClick={(event) => event.stopPropagation()} role="presentation"><Sidebar collapsed={false} onCollapse={() => setIsSidebarOpen(false)} onNavigate={() => setIsSidebarOpen(false)} openGroup={openGroup} setOpenGroup={setOpenGroup} user={user} /></div></div> : null}
        <main className="shell-main"><div className="shell-content"><div className="content-scroll"><div className="content-inner"><div className="breadcrumbs"><Link to="/dashboard">Home</Link><ChevronRight size={14} /><span>{current.section}</span><ChevronRight size={14} /><strong>{current.label}</strong></div><Outlet /></div></div></div></main>
      </div>
    </div>
  );
}
