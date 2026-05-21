import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as purchasingService from '../services/purchasingService.js';
import * as warehouseService from '../services/warehouseService.js';

const selectClass = 'block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10';

export function PurchaseReceivePage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [locationsByWarehouse, setLocationsByWarehouse] = useState({});
  const [receiptNumber, setReceiptNumber] = useState(`GRN-${Date.now()}`);
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const [orderRow, warehouseRows] = await Promise.all([purchasingService.getPurchaseOrder(accessToken, id), warehouseService.listWarehouses(accessToken)]);
        const locationPairs = await Promise.all(warehouseRows.map(async (warehouse) => [warehouse.id, await warehouseService.listWarehouseLocations(accessToken, warehouse.id)]));
        const locationMap = Object.fromEntries(locationPairs);
        const defaultWarehouse = warehouseRows[0]?.id ? String(warehouseRows[0].id) : '';
        const defaultLocation = defaultWarehouse && locationMap[defaultWarehouse]?.[0]?.id ? String(locationMap[defaultWarehouse][0].id) : '';
        setOrder(orderRow);
        setWarehouses(warehouseRows);
        setLocationsByWarehouse(locationMap);
        setLines(orderRow.items.map((item) => ({ purchase_order_item_id: item.id, product_id: item.product_id, warehouse_id: defaultWarehouse, location_id: defaultLocation, received_quantity: Math.max(0, Number(item.ordered_quantity) - Number(item.received_quantity)).toString(), unit_cost: item.unit_cost })));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken, id]);

  function updateLine(index, key, value) {
    setLines((current) => current.map((line, lineIndex) => {
      if (lineIndex !== index) return line;
      if (key === 'warehouse_id') {
        const firstLocation = locationsByWarehouse[value]?.[0]?.id ?? '';
        return { ...line, warehouse_id: value, location_id: firstLocation ? String(firstLocation) : '' };
      }
      return { ...line, [key]: value };
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const items = lines
        .filter((line, index) => Number(line.received_quantity) > 0 && Number(line.received_quantity) <= Number(order.items[index].ordered_quantity) - Number(order.items[index].received_quantity))
        .map((line) => ({ ...line, warehouse_id: Number(line.warehouse_id), location_id: Number(line.location_id), received_quantity: line.received_quantity, product_id: Number(line.product_id), purchase_order_item_id: Number(line.purchase_order_item_id) }));
      const receipt = await purchasingService.createPurchaseReceipt(accessToken, id, { receipt_number: receiptNumber, items });
      navigate(`/purchase-receipts/${receipt.id}`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (!order) return <ErrorState description={error || 'Purchase order not found.'} />;

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="primary">Receiving</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Receive {order.po_number}</h1>
        <p className="mt-2 text-sm text-warelyn-muted">Choose warehouse and location for each received line. The backend validates remaining quantities before stock changes.</p>
      </div>
      {error ? <ErrorState description={error} /> : null}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Receipt</h2></CardHeader>
          <CardBody><Input label="Receipt number" required value={receiptNumber} onChange={(event) => setReceiptNumber(event.target.value)} /></CardBody>
        </Card>
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Receipt lines</h2></CardHeader>
          <CardBody className="space-y-4">
            {lines.map((line, index) => {
              const item = order.items[index];
              const remaining = Number(item.ordered_quantity) - Number(item.received_quantity);
              return (
                <div className="grid gap-3 rounded-xl border border-warelyn-border p-4 lg:grid-cols-[1fr_1fr_1fr_1fr]" key={line.purchase_order_item_id}>
                  <div><span className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">Product</span><p className="mt-2 font-semibold text-warelyn-text">#{line.product_id}</p><p className="text-sm text-warelyn-muted">Remaining {remaining.toFixed(3)}</p></div>
                  <Input label="Receive quantity" max={remaining} min="0" step="0.001" type="number" value={line.received_quantity} onChange={(event) => updateLine(index, 'received_quantity', event.target.value)} />
                  <label className="block"><span className="mb-2 block text-sm font-medium text-warelyn-text">Warehouse</span><select className={selectClass} required value={line.warehouse_id} onChange={(event) => updateLine(index, 'warehouse_id', event.target.value)}><option value="">Select warehouse</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></label>
                  <label className="block"><span className="mb-2 block text-sm font-medium text-warelyn-text">Location</span><select className={selectClass} required value={line.location_id} onChange={(event) => updateLine(index, 'location_id', event.target.value)}><option value="">Select location</option>{(locationsByWarehouse[line.warehouse_id] ?? []).map((location) => <option key={location.id} value={location.id}>{location.name} ({location.location_type})</option>)}</select></label>
                </div>
              );
            })}
          </CardBody>
        </Card>
        <div className="flex justify-end"><Button disabled={isSaving} type="submit">{isSaving ? 'Creating...' : 'Create receipt draft'}</Button></div>
      </form>
    </div>
  );
}
