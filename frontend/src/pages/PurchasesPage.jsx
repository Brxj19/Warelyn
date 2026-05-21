import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as purchasingService from '../services/purchasingService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'PURCHASE_STAFF']);
const statusTone = { DRAFT: 'neutral', SUBMITTED: 'primary', PARTIALLY_RECEIVED: 'warning', RECEIVED: 'success', CANCELLED: 'danger', CLOSED: 'neutral' };

export function PurchasesPage() {
  const { accessToken, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const mayWrite = canWrite.has(user?.role);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        setOrders(await purchasingService.listPurchaseOrders(accessToken));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="primary">Purchasing</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Purchase orders</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warelyn-muted">Create purchase orders and receive goods into warehouse locations. Stock changes only after receipt commit.</p>
        </div>
        {mayWrite ? <Link to="/purchases/new"><Button>New purchase order</Button></Link> : null}
      </div>
      {error ? <ErrorState description={error} /> : null}
      {isLoading ? <LoadingState /> : (
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Orders</h2></CardHeader>
          <CardBody>
            {orders.length === 0 ? <EmptyState title="No purchase orders" description="Create a purchase order when procurement is ready." /> : (
              <div className="overflow-hidden rounded-xl border border-warelyn-border">
                <table className="min-w-full divide-y divide-warelyn-border text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted">
                    <tr><th className="px-4 py-3">PO Number</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Order Date</th><th className="px-4 py-3">Lines</th></tr>
                  </thead>
                  <tbody className="divide-y divide-warelyn-border bg-white">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3"><Link className="font-semibold text-warelyn-primary" to={`/purchases/${order.id}`}>{order.po_number}</Link></td>
                        <td className="px-4 py-3"><Badge tone={statusTone[order.status] ?? 'neutral'}>{order.status}</Badge></td>
                        <td className="px-4 py-3 text-warelyn-muted">{order.order_date}</td>
                        <td className="px-4 py-3 text-warelyn-muted">{order.items.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
