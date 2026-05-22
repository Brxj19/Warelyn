import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
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

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-warelyn-border bg-white p-6 shadow-sm"><Badge tone="primary">Reports</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Operational reports</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-warelyn-muted">Read-only reporting from backend inventory, ledger, batch, serial, returns, purchasing, and sales data. Reports expose operational truth without frontend stock calculation.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reportLinks.map(([title, to, description]) => <Link className="block" key={to} to={to}><Card className="h-full transition hover:-translate-y-0.5 hover:border-warelyn-primary hover:shadow-soft"><CardBody><div className="mb-4 h-1.5 w-12 rounded-full bg-warelyn-primary" /><h2 className="font-semibold text-warelyn-text">{title}</h2><p className="mt-2 text-sm leading-6 text-warelyn-muted">{description}</p></CardBody></Card></Link>)}</div>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Badge tone="primary">Report</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-warelyn-muted">{description}</p></div><Link to="/reports" className="text-sm font-semibold text-warelyn-primary hover:text-blue-900">Back to reports</Link></div>
      {summary ? summary(data) : null}
      <Card><CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-warelyn-text">Results</h2><p className="mt-1 text-sm text-warelyn-muted">{rows.length} backend-returned row(s)</p></div><div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-warelyn-muted ring-1 ring-warelyn-border">Filter-ready table shell</div></CardHeader><CardBody>{rows.length === 0 ? <EmptyState title="No report rows" description="No data matched this report." /> : <div className="overflow-x-auto rounded-xl border border-warelyn-border"><table className="min-w-full divide-y divide-warelyn-border text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted"><tr>{columns.map((column) => <th className="px-4 py-3" key={column.key}>{column.label}</th>)}</tr></thead><tbody className="divide-y divide-warelyn-border bg-white">{rows.map((row, index) => <tr className="hover:bg-slate-50/70" key={row.id ?? index}>{columns.map((column) => <td className="whitespace-nowrap px-4 py-3" key={column.key}>{row[column.key] ?? '-'}</td>)}</tr>)}</tbody></table></div>}</CardBody></Card>
    </div>
  );
}
