// api.js - Our helper for communicating with the backend server
//
// Instead of writing the same "fetch data from server" code in every component,
// we set it up once here and import it where needed.
//
// Think of this like a helper class in Java that handles all network requests.
// axios is a library that makes HTTP requests easier than the built-in fetch().

import axios from 'axios';

// The URL where our Express backend server is running
// Both our React app (port 3000) and Express server (port 5000) run locally
const API_URL = 'http://localhost:5000';

// Create an axios "instance" with our base URL pre-set
// This means we can write api.get('/api/courses') instead of
// axios.get('http://localhost:5000/api/courses') every time
const api = axios.create({
  baseURL: API_URL
});

// An "interceptor" runs before every request we make
// This one automatically adds the user's login token to every request
// So we don't have to remember to add it in each component
api.interceptors.request.use((config) => {
  // Check if there's a token saved in the browser's localStorage
  const token = localStorage.getItem('token');

  if (token) {
    // Add it to the Authorization header
    // The backend's verifyToken middleware will read this
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config; // Return the modified config so the request continues
});

// This interceptor handles responses - if we get a 401 (unauthorized),
// it means the token expired, so we clear it and reload to send the user to login
api.interceptors.response.use(
  (response) => response, // On success, just return the response normally
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - clear storage and go back to login page
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error); // Re-throw so individual components can catch it too
  }
);

export default api;
