import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { WorkflowProgress } from '../components/ui/WorkflowProgress.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as catalogService from '../services/catalogService.js';
import * as returnsService from '../services/returnsService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);
const canQC = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER']);
const statusTone = { DRAFT: 'neutral', SUBMITTED: 'primary', INSPECTION_PENDING: 'warning', PROCESSED: 'success', CANCELLED: 'danger' };
const returnSteps = [{ key: 'DRAFT', label: 'Draft' }, { key: 'SUBMITTED', label: 'Submitted' }, { key: 'INSPECTION_PENDING', label: 'Inspection' }, { key: 'PROCESSED', label: 'Processed' }];
const qcTone = { ACCEPTED_RESTOCK: 'success', ACCEPTED_BLOCKED: 'warning', DAMAGED: 'danger', SCRAPPED: 'danger', REJECTED: 'neutral', PENDING: 'neutral' };

export function SalesReturnDetailPage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [salesReturn, setSalesReturn] = useState(null);
  const [productsById, setProductsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const [row, products] = await Promise.all([returnsService.getSalesReturn(accessToken, id), catalogService.listProducts(accessToken)]);
      setSalesReturn(row);
      setProductsById(Object.fromEntries(products.map((product) => [product.id, product])));
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
      await action(accessToken, id);
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (!salesReturn) return <ErrorState description={error || 'Sales return not found.'} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><Badge tone="primary">Sales return</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">{salesReturn.return_number}</h1><p className="mt-2 text-sm text-warelyn-muted">Return for sales order #{salesReturn.sales_order_id}. QC outcome decides stock handling.</p></div>
        <div className="flex flex-wrap gap-2"><Badge tone={statusTone[salesReturn.status] ?? 'neutral'}>{salesReturn.status}</Badge>{canWrite.has(user?.role) && salesReturn.status === 'DRAFT' ? <Button disabled={isSaving} onClick={() => run(returnsService.submitSalesReturn)}>Submit</Button> : null}{canWrite.has(user?.role) && ['DRAFT', 'SUBMITTED', 'INSPECTION_PENDING'].includes(salesReturn.status) ? <Button disabled={isSaving} variant="danger" onClick={() => run(returnsService.cancelSalesReturn)}>Cancel</Button> : null}{canQC.has(user?.role) && ['SUBMITTED', 'INSPECTION_PENDING'].includes(salesReturn.status) ? <Link to={`/returns/${salesReturn.id}/inspect`}><Button variant="accent">Inspect / process</Button></Link> : null}</div>
      </div>
      {error ? <ErrorState description={error} /> : null}
      <WorkflowProgress current={salesReturn.status} steps={returnSteps} />
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Return items</h2></CardHeader><CardBody><div className="overflow-hidden rounded-xl border border-warelyn-border"><table className="min-w-full divide-y divide-warelyn-border text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Returned</th><th className="px-4 py-3">Accepted</th><th className="px-4 py-3">Rejected</th><th className="px-4 py-3">QC</th><th className="px-4 py-3">Tracking</th></tr></thead><tbody className="divide-y divide-warelyn-border bg-white">{salesReturn.items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-semibold text-warelyn-text">{productsById[item.product_id]?.name ?? `#${item.product_id}`}</td><td className="px-4 py-3">{item.returned_quantity}</td><td className="px-4 py-3">{item.accepted_quantity}</td><td className="px-4 py-3">{item.rejected_quantity}</td><td className="px-4 py-3"><Badge tone={qcTone[item.qc_status] ?? 'neutral'}>{item.qc_status}</Badge></td><td className="px-4 py-3 text-warelyn-muted">Batch {item.batch_id ?? '-'} / Serial {item.serial_id ?? '-'}</td></tr>)}</tbody></table></div></CardBody></Card>
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Blocked return stock</h2></CardHeader><CardBody>{salesReturn.blocked_stock.length === 0 ? <EmptyState title="No blocked stock" description="Rejected returns and sellable restocks do not create blocked stock records." /> : <div className="grid gap-3 md:grid-cols-2">{salesReturn.blocked_stock.map((row) => <div className="rounded-xl border border-warelyn-border p-4" key={row.id}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{productsById[row.product_id]?.name ?? `#${row.product_id}`}</span><Badge tone={row.status === 'QC_HOLD' || row.status === 'QUARANTINE' ? 'warning' : 'danger'}>{row.status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">Quantity {row.quantity}. Non-sellable and excluded from warehouse stock availability.</p></div>)}</div>}</CardBody></Card>
    </div>
  );
}
