import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as salesService from '../services/salesService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);

export function SalesFulfillmentDetailPage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [fulfillment, setFulfillment] = useState(null);
  const [summary, setSummary] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(`sales-fulfillment-${id}-${Date.now()}`);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const mayWrite = canWrite.has(user?.role);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      setFulfillment(await salesService.getSalesFulfillment(accessToken, id));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken, id]);

  async function commit() {
    setIsSaving(true);
    setError('');
    try {
      const result = await salesService.commitSalesFulfillment(accessToken, id, { idempotency_key: idempotencyKey });
      setSummary(result);
      setFulfillment(result.fulfillment);
    } catch (commitError) {
      setError(commitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function cancel() {
    setIsSaving(true);
    setError('');
    try {
      setFulfillment(await salesService.cancelSalesFulfillment(accessToken, id));
    } catch (cancelError) {
      setError(cancelError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (!fulfillment) return <ErrorState description={error || 'Sales fulfillment not found.'} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Badge tone="primary">Sales Fulfillment</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">{fulfillment.fulfillment_number}</h1><p className="mt-2 text-sm text-warelyn-muted">Fulfillment for <Link className="font-semibold text-warelyn-primary" to={`/sales/${fulfillment.sales_order_id}`}>sales order #{fulfillment.sales_order_id}</Link>.</p></div><Badge tone={fulfillment.status === 'COMMITTED' ? 'success' : fulfillment.status === 'CANCELLED' ? 'danger' : 'neutral'}>{fulfillment.status}</Badge></div>
      {error ? <ErrorState description={error} /> : null}
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Fulfillment lines</h2></CardHeader><CardBody><div className="overflow-hidden rounded-xl border border-warelyn-border"><table className="min-w-full divide-y divide-warelyn-border text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Warehouse</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Reservation</th><th className="px-4 py-3">Quantity</th></tr></thead><tbody className="divide-y divide-warelyn-border bg-white">{fulfillment.items.map((item) => <tr key={item.id}><td className="px-4 py-3">#{item.product_id}</td><td className="px-4 py-3">#{item.warehouse_id}</td><td className="px-4 py-3">#{item.location_id}</td><td className="px-4 py-3">#{item.reservation_id}</td><td className="px-4 py-3 font-semibold text-warelyn-text">{item.fulfilled_quantity}</td></tr>)}</tbody></table></div></CardBody></Card>
      {mayWrite && fulfillment.status === 'DRAFT' ? <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Commit fulfillment</h2></CardHeader><CardBody className="space-y-4"><p className="text-sm text-warelyn-muted">Committing converts active reservations into physical deduction through InventoryEngine.</p><Input label="Idempotency key" required value={idempotencyKey} onChange={(event) => setIdempotencyKey(event.target.value)} /><div className="flex flex-wrap gap-2"><Button disabled={isSaving} variant="accent" onClick={commit}>{isSaving ? 'Committing...' : 'Commit fulfillment'}</Button><Button disabled={isSaving} variant="danger" onClick={cancel}>Cancel fulfillment</Button></div></CardBody></Card> : null}
      {summary ? <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Stock impact after commit</h2></CardHeader><CardBody><div className="grid gap-3 md:grid-cols-2">{summary.stock_results.map((result, index) => <div className="rounded-xl border border-warelyn-border p-4" key={index}><p className="font-semibold text-warelyn-text">Product #{result.stock.product_id}</p><p className="text-sm text-warelyn-muted">On hand: {result.stock.quantity_on_hand}</p><p className="text-sm text-warelyn-muted">Reserved: {result.stock.quantity_reserved}</p><p className="text-sm text-warelyn-muted">Available: {result.stock.quantity_available}</p></div>)}</div></CardBody></Card> : null}
    </div>
  );
}
