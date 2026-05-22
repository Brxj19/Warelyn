import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ActionMenu } from '../components/ui/ActionMenu.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { ScreenToolbar } from '../components/ui/ScreenToolbar.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { TableShell } from '../components/ui/TableShell.jsx';
import { formatDecimal, formatMoney } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER']);

export function MasterDataPage({ title, description, fields, listRecords, createRecord, actions = null, searchPlaceholder = '', customInputs = {}, rowLink = null }) {
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

  const filteredRecords = records.filter((record) => {
    if (!search) return true;
    const value = search.toLowerCase();
    return fields.some((field) => String(record[field.name] ?? '').toLowerCase().includes(value));
  });

  return (
    <div className="space-y-6">
      <PageHeader kicker="Master data" title={title} description={description} actions={actions} />
      {error ? <ErrorState description={error} /> : null}
      {mayWrite ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-warelyn-text">Create {title.slice(0, -1)}</h2>
            <p className="mt-1 text-sm text-warelyn-muted">Add a new {title.slice(0, -1).toLowerCase()} record without changing inventory balances or workflow state.</p>
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
        <TableShell
          description={`${filteredRecords.length} record(s) in this view`}
          emptyAction={mayWrite ? <Button onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} type="button">Create record</Button> : null}
          emptyDescription="Create master data records when your role allows it."
          emptyTitle={`No ${title.toLowerCase()} yet`}
          isEmpty={filteredRecords.length === 0}
          rowCount={filteredRecords.length}
          title="Records"
          toolbar={
            <ScreenToolbar
              onReset={() => setSearch('')}
              onSearchChange={setSearch}
              searchPlaceholder={searchPlaceholder || `Search ${title.toLowerCase()}`}
              searchValue={search}
            />
          }
        >
          <table>
            <thead>
              <tr>
                {fields.map((field, index) => <th className={index > 0 && isNumericField(field.name) ? 'text-right' : ''} key={field.name}>{field.label}</th>)}
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  {fields.map((field, index) => {
                    const content = renderCell(record[field.name], field.name);
                    const rowUrl = index === 0 && rowLink ? rowLink(record) : null;
                    return (
                      <td className={isNumericField(field.name) ? 'number-cell' : ''} key={field.name}>
                        {rowUrl ? <Link className="font-semibold text-warelyn-primary" to={rowUrl}>{content}</Link> : content}
                      </td>
                    );
                  })}
                  <td><StatusBadge status={record.status ?? 'ACTIVE'}>{record.status ?? 'ACTIVE'}</StatusBadge></td>
                  <td className="text-right">
                    <ActionMenu items={rowLink ? [{ label: 'View', onClick: () => window.location.assign(rowLink(record)) }] : []} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}

function isNumericField(name) {
  return ['cost_price', 'selling_price', 'reorder_level'].includes(name);
}

function renderCell(value, fieldName) {
  if (value === null || value === undefined || value === '') return '-';
  if (['sku', 'barcode', 'gst_number', 'code'].includes(fieldName)) return <span className="mono-cell">{value}</span>;
  if (fieldName === 'reorder_level') return formatDecimal(value);
  if (isNumericField(fieldName)) return formatMoney(value);
  return value;
}
