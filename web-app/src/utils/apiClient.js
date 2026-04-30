export const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('urbanSyncToken');
  
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  
    const response = await fetch(url, { ...options, headers });
  
    // Global kickout logic for expired/invalid tokens
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('urbanSyncToken');
      localStorage.removeItem('urbanSyncUser');
      window.location.href = '/login';
    }
  
    return response;
  };
