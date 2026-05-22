import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { WorkflowProgress } from '../components/ui/WorkflowProgress.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as catalogService from '../services/catalogService.js';
import * as fulfillmentService from '../services/fulfillmentService.js';
import * as inventoryService from '../services/inventoryService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);
const statusTone = { PENDING: 'warning', IN_PROGRESS: 'primary', PICKED: 'success', CANCELLED: 'danger' };
const pickSteps = [{ key: 'PENDING', label: 'Pending' }, { key: 'IN_PROGRESS', label: 'In progress' }, { key: 'PICKED', label: 'Picked' }];

export function PickTaskDetailPage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [task, setTask] = useState(null);
  const [productsById, setProductsById] = useState({});
  const [serials, setSerials] = useState([]);
  const [batches, setBatches] = useState([]);
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const mayWrite = canWrite.has(user?.role);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const [taskRow, products, serialRows, batchRows] = await Promise.all([fulfillmentService.getPickTask(accessToken, id), catalogService.listProducts(accessToken), inventoryService.listInventorySerials(accessToken), inventoryService.listInventoryBatches(accessToken)]);
      setTask(taskRow);
      setProductsById(Object.fromEntries(products.map((product) => [product.id, product])));
      setSerials(serialRows);
      setBatches(batchRows);
      setLines(taskRow.items.map((item) => ({ pick_task_item_id: item.id, picked_quantity: item.picked_quantity === '0.000' ? item.required_quantity : item.picked_quantity, batch_id: item.batch_id ?? '', serial_id: item.serial_id ?? '' })));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken, id]);

  function updateLine(index, key, value) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)));
  }

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

  async function submitPick() {
    await run(() => fulfillmentService.pickPickTask(accessToken, id, { items: lines.map((line) => ({ pick_task_item_id: Number(line.pick_task_item_id), picked_quantity: line.picked_quantity, batch_id: line.batch_id ? Number(line.batch_id) : null, serial_id: line.serial_id ? Number(line.serial_id) : null })) }));
  }

  if (isLoading) return <LoadingState />;
  if (!task) return <ErrorState description={error || 'Pick task not found.'} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Badge tone="primary">Pick Task</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">{task.pick_number}</h1><p className="mt-2 text-sm text-warelyn-muted">Sales order <Link className="text-warelyn-primary" to={`/sales/${task.sales_order_id}`}>#{task.sales_order_id}</Link>. Picking records allocation only; it does not mutate stock.</p></div><div className="flex flex-wrap gap-2"><Badge tone={statusTone[task.status] ?? 'neutral'}>{task.status}</Badge>{mayWrite && task.status === 'PENDING' ? <Button disabled={isSaving} onClick={() => run(() => fulfillmentService.startPickTask(accessToken, id))}>Start</Button> : null}{mayWrite && ['PENDING', 'IN_PROGRESS'].includes(task.status) ? <Button disabled={isSaving} variant="danger" onClick={() => run(() => fulfillmentService.cancelPickTask(accessToken, id))}>Cancel</Button> : null}</div></div>
      {error ? <ErrorState description={error} /> : null}
      <WorkflowProgress current={task.status} steps={pickSteps} />
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Pick lines</h2></CardHeader><CardBody className="space-y-4">{task.items.map((item, index) => { const product = productsById[item.product_id]; const availableSerials = serials.filter((serial) => serial.product_id === item.product_id && serial.warehouse_id === item.warehouse_id && serial.location_id === item.location_id && serial.status === 'IN_STOCK'); const availableBatches = batches.filter((batch) => batch.product_id === item.product_id && batch.warehouse_id === item.warehouse_id && batch.location_id === item.location_id && batch.status === 'ACTIVE'); return <div className="grid gap-3 rounded-xl border border-warelyn-border p-4 lg:grid-cols-5" key={item.id}><div><span className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">Product</span><p className="mt-2 font-semibold text-warelyn-text">{product?.name ?? `#${item.product_id}`}</p><p className="text-xs text-warelyn-muted">Reservation #{item.reservation_id}</p></div><Input label="Picked quantity" min="0" step="0.001" type="number" value={lines[index]?.picked_quantity ?? ''} onChange={(event) => updateLine(index, 'picked_quantity', event.target.value)} /><label className="block"><span className="mb-2 block text-sm font-medium text-warelyn-text">Serial</span><select className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm" value={lines[index]?.serial_id ?? ''} onChange={(event) => updateLine(index, 'serial_id', event.target.value)}><option value="">{product?.track_serial ? 'Select serial' : 'Not serial-tracked'}</option>{availableSerials.map((serial) => <option key={serial.id} value={serial.id}>{serial.serial_number}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-medium text-warelyn-text">Batch</span><select className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm" value={lines[index]?.batch_id ?? ''} onChange={(event) => updateLine(index, 'batch_id', event.target.value)}><option value="">Optional</option>{availableBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_number}{batch.expiry_date ? ` exp ${batch.expiry_date}` : ''}</option>)}</select></label><div><span className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">Required</span><p className="mt-2 font-semibold text-warelyn-text">{item.required_quantity}</p><Badge tone={item.status === 'PICKED' ? 'success' : 'neutral'}>{item.status}</Badge></div></div>; })}{mayWrite && ['PENDING', 'IN_PROGRESS'].includes(task.status) ? <div className="flex justify-end"><Button disabled={isSaving} onClick={submitPick}>{isSaving ? 'Saving...' : 'Save picked allocation'}</Button></div> : null}</CardBody></Card>
    </div>
  );
}
