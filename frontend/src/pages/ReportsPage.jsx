import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { TableShell } from '../components/ui/TableShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const reportLinks = [
  ['Inventory summary', '/reports/inventory-summary', 'Top-level stock, value, low-stock, expiry, blocked, and reconciliation indicators.'],
  ['Warehouse stock', '/reports/warehouse-stock', 'Stock projection by warehouse and SKU.'],
  ['Location stock', '/reports/location-stock', 'Stock projection by bin/location and SKU.'],
  ['Stock movements', '/reports/stock-movements', 'Ledger-backed stock movement history.'],
  ['Low stock', '/reports/low-stock', 'Products at or below reorder level.'],
  ['Reorder suggestions', '/reports/reorder-suggestions', 'Advisory replenishment quantities based on reorder level.'],
  ['Product valuation', '/reports/product-valuation', 'Current-cost stock valuation from backend data.'],
  ['Batch expiry', '/reports/batch-expiry', 'Expired and expiring batch visibility.'],
  ['Serial status', '/reports/serial-status', 'Serial-level stock state.'],
  ['Blocked stock', '/reports/blocked-stock', 'Return, batch, and serial non-sellable stock.'],
  ['Reconciliation', '/reports/reconciliation', 'Ledger-to-projection mismatch visibility.'],
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
      <div className="space-y-6">{reportGroups.map(([group, names]) => <section key={group}><h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-warelyn-muted">{group}</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reportLinks.filter(([title]) => names.includes(title)).map(([title, to, description]) => <Link className="block" key={to} to={to}><Card className="h-full transition hover:-translate-y-0.5 hover:border-warelyn-primary hover:shadow-soft"><CardBody><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-warelyn-primary"><Badge tone="primary">{title.slice(0, 1)}</Badge></div><h2 className="font-semibold text-warelyn-text">{title}</h2><p className="mt-2 text-sm leading-6 text-warelyn-muted">{description}</p></CardBody></Card></Link>)}</div></section>)}</div>
    </div>
  );
}

export function SimpleReportPage({ columns, description, load, loadRows, normalize = (row) => row, summary, title }) {
  const { accessToken } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function run() {
      setIsLoading(true);
      setError('');
      try {
        setData(await load(accessToken));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    run();
  }, [accessToken, load]);

  if (isLoading) return <LoadingState variant="table" />;
  if (error) return <ErrorState description={error} title={error.includes('403') || error.toLowerCase().includes('forbidden') ? 'Report access denied' : 'Unable to load report'} />;
  const sourceRows = loadRows ? loadRows(data) : data;
  const rows = Array.isArray(sourceRows) ? sourceRows.map(normalize) : [];

  return (
    <div className="space-y-6">
      <PageHeader kicker="Report" title={title} description={description} actions={<Link to="/reports" className="text-sm font-semibold text-warelyn-primary hover:text-blue-900">Back to reports</Link>} />
      {summary ? summary(data) : null}
      <Card><CardBody className="flex flex-wrap items-center gap-3"><Badge tone="neutral">Filters</Badge><span className="text-sm text-warelyn-muted">Current report uses backend defaults.</span><button className="text-sm font-semibold text-warelyn-primary" type="button">Reset filters</button></CardBody></Card>
      <TableShell description={`${rows.length} backend-returned row(s)`} emptyDescription="No data matched this report." emptyTitle="No report rows" isEmpty={rows.length === 0} title="Results">
        <table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id ?? index}>{columns.map((column) => <td className="whitespace-nowrap" key={column.key}>{row[column.key] ?? '-'}</td>)}</tr>)}</tbody></table>
      </TableShell>
    </div>
  );
}
