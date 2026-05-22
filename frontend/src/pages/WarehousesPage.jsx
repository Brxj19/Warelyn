import { Link } from 'react-router-dom';

import * as warehouseService from '../services/warehouseService.js';
import { MasterDataPage } from './MasterDataPage.jsx';

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'code', label: 'Code', required: true },
  { name: 'address', label: 'Address' },
];

export function WarehousesPage() {
  return (
    <MasterDataPage
      createRecord={warehouseService.createWarehouse}
      description="Create warehouse master records. Stock quantities are intentionally not tracked here yet."
      fields={fields}
      listRecords={warehouseService.listWarehouses}
      rowLink={(warehouse) => `/warehouses/${warehouse.id}`}
      title="Warehouses"
    />
  );
}

export function WarehouseLink({ warehouse }) {
  return <Link className="font-semibold text-warelyn-primary" to={`/warehouses/${warehouse.id}`}>{warehouse.name}</Link>;
}
