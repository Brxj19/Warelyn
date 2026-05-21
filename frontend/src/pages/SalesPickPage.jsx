import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as fulfillmentService from '../services/fulfillmentService.js';
import * as salesService from '../services/salesService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);

export function SalesPickPage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [pickTasks, setPickTasks] = useState([]);
  const [pickNumber, setPickNumber] = useState(`PICK-${Date.now()}`);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const mayWrite = canWrite.has(user?.role);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const [orderRow, taskRows] = await Promise.all([salesService.getSalesOrder(accessToken, id), fulfillmentService.listPickTasksForOrder(accessToken, id)]);
      setOrder(orderRow);
      setPickTasks(taskRows);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken, id]);

  async function createTask(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await fulfillmentService.createPickTask(accessToken, id, { pick_number: pickNumber, notes: notes || null });
      setPickNumber(`PICK-${Date.now()}`);
      setNotes('');
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (!order) return <ErrorState description={error || 'Sales order not found.'} />;

  return (
    <div className="space-y-6">
      <div><Badge tone="primary">Sales Picking</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Pick {order.order_number}</h1><p className="mt-2 text-sm text-warelyn-muted">Generate pick work from active reservations. Package data remains optional for Phase 7.</p></div>
      {error ? <ErrorState description={error} /> : null}
      {mayWrite && ['CONFIRMED', 'PARTIALLY_FULFILLED'].includes(order.status) ? <form onSubmit={createTask}><Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Create pick task</h2></CardHeader><CardBody className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"><Input label="Pick number" required value={pickNumber} onChange={(event) => setPickNumber(event.target.value)} /><Input label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} /><div className="flex items-end"><Button disabled={isSaving} type="submit">Create task</Button></div></CardBody></Card></form> : null}
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Pick tasks for this order</h2></CardHeader><CardBody>{pickTasks.length === 0 ? <EmptyState title="No pick tasks" description="Create a pick task after confirming the order." /> : <div className="grid gap-3 md:grid-cols-2">{pickTasks.map((task) => <Link className="rounded-xl border border-warelyn-border p-4 transition hover:border-warelyn-primary" key={task.id} to={`/pick-tasks/${task.id}`}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{task.pick_number}</span><Badge tone={task.status === 'PICKED' ? 'success' : task.status === 'CANCELLED' ? 'danger' : 'neutral'}>{task.status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{task.items.length} pick line(s)</p></Link>)}</div>}</CardBody></Card>
    </div>
  );
}
