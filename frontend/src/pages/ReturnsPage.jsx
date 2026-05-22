import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as returnsService from '../services/returnsService.js';

const statusTone = { DRAFT: 'neutral', SUBMITTED: 'primary', INSPECTION_PENDING: 'warning', PARTIALLY_PROCESSED: 'warning', PROCESSED: 'success', CANCELLED: 'danger' };
const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);

export function ReturnsPage() {
  const { accessToken, user } = useAuth();
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        setReturns(await returnsService.listSalesReturns(accessToken));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="primary">Returns QC</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Sales returns</h1>
          <p className="mt-2 text-sm text-warelyn-muted">Inspect customer returns before stock is restocked, blocked, damaged, scrapped, or rejected.</p>
        </div>
        {canWrite.has(user?.role) ? <Link to="/returns/new"><Button>New return</Button></Link> : null}
      </div>
      {error ? <ErrorState description={error} /> : null}
      <Card>
        <CardBody>
          {returns.length === 0 ? <EmptyState title="No returns" description="Create a sales return from a fulfilled sales order." /> : (
            <div className="overflow-hidden rounded-xl border border-warelyn-border">
              <table className="min-w-full divide-y divide-warelyn-border text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-warelyn-muted"><tr><th className="px-4 py-3">Return</th><th className="px-4 py-3">Sales order</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Lines</th><th className="px-4 py-3">Created</th></tr></thead>
                <tbody className="divide-y divide-warelyn-border bg-white">
                  {returns.map((row) => <tr key={row.id}><td className="px-4 py-3 font-semibold text-warelyn-primary"><Link to={`/returns/${row.id}`}>{row.return_number}</Link></td><td className="px-4 py-3">#{row.sales_order_id}</td><td className="px-4 py-3"><Badge tone={statusTone[row.status] ?? 'neutral'}>{row.status}</Badge></td><td className="px-4 py-3">{row.items.length}</td><td className="px-4 py-3 text-warelyn-muted">{new Date(row.created_at).toLocaleDateString()}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
