import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as warehouseService from '../services/warehouseService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER']);

export function WarehouseDetailPage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', barcode: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const mayWrite = canWrite.has(user?.role);

  async function loadLocations() {
    setIsLoading(true);
    setError('');
    try {
      setLocations(await warehouseService.listWarehouseLocations(accessToken, id));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLocations();
  }, [accessToken, id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
      await warehouseService.createWarehouseLocation(accessToken, id, payload);
      setForm({ name: '', code: '', barcode: '' });
      await loadLocations();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="primary">Warehouse Setup</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Warehouse locations</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-warelyn-muted">Configure bins and locations for warehouse #{id}. Location setup does not create stock balances.</p>
      </div>
      {error ? <ErrorState description={error} /> : null}
      {mayWrite ? (
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Create Location</h2></CardHeader>
          <CardBody>
            <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
              {['name', 'code', 'barcode'].map((field) => (
                <Input key={field} label={field[0].toUpperCase() + field.slice(1)} required={field !== 'barcode'} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
              ))}
              <div className="flex items-end"><Button disabled={isSaving} type="submit">{isSaving ? 'Saving...' : 'Create'}</Button></div>
            </form>
          </CardBody>
        </Card>
      ) : null}
      {isLoading ? <LoadingState /> : (
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Locations</h2></CardHeader>
          <CardBody>
            {locations.length === 0 ? <EmptyState title="No locations yet" description="Create receiving, storage, picking, or packing locations when your role allows it." /> : (
              <div className="grid gap-3 md:grid-cols-2">
                {locations.map((location) => (
                  <div className="rounded-xl border border-warelyn-border p-4" key={location.id}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-warelyn-text">{location.name}</h3>
                      <Badge tone="success">{location.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-warelyn-muted">Code: {location.code}</p>
                    <p className="text-sm text-warelyn-muted">Type: {location.location_type}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
