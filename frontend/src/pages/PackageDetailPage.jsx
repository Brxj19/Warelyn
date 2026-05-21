import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as fulfillmentService from '../services/fulfillmentService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);

export function PackageDetailPage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [pkg, setPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const mayWrite = canWrite.has(user?.role);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      setPackage(await fulfillmentService.getPackage(accessToken, id));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken, id]);

  async function run(action) {
    setIsSaving(true);
    setError('');
    try {
      await action();
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (!pkg) return <ErrorState description={error || 'Package not found.'} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Badge tone="primary">Package</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">{pkg.package_number}</h1><p className="mt-2 text-sm text-warelyn-muted">Sales order <Link className="text-warelyn-primary" to={`/sales/${pkg.sales_order_id}`}>#{pkg.sales_order_id}</Link>. Packing does not create ledger entries.</p></div><div className="flex flex-wrap gap-2"><Badge tone={pkg.status === 'PACKED' ? 'success' : pkg.status === 'CANCELLED' ? 'danger' : 'neutral'}>{pkg.status}</Badge>{mayWrite && pkg.status === 'DRAFT' ? <Button disabled={isSaving} onClick={() => run(() => fulfillmentService.packPackage(accessToken, id))}>Pack</Button> : null}{mayWrite && pkg.status === 'DRAFT' ? <Button disabled={isSaving} variant="danger" onClick={() => run(() => fulfillmentService.cancelPackage(accessToken, id))}>Cancel</Button> : null}</div></div>
      {error ? <ErrorState description={error} /> : null}
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Package items</h2></CardHeader><CardBody><div className="overflow-hidden rounded-xl border border-warelyn-border"><table className="min-w-full divide-y divide-warelyn-border text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted"><tr><th className="px-4 py-3">Pick item</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Batch</th><th className="px-4 py-3">Serial</th><th className="px-4 py-3">Quantity</th></tr></thead><tbody className="divide-y divide-warelyn-border bg-white">{pkg.items.map((item) => <tr key={item.id}><td className="px-4 py-3">#{item.pick_task_item_id}</td><td className="px-4 py-3">#{item.product_id}</td><td className="px-4 py-3">{item.batch_id ?? '-'}</td><td className="px-4 py-3">{item.serial_id ?? '-'}</td><td className="px-4 py-3 font-semibold">{item.quantity}</td></tr>)}</tbody></table></div></CardBody></Card>
    </div>
  );
}
