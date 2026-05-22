import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { TableShell } from '../components/ui/TableShell.jsx';
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
      <PageHeader backTo="/warehouses" description={`Configure bins and locations for warehouse #${id}. Location setup does not create stock balances.`} kicker="Warehouse setup" title="Warehouse locations" />
      {error ? <ErrorState description={error} /> : null}
      <div className="record-summary-grid">
        <Card className="record-summary-card"><CardBody><span>Warehouse</span><strong>#{id}</strong><small>Tenant-scoped master data</small></CardBody></Card>
        <Card className="record-summary-card"><CardBody><span>Location count</span><strong>{locations.length}</strong><small>Configured bins and zones</small></CardBody></Card>
        <Card className="record-summary-card"><CardBody><span>Active locations</span><strong>{locations.filter((row) => row.status === 'ACTIVE').length}</strong><small>Ready for workflow use</small></CardBody></Card>
      </div>
      {mayWrite ? (
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Create location</h2><p className="mt-1 text-sm text-warelyn-muted">Use receiving, storage, picking, packing, or return locations to structure warehouse operations.</p></CardHeader>
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
        <TableShell
          description={`${locations.length} configured location(s)`}
          emptyDescription="Create receiving, storage, picking, or packing locations when your role allows it."
          emptyTitle="No locations yet"
          isEmpty={locations.length === 0}
          rowCount={locations.length}
          title="Locations"
        >
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Barcode</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <td className="font-semibold text-warelyn-text">{location.name}</td>
                  <td><span className="mono-cell">{location.code}</span></td>
                  <td><span className="mono-cell">{location.barcode ?? '-'}</span></td>
                  <td>{location.location_type}</td>
                  <td><StatusBadge status={location.status}>{location.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
