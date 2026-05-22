import { Activity, AlertTriangle, BarChart3, Boxes, ClipboardList, PackageCheck, Search, ShieldCheck, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { ScreenToolbar } from '../components/ui/ScreenToolbar.jsx';
import { TableShell } from '../components/ui/TableShell.jsx';
import { formatDate, formatDateTime, formatDecimal, formatMoney, titleCaseStatus } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';

export const reportLinks = [
  ['Inventory summary', '/reports/inventory-summary', 'Top-level stock, value, low-stock, expiry, blocked, and reconciliation indicators.', Boxes],
  ['Warehouse stock', '/reports/warehouse-stock', 'Stock projection by warehouse and SKU.', Warehouse],
  ['Location stock', '/reports/location-stock', 'Stock projection by bin/location and SKU.', Warehouse],
  ['Stock movements', '/reports/stock-movements', 'Ledger-backed stock movement history.', Activity],
  ['Low stock', '/reports/low-stock', 'Products at or below reorder level.', AlertTriangle],
  ['Reorder suggestions', '/reports/reorder-suggestions', 'Advisory replenishment quantities based on reorder level.', ClipboardList],
  ['Product valuation', '/reports/product-valuation', 'Current-cost stock valuation from backend data.', BarChart3],
  ['Batch expiry', '/reports/batch-expiry', 'Expired and expiring batch visibility.', PackageCheck],
  ['Serial status', '/reports/serial-status', 'Serial-level stock state.', PackageCheck],
  ['Blocked stock', '/reports/blocked-stock', 'Return, batch, and serial non-sellable stock.', ShieldCheck],
  ['Reconciliation', '/reports/reconciliation', 'Ledger-to-projection mismatch visibility.', ShieldCheck],
];

const reportGroups = [
  ['Inventory', ['Inventory summary', 'Warehouse stock', 'Location stock', 'Product valuation']],
  ['Stock Health', ['Low stock', 'Reorder suggestions', 'Blocked stock']],
  ['Traceability', ['Stock movements', 'Batch expiry', 'Serial status']],
  ['Reconciliation', ['Reconciliation']],
];

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader kicker="Reports" title="Operational reports" description="Read-only reporting from backend inventory, ledger, batch, serial, returns, purchasing, and sales data. Reports expose operational truth without frontend stock calculation." />
      <div className="space-y-6">
        {reportGroups.map(([group, names]) => (
          <section key={group}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-warelyn-muted">{group}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reportLinks
                .filter(([title]) => names.includes(title))
                .map(([title, to, description, Icon]) => (
                  <Link className="metric-link-card" key={to} to={to}>
                    <div className="metric-link-card-body">
                      <div className="metric-link-card-icon">
                        <Icon size={20} />
                      </div>
                      <p className="metric-link-card-label">Open report</p>
                      <h2 className="mt-3 text-xl font-semibold text-warelyn-text">{title}</h2>
                      <p className="metric-link-card-copy">{description}</p>
                      <span className="metric-link-card-status primary">Open report</span>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function SimpleReportPage({ columns, description, filters = [], load, loadRows, normalize = (row) => row, summary, title }) {
  const { accessToken } = useAuth();
  const [data, setData] = useState(null);
  const [query, setQuery] = useState({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function run() {
      setIsLoading(true);
      setError('');
      try {
        setData(await load(accessToken, query));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    run();
  }, [accessToken, load, query]);
  const sourceRows = loadRows ? loadRows(data) : data;
  const normalizedRows = Array.isArray(sourceRows) ? sourceRows.map(normalize) : [];
  const rows = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return normalizedRows;
    return normalizedRows.filter((row) =>
      columns.some((column) => {
        const raw = row[column.key];
        return raw !== null && raw !== undefined && String(raw).toLowerCase().includes(value);
      }),
    );
  }, [columns, normalizedRows, search]);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Report" title={title} description={description} actions={<Link to="/reports" className="text-sm font-semibold text-warelyn-primary hover:text-blue-900">Back to reports</Link>} />
      {summary ? summary(data) : null}
      <TableShell
        description={`${rows.length} backend-returned row(s)`}
        emptyDescription="No data matched this report."
        emptyTitle="No report rows"
        error={error}
        isEmpty={rows.length === 0}
        isLoading={isLoading}
        rowCount={rows.length}
        title="Results"
        toolbar={
          <ScreenToolbar
            activeFilters={filters.map((filter) => {
              const value = query[filter.key];
              if (!value) return null;
              return { key: filter.key, label: `${filter.label}: ${value}`, onRemove: () => setQuery((current) => ({ ...current, [filter.key]: '' })) };
            }).filter(Boolean)}
            onReset={() => {
              setQuery({});
              setSearch('');
            }}
            onSearchChange={setSearch}
            searchPlaceholder="Search rows"
            searchValue={search}
          >
            {filters.length ? (
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <label className="block min-w-[160px]" key={filter.key}>
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-warelyn-muted">{filter.label}</span>
                    <select className="block w-full rounded-xl border border-warelyn-border bg-white px-3 py-2.5 text-sm" onChange={(event) => setQuery((current) => ({ ...current, [filter.key]: event.target.value }))} value={query[filter.key] ?? ''}>
                      <option value="">{filter.emptyLabel ?? `All ${filter.label}`}</option>
                      {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            ) : null}
          </ScreenToolbar>
        }
      >
        <table>
          <thead>
            <tr>{columns.map((column) => <th className={column.numeric ? 'text-right' : ''} key={column.key}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id ?? index}>
                {columns.map((column) => (
                  <td className={column.numeric ? 'number-cell whitespace-nowrap' : 'whitespace-nowrap'} key={column.key}>
                    {renderReportCell(row[column.key], column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}

function renderReportCell(value, key) {
  if (value === null || value === undefined || value === '') return '-';
  if (key.includes('created_at')) return formatDateTime(value);
  if (key.endsWith('_date') || key === 'expiry_date' || key === 'order_date') return formatDate(value);
  if (key.includes('status') || key === 'movement_type' || key === 'reference_type') return <StatusBadge status={value}>{titleCaseStatus(value)}</StatusBadge>;
  if (['sku', 'barcode', 'ledger_id', 'reference_id', 'batch_number', 'serial_number'].includes(key)) return <span className="mono-cell">{value}</span>;
  if (key.includes('value') || key.includes('cost') || key.includes('price')) return formatMoney(value);
  if (key.includes('quantity') || key.includes('on_hand') || key.includes('reserved') || key.includes('available') || key.includes('delta')) return formatDecimal(value);
  return value;
}
