import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  Layers,
  LayoutDashboard,
  ListChecks,
  Package,
  PackageCheck,
  Plus,
  Search,
  Server,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Undo2,
  Upload,
  UserCog,
  Users,
  Warehouse,
} from 'lucide-react';

export const writeRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER'];
export const purchaseRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF', 'VIEWER'];
export const purchaseWriteRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF'];
export const salesRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF', 'VIEWER'];
export const salesWriteRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'];
export const reportRoles = ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'VIEWER'];

export const superAdminRoles = ['SUPER_ADMIN'];

export const navGroups = [
  {
    label: 'Overview',
    roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF', 'SALES_STAFF', 'VIEWER'],
    items: [{ icon: LayoutDashboard, label: 'Dashboard', section: 'Overview', to: '/dashboard' }],
  },
  {
    label: 'Platform',
    roles: superAdminRoles,
    items: [
      { icon: UserCog, label: 'Platform Console', section: 'Platform', to: '/admin', roles: superAdminRoles, exact: true },
      { icon: Layers, label: 'Tenants', section: 'Platform', to: '/admin/tenants', roles: superAdminRoles, exact: true },
      { icon: ClipboardList, label: 'Audit Logs', section: 'Platform', to: '/admin/audit-logs', roles: superAdminRoles, exact: true },
      { icon: Server, label: 'Platform Health', section: 'Platform', to: '/admin/platform-health', roles: superAdminRoles, exact: true },
    ],
  },
  {
    label: 'Catalog',
    roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF', 'SALES_STAFF', 'VIEWER'],
    items: [
      {
        icon: Package,
        label: 'Products',
        section: 'Catalog',
        children: [
          { icon: Package, label: 'All Products', section: 'Catalog', to: '/catalog/products', exact: true },
          { icon: Plus, label: 'Create Product', section: 'Catalog', to: '/catalog/products/new', roles: writeRoles, exact: true },
          { icon: Upload, label: 'Import Products', section: 'Catalog', to: '/catalog/products/import', roles: writeRoles, exact: true },
        ],
      },
      { icon: Layers, label: 'Categories', section: 'Catalog', to: '/catalog/categories', exact: true },
      { icon: BadgeCheck, label: 'Brands', section: 'Catalog', to: '/catalog/brands', exact: true },
      { icon: BriefcaseBusiness, label: 'Vendors', section: 'Catalog', to: '/catalog/vendors', exact: true },
      { icon: Users, label: 'Customers', section: 'Catalog', to: '/catalog/customers', exact: true },
    ],
  },
  {
    label: 'Warehousing',
    roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF', 'SALES_STAFF', 'VIEWER'],
    items: [
      {
        icon: Warehouse,
        label: 'Warehouses',
        section: 'Warehousing',
        children: [
          { icon: Warehouse, label: 'All Warehouses', section: 'Warehousing', to: '/warehouses', exact: true },
          { icon: Plus, label: 'Create Warehouse', section: 'Warehousing', to: '/warehouses/new', roles: writeRoles, exact: true },
        ],
      },
    ],
  },
  {
    label: 'Purchases',
    roles: purchaseRoles,
    items: [
      {
        icon: ClipboardList,
        label: 'Purchase Orders',
        section: 'Purchases',
        roles: purchaseRoles,
        children: [
          { icon: ClipboardList, label: 'All Purchase Orders', section: 'Purchases', to: '/purchases', roles: purchaseRoles, exact: true },
          { icon: Plus, label: 'Create Purchase Order', section: 'Purchases', to: '/purchases/new', roles: purchaseWriteRoles, exact: true },
        ],
      },
      {
        icon: Truck,
        label: 'Purchase Receipts',
        section: 'Purchases',
        roles: purchaseRoles,
        children: [
          { icon: Truck, label: 'All Receipts', section: 'Purchases', to: '/purchase-receipts', roles: purchaseRoles, exact: true },
          { icon: Plus, label: 'Receive Stock', section: 'Purchases', to: '/purchase-receipts/new', roles: purchaseWriteRoles, exact: true },
        ],
      },
      {
        icon: FileText,
        label: 'Bills',
        section: 'Purchases',
        to: '/bills',
        roles: purchaseRoles,
        exact: true,
      },
    ],
  },
  {
    label: 'Sales',
    roles: salesRoles,
    items: [
      {
        icon: ShoppingCart,
        label: 'Sales Orders',
        section: 'Sales',
        roles: salesRoles,
        children: [
          { icon: ShoppingCart, label: 'All Sales Orders', section: 'Sales', to: '/sales', roles: salesRoles, exact: true },
          { icon: Plus, label: 'Create Sales Order', section: 'Sales', to: '/sales/new', roles: salesWriteRoles, exact: true },
        ],
      },
      {
        icon: FileText,
        label: 'Invoices',
        section: 'Sales',
        to: '/invoices',
        roles: salesRoles,
        exact: true,
      },
    ],
  },
  {
    label: 'Operations',
    roles: salesRoles,
    items: [
      {
        icon: ListChecks,
        label: 'Picking',
        section: 'Operations',
        roles: salesRoles,
        children: [
          { icon: ListChecks, label: 'Pick Tasks', section: 'Operations', to: '/pick-tasks', roles: salesRoles, exact: true },
        ],
      },
      {
        icon: PackageCheck,
        label: 'Packing',
        section: 'Operations',
        roles: salesRoles,
        children: [
          { icon: PackageCheck, label: 'Packages', section: 'Operations', to: '/packages', roles: salesRoles, exact: true },
        ],
      },
      {
        icon: Boxes,
        label: 'Fulfillment',
        section: 'Operations',
        roles: salesRoles,
        children: [
          { icon: Boxes, label: 'Fulfillments', section: 'Operations', to: '/sales-fulfillments', roles: salesRoles, exact: true },
        ],
      },
      {
        icon: Undo2,
        label: 'Returns',
        section: 'Operations',
        roles: salesRoles,
        children: [
          { icon: Undo2, label: 'Sales Returns', section: 'Operations', to: '/returns', roles: salesRoles, exact: true },
          { icon: Plus, label: 'Create Return', section: 'Operations', to: '/returns/new', roles: salesWriteRoles, exact: true },
          { icon: ShieldCheck, label: 'Returns QC', section: 'Operations', to: '/returns/qc', roles: salesRoles, exact: true },
        ],
      },
    ],
  },
  {
    label: 'Reports',
    roles: reportRoles,
    items: [
      { icon: BarChart3, label: 'Overview', section: 'Reports', to: '/reports', roles: reportRoles, exact: true },
      { icon: Boxes, label: 'Inventory Summary', section: 'Reports', to: '/reports/inventory-summary', roles: reportRoles, exact: true },
      { icon: Warehouse, label: 'Warehouse Stock', section: 'Reports', to: '/reports/warehouse-stock', roles: reportRoles, exact: true },
      { icon: Warehouse, label: 'Location Stock', section: 'Reports', to: '/reports/location-stock', roles: reportRoles, exact: true },
      { icon: Activity, label: 'Stock Movements', section: 'Reports', to: '/reports/stock-movements', roles: reportRoles, exact: true },
      { icon: AlertTriangle, label: 'Low Stock', section: 'Reports', to: '/reports/low-stock', roles: reportRoles, exact: true },
      { icon: ClipboardList, label: 'Reorder Suggestions', section: 'Reports', to: '/reports/reorder-suggestions', roles: reportRoles, exact: true },
      { icon: BarChart3, label: 'Product Valuation', section: 'Reports', to: '/reports/product-valuation', roles: reportRoles, exact: true },
      { icon: Package, label: 'Batch Expiry', section: 'Reports', to: '/reports/batch-expiry', roles: reportRoles, exact: true },
      { icon: PackageCheck, label: 'Serial Status', section: 'Reports', to: '/reports/serial-status', roles: reportRoles, exact: true },
      { icon: ShieldCheck, label: 'Blocked Stock', section: 'Reports', to: '/reports/blocked-stock', roles: reportRoles, exact: true },
      { icon: ShieldCheck, label: 'Reconciliation', section: 'Reports', to: '/reports/reconciliation', roles: reportRoles, exact: true },
    ],
  },
  {
    label: 'Preferences',
    roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF', 'SALES_STAFF', 'VIEWER'],
    items: [{ icon: Settings, label: 'Settings', section: 'Preferences', to: '/settings', exact: true }],
  },
];

