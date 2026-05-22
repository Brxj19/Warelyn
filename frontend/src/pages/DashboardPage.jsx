import { Activity, ArrowRight, Boxes, ClipboardList, PackageCheck, ShieldAlert, ShoppingCart, TrendingUp, Undo2, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { TableShell } from '../components/ui/TableShell.jsx';
import { formatDate, formatMoney } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as fulfillmentService from '../services/fulfillmentService.js';
import * as purchasingService from '../services/purchasingService.js';
import * as reportsService from '../services/reportsService.js';
import * as returnsService from '../services/returnsService.js';
import * as salesService from '../services/salesService.js';

const kpiCards = [
  ['total_products', 'Total products', 'Catalog scope', 'primary', Boxes, '/catalog/products'],
  ['total_stock_value_cost', 'Stock value', 'Backend valuation', 'success', TrendingUp, '/reports/product-valuation'],
  ['low_stock_count', 'Low stock', 'Needs attention', 'warning', ShieldAlert, '/reports/low-stock'],
  ['openPurchaseOrders', 'Open purchase orders', 'Ready for receiving', 'primary', ClipboardList, '/purchases'],
  ['openSalesOrders', 'Open sales orders', 'Awaiting workflow steps', 'primary', ShoppingCart, '/sales'],
  ['pickQueue', 'Pick / pack queue', 'Operational queue', 'warning', PackageCheck, '/pick-tasks'],
  ['returnsQc', 'Returns QC', 'Inspection workload', 'warning', Undo2, '/returns'],
  ['reconciliation_mismatch_count', 'Reconciliation health', 'Ledger visibility', 'danger', Activity, '/reports/reconciliation'],
];

function ActionList({ emptyDescription, emptyTitle, items, renderItem }) {
  if (!items?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <div className="divide-y divide-warelyn-border overflow-hidden rounded-2xl border border-warelyn-border bg-white">{items.map(renderItem)}</div>;
}

export function DashboardPage() {
  const { accessToken, logout, tenant, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [pickTasks, setPickTasks] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const [dashboardData, purchaseRows, salesRows, pickRows, returnRows] = await Promise.all([
          reportsService.getOperationalDashboard(accessToken),
          purchasingService.listPurchaseOrders(accessToken),
          salesService.listSalesOrders(accessToken),
          fulfillmentService.listPickTasks(accessToken),
          returnsService.listSalesReturns(accessToken),
        ]);
        setDashboard(dashboardData);
        setPurchaseOrders(purchaseRows);
        setSalesOrders(salesRows);
        setPickTasks(pickRows);
        setSalesReturns(returnRows);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  const derivedKpis = useMemo(() => ({
    openPurchaseOrders: purchaseOrders.filter((row) => ['DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED'].includes(row.status)).length,
    openSalesOrders: salesOrders.filter((row) => ['DRAFT', 'CONFIRMED', 'PARTIALLY_FULFILLED'].includes(row.status)).length,
    pickQueue: pickTasks.filter((row) => ['PENDING', 'IN_PROGRESS'].includes(row.status)).length,
    returnsQc: salesReturns.filter((row) => ['SUBMITTED', 'INSPECTION_PENDING', 'PARTIALLY_PROCESSED'].includes(row.status)).length,
  }), [pickTasks, purchaseOrders, salesOrders, salesReturns]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Operational dashboard"
        title={`Welcome, ${user?.name ?? 'Warelyn user'}`}
        description={`Backend-driven operational KPIs for ${tenant?.company_name ?? 'your workspace'}. Reports stay read-only and inventory truth remains backend-controlled.`}
        actions={<><Link to="/reports"><Button variant="secondary">Open reports</Button></Link><Button variant="ghost" onClick={logout}>Logout</Button></>}
      />
      {error ? <ErrorState description={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(([key, label, description, tone, Icon, to]) => {
          const value = derivedKpis[key] ?? dashboard?.kpis?.[key] ?? 0;
          return (
            <Link className="metric-link-card" key={key} to={to}>
              <div className="metric-link-card-body">
                <div className="metric-link-card-icon">
                  <Icon size={20} />
                </div>
                <p className="metric-link-card-label">{label}</p>
                <p className="metric-link-card-value">{typeof value === 'number' && key === 'total_stock_value_cost' ? formatMoney(value) : value}</p>
                <p className="metric-link-card-copy">{description}</p>
                <span className={`metric-link-card-status ${tone}`}>
                  Open related screen
                  <ArrowRight className="ml-1" size={12} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-warelyn-text">Pending actions</h2>
            <Link className="text-sm font-semibold text-warelyn-primary" to="/reports/reorder-suggestions">View all</Link>
          </CardHeader>
          <CardBody>
            <ActionList
              emptyDescription="No operational exceptions are currently reported."
              emptyTitle="No pending actions"
              items={dashboard?.pending_actions}
              renderItem={(action) => (
                <div className="flex items-center justify-between gap-3 p-4" key={action.label}>
                  <span className="font-semibold text-warelyn-text">{action.label}</span>
                  <StatusBadge status={action.tone === 'danger' ? 'CANCELLED' : action.tone === 'warning' ? 'PENDING' : 'CONFIRMED'}>
                    {action.count}
                  </StatusBadge>
                </div>
              )}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-warelyn-text">Reconciliation health</h2>
            <Link className="text-sm font-semibold text-warelyn-primary" to="/reports/reconciliation">Open report</Link>
          </CardHeader>
          <CardBody>
            <div className="workflow-helper-panel">
              <h3>Projection versus ledger</h3>
              <p>Use the reconciliation report for backend-calculated mismatches across stock projection and ledger history.</p>
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge status={(dashboard?.kpis?.reconciliation_mismatch_count ?? 0) > 0 ? 'CANCELLED' : 'COMMITTED'}>
                  {(dashboard?.kpis?.reconciliation_mismatch_count ?? 0) > 0 ? 'Needs review' : 'Healthy'}
                </StatusBadge>
                <strong className="text-2xl font-bold text-warelyn-text">{dashboard?.kpis?.reconciliation_mismatch_count ?? 0}</strong>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableShell
          description="Recent backend-authored movement history."
          emptyDescription="Stock movements will appear after inventory activity."
          emptyTitle="No movements"
          isEmpty={!dashboard?.recent_stock_movements?.length}
          rowCount={dashboard?.recent_stock_movements?.length ?? 0}
          title="Recent stock movements"
        >
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Movement</th>
                <th>Warehouse</th>
                <th className="text-right">Qty delta</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.recent_stock_movements ?? []).map((movement) => (
                <tr key={movement.ledger_id}>
                  <td>
                    <div className="font-semibold text-warelyn-text">{movement.product_name}</div>
                    <div className="text-xs text-warelyn-muted">{movement.location_name}</div>
                  </td>
                  <td><StatusBadge status={movement.movement_type}>{movement.movement_type}</StatusBadge></td>
                  <td>{movement.warehouse_name}</td>
                  <td className="number-cell">{movement.quantity_delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-warelyn-text">Low stock list</h2>
              <Link className="text-sm font-semibold text-warelyn-primary" to="/reports/low-stock">Open report</Link>
            </CardHeader>
            <CardBody>
              <ActionList
                emptyDescription="All stocked products are above reorder thresholds."
                emptyTitle="No low stock"
                items={dashboard?.low_stock_items}
                renderItem={(item) => (
                  <div className="p-4" key={`${item.product_id}-${item.warehouse_id}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-warelyn-text">{item.product_name}</span>
                      <StatusBadge status={item.status}>{item.status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-warelyn-muted">Available {item.available}; reorder level {item.reorder_level}</p>
                  </div>
                )}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-warelyn-text">Expiring batches</h2>
              <Link className="text-sm font-semibold text-warelyn-primary" to="/reports/batch-expiry">Open report</Link>
            </CardHeader>
            <CardBody>
              <ActionList
                emptyDescription="No batches are currently expired or expiring soon."
                emptyTitle="No expiring batches"
                items={dashboard?.expiring_batches}
                renderItem={(batch) => (
                  <div className="p-4" key={batch.batch_id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-warelyn-text">{batch.batch_number}</span>
                      <StatusBadge status={batch.expiry_status}>{batch.expiry_status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-warelyn-muted">{batch.product_name}; expires {batch.expiry_date ? formatDate(batch.expiry_date) : 'not set'}</p>
                  </div>
                )}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
