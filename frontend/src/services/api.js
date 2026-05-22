const API_URL = 'http://localhost:5000/api';

/**
 * Custom error class for API failures
 */
export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Centralized apiFetch helper
 * @param {string} endpoint - The relative API path (e.g. '/inventory/units' or '/outbound/orders')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} Response json normalized
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('wms_token');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${normalizedEndpoint}`;

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    ...options,
    headers,
    method: options.method || 'GET'
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    
    // Auto logout on 401 unauthorized
    if (res.status === 401) {
      localStorage.removeItem('wms_token');
      // Redirect to login page if inside browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new APIError('Session expired. Please log in again.', 401);
    }

    const contentType = res.headers.get('content-type');
    let data = {};
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    }

    if (!res.ok) {
      throw new APIError(data.message || 'API request failed', res.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof APIError) {
      throw err;
    }
    console.error('Fetch communication failure:', err.message);
    throw new APIError(err.message || 'Network communication failure', 500);
  }
};

export default apiFetch;
