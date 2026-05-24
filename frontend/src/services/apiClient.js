const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api';

let _globalErrorHandler = null;
export function setGlobalErrorHandler(fn) { _globalErrorHandler = fn; }

export async function apiRequest(path, options = {}) {
  const { accessToken, ...fetchOptions } = options;
  const isFormData = fetchOptions.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(fetchOptions.headers ?? {}),
    },
    ...fetchOptions,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = payload?.error?.message ?? 'API request failed.';
    if (_globalErrorHandler) {
      if (response.status === 401) {
        _globalErrorHandler('Session expired. Please log in again.', 'error');
      } else if (response.status === 403) {
        _globalErrorHandler('You do not have permission for this action.', 'error');
      } else if (response.status >= 500) {
        _globalErrorHandler(errorMessage, 'error');
      }
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function getHealth() {
  return apiRequest('/health');
}
