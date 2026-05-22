import { ArrowRight, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ActionMenu } from '../components/ui/ActionMenu.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { ScreenToolbar } from '../components/ui/ScreenToolbar.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { TableShell } from '../components/ui/TableShell.jsx';
import { formatDate, formatDecimal } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as catalogService from '../services/catalogService.js';
import * as fulfillmentService from '../services/fulfillmentService.js';
import * as purchasingService from '../services/purchasingService.js';
import * as salesService from '../services/salesService.js';

const canPurchaseWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF']);
const canSalesWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);

export function PurchaseReceiptsPage() {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [vendorsById, setVendorsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const mayWrite = canPurchaseWrite.has(user?.role);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const [orders, vendorRows] = await Promise.all([
          purchasingService.listPurchaseOrders(accessToken),
          catalogService.listVendors(accessToken),
        ]);
        const receiptGroups = await Promise.all(
          orders.map(async (order) => ({
            order,
            receipts: await purchasingService.listPurchaseReceipts(accessToken, order.id),
          })),
        );
        setVendorsById(Object.fromEntries(vendorRows.map((row) => [row.id, row])));
        setReceipts(
          receiptGroups.flatMap(({ order, receipts: orderReceipts }) =>
            orderReceipts.map((receipt) => ({
              ...receipt,
              po_number: order.po_number,
              vendor_id: order.vendor_id,
            })),
          ),
        );
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  const filteredReceipts = useMemo(() => {
    if (!search) return receipts;
    const value = search.toLowerCase();
    return receipts.filter((receipt) =>
      `${receipt.receipt_number} ${receipt.po_number} ${vendorsById[receipt.vendor_id]?.name ?? ''} ${receipt.status}`
        .toLowerCase()
        .includes(value),
    );
  }, [receipts, search, vendorsById]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          mayWrite ? (
            <Link to="/purchase-receipts/new">
              <Button>Receive / Create Receipt</Button>
            </Link>
          ) : null
        }
        kicker="Purchases"
        title="Purchase receipts"
        description="Review receipt drafts and committed inbound stock documents without mixing them into purchase order list pages."
      />
      {error ? <ErrorState description={error} /> : null}
      <TableShell
        description={`${filteredReceipts.length} receipt(s) in view`}
        emptyAction={
          mayWrite ? (
            <Link to="/purchase-receipts/new">
              <Button>Create receipt</Button>
            </Link>
          ) : null
        }
        emptyDescription="Open a receivable purchase order to create the first receipt."
        emptyTitle="No purchase receipts yet"
        error={error}
        isEmpty={filteredReceipts.length === 0}
        isLoading={isLoading}
        rowCount={filteredReceipts.length}
        title="Receipts"
        toolbar={
          <ScreenToolbar
            onReset={() => setSearch('')}
            onSearchChange={setSearch}
            searchPlaceholder="Search receipt number, PO, or vendor"
            searchValue={search}
          />
        }
      >
        <table>
          <thead>
            <tr>
              <th>Receipt number</th>
              <th>Purchase order</th>
              <th>Vendor</th>
              <th>Status</th>
              <th className="text-right">Lines</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map((receipt) => (
              <tr key={receipt.id}>
                <td>
                  <Link className="font-semibold text-warelyn-primary" to={`/purchase-receipts/${receipt.id}`}>
                    {receipt.receipt_number}
                  </Link>
                </td>
                <td><span className="mono-cell">{receipt.po_number}</span></td>
                <td>{vendorsById[receipt.vendor_id]?.name ?? `Vendor #${receipt.vendor_id}`}</td>
                <td><StatusBadge status={receipt.status}>{receipt.status}</StatusBadge></td>
                <td className="number-cell">{receipt.items.length}</td>
                <td>{receipt.created_at ? formatDate(receipt.created_at) : '-'}</td>
                <td className="text-right">
                  <ActionMenu items={[{ label: 'View', icon: Eye, onClick: () => navigate(`/purchase-receipts/${receipt.id}`) }]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

export function PurchaseReceiptStartPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [vendorsById, setVendorsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const [orderRows, vendorRows] = await Promise.all([
          purchasingService.listPurchaseOrders(accessToken),
          catalogService.listVendors(accessToken),
        ]);
        setOrders(orderRows.filter((order) => ['SUBMITTED', 'PARTIALLY_RECEIVED'].includes(order.status)));
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
    if (!search) return orders;
    const value = search.toLowerCase();
    return orders.filter((order) =>
      `${order.po_number} ${vendorsById[order.vendor_id]?.name ?? ''} ${order.status}`.toLowerCase().includes(value),
    );
  }, [orders, search, vendorsById]);

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/purchase-receipts"
        kicker="Purchases"
        title="Start receipt workflow"
        description="Choose a submitted purchase order to open the focused receiving workflow."
      />
      {error ? <ErrorState description={error} /> : null}
      <TableShell
        description={`${filteredOrders.length} receivable purchase order(s) in view`}
        emptyDescription="Purchase orders must be submitted before goods can be received."
        emptyTitle="No receivable purchase orders"
        error={error}
        isEmpty={filteredOrders.length === 0}
        isLoading={isLoading}
        rowCount={filteredOrders.length}
        title="Select purchase order"
        toolbar={
          <ScreenToolbar
            onReset={() => setSearch('')}
            onSearchChange={setSearch}
            searchPlaceholder="Search purchase order or vendor"
            searchValue={search}
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
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td><span className="font-semibold text-warelyn-text">{order.po_number}</span></td>
                <td>{vendorsById[order.vendor_id]?.name ?? `Vendor #${order.vendor_id}`}</td>
                <td><StatusBadge status={order.status}>{order.status}</StatusBadge></td>
                <td className="number-cell">{order.items.length}</td>
                <td className="text-right">
                  <Button onClick={() => navigate(`/purchases/${order.id}/receive`)} type="button" variant="secondary">
                    Open receive workflow
                    <ArrowRight size={15} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

export function PackagesPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [salesOrdersById, setSalesOrdersById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const orders = await salesService.listSalesOrders(accessToken);
        const packageGroups = await Promise.all(
          orders.map(async (order) => ({
            order,
            packages: await fulfillmentService.listPackagesForOrder(accessToken, order.id),
          })),
        );
        setSalesOrdersById(Object.fromEntries(orders.map((row) => [row.id, row])));
        setPackages(
          packageGroups.flatMap(({ order, packages: orderPackages }) =>
            orderPackages.map((pkg) => ({
              ...pkg,
              order_number: order.order_number,
            })),
          ),
        );
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  const filteredPackages = useMemo(() => {
    if (!search) return packages;
    const value = search.toLowerCase();
    return packages.filter((pkg) => `${pkg.package_number} ${pkg.order_number} ${pkg.status}`.toLowerCase().includes(value));
  }, [packages, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link to="/sales">
            <Button variant="secondary">Start from sales orders</Button>
          </Link>
        }
        kicker="Operations"
        title="Packages"
        description="Review package records separately from the focused package creation workflow."
      />
      {error ? <ErrorState description={error} /> : null}
      <TableShell
        description={`${filteredPackages.length} package record(s) in view`}
        emptyDescription="Create packages from picked sales order items."
        emptyTitle="No packages yet"
        error={error}
        isEmpty={filteredPackages.length === 0}
        isLoading={isLoading}
        rowCount={filteredPackages.length}
        title="Package records"
        toolbar={
          <ScreenToolbar
            onReset={() => setSearch('')}
            onSearchChange={setSearch}
            searchPlaceholder="Search package number or sales order"
            searchValue={search}
          />
        }
      >
        <table>
          <thead>
            <tr>
              <th>Package number</th>
              <th>Sales order</th>
              <th>Status</th>
              <th className="text-right">Items</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredPackages.map((pkg) => (
              <tr key={pkg.id}>
                <td>
                  <Link className="font-semibold text-warelyn-primary" to={`/packages/${pkg.id}`}>
                    {pkg.package_number}
                  </Link>
                </td>
                <td><Link className="text-warelyn-primary" to={`/sales/${pkg.sales_order_id}`}>{pkg.order_number}</Link></td>
                <td><StatusBadge status={pkg.status}>{pkg.status}</StatusBadge></td>
                <td className="number-cell">{pkg.items.length}</td>
                <td>{pkg.created_at ? formatDate(pkg.created_at) : '-'}</td>
                <td className="text-right">
                  <ActionMenu items={[{ label: 'View', icon: Eye, onClick: () => navigate(`/packages/${pkg.id}`) }]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

export function SalesFulfillmentsPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [fulfillments, setFulfillments] = useState([]);
  const [salesOrdersById, setSalesOrdersById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const orders = await salesService.listSalesOrders(accessToken);
        const fulfillmentGroups = await Promise.all(
          orders.map(async (order) => ({
            order,
            fulfillments: await salesService.listSalesFulfillments(accessToken, order.id),
          })),
        );
        setSalesOrdersById(Object.fromEntries(orders.map((row) => [row.id, row])));
        setFulfillments(
          fulfillmentGroups.flatMap(({ order, fulfillments: orderFulfillments }) =>
            orderFulfillments.map((fulfillment) => ({
              ...fulfillment,
              order_number: order.order_number,
            })),
          ),
        );
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  const filteredFulfillments = useMemo(() => {
    if (!search) return fulfillments;
    const value = search.toLowerCase();
    return fulfillments.filter((row) => `${row.fulfillment_number} ${row.order_number} ${row.status}`.toLowerCase().includes(value));
  }, [fulfillments, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link to="/sales">
            <Button variant="secondary">Start from sales orders</Button>
          </Link>
        }
        kicker="Operations"
        title="Fulfillments"
        description="Review fulfillment drafts and committed outbound stock documents separately from sales order list screens."
      />
      {error ? <ErrorState description={error} /> : null}
      <TableShell
        description={`${filteredFulfillments.length} fulfillment record(s) in view`}
        emptyDescription="Create fulfillments from sales orders with active reservations."
        emptyTitle="No fulfillments yet"
        error={error}
        isEmpty={filteredFulfillments.length === 0}
        isLoading={isLoading}
        rowCount={filteredFulfillments.length}
        title="Fulfillment records"
        toolbar={
          <ScreenToolbar
            onReset={() => setSearch('')}
            onSearchChange={setSearch}
            searchPlaceholder="Search fulfillment number or sales order"
            searchValue={search}
          />
        }
      >
        <table>
          <thead>
            <tr>
              <th>Fulfillment number</th>
              <th>Sales order</th>
              <th>Status</th>
              <th className="text-right">Lines</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredFulfillments.map((fulfillment) => (
              <tr key={fulfillment.id}>
                <td>
                  <Link className="font-semibold text-warelyn-primary" to={`/sales-fulfillments/${fulfillment.id}`}>
                    {fulfillment.fulfillment_number}
                  </Link>
                </td>
                <td><Link className="text-warelyn-primary" to={`/sales/${fulfillment.sales_order_id}`}>{fulfillment.order_number}</Link></td>
                <td><StatusBadge status={fulfillment.status}>{fulfillment.status}</StatusBadge></td>
                <td className="number-cell">{fulfillment.items.length}</td>
                <td>{fulfillment.created_at ? formatDate(fulfillment.created_at) : '-'}</td>
                <td className="text-right">
                  <ActionMenu items={[{ label: 'View', icon: Eye, onClick: () => navigate(`/sales-fulfillments/${fulfillment.id}`) }]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
