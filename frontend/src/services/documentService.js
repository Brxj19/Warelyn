import { apiRequest } from './apiClient.js';

function downloadPath(path, accessToken) {
  return fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  }).then(async (response) => {
    if (!response.ok) {
      let message = 'Download failed.';
      try {
        const payload = await response.json();
        message = payload?.error?.message ?? message;
      } catch {}
      throw new Error(message);
    }
    return response.blob();
  });
}

export function listInvoices(accessToken) {
  return apiRequest('/invoices', { accessToken });
}

export function createInvoice(accessToken, payload) {
  return apiRequest('/invoices', { accessToken, method: 'POST', body: JSON.stringify(payload) });
}

export function getInvoice(accessToken, id) {
  return apiRequest(`/invoices/${id}`, { accessToken });
}

export function sendInvoice(accessToken, id, email) {
  return apiRequest(`/invoices/${id}/send`, { accessToken, method: 'POST', body: JSON.stringify({ email }) });
}

export function markInvoicePaid(accessToken, id) {
  return apiRequest(`/invoices/${id}/mark-paid`, { accessToken, method: 'POST', body: JSON.stringify({}) });
}

export function voidInvoice(accessToken, id) {
  return apiRequest(`/invoices/${id}/void`, { accessToken, method: 'POST', body: JSON.stringify({}) });
}

export function downloadInvoicePdf(accessToken, id) {
  return downloadPath(`/invoices/${id}/pdf`, accessToken);
}

export function listBills(accessToken) {
  return apiRequest('/bills', { accessToken });
}

export function createBill(accessToken, payload) {
  return apiRequest('/bills', { accessToken, method: 'POST', body: JSON.stringify(payload) });
}

export function getBill(accessToken, id) {
  return apiRequest(`/bills/${id}`, { accessToken });
}

export function sendBill(accessToken, id, email) {
  return apiRequest(`/bills/${id}/send`, { accessToken, method: 'POST', body: JSON.stringify({ email }) });
}

export function markBillPaid(accessToken, id) {
  return apiRequest(`/bills/${id}/mark-paid`, { accessToken, method: 'POST', body: JSON.stringify({}) });
}

export function voidBill(accessToken, id) {
  return apiRequest(`/bills/${id}/void`, { accessToken, method: 'POST', body: JSON.stringify({}) });
}

export function downloadBillPdf(accessToken, id) {
  return downloadPath(`/bills/${id}/pdf`, accessToken);
}

export function listDocumentTemplates(accessToken, channel = '') {
  const query = channel ? `?channel=${encodeURIComponent(channel)}` : '';
  return apiRequest(`/document-templates${query}`, { accessToken });
}

export function updateDocumentTemplate(accessToken, id, payload) {
  return apiRequest(`/document-templates/${id}`, { accessToken, method: 'PATCH', body: JSON.stringify(payload) });
}

export function previewDocumentTemplate(accessToken, id, payload) {
  return apiRequest(`/document-templates/${id}/preview`, { accessToken, method: 'POST', body: JSON.stringify(payload) });
}
