import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error has response from server
    if (error.response) {
      const { status, data } = error.response;
      
      // Auto logout on 401 Unauthorized (unless it's a login attempt)
      if (status === 401 && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        toast.error('Session expired. Please log in again.');
      } 
      // Handle other API errors
      else if (data && data.error) {
        toast.error(data.error);
      } else {
        toast.error(`Server error: ${status}`);
      }
    } else if (error.request) {
      // Network error or no response
      toast.error('Network error. Unable to reach server.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
