import { useEffect, useState } from 'react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER']);

export function MasterDataPage({ title, description, fields, listRecords, createRecord, actions = null, searchPlaceholder = '', customInputs = {} }) {
  const { accessToken, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ''])));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const mayWrite = canWrite.has(user?.role);

  async function loadRecords() {
    setIsLoading(true);
    setError('');
    try {
      setRecords(await listRecords(accessToken, search));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [accessToken, search]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
      await createRecord(accessToken, payload);
      setForm(Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ''])));
      await loadRecords();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="primary">Master Data</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warelyn-muted">{description}</p>
        </div>
        {actions}
      </div>
      {error ? <ErrorState description={error} /> : null}
      {mayWrite ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-warelyn-text">Create {title.slice(0, -1)}</h2>
          </CardHeader>
          <CardBody>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              {fields.map((field) => {
                const FieldInput = customInputs[field.name] ?? Input;
                return (
                  <FieldInput
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    required={field.required}
                    type={field.type ?? 'text'}
                    value={form[field.name]}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                  />
                );
              })}
              <div className="flex items-end">
                <Button isLoading={isSaving} type="submit">{isSaving ? 'Saving...' : 'Create'}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
      {isLoading ? <LoadingState variant="table" /> : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-warelyn-text">Records</h2>
              {searchPlaceholder ? <Input className="sm:w-80" label="" placeholder={searchPlaceholder} value={search} onChange={(event) => setSearch(event.target.value)} /> : null}
            </div>
          </CardHeader>
          <CardBody>
            {records.length === 0 ? <EmptyState title="No records yet" description="Create master data records when your role allows it." /> : (
              <div className="overflow-hidden rounded-xl border border-warelyn-border">
                <table className="min-w-full divide-y divide-warelyn-border text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted">
                    <tr>
                      {fields.map((field) => <th className="px-4 py-3" key={field.name}>{field.label}</th>)}
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warelyn-border bg-white">
                    {records.map((record) => (
                      <tr className="hover:bg-slate-50/70" key={record.id}>
                        {fields.map((field) => <td className="px-4 py-3 text-warelyn-text" key={field.name}>{record[field.name] ?? '-'}</td>)}
                        <td className="px-4 py-3"><Badge tone={record.status === 'ACTIVE' ? 'success' : 'neutral'}>{record.status}</Badge></td>
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
