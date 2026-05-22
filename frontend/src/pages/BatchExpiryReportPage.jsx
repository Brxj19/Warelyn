import * as reportsService from '../services/reportsService.js';
import { SimpleReportPage } from './ReportsPage.jsx';

const columns = [{ key: 'batch_number', label: 'Batch' }, { key: 'product_name', label: 'Product' }, { key: 'sku', label: 'SKU' }, { key: 'warehouse_name', label: 'Warehouse' }, { key: 'location_name', label: 'Location' }, { key: 'expiry_date', label: 'Expiry' }, { key: 'quantity_on_hand', label: 'On hand' }, { key: 'quantity_available', label: 'Available' }, { key: 'status', label: 'Batch status' }, { key: 'days_to_expiry', label: 'Days' }, { key: 'expiry_status', label: 'Expiry status' }];

export function BatchExpiryReportPage() {
  return <SimpleReportPage title="Batch expiry" description="Backend batch expiry report with expired and expiring-soon states." load={reportsService.getBatchExpiry} columns={columns} />;
}
