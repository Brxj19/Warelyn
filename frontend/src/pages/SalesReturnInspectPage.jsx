import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as catalogService from '../services/catalogService.js';
import * as returnsService from '../services/returnsService.js';

const selectClass = 'block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10';
const outcomes = [
  ['ACCEPTED_RESTOCK', 'Sellable restock', 'Adds returned quantity to on-hand and available stock through InventoryEngine.'],
  ['ACCEPTED_BLOCKED', 'QC hold', 'Creates blocked return stock only. It is not sellable.'],
  ['DAMAGED', 'Damaged', 'Creates damaged blocked return stock only.'],
  ['SCRAPPED', 'Scrapped', 'Creates scrapped blocked return stock only.'],
  ['REJECTED', 'Rejected', 'No stock movement or blocked stock record.'],
];

export function SalesReturnInspectPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [salesReturn, setSalesReturn] = useState(null);
  const [productsById, setProductsById] = useState({});
  const [items, setItems] = useState([]);
  const [idempotencyKey, setIdempotencyKey] = useState(`return-process-${id}-${Date.now()}`);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const [row, products] = await Promise.all([returnsService.getSalesReturn(accessToken, id), catalogService.listProducts(accessToken)]);
        setSalesReturn(row);
        setProductsById(Object.fromEntries(products.map((product) => [product.id, product])));
        setItems(row.items.map((item) => ({ sales_return_item_id: item.id, qc_status: item.qc_status === 'PENDING' ? 'ACCEPTED_RESTOCK' : item.qc_status, accepted_quantity: item.accepted_quantity === '0.000' ? item.returned_quantity : item.accepted_quantity, rejected_quantity: item.rejected_quantity, reason: item.reason ?? '', notes: item.notes ?? '', returned_quantity: item.returned_quantity, product_id: item.product_id })));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken, id]);

  function updateItem(index, key, value) {
    setItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (key === 'qc_status' && value === 'REJECTED') return { ...item, qc_status: value, accepted_quantity: '0', rejected_quantity: item.returned_quantity };
      if (key === 'qc_status') return { ...item, qc_status: value, accepted_quantity: item.returned_quantity, rejected_quantity: '0' };
      return { ...item, [key]: value };
    }));
  }

  async function inspectAndProcess(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const inspectionPayload = { notes: note, items: items.map(({ returned_quantity, product_id, ...item }) => item) };
      await returnsService.inspectSalesReturn(accessToken, id, inspectionPayload);
      await returnsService.processSalesReturn(accessToken, id, { idempotency_key: idempotencyKey, note });
      navigate(`/returns/${id}`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (!salesReturn) return <ErrorState description={error || 'Sales return not found.'} />;

  return (
    <form className="space-y-6" onSubmit={inspectAndProcess}>
      <div><Badge tone="primary">QC inspection</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Inspect {salesReturn.return_number}</h1><p className="mt-2 text-sm text-warelyn-muted">The advisory stock impact below mirrors backend rules; the frontend does not calculate authoritative stock.</p></div>
      {error ? <ErrorState description={error} /> : null}
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Inspection outcomes</h2></CardHeader><CardBody className="space-y-4">{items.map((item, index) => { const outcome = outcomes.find(([value]) => value === item.qc_status); return <div className="grid gap-3 rounded-xl border border-warelyn-border p-4 lg:grid-cols-5" key={item.sales_return_item_id}><div><span className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">Product</span><p className="mt-2 font-semibold text-warelyn-text">{productsById[item.product_id]?.name ?? `#${item.product_id}`}</p><p className="text-xs text-warelyn-muted">Returned {item.returned_quantity}</p></div><label className="block lg:col-span-2"><span className="mb-2 block text-sm font-medium text-warelyn-text">QC outcome</span><select className={selectClass} value={item.qc_status} onChange={(event) => updateItem(index, 'qc_status', event.target.value)}>{outcomes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p className="mt-2 text-xs text-warelyn-muted">{outcome?.[2]}</p></label><Input label="Accepted" min="0" step="0.001" type="number" value={item.accepted_quantity} onChange={(event) => updateItem(index, 'accepted_quantity', event.target.value)} /><Input label="Rejected" min="0" step="0.001" type="number" value={item.rejected_quantity} onChange={(event) => updateItem(index, 'rejected_quantity', event.target.value)} /><Input className="lg:col-span-2" label="Reason" value={item.reason} onChange={(event) => updateItem(index, 'reason', event.target.value)} /></div>; })}</CardBody></Card>
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Processing</h2></CardHeader><CardBody className="grid gap-4 md:grid-cols-2"><Input label="Idempotency key" required value={idempotencyKey} onChange={(event) => setIdempotencyKey(event.target.value)} /><Input label="QC note" value={note} onChange={(event) => setNote(event.target.value)} /></CardBody></Card>
      <div className="flex justify-end"><Button disabled={isSaving} type="submit" variant="accent">Inspect and process</Button></div>
    </form>
  );
}
