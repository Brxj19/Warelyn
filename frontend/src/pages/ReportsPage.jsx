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
      <div><Badge tone="primary">Reports</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Operational reports</h1><p className="mt-2 text-sm text-warelyn-muted">Read-only reporting from backend inventory, ledger, batch, serial, returns, purchasing, and sales data.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reportLinks.map(([title, to, description]) => <Link className="block" key={to} to={to}><Card className="h-full transition hover:border-warelyn-primary"><CardBody><h2 className="font-semibold text-warelyn-text">{title}</h2><p className="mt-2 text-sm leading-6 text-warelyn-muted">{description}</p></CardBody></Card></Link>)}</div>
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

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error} />;
  const sourceRows = loadRows ? loadRows(data) : data;
  const rows = Array.isArray(sourceRows) ? sourceRows.map(normalize) : [];

  return (
    <div className="space-y-6">
      <div><Badge tone="primary">Report</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">{title}</h1><p className="mt-2 text-sm text-warelyn-muted">{description}</p></div>
      {summary ? summary(data) : null}
      <Card><CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Results</h2></CardHeader><CardBody>{rows.length === 0 ? <EmptyState title="No report rows" description="No data matched this report." /> : <div className="overflow-x-auto rounded-xl border border-warelyn-border"><table className="min-w-full divide-y divide-warelyn-border text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted"><tr>{columns.map((column) => <th className="px-4 py-3" key={column.key}>{column.label}</th>)}</tr></thead><tbody className="divide-y divide-warelyn-border bg-white">{rows.map((row, index) => <tr key={row.id ?? index}>{columns.map((column) => <td className="whitespace-nowrap px-4 py-3" key={column.key}>{row[column.key] ?? '-'}</td>)}</tr>)}</tbody></table></div>}</CardBody></Card>
    </div>
  );
}
