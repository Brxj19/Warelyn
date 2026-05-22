import { Card, CardBody } from '../components/ui/Card.jsx';
import * as reportsService from '../services/reportsService.js';
import { SimpleReportPage } from './ReportsPage.jsx';

const columns = [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }];

export function InventorySummaryReportPage() {
  return <SimpleReportPage title="Inventory summary" description="Backend-calculated inventory KPIs and exception counts." load={reportsService.getInventorySummary} columns={columns} normalize={(row) => row} summary={(data) => <Card><CardBody className="grid gap-4 md:grid-cols-4">{Object.entries(data ?? {}).map(([key, value]) => <div key={key}><p className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">{key.replaceAll('_', ' ')}</p><p className="mt-1 text-xl font-bold text-warelyn-text">{value}</p></div>)}</CardBody></Card>} />;
}
