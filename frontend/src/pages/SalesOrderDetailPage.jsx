import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ConfirmationModal } from '../components/ui/ConfirmationModal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as catalogService from '../services/catalogService.js';
import * as fulfillmentService from '../services/fulfillmentService.js';
import * as salesService from '../services/salesService.js';
import * as warehouseService from '../services/warehouseService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);
const fulfillableStatuses = new Set(['CONFIRMED', 'PARTIALLY_FULFILLED']);
const statusTone = { DRAFT: 'neutral', CONFIRMED: 'primary', PARTIALLY_FULFILLED: 'warning', FULFILLED: 'success', CANCELLED: 'danger', CLOSED: 'neutral' };
const selectClass = 'block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10';

export function SalesOrderDetailPage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [fulfillments, setFulfillments] = useState([]);
  const [pickTasks, setPickTasks] = useState([]);
  const [packages, setPackages] = useState([]);
  const [productsById, setProductsById] = useState({});
  const [warehouses, setWarehouses] = useState([]);
  const [locationsByWarehouse, setLocationsByWarehouse] = useState({});
  const [allocations, setAllocations] = useState([]);
  const [idempotencyKey, setIdempotencyKey] = useState(`sales-confirm-${id}-${Date.now()}`);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const mayWrite = canWrite.has(user?.role);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const [orderRow, fulfillmentRows, pickRows, packageRows, productRows, warehouseRows] = await Promise.all([
        salesService.getSalesOrder(accessToken, id),
        salesService.listSalesFulfillments(accessToken, id),
        fulfillmentService.listPickTasksForOrder(accessToken, id),
        fulfillmentService.listPackagesForOrder(accessToken, id),
        catalogService.listProducts(accessToken),
        warehouseService.listWarehouses(accessToken),
      ]);
      const locationPairs = await Promise.all(warehouseRows.map(async (warehouse) => [warehouse.id, await warehouseService.listWarehouseLocations(accessToken, warehouse.id)]));
      const locationMap = Object.fromEntries(locationPairs);
      const defaultWarehouse = warehouseRows[0]?.id ? String(warehouseRows[0].id) : '';
      const defaultLocation = defaultWarehouse && locationMap[defaultWarehouse]?.[0]?.id ? String(locationMap[defaultWarehouse][0].id) : '';
      setOrder(orderRow);
      setFulfillments(fulfillmentRows);
      setPickTasks(pickRows);
      setPackages(packageRows);
      setProductsById(Object.fromEntries(productRows.map((product) => [product.id, product])));
      setWarehouses(warehouseRows);
      setLocationsByWarehouse(locationMap);
      setAllocations(orderRow.items.map((item) => ({ sales_order_item_id: item.id, warehouse_id: defaultWarehouse, location_id: defaultLocation, quantity: item.ordered_quantity })));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken, id]);

  function updateAllocation(index, key, value) {
    setAllocations((current) => current.map((allocation, allocationIndex) => {
      if (allocationIndex !== index) return allocation;
      if (key === 'warehouse_id') {
        const firstLocation = locationsByWarehouse[value]?.[0]?.id ?? '';
        return { ...allocation, warehouse_id: value, location_id: firstLocation ? String(firstLocation) : '' };
      }
      return { ...allocation, [key]: value };
    }));
  }

  async function confirm() {
    setIsSaving(true);
    setError('');
    try {
      const result = await salesService.confirmSalesOrder(accessToken, id, { idempotency_key: idempotencyKey, allocations: allocations.map((allocation) => ({ ...allocation, warehouse_id: Number(allocation.warehouse_id), location_id: Number(allocation.location_id), sales_order_item_id: Number(allocation.sales_order_item_id) })) });
      setSummary(result);
      await load();
    } catch (confirmError) {
      setError(confirmError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function runAction(action) {
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
  if (!order) return <ErrorState description={error || 'Sales order not found.'} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><Badge tone="primary">Sales Order</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">{order.order_number}</h1><p className="mt-2 text-sm text-warelyn-muted">Order date {order.order_date}. Confirmation reserves stock; picking allocates serials and batches; fulfillment deducts reserved stock.</p></div>
        <div className="flex flex-wrap gap-2"><Badge tone={statusTone[order.status] ?? 'neutral'}>{order.status}</Badge>{mayWrite && order.status === 'DRAFT' ? <Button disabled={isSaving} onClick={() => setPendingAction({ description: 'Confirming reserves backend stock using the allocation lines below. No frontend stock calculation is used.', label: 'Confirm order', run: confirm, variant: 'primary' })}>Confirm</Button> : null}{mayWrite && ['DRAFT', 'CONFIRMED', 'PARTIALLY_FULFILLED'].includes(order.status) ? <Button disabled={isSaving} variant="danger" onClick={() => setPendingAction({ description: 'Cancel this sales order and let the backend release any active reservations.', label: 'Cancel order', run: () => runAction(salesService.cancelSalesOrder), variant: 'danger' })}>Cancel</Button> : null}{mayWrite && fulfillableStatuses.has(order.status) ? <Button disabled={isSaving} variant="secondary" onClick={() => setPendingAction({ description: 'Close this sales order to stop further workflow activity.', label: 'Close order', run: () => runAction(salesService.closeSalesOrder), variant: 'secondary' })}>Close</Button> : null}{fulfillableStatuses.has(order.status) ? <Link to={`/sales/${order.id}/pick`}><Button variant="secondary">Pick order</Button></Link> : null}{fulfillableStatuses.has(order.status) ? <Link to={`/sales/${order.id}/package`}><Button variant="secondary">Packages</Button></Link> : null}{mayWrite && fulfillableStatuses.has(order.status) ? <Link to={`/sales/${order.id}/fulfill`}><Button variant="accent">Fulfill</Button></Link> : null}{mayWrite && ['PARTIALLY_FULFILLED', 'FULFILLED', 'CLOSED'].includes(order.status) ? <Link to={`/returns/new?sales_order_id=${order.id}`}><Button variant="secondary">Create return</Button></Link> : null}</div>
      </div>
      {error ? <ErrorState description={error} /> : null}

      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Ordered, reserved, fulfilled</h2></CardHeader><CardBody><div className="overflow-hidden rounded-xl border border-warelyn-border"><table className="min-w-full divide-y divide-warelyn-border text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Ordered</th><th className="px-4 py-3">Reserved</th><th className="px-4 py-3">Fulfilled</th><th className="px-4 py-3">Remaining</th></tr></thead><tbody className="divide-y divide-warelyn-border bg-white">{order.items.map((item) => <tr key={item.id}><td className="px-4 py-3">{productsById[item.product_id]?.name ?? `#${item.product_id}`}{productsById[item.product_id]?.track_serial ? <span className="ml-2 text-xs font-semibold text-warelyn-primary">Serial pick required</span> : null}</td><td className="px-4 py-3">{item.ordered_quantity}</td><td className="px-4 py-3">{item.reserved_quantity}</td><td className="px-4 py-3">{item.fulfilled_quantity}</td><td className="px-4 py-3 font-semibold text-warelyn-text">{(Number(item.ordered_quantity) - Number(item.fulfilled_quantity)).toFixed(3)}</td></tr>)}</tbody></table></div></CardBody></Card>

      {mayWrite && order.status === 'DRAFT' ? <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Location allocation</h2></CardHeader><CardBody className="space-y-4"><Input label="Idempotency key" required value={idempotencyKey} onChange={(event) => setIdempotencyKey(event.target.value)} />{allocations.map((allocation, index) => <div className="grid gap-3 rounded-xl border border-warelyn-border p-4 md:grid-cols-4" key={allocation.sales_order_item_id}><div><span className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">Product</span><p className="mt-2 font-semibold text-warelyn-text">{productsById[order.items[index]?.product_id]?.name ?? `#${order.items[index]?.product_id}`}</p></div><Input label="Quantity" min="0.001" required step="0.001" type="number" value={allocation.quantity} onChange={(event) => updateAllocation(index, 'quantity', event.target.value)} /><label className="block"><span className="mb-2 block text-sm font-medium text-warelyn-text">Warehouse</span><select className={selectClass} required value={allocation.warehouse_id} onChange={(event) => updateAllocation(index, 'warehouse_id', event.target.value)}><option value="">Select warehouse</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-medium text-warelyn-text">Location</span><select className={selectClass} required value={allocation.location_id} onChange={(event) => updateAllocation(index, 'location_id', event.target.value)}><option value="">Select location</option>{(locationsByWarehouse[allocation.warehouse_id] ?? []).map((location) => <option key={location.id} value={location.id}>{location.name} ({location.location_type})</option>)}</select></label></div>)}<p className="text-sm text-warelyn-muted">Use one-unit allocation lines for serial-tracked products. FEFO and batch auto-allocation remain future work.</p><Button disabled={isSaving} onClick={confirm}>Confirm and reserve</Button></CardBody></Card> : null}

      {summary?.stock_results?.length ? <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Reservation result</h2></CardHeader><CardBody><div className="grid gap-3 md:grid-cols-2">{summary.stock_results.map((result, index) => <div className="rounded-xl border border-warelyn-border p-4" key={index}><p className="font-semibold text-warelyn-text">Reservation #{result.reservation?.id}</p><p className="text-sm text-warelyn-muted">Product #{result.stock.product_id}: reserved {result.stock.quantity_reserved}, available {result.stock.quantity_available}</p></div>)}</div></CardBody></Card> : null}

      <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Pick tasks</h2></CardHeader><CardBody>{pickTasks.length === 0 ? <EmptyState title="No pick tasks" description="Create a pick task from this confirmed order." /> : <div className="space-y-3">{pickTasks.map((task) => <Link className="block rounded-xl border border-warelyn-border p-4 transition hover:border-warelyn-primary" key={task.id} to={`/pick-tasks/${task.id}`}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{task.pick_number}</span><Badge tone={task.status === 'PICKED' ? 'success' : task.status === 'CANCELLED' ? 'danger' : 'neutral'}>{task.status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{task.items.length} line(s)</p></Link>)}</div>}</CardBody></Card><Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Packages</h2></CardHeader><CardBody>{packages.length === 0 ? <EmptyState title="No packages" description="Package data is optional in Phase 7." /> : <div className="space-y-3">{packages.map((pkg) => <Link className="block rounded-xl border border-warelyn-border p-4 transition hover:border-warelyn-primary" key={pkg.id} to={`/packages/${pkg.id}`}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{pkg.package_number}</span><Badge tone={pkg.status === 'PACKED' ? 'success' : pkg.status === 'CANCELLED' ? 'danger' : 'neutral'}>{pkg.status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{pkg.items.length} item(s)</p></Link>)}</div>}</CardBody></Card></div>

      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Fulfillments</h2></CardHeader><CardBody>{fulfillments.length === 0 ? <EmptyState title="No fulfillments" description="Create a fulfillment after stock is reserved." /> : <div className="grid gap-3 md:grid-cols-2">{fulfillments.map((fulfillment) => <Link className="rounded-xl border border-warelyn-border p-4 transition hover:border-warelyn-primary" key={fulfillment.id} to={`/sales-fulfillments/${fulfillment.id}`}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{fulfillment.fulfillment_number}</span><Badge tone={fulfillment.status === 'COMMITTED' ? 'success' : fulfillment.status === 'CANCELLED' ? 'danger' : 'neutral'}>{fulfillment.status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{fulfillment.items.length} line(s)</p></Link>)}</div>}</CardBody></Card>
      <ConfirmationModal confirmLabel={pendingAction?.label} description={pendingAction?.description} isLoading={isSaving} onCancel={() => setPendingAction(null)} onConfirm={async () => { await pendingAction?.run(); setPendingAction(null); }} open={Boolean(pendingAction)} title="Confirm sales workflow action" variant={pendingAction?.variant} />
    </div>
  );
}
