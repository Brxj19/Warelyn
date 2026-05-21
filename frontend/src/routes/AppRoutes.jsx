import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { MainLayout } from '../layouts/MainLayout.jsx';
import { CatalogPage } from '../pages/CatalogPage.jsx';
import { BrandsPage, CategoriesPage, CustomersPage, ProductsPage, VendorsPage } from '../pages/CatalogMasterPages.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
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
          <Route path="catalog/categories" element={<CategoriesPage />} />
          <Route path="catalog/brands" element={<BrandsPage />} />
          <Route path="catalog/vendors" element={<VendorsPage />} />
          <Route path="catalog/customers" element={<CustomersPage />} />
          <Route path="warehouses" element={<WarehousesPage />} />
          <Route path="warehouses/:id" element={<WarehouseDetailPage />} />
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
