import * as reportsService from '../services/reportsService.js';
import { SimpleReportPage } from './ReportsPage.jsx';

const columns = [{ key: 'warehouse_name', label: 'Warehouse' }, { key: 'product_name', label: 'Product' }, { key: 'sku', label: 'SKU' }, { key: 'on_hand', label: 'On hand' }, { key: 'reserved', label: 'Reserved' }, { key: 'available', label: 'Available' }, { key: 'stock_value', label: 'Value' }, { key: 'stock_status', label: 'Status' }];

export function WarehouseStockReportPage() {
  return <SimpleReportPage title="Warehouse stock" description="Backend warehouse stock projection by SKU." load={reportsService.getWarehouseStock} columns={columns} />;
}
