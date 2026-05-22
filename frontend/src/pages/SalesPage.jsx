import { Eye, PackageCheck, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ActionMenu } from '../components/ui/ActionMenu.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { ScreenToolbar } from '../components/ui/ScreenToolbar.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { TableShell } from '../components/ui/TableShell.jsx';
import { formatDate } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as catalogService from '../services/catalogService.js';
import * as salesService from '../services/salesService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);
const statusTabs = ['ALL', 'DRAFT', 'CONFIRMED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'CLOSED'];

export function SalesPage() {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [customersById, setCustomersById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const mayWrite = canWrite.has(user?.role);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const [orderRows, customerRows] = await Promise.all([salesService.listSalesOrders(accessToken), catalogService.listCustomers(accessToken)]);
        setOrders(orderRows);
        setCustomersById(Object.fromEntries(customerRows.map((row) => [row.id, row])));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
      if (!search) return true;
      const value = search.toLowerCase();
      const customerName = customersById[order.customer_id]?.name ?? '';
      return `${order.order_number} ${customerName} ${order.status}`.toLowerCase().includes(value);
    });
  }, [customersById, orders, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Sales" title="Sales orders" description="Review sales order records only. Confirmation, picking, packing, fulfillment, and returns each stay on focused workflow pages." actions={mayWrite ? <Link to="/sales/new"><Button><Plus size={16} />Sales Order</Button></Link> : null} />
      <TableShell
        description={`${filteredOrders.length} sales order(s) in view`}
        emptyAction={mayWrite ? <Link to="/sales/new"><Button>Create sales order</Button></Link> : null}
        emptyDescription="Create a sales order when a customer is ready to buy."
        emptyTitle="No sales orders yet"
        error={error}
        isEmpty={filteredOrders.length === 0}
        isLoading={isLoading}
        rowCount={filteredOrders.length}
        title="Orders"
        toolbar={
          <ScreenToolbar
            onReset={() => {
              setSearch('');
              setStatusFilter('ALL');
            }}
            onSearchChange={setSearch}
            searchPlaceholder="Search order number or customer"
            searchValue={search}
            tabs={statusTabs.map((status) => ({
              key: status,
              label: status === 'ALL' ? 'All' : status.replaceAll('_', ' '),
              active: statusFilter === status,
              count: status === 'ALL' ? orders.length : orders.filter((row) => row.status === status).length,
              onClick: () => setStatusFilter(status),
            }))}
          />
        }
      >
        <table>
          <thead>
            <tr>
              <th>SO number</th>
              <th>Customer</th>
              <th>Status</th>
              <th className="text-right">Lines</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td><Link className="font-semibold text-warelyn-primary" to={`/sales/${order.id}`}>{order.order_number}</Link></td>
                <td>{customersById[order.customer_id]?.name ?? `Customer #${order.customer_id}`}</td>
                <td><StatusBadge status={order.status}>{order.status}</StatusBadge></td>
                <td className="number-cell">{order.items.length}</td>
                <td>{formatDate(order.order_date)}</td>
                <td className="text-right">
                  <ActionMenu items={[
                    { label: 'View', icon: Eye, onClick: () => navigate(`/sales/${order.id}`) },
                    ...(mayWrite && ['CONFIRMED', 'PARTIALLY_FULFILLED'].includes(order.status) ? [{ label: 'Pick workflow', icon: PackageCheck, onClick: () => navigate(`/sales/${order.id}/pick`) }] : []),
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
