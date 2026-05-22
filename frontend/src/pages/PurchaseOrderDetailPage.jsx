import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ConfirmationModal } from '../components/ui/ConfirmationModal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { WorkflowProgress } from '../components/ui/WorkflowProgress.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as purchasingService from '../services/purchasingService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF']);
const receivableStatuses = new Set(['SUBMITTED', 'PARTIALLY_RECEIVED']);
const statusTone = { DRAFT: 'neutral', SUBMITTED: 'primary', PARTIALLY_RECEIVED: 'warning', RECEIVED: 'success', CANCELLED: 'danger', CLOSED: 'neutral' };
const purchaseSteps = [{ key: 'DRAFT', label: 'Draft' }, { key: 'SUBMITTED', label: 'Submitted' }, { key: 'PARTIALLY_RECEIVED', label: 'Receiving' }, { key: 'RECEIVED', label: 'Received / Closed', matches: ['RECEIVED', 'CLOSED'] }];

export function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const mayWrite = canWrite.has(user?.role);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const [orderRow, receiptRows] = await Promise.all([purchasingService.getPurchaseOrder(accessToken, id), purchasingService.listPurchaseReceipts(accessToken, id)]);
      setOrder(orderRow);
      setReceipts(receiptRows);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken, id]);

  async function runAction(action = pendingAction?.action) {
    if (!action) return;
    setIsSaving(true);
    setError('');
    try {
      await action(accessToken, id);
      setPendingAction(null);
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (!order) return <ErrorState description={error || 'Purchase order not found.'} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="primary">Purchase Order</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">{order.po_number}</h1>
          <p className="mt-2 text-sm text-warelyn-muted">Order date {order.order_date}. Stock changes only through committed purchase receipts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone[order.status] ?? 'neutral'}>{order.status}</Badge>
          {mayWrite && order.status === 'DRAFT' ? <Button disabled={isSaving} onClick={() => setPendingAction({ action: purchasingService.submitPurchaseOrder, description: 'Submit this purchase order for receiving. Stock will not change until a receipt is committed.', label: 'Submit order', variant: 'primary' })}>Submit</Button> : null}
          {mayWrite && ['DRAFT', 'SUBMITTED'].includes(order.status) ? <Button disabled={isSaving} variant="danger" onClick={() => setPendingAction({ action: purchasingService.cancelPurchaseOrder, description: 'Cancel this purchase order. Existing committed receipts are not reversed by this action.', label: 'Cancel order', variant: 'danger' })}>Cancel</Button> : null}
          {mayWrite && ['SUBMITTED', 'PARTIALLY_RECEIVED'].includes(order.status) ? <Button disabled={isSaving} variant="secondary" onClick={() => setPendingAction({ action: purchasingService.closePurchaseOrder, description: 'Close this purchase order to stop further receiving against it.', label: 'Close order', variant: 'secondary' })}>Close</Button> : null}
          {mayWrite && receivableStatuses.has(order.status) ? <Link to={`/purchases/${order.id}/receive`}><Button variant="accent">Receive</Button></Link> : null}
        </div>
      </div>
      {error ? <ErrorState description={error} /> : null}
      <WorkflowProgress current={order.status} steps={purchaseSteps} />
      <Card>
        <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Ordered vs received</h2></CardHeader>
        <CardBody>
          <div className="overflow-hidden rounded-xl border border-warelyn-border">
            <table className="min-w-full divide-y divide-warelyn-border text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted"><tr><th className="px-4 py-3">Product ID</th><th className="px-4 py-3">Ordered</th><th className="px-4 py-3">Received</th><th className="px-4 py-3">Remaining</th><th className="px-4 py-3">Unit Cost</th></tr></thead>
              <tbody className="divide-y divide-warelyn-border bg-white">
                {order.items.map((item) => {
                  const remaining = Number(item.ordered_quantity) - Number(item.received_quantity);
                  return <tr key={item.id}><td className="px-4 py-3">#{item.product_id}</td><td className="px-4 py-3">{item.ordered_quantity}</td><td className="px-4 py-3">{item.received_quantity}</td><td className="px-4 py-3 font-semibold text-warelyn-text">{remaining.toFixed(3)}</td><td className="px-4 py-3">{item.unit_cost}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Receipts</h2></CardHeader>
        <CardBody>
          {receipts.length === 0 ? <EmptyState title="No receipts" description="Create a receipt when goods arrive." /> : (
            <div className="grid gap-3 md:grid-cols-2">
              {receipts.map((receipt) => <Link className="rounded-xl border border-warelyn-border p-4 transition hover:border-warelyn-primary" key={receipt.id} to={`/purchase-receipts/${receipt.id}`}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{receipt.receipt_number}</span><Badge tone={receipt.status === 'COMMITTED' ? 'success' : receipt.status === 'CANCELLED' ? 'danger' : 'neutral'}>{receipt.status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{receipt.items.length} line(s)</p></Link>)}
            </div>
          )}
        </CardBody>
      </Card>
      <ConfirmationModal confirmLabel={pendingAction?.label} description={pendingAction?.description} isLoading={isSaving} onCancel={() => setPendingAction(null)} onConfirm={() => runAction()} open={Boolean(pendingAction)} title="Confirm purchase workflow action" variant={pendingAction?.variant} />
    </div>
  );
}