export const quickCreateItems = [
  { icon: Package, label: 'New Product', roles: writeRoles, to: '/catalog/products/new' },
  { icon: ClipboardList, label: 'New Purchase Order', roles: purchaseWriteRoles, to: '/purchases/new' },
  { icon: Truck, label: 'Receive Stock', roles: purchaseWriteRoles, to: '/purchase-receipts/new' },
  { icon: ShoppingCart, label: 'New Sales Order', roles: salesWriteRoles, to: '/sales/new' },
  { icon: Undo2, label: 'New Return', roles: salesWriteRoles, to: '/returns/new' },
  { icon: Warehouse, label: 'Open Warehouses', roles: writeRoles, to: '/warehouses' },
];

const detailRoutes = [
  { pattern: /^\/inventory$/, label: 'Inventory Dashboard', section: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { pattern: /^\/warehouses\/[^/]+$/, label: 'Warehouse Detail', section: 'Warehousing', to: '/warehouses', icon: Warehouse },
  { pattern: /^\/purchases\/[^/]+$/, label: 'Purchase Order Detail', section: 'Purchases', to: '/purchases', icon: ClipboardList },
  { pattern: /^\/purchases\/[^/]+\/receive$/, label: 'Receive Purchase Order', section: 'Purchases', to: '/purchase-receipts/new', icon: Truck },
  { pattern: /^\/purchase-receipts\/[^/]+$/, label: 'Purchase Receipt', section: 'Purchases', to: '/purchase-receipts', icon: Truck },
  { pattern: /^\/bills\/[^/]+$/, label: 'Bill Detail', section: 'Purchases', to: '/bills', icon: FileText },
  { pattern: /^\/sales\/[^/]+$/, label: 'Sales Order Detail', section: 'Sales', to: '/sales', icon: ShoppingCart },
  { pattern: /^\/invoices\/[^/]+$/, label: 'Invoice Detail', section: 'Sales', to: '/invoices', icon: FileText },
  { pattern: /^\/sales\/[^/]+\/pick$/, label: 'Sales Picking', section: 'Operations', to: '/pick-tasks', icon: ListChecks },
  { pattern: /^\/sales\/[^/]+\/package$/, label: 'Sales Packaging', section: 'Operations', to: '/packages', icon: PackageCheck },
  { pattern: /^\/sales\/[^/]+\/fulfill$/, label: 'Sales Fulfillment', section: 'Operations', to: '/sales-fulfillments', icon: Boxes },
  { pattern: /^\/sales-fulfillments\/[^/]+$/, label: 'Fulfillment Detail', section: 'Operations', to: '/sales-fulfillments', icon: Boxes },
  { pattern: /^\/returns\/[^/]+$/, label: 'Return Detail', section: 'Operations', to: '/returns', icon: Undo2 },
  { pattern: /^\/returns\/[^/]+\/inspect$/, label: 'Return Inspection', section: 'Operations', to: '/returns/qc', icon: ShieldCheck },
  { pattern: /^\/pick-tasks\/[^/]+$/, label: 'Pick Task Detail', section: 'Operations', to: '/pick-tasks', icon: ListChecks },
  { pattern: /^\/packages\/[^/]+$/, label: 'Package Detail', section: 'Operations', to: '/packages', icon: PackageCheck },
];

export function canSee(item, role) {
  return !item.roles || item.roles.includes(role);
}

export function getVisibleNavGroups(role) {
  return navGroups
    .filter((group) => canSee(group, role))
    .map((group) => ({
      ...group,
      items: filterVisibleItems(group.items, role),
    }))
    .filter((group) => group.items.length > 0);
}

export function flattenNav(role) {
  return getVisibleNavGroups(role).flatMap((group) => flattenItems(group.items, group.label));
}

export function activeGroupFor(pathname, role) {
  return getVisibleNavGroups(role).find((group) => flattenItems(group.items, group.label).some((item) => matchesPathLoose(item.to, pathname)))?.label ?? 'Overview';
}

export function resolveRouteMeta(pathname, role) {
  const navItem = findBestNavMatch(pathname, role);
  if (navItem) return navItem;
  const detailMatch = detailRoutes.find((item) => item.pattern.test(pathname));
  if (detailMatch) return detailMatch;
  return { icon: Search, label: 'Workspace', section: 'Workspace', to: pathname };
}

export function isItemActive(item, pathname) {
  if (item.children?.length) {
    return item.children.some((child) => matchesPathLoose(child.to, pathname));
  }
  return matchesPath(item.to, pathname, item.exact);
}

function filterVisibleItems(items, role) {
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = item.children.filter((child) => canSee(child, role));
        if (!children.length || (item.roles && !item.roles.includes(role))) return null;
        return { ...item, children };
      }
      if (!canSee(item, role)) return null;
      return item;
    })
    .filter(Boolean);
}

function flattenItems(items, groupLabel, parentLabel = null) {
  return items.flatMap((item) => {
    if (item.children?.length) {
      return flattenItems(
        item.children.map((child) => ({ ...child, icon: child.icon ?? item.icon })),
        groupLabel,
        item.label,
      );
    }
    return [{ ...item, group: groupLabel, parentLabel }];
  });
}

function findBestNavMatch(pathname, role) {
  return flattenNav(role)
    .sort((left, right) => right.to.length - left.to.length)
    .find((item) => matchesPath(item.to, pathname, item.exact));
}

function matchesPath(basePath, pathname, exact = false) {
  if (exact) return pathname === basePath;
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function matchesPathLoose(basePath, pathname) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}
