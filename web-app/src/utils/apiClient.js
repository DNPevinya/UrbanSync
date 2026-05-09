export const apiFetch = async (url, options = {}) => {
  // 1. Grab the token directly from where Login.jsx saved it
  const token = localStorage.getItem('urbanSyncToken'); 

  // 2. Prepare the headers (keep any existing ones, add our token)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`; // Attach the VIP Pass
  }

  // 3. Perform the actual fetch
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 4. Global Security Net: Kick to login if token is expired/invalid
  if (response.status === 401 || response.status === 403) {
    console.error("Security Token expired or invalid. Redirecting to login.");
    localStorage.removeItem('urbanSyncUser');
    localStorage.removeItem('urbanSyncToken'); // Clear the token too
    window.location.href = '/login'; 
  }

  return response;
};