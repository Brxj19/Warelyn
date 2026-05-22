import { ClipboardCheck, Eye, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ActionMenu } from '../components/ui/ActionMenu.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { ScreenToolbar } from '../components/ui/ScreenToolbar.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { TableShell } from '../components/ui/TableShell.jsx';
import { formatDate } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as returnsService from '../services/returnsService.js';

const canWrite = new Set(['TENANT_ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF']);
const statusTabs = ['ALL', 'DRAFT', 'SUBMITTED', 'INSPECTION_PENDING', 'PARTIALLY_PROCESSED', 'PROCESSED', 'CANCELLED'];

export function ReturnsPage({ mode = 'all' }) {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(mode === 'qc' ? 'INSPECTION_PENDING' : 'ALL');
  const [search, setSearch] = useState('');

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

  const filteredReturns = useMemo(() => {
    return returns.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (!search) return true;
      return `${row.return_number} ${row.sales_order_id} ${row.status}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [returns, search, statusFilter]);

  const isQcMode = mode === 'qc';
  return (
    <div className="space-y-6">
      <PageHeader
        kicker={isQcMode ? 'Returns QC' : 'Returns'}
        title={isQcMode ? 'Returns QC queue' : 'Sales returns'}
        description={isQcMode ? 'Review returns waiting for inspection and open the dedicated QC workflow.' : 'Review return records only. Creation and QC processing stay on focused workflow pages.'}
        actions={!isQcMode && canWrite.has(user?.role) ? <Link to="/returns/new"><Button><Plus size={16} />Return</Button></Link> : null}
      />
      <TableShell
        description={`${filteredReturns.length} return(s) in view`}
        emptyAction={!isQcMode && canWrite.has(user?.role) ? <Link to="/returns/new"><Button>Create return</Button></Link> : null}
        emptyDescription={isQcMode ? 'Returns that need inspection will appear here.' : 'Returned items that need inspection will appear here.'}
        emptyTitle={isQcMode ? 'No returns waiting for QC' : 'No returns waiting'}
        error={error}
        isEmpty={filteredReturns.length === 0}
        isLoading={isLoading}
        rowCount={filteredReturns.length}
        title={isQcMode ? 'QC queue' : 'Return queue'}
        toolbar={
          <ScreenToolbar
            onReset={() => {
              setSearch('');
              setStatusFilter(isQcMode ? 'INSPECTION_PENDING' : 'ALL');
            }}
            onSearchChange={setSearch}
            searchPlaceholder="Search return number or sales order"
            searchValue={search}
            tabs={(isQcMode ? ['INSPECTION_PENDING', 'SUBMITTED', 'PARTIALLY_PROCESSED', 'PROCESSED'] : statusTabs).map((status) => ({
              key: status,
              label: status === 'ALL' ? 'All' : status.replaceAll('_', ' '),
              active: statusFilter === status,
              count: status === 'ALL' ? returns.length : returns.filter((row) => row.status === status).length,
              onClick: () => setStatusFilter(status),
            }))}
          />
        }
      >
        <table>
          <thead>
            <tr>
              <th>Return number</th>
              <th>Sales order</th>
              <th>Status</th>
              <th className="text-right">Lines</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredReturns.map((row) => (
              <tr key={row.id}>
                <td><Link className="font-semibold text-warelyn-primary" to={`/returns/${row.id}`}>{row.return_number}</Link></td>
                <td><span className="mono-cell">#{row.sales_order_id}</span></td>
                <td><StatusBadge status={row.status}>{row.status}</StatusBadge></td>
                <td className="number-cell">{row.items.length}</td>
                <td>{formatDate(row.created_at)}</td>
                <td className="text-right">
                  <ActionMenu items={[
                    { label: 'View', icon: Eye, onClick: () => navigate(`/returns/${row.id}`) },
                    ...(canWrite.has(user?.role) && ['SUBMITTED', 'INSPECTION_PENDING'].includes(row.status) ? [{ label: 'Inspect', icon: ClipboardCheck, onClick: () => navigate(`/returns/${row.id}/inspect`) }] : []),
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
