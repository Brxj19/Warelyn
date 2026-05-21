import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { MainLayout } from '../layouts/MainLayout.jsx';
import { CatalogPage } from '../pages/CatalogPage.jsx';
import { BrandsPage, CategoriesPage, CustomersPage, ProductsPage, VendorsPage } from '../pages/CatalogMasterPages.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { PackageDetailPage } from '../pages/PackageDetailPage.jsx';
import { PickTaskDetailPage } from '../pages/PickTaskDetailPage.jsx';
import { PickTasksPage } from '../pages/PickTasksPage.jsx';
import { ProductImportPage } from '../pages/ProductImportPage.jsx';
import { PurchaseOrderDetailPage } from '../pages/PurchaseOrderDetailPage.jsx';
import { PurchaseOrderFormPage } from '../pages/PurchaseOrderFormPage.jsx';
import { PurchaseReceiptDetailPage } from '../pages/PurchaseReceiptDetailPage.jsx';
import { PurchaseReceivePage } from '../pages/PurchaseReceivePage.jsx';
import { PurchasesPage } from '../pages/PurchasesPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { SalesFulfillPage } from '../pages/SalesFulfillPage.jsx';
import { SalesFulfillmentDetailPage } from '../pages/SalesFulfillmentDetailPage.jsx';
import { SalesOrderDetailPage } from '../pages/SalesOrderDetailPage.jsx';
import { SalesOrderFormPage } from '../pages/SalesOrderFormPage.jsx';
import { SalesPackagePage } from '../pages/SalesPackagePage.jsx';
import { SalesPage } from '../pages/SalesPage.jsx';
import { SalesPickPage } from '../pages/SalesPickPage.jsx';
import { WarehouseDetailPage } from '../pages/WarehouseDetailPage.jsx';
import { WarehousesPage } from '../pages/WarehousesPage.jsx';
import { GuestRoute } from './GuestRoute.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/products" element={<ProductsPage />} />
          <Route path="catalog/products/import" element={<ProductImportPage />} />
          <Route path="catalog/categories" element={<CategoriesPage />} />
          <Route path="catalog/brands" element={<BrandsPage />} />
          <Route path="catalog/vendors" element={<VendorsPage />} />
          <Route path="catalog/customers" element={<CustomersPage />} />
          <Route path="warehouses" element={<WarehousesPage />} />
          <Route path="warehouses/:id" element={<WarehouseDetailPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="purchases/new" element={<PurchaseOrderFormPage />} />
          <Route path="purchases/:id" element={<PurchaseOrderDetailPage />} />
          <Route path="purchases/:id/receive" element={<PurchaseReceivePage />} />
          <Route path="purchase-receipts/:id" element={<PurchaseReceiptDetailPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales/new" element={<SalesOrderFormPage />} />
          <Route path="sales/:id" element={<SalesOrderDetailPage />} />
          <Route path="sales/:id/pick" element={<SalesPickPage />} />
          <Route path="sales/:id/package" element={<SalesPackagePage />} />
          <Route path="sales/:id/fulfill" element={<SalesFulfillPage />} />
          <Route path="pick-tasks" element={<PickTasksPage />} />
          <Route path="pick-tasks/:id" element={<PickTaskDetailPage />} />
          <Route path="packages/:id" element={<PackageDetailPage />} />
          <Route path="sales-fulfillments/:id" element={<SalesFulfillmentDetailPage />} />
          <Route path="inventory" element={<DashboardPage />} />
          <Route path="reports" element={<DashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Route>
      <Route path="/auth" element={<Navigate replace to="/login" />} />
    </Routes>
  );
}
