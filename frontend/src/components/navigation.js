import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  Boxes,
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  Layers,
  ListChecks,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Undo2,
  Upload,
  Users,
  Warehouse,
} from 'lucide-react';

export const writeRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER'];
export const purchaseRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF', 'VIEWER'];
export const salesRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF', 'VIEWER'];
export const reportRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'VIEWER'];

export const navGroups = [
  {
    label: 'Overview',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', section: 'Overview', to: '/dashboard' }],
  },
  {
    label: 'Catalog',
    items: [
      { icon: Package, label: 'Products', section: 'Catalog', to: '/catalog/products' },
      { icon: Upload, label: 'Import Products', section: 'Catalog', to: '/catalog/products/import', roles: writeRoles },
      { icon: Layers, label: 'Categories', section: 'Catalog', to: '/catalog/categories' },
      { icon: BadgeCheck, label: 'Brands', section: 'Catalog', to: '/catalog/brands' },
      { icon: BriefcaseBusiness, label: 'Vendors', section: 'Catalog', to: '/catalog/vendors' },
      { icon: Users, label: 'Customers', section: 'Catalog', to: '/catalog/customers' },
    ],
  },
  {
    label: 'Warehousing',
    items: [
      { icon: Warehouse, label: 'Warehouses', section: 'Warehousing', to: '/warehouses' },
      { icon: Boxes, label: 'Inventory Stock', section: 'Warehousing', to: '/reports/warehouse-stock', roles: reportRoles },
      { icon: Activity, label: 'Stock Ledger', section: 'Warehousing', to: '/reports/stock-movements', roles: reportRoles },
      { icon: ShieldCheck, label: 'Reconciliation', section: 'Warehousing', to: '/reports/reconciliation', roles: reportRoles },
      { icon: Package, label: 'Batch / Serial', section: 'Warehousing', to: '/reports/serial-status', roles: reportRoles },
    ],
  },
  {
    label: 'Purchases',
    items: [{ icon: ClipboardList, label: 'Purchase Orders', section: 'Purchases', to: '/purchases', roles: purchaseRoles }],
  },
  {
    label: 'Sales',
    items: [
      { icon: ShoppingCart, label: 'Sales Orders', section: 'Sales', to: '/sales', roles: salesRoles },
      { icon: Undo2, label: 'Returns', section: 'Sales', to: '/returns', roles: salesRoles },
    ],
  },
  {
    label: 'Operations',
    items: [{ icon: ListChecks, label: 'Pick Tasks', section: 'Operations', to: '/pick-tasks', roles: salesRoles }],
  },
  {
    label: 'Reports',
    items: [
      { icon: BarChart3, label: 'Operational Reports', section: 'Reports', to: '/reports', roles: reportRoles },
      { icon: Bell, label: 'Low Stock', section: 'Reports', to: '/reports/low-stock', roles: reportRoles },
      { icon: ClipboardList, label: 'Reorder Suggestions', section: 'Reports', to: '/reports/reorder-suggestions', roles: reportRoles },
    ],
  },
];

export const quickCreateItems = [
  { icon: Package, label: 'Open Products', roles: writeRoles, to: '/catalog/products' },
  { icon: ClipboardList, label: 'New Purchase Order', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF'], to: '/purchases/new' },
  { icon: ShoppingCart, label: 'New Sales Order', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'], to: '/sales/new' },
  { icon: Undo2, label: 'New Return', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'], to: '/returns/new' },
  { icon: Warehouse, label: 'Open Warehouses', roles: writeRoles, to: '/warehouses' },
];

const detailRoutes = [
  { pattern: /^\/inventory$/, label: 'Inventory Dashboard', section: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { pattern: /^\/warehouses\/[^/]+$/, label: 'Warehouse Detail', section: 'Warehousing', to: '/warehouses', icon: Warehouse },
  { pattern: /^\/purchases\/new$/, label: 'New Purchase Order', section: 'Purchases', to: '/purchases/new', icon: ClipboardList },
  { pattern: /^\/purchases\/[^/]+$/, label: 'Purchase Order Detail', section: 'Purchases', to: '/purchases', icon: ClipboardList },
  { pattern: /^\/purchases\/[^/]+\/receive$/, label: 'Receive Purchase Order', section: 'Purchases', to: '/purchases', icon: Truck },
  { pattern: /^\/purchase-receipts\/[^/]+$/, label: 'Purchase Receipt', section: 'Purchases', to: '/purchases', icon: Truck },
  { pattern: /^\/sales\/new$/, label: 'New Sales Order', section: 'Sales', to: '/sales/new', icon: ShoppingCart },
  { pattern: /^\/sales\/[^/]+$/, label: 'Sales Order Detail', section: 'Sales', to: '/sales', icon: ShoppingCart },
  { pattern: /^\/sales\/[^/]+\/pick$/, label: 'Sales Picking', section: 'Operations', to: '/pick-tasks', icon: ListChecks },
  { pattern: /^\/sales\/[^/]+\/package$/, label: 'Sales Packaging', section: 'Operations', to: '/pick-tasks', icon: Package },
  { pattern: /^\/sales\/[^/]+\/fulfill$/, label: 'Sales Fulfillment', section: 'Sales', to: '/sales', icon: Boxes },
  { pattern: /^\/sales-fulfillments\/[^/]+$/, label: 'Fulfillment Detail', section: 'Sales', to: '/sales', icon: Boxes },
  { pattern: /^\/returns\/new$/, label: 'New Return', section: 'Sales', to: '/returns/new', icon: Undo2 },
  { pattern: /^\/returns\/[^/]+$/, label: 'Return Detail', section: 'Sales', to: '/returns', icon: Undo2 },
  { pattern: /^\/returns\/[^/]+\/inspect$/, label: 'Return Inspection', section: 'Sales', to: '/returns', icon: ShieldCheck },
  { pattern: /^\/pick-tasks\/[^/]+$/, label: 'Pick Task Detail', section: 'Operations', to: '/pick-tasks', icon: ListChecks },
  { pattern: /^\/packages\/[^/]+$/, label: 'Package Detail', section: 'Operations', to: '/pick-tasks', icon: Package },
];

export function canSee(item, role) {
  return !item.roles || item.roles.includes(role);
}

export function getVisibleNavGroups(role) {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canSee(item, role)),
    }))
    .filter((group) => group.items.length > 0);
}

export function flattenNav(role) {
  return getVisibleNavGroups(role).flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
}

export function activeGroupFor(pathname, role) {
  return getVisibleNavGroups(role).find((group) => group.items.some((item) => matchesPath(item.to, pathname)))?.label ?? 'Overview';
}

export function resolveRouteMeta(pathname, role) {
  const navItem = findBestNavMatch(pathname, role);
  if (navItem) return navItem;
  const detailMatch = detailRoutes.find((item) => item.pattern.test(pathname));
  if (detailMatch) return detailMatch;
  return { icon: Search, label: 'Workspace', section: 'Workspace', to: pathname };
}

function findBestNavMatch(pathname, role) {
  return flattenNav(role)
    .sort((left, right) => right.to.length - left.to.length)
    .find((item) => matchesPath(item.to, pathname));
}

function matchesPath(basePath, pathname) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}
