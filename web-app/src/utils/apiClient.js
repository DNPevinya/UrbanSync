export const apiFetch = async (url, options = {}) => {
  //  Grab the token directly from where Login.jsx saved it
  const token = localStorage.getItem('urbanSyncToken'); 

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`; 
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    console.error("Security Token expired or invalid. Redirecting to login.");
    localStorage.removeItem('urbanSyncUser');
    localStorage.removeItem('urbanSyncToken');
    window.location.href = '/login'; 
  }

  return response;
};