import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as reportsService from '../services/reportsService.js';

const kpiLabels = [
  ['total_products', 'Products'],
  ['total_stock_value_cost', 'Stock value'],
  ['low_stock_count', 'Low stock'],
  ['out_of_stock_count', 'Out of stock'],
  ['expiring_soon_batch_count', 'Expiring soon'],
  ['reconciliation_mismatch_count', 'Mismatches'],
];

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="primary">Operational dashboard</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Welcome, {user?.name ?? 'Warelyn user'}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warelyn-muted">Backend-driven operational KPIs for {tenant?.company_name ?? 'your workspace'}. Reports are read-only and do not mutate stock.</p>
        </div>
        <div className="flex gap-2"><Link to="/reports"><Button variant="secondary">Open reports</Button></Link><Button variant="secondary" onClick={logout}>Logout</Button></div>
      </div>
      {error ? <ErrorState description={error} /> : null}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpiLabels.map(([key, label]) => <Card key={key}><CardBody><p className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">{label}</p><p className="mt-2 text-2xl font-bold text-warelyn-text">{dashboard?.kpis?.[key] ?? 0}</p></CardBody></Card>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Pending actions</h2></CardHeader><CardBody>{dashboard?.pending_actions?.length ? <div className="space-y-3">{dashboard.pending_actions.map((action) => <div className="flex items-center justify-between rounded-xl border border-warelyn-border p-4" key={action.label}><span className="font-semibold text-warelyn-text">{action.label}</span><Badge tone={action.tone}>{action.count}</Badge></div>)}</div> : <EmptyState title="No pending actions" description="No operational exceptions are currently reported." />}</CardBody></Card>
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Recent stock movements</h2></CardHeader><CardBody>{dashboard?.recent_stock_movements?.length ? <div className="space-y-3">{dashboard.recent_stock_movements.map((movement) => <div className="rounded-xl border border-warelyn-border p-4" key={movement.ledger_id}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{movement.product_name}</span><Badge tone="neutral">{movement.movement_type}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{movement.quantity_delta} at {movement.warehouse_name} / {movement.location_name}</p></div>)}</div> : <EmptyState title="No movements" description="Stock movements will appear after inventory activity." />}</CardBody></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Low stock items</h2></CardHeader><CardBody>{dashboard?.low_stock_items?.length ? <div className="space-y-3">{dashboard.low_stock_items.map((item) => <div className="rounded-xl border border-warelyn-border p-4" key={`${item.product_id}-${item.warehouse_id}`}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{item.product_name}</span><Badge tone={item.status === 'OUT_OF_STOCK' ? 'danger' : 'warning'}>{item.status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">Available {item.available}; reorder level {item.reorder_level}</p></div>)}</div> : <EmptyState title="No low stock" description="All stocked products are above reorder thresholds." />}</CardBody></Card>
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Expiring batches</h2></CardHeader><CardBody>{dashboard?.expiring_batches?.length ? <div className="space-y-3">{dashboard.expiring_batches.map((batch) => <div className="rounded-xl border border-warelyn-border p-4" key={batch.batch_id}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{batch.batch_number}</span><Badge tone={batch.expiry_status === 'EXPIRED' ? 'danger' : 'warning'}>{batch.expiry_status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{batch.product_name}; expires {batch.expiry_date ?? 'not set'}</p></div>)}</div> : <EmptyState title="No expiring batches" description="No batches are currently expired or expiring soon." />}</CardBody></Card>
      </div>
    </div>
  );
}
