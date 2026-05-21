import { apiRequest } from './apiClient.js';

export function listCategories(accessToken) {
  return apiRequest('/catalog/categories', { accessToken });
}

export function createCategory(accessToken, payload) {
  return apiRequest('/catalog/categories', { accessToken, method: 'POST', body: JSON.stringify(payload) });
}

export function listBrands(accessToken) {
  return apiRequest('/catalog/brands', { accessToken });
}

export function createBrand(accessToken, payload) {
  return apiRequest('/catalog/brands', { accessToken, method: 'POST', body: JSON.stringify(payload) });
}

export function listVendors(accessToken) {
  return apiRequest('/catalog/vendors', { accessToken });
}

export function createVendor(accessToken, payload) {
  return apiRequest('/catalog/vendors', { accessToken, method: 'POST', body: JSON.stringify(payload) });
}

export function listCustomers(accessToken) {
  return apiRequest('/catalog/customers', { accessToken });
}

export function createCustomer(accessToken, payload) {
  return apiRequest('/catalog/customers', { accessToken, method: 'POST', body: JSON.stringify(payload) });
}

export function listProducts(accessToken) {
  return apiRequest('/catalog/products', { accessToken });
}

export function createProduct(accessToken, payload) {
  return apiRequest('/catalog/products', { accessToken, method: 'POST', body: JSON.stringify(payload) });
}
