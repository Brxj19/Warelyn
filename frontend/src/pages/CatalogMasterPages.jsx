import { Link } from 'react-router-dom';

import { BarcodeInput } from '../components/forms/BarcodeInput.jsx';
import { Button } from '../components/ui/Button.jsx';
import * as catalogService from '../services/catalogService.js';
import { MasterDataPage } from './MasterDataPage.jsx';

const nameDescriptionFields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'description', label: 'Description' },
];

const partyFields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'gst_number', label: 'GST Number' },
];

const productFields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'sku', label: 'SKU', required: true },
  { name: 'barcode', label: 'Barcode' },
  { name: 'unit', label: 'Unit', defaultValue: 'pcs', required: true },
  { name: 'cost_price', label: 'Cost Price', type: 'number' },
  { name: 'selling_price', label: 'Selling Price', type: 'number' },
];

export function ProductsPage() {
  return (
    <MasterDataPage
      actions={<Link to="/catalog/products/import"><Button>Import Products</Button></Link>}
      createRecord={catalogService.createProduct}
      description="Create product masters without stock quantities or movements. Search by name, SKU, or barcode."
      fields={productFields}
      listRecords={catalogService.listProducts}
      searchPlaceholder="Search products by name, SKU, or barcode"
      title="Products"
      customInputs={{ barcode: BarcodeInput }}
    />
  );
}

export function CategoriesPage() {
  return <MasterDataPage createRecord={catalogService.createCategory} description="Group products using tenant-scoped categories." fields={nameDescriptionFields} listRecords={catalogService.listCategories} title="Categories" />;
}

export function BrandsPage() {
  return <MasterDataPage createRecord={catalogService.createBrand} description="Maintain tenant-scoped product brands." fields={nameDescriptionFields} listRecords={catalogService.listBrands} title="Brands" />;
}

export function VendorsPage() {
  return <MasterDataPage createRecord={catalogService.createVendor} description="Maintain supplier records for purchase workflows." fields={partyFields} listRecords={catalogService.listVendors} title="Vendors" />;
}

export function CustomersPage() {
  return <MasterDataPage createRecord={catalogService.createCustomer} description="Maintain customer records for sales workflows." fields={partyFields} listRecords={catalogService.listCustomers} title="Customers" />;
}
