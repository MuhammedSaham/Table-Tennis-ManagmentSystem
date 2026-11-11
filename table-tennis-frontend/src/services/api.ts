import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const getProfileImageUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/api\/v1\/?$/, '');
  return `${backendBase}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle validation errors from backend
    if (error.response?.data?.errors) {
      // Let the component handle specific field errors
      return Promise.reject(error);
    }
    
    // Handle specific error codes with user-friendly messages
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const isAuthPage = ['/login', '/register', '/reset-password', '/verify-email'].includes(window.location.pathname);
      if (hadToken && !isAuthPage) {
        toast.error('Your session has expired. Please login again.', { id: 'session-expired' });
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to do that.");
    } else if (error.response?.status === 404) {
      toast.error('The requested resource was not found.');
    } else if (error.response?.status === 409) {
      toast.error('This item already exists.');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Our team has been notified.');
    } else if (error.response?.data?.message) {
      // Show backend error message if available
      toast.error(error.response.data.message);
    } else if (error.message === 'Network Error') {
      toast.error('Cannot connect to server. Please check if backend is running.');
    } else {
      toast.error('Something went wrong. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

export default api;