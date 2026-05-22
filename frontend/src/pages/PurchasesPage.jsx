import { Eye, Plus, ReceiptText } from 'lucide-react';
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
import * as purchasingService from '../services/purchasingService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF']);
const statusTabs = ['ALL', 'DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'CLOSED'];

export function PurchasesPage() {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [vendorsById, setVendorsById] = useState({});
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
        const [orderRows, vendorRows] = await Promise.all([purchasingService.listPurchaseOrders(accessToken), catalogService.listVendors(accessToken)]);
        setOrders(orderRows);
        setVendorsById(Object.fromEntries(vendorRows.map((row) => [row.id, row])));
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
      const vendorName = vendorsById[order.vendor_id]?.name ?? '';
      return `${order.po_number} ${vendorName} ${order.status}`.toLowerCase().includes(value);
    });
  }, [orders, search, statusFilter, vendorsById]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Purchasing"
        title="Purchase orders"
        description="Review purchase order records only. Create and receiving workflows stay on their own focused screens."
        actions={mayWrite ? <Link to="/purchases/new"><Button><Plus size={16} />Purchase Order</Button></Link> : null}
      />
      <TableShell
        description={`${filteredOrders.length} purchase order(s) in view`}
        emptyAction={mayWrite ? <Link to="/purchases/new"><Button>Create purchase order</Button></Link> : null}
        emptyDescription="Create your first purchase order to start receiving stock."
        emptyTitle="No purchase orders yet"
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
            searchPlaceholder="Search PO number or vendor"
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
              <th>PO number</th>
              <th>Vendor</th>
              <th>Status</th>
              <th className="text-right">Lines</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td><Link className="font-semibold text-warelyn-primary" to={`/purchases/${order.id}`}>{order.po_number}</Link></td>
                <td>{vendorsById[order.vendor_id]?.name ?? `Vendor #${order.vendor_id}`}</td>
                <td><StatusBadge status={order.status}>{order.status}</StatusBadge></td>
                <td className="number-cell">{order.items.length}</td>
                <td>{formatDate(order.order_date)}</td>
                <td className="text-right">
                  <ActionMenu items={[
                    { label: 'View', icon: Eye, onClick: () => navigate(`/purchases/${order.id}`) },
                    ...(mayWrite && ['SUBMITTED', 'PARTIALLY_RECEIVED'].includes(order.status) ? [{ label: 'Receive', icon: ReceiptText, onClick: () => navigate(`/purchases/${order.id}/receive`) }] : []),
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
