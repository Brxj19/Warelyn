import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader, MetricCard } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as reportsService from '../services/reportsService.js';

const kpiLabels = [
  ['total_products', 'Products', 'Catalog scope', 'primary'],
  ['total_stock_value_cost', 'Stock value', 'Backend valuation', 'success'],
  ['low_stock_count', 'Low stock', 'Needs attention', 'warning'],
  ['out_of_stock_count', 'Out of stock', 'Cannot allocate', 'danger'],
  ['expiring_soon_batch_count', 'Expiring soon', 'Batch watchlist', 'warning'],
  ['reconciliation_mismatch_count', 'Mismatches', 'Ledger health', 'danger'],
];

function ActionList({ emptyDescription, emptyTitle, items, renderItem }) {
  if (!items?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <div className="divide-y divide-warelyn-border overflow-hidden rounded-2xl border border-warelyn-border bg-white">{items.map(renderItem)}</div>;
}

export function DashboardPage() {
  const { accessToken, logout, tenant, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        setDashboard(await reportsService.getOperationalDashboard(accessToken));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader kicker="Operational dashboard" title={`Welcome, ${user?.name ?? 'Warelyn user'}`} description={`Backend-driven operational KPIs for ${tenant?.company_name ?? 'your workspace'}. Reports are read-only and do not mutate stock.`} actions={<><Link to="/reports"><Button variant="secondary">Open reports</Button></Link><Button variant="ghost" onClick={logout}>Logout</Button></>} />
      {error ? <ErrorState description={error} /> : null}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpiLabels.map(([key, label, description, tone]) => <MetricCard description={description} key={key} label={label} tone={tone} value={dashboard?.kpis?.[key] ?? 0} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Pending actions</h2></CardHeader><CardBody><ActionList emptyDescription="No operational exceptions are currently reported." emptyTitle="No pending actions" items={dashboard?.pending_actions} renderItem={(action) => <div className="flex items-center justify-between gap-3 p-4" key={action.label}><span className="font-semibold text-warelyn-text">{action.label}</span><Badge tone={action.tone}>{action.count}</Badge></div>} /></CardBody></Card>
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Recent stock movements</h2></CardHeader><CardBody><ActionList emptyDescription="Stock movements will appear after inventory activity." emptyTitle="No movements" items={dashboard?.recent_stock_movements} renderItem={(movement) => <div className="p-4" key={movement.ledger_id}><div className="flex items-center justify-between gap-3"><span className="font-semibold text-warelyn-text">{movement.product_name}</span><Badge tone="neutral">{movement.movement_type}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{movement.quantity_delta} at {movement.warehouse_name} / {movement.location_name}</p></div>} /></CardBody></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Low stock items</h2></CardHeader><CardBody><ActionList emptyDescription="All stocked products are above reorder thresholds." emptyTitle="No low stock" items={dashboard?.low_stock_items} renderItem={(item) => <div className="p-4" key={`${item.product_id}-${item.warehouse_id}`}><div className="flex items-center justify-between gap-3"><span className="font-semibold text-warelyn-text">{item.product_name}</span><Badge tone={item.status === 'OUT_OF_STOCK' ? 'danger' : 'warning'}>{item.status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">Available {item.available}; reorder level {item.reorder_level}</p></div>} /></CardBody></Card>
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Expiring batches</h2></CardHeader><CardBody><ActionList emptyDescription="No batches are currently expired or expiring soon." emptyTitle="No expiring batches" items={dashboard?.expiring_batches} renderItem={(batch) => <div className="p-4" key={batch.batch_id}><div className="flex items-center justify-between gap-3"><span className="font-semibold text-warelyn-text">{batch.batch_number}</span><Badge tone={batch.expiry_status === 'EXPIRED' ? 'danger' : 'warning'}>{batch.expiry_status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{batch.product_name}; expires {batch.expiry_date ?? 'not set'}</p></div>} /></CardBody></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Returns QC</h2></CardHeader><CardBody><EmptyState title="Returns QC appears in pending actions" description="Use the returns queue for item-level QC decisions and backend-controlled restock or blocked-stock outcomes." /></CardBody></Card>
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Reconciliation health</h2></CardHeader><CardBody><div className="rounded-2xl border border-warelyn-border bg-slate-50 p-5"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-warelyn-text">Ledger to projection mismatches</span><Badge tone={(dashboard?.kpis?.reconciliation_mismatch_count ?? 0) > 0 ? 'danger' : 'success'}>{dashboard?.kpis?.reconciliation_mismatch_count ?? 0}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">Open the reconciliation report for backend-calculated mismatch detail.</p></div></CardBody></Card>
      </div>
    </div>
  );
}
