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

export function SalesPackagePage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [pickTasks, setPickTasks] = useState([]);
  const [packages, setPackages] = useState([]);
  const [packageNumber, setPackageNumber] = useState(`PKG-${Date.now()}`);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const mayWrite = canWrite.has(user?.role);
  const pickedItems = pickTasks.flatMap((task) => task.items.map((item) => ({ ...item, pick_number: task.pick_number }))).filter((item) => item.status === 'PICKED');

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const [orderRow, taskRows, packageRows] = await Promise.all([salesService.getSalesOrder(accessToken, id), fulfillmentService.listPickTasksForOrder(accessToken, id), fulfillmentService.listPackagesForOrder(accessToken, id)]);
      setOrder(orderRow);
      setPickTasks(taskRows);
      setPackages(packageRows);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken, id]);

  function toggleItem(itemId) {
    setSelectedItems((current) => (current.includes(itemId) ? current.filter((idValue) => idValue !== itemId) : [...current, itemId]));
  }

  async function createPackage(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await fulfillmentService.createPackage(accessToken, id, { package_number: packageNumber, pick_task_item_ids: selectedItems });
      setPackageNumber(`PKG-${Date.now()}`);
      setSelectedItems([]);
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
      <div><Badge tone="primary">Packing</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Package {order.order_number}</h1><p className="mt-2 text-sm text-warelyn-muted">Packages group picked items for operations. They do not deduct stock and are optional before fulfillment.</p></div>
      {error ? <ErrorState description={error} /> : null}
      {mayWrite ? <form onSubmit={createPackage}><Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Create package</h2></CardHeader><CardBody className="space-y-4"><Input label="Package number" required value={packageNumber} onChange={(event) => setPackageNumber(event.target.value)} />{pickedItems.length === 0 ? <EmptyState title="No picked items" description="Pick items before creating a package." /> : <div className="grid gap-3 md:grid-cols-2">{pickedItems.map((item) => <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-warelyn-border p-4" key={item.id}><input checked={selectedItems.includes(item.id)} type="checkbox" onChange={() => toggleItem(item.id)} /><span><span className="block font-semibold text-warelyn-text">Pick {item.pick_number} item #{item.id}</span><span className="block text-sm text-warelyn-muted">Product #{item.product_id}, quantity {item.picked_quantity}</span></span></label>)}</div>}<div className="flex justify-end"><Button disabled={isSaving || selectedItems.length === 0} type="submit">Create package</Button></div></CardBody></Card></form> : null}
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Packages</h2></CardHeader><CardBody>{packages.length === 0 ? <EmptyState title="No packages" description="Package creation is optional in Phase 7." /> : <div className="grid gap-3 md:grid-cols-2">{packages.map((pkg) => <Link className="rounded-xl border border-warelyn-border p-4 transition hover:border-warelyn-primary" key={pkg.id} to={`/packages/${pkg.id}`}><div className="flex items-center justify-between"><span className="font-semibold text-warelyn-text">{pkg.package_number}</span><Badge tone={pkg.status === 'PACKED' ? 'success' : pkg.status === 'CANCELLED' ? 'danger' : 'neutral'}>{pkg.status}</Badge></div><p className="mt-2 text-sm text-warelyn-muted">{pkg.items.length} item(s)</p></Link>)}</div>}</CardBody></Card>
    </div>
  );
}
