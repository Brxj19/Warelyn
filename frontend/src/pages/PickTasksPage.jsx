import { Eye, PlayCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ActionMenu } from '../components/ui/ActionMenu.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { ScreenToolbar } from '../components/ui/ScreenToolbar.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { TableShell } from '../components/ui/TableShell.jsx';
import { formatDate } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as fulfillmentService from '../services/fulfillmentService.js';

const statusTabs = ['ALL', 'PENDING', 'IN_PROGRESS', 'PICKED', 'CANCELLED'];

export function PickTasksPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [pickTasks, setPickTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

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

  const filteredTasks = useMemo(() => {
    return pickTasks.filter((task) => {
      if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
      if (!search) return true;
      return `${task.pick_number} ${task.sales_order_id} ${task.status}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [pickTasks, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Picking" title="Pick tasks" description="Review the pick queue only. Task creation still begins from a specific confirmed sales order." />
      <TableShell
        description={`${filteredTasks.length} task(s) in this view`}
        emptyDescription="Create pick tasks from confirmed sales orders."
        emptyTitle="No pick tasks"
        error={error}
        isEmpty={filteredTasks.length === 0}
        isLoading={isLoading}
        rowCount={filteredTasks.length}
        title="Warehouse work queue"
        toolbar={
          <ScreenToolbar
            onReset={() => {
              setSearch('');
              setStatusFilter('ALL');
            }}
            onSearchChange={setSearch}
            searchPlaceholder="Search pick task or sales order"
            searchValue={search}
            tabs={statusTabs.map((status) => ({
              key: status,
              label: status === 'ALL' ? 'All' : status.replaceAll('_', ' '),
              active: statusFilter === status,
              count: status === 'ALL' ? pickTasks.length : pickTasks.filter((row) => row.status === status).length,
              onClick: () => setStatusFilter(status),
            }))}
          />
        }
      >
        <table>
          <thead>
            <tr>
              <th>Pick task</th>
              <th>Sales order</th>
              <th>Status</th>
              <th className="text-right">Items</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td><Link className="font-semibold text-warelyn-primary" to={`/pick-tasks/${task.id}`}>{task.pick_number}</Link></td>
                <td><Link className="text-warelyn-primary" to={`/sales/${task.sales_order_id}`}>#{task.sales_order_id}</Link></td>
                <td><StatusBadge status={task.status}>{task.status}</StatusBadge></td>
                <td className="number-cell">{task.items.length}</td>
                <td>{task.created_at ? formatDate(task.created_at) : '-'}</td>
                <td className="text-right">
                  <ActionMenu items={[
                    { label: 'View', icon: Eye, onClick: () => navigate(`/pick-tasks/${task.id}`) },
                    ...(task.status === 'PENDING' ? [{ label: 'Open picking', icon: PlayCircle, onClick: () => navigate(`/pick-tasks/${task.id}`) }] : []),
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
