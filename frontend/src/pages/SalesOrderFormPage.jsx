import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as catalogService from '../services/catalogService.js';
import * as salesService from '../services/salesService.js';

const selectClass = 'block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10';

export function SalesOrderFormPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ customer_id: '', order_number: `SO-${Date.now()}`, order_date: new Date().toISOString().slice(0, 10), expected_ship_date: '', notes: '' });
  const [items, setItems] = useState([{ product_id: '', ordered_quantity: '1', unit_price: '0', notes: '' }]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [customerRows, productRows] = await Promise.all([catalogService.listCustomers(accessToken), catalogService.listProducts(accessToken)]);
        setCustomers(customerRows);
        setProducts(productRows);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  function updateItem(index, key, value) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = { ...Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '')), customer_id: Number(form.customer_id), items: items.filter((item) => item.product_id).map((item) => ({ ...item, product_id: Number(item.product_id) })) };
      const order = await salesService.createSalesOrder(accessToken, payload);
      navigate(`/sales/${order.id}`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div><Badge tone="primary">Sales</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">New sales order</h1><p className="mt-2 text-sm text-warelyn-muted">Create a draft order. Stock is reserved only after explicit location allocation on confirmation.</p></div>
      {error ? <ErrorState description={error} /> : null}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Order details</h2></CardHeader><CardBody className="grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-medium text-warelyn-text">Customer</span><select className={selectClass} required value={form.customer_id} onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value }))}><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><Input label="Order number" required value={form.order_number} onChange={(event) => setForm((current) => ({ ...current, order_number: event.target.value }))} /><Input label="Order date" required type="date" value={form.order_date} onChange={(event) => setForm((current) => ({ ...current, order_date: event.target.value }))} /><Input label="Expected ship date" type="date" value={form.expected_ship_date} onChange={(event) => setForm((current) => ({ ...current, expected_ship_date: event.target.value }))} /><Input className="md:col-span-2" label="Notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></CardBody></Card>
        <Card><CardHeader className="flex items-center justify-between"><h2 className="text-lg font-semibold text-warelyn-text">Product lines</h2><Button variant="secondary" onClick={() => setItems((current) => [...current, { product_id: '', ordered_quantity: '1', unit_price: '0', notes: '' }])}>Add line</Button></CardHeader><CardBody className="space-y-4">{items.map((item, index) => <div className="grid gap-3 rounded-xl border border-warelyn-border p-4 md:grid-cols-[2fr_1fr_1fr_auto]" key={index}><label className="block"><span className="mb-2 block text-sm font-medium text-warelyn-text">Product</span><select className={selectClass} required value={item.product_id} onChange={(event) => updateItem(index, 'product_id', event.target.value)}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku}){product.track_serial ? ' - serial sales blocked' : ''}</option>)}</select></label><Input label="Quantity" min="0.001" required step="0.001" type="number" value={item.ordered_quantity} onChange={(event) => updateItem(index, 'ordered_quantity', event.target.value)} /><Input label="Unit price" min="0" required step="0.01" type="number" value={item.unit_price} onChange={(event) => updateItem(index, 'unit_price', event.target.value)} /><div className="flex items-end"><Button disabled={items.length === 1} variant="secondary" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button></div></div>)}</CardBody></Card>
        <div className="flex justify-end"><Button disabled={isSaving} type="submit">{isSaving ? 'Creating...' : 'Create sales order'}</Button></div>
      </form>
    </div>
  );
}
