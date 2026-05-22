import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as fulfillmentService from '../services/fulfillmentService.js';

const statusTone = { PENDING: 'warning', IN_PROGRESS: 'primary', PICKED: 'success', CANCELLED: 'danger' };

export function PickTasksPage() {
  const { accessToken } = useAuth();
  const [pickTasks, setPickTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        setPickTasks(await fulfillmentService.listPickTasks(accessToken));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (isLoading) return <LoadingState variant="table" />;

  return (
    <div className="space-y-6">
      <div><Badge tone="primary">Picking</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Pick tasks</h1><p className="mt-2 text-sm text-warelyn-muted">Pick tasks allocate reserved stock for fulfillment without deducting or releasing stock.</p></div>
      {error ? <ErrorState description={error} /> : null}
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Warehouse work queue</h2></CardHeader><CardBody>{pickTasks.length === 0 ? <EmptyState title="No pick tasks" description="Create pick tasks from confirmed sales orders." /> : <div className="overflow-hidden rounded-xl border border-warelyn-border"><table className="min-w-full divide-y divide-warelyn-border text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted"><tr><th className="px-4 py-3">Pick task</th><th className="px-4 py-3">Sales order</th><th className="px-4 py-3">Lines</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-warelyn-border bg-white">{pickTasks.map((task) => <tr key={task.id}><td className="px-4 py-3 font-semibold text-warelyn-primary"><Link to={`/pick-tasks/${task.id}`}>{task.pick_number}</Link></td><td className="px-4 py-3"><Link className="text-warelyn-primary" to={`/sales/${task.sales_order_id}`}>#{task.sales_order_id}</Link></td><td className="px-4 py-3">{task.items.length}</td><td className="px-4 py-3"><Badge tone={statusTone[task.status] ?? 'neutral'}>{task.status}</Badge></td></tr>)}</tbody></table></div>}</CardBody></Card>
    </div>
  );
}
