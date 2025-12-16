import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type { ApiResponse } from '../types/api-response';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unified API response format
apiClient.interceptors.response.use(
  (response) => {
    // Check if response is in ApiResponse format
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      'status' in response.data
    ) {
      const apiResponse = response.data as ApiResponse;

      // For successful responses, unwrap the data
      // Keep pagination metadata if present
      if (apiResponse.pagination) {
        // Return paginated response with data and meta
        return {
          ...response,
          data: {
            data: apiResponse.data,
            meta: {
              total: apiResponse.pagination.total,
              page: apiResponse.pagination.pageNumber,
              limit: apiResponse.pagination.pageSize,
              totalPages: apiResponse.pagination.totalPages,
            },
          },
        };
      }

      // For non-paginated responses, just return the unwrapped data
      return {
        ...response,
        data: apiResponse.data,
      };
    }

    // If not in ApiResponse format, return as is (backwards compatibility)
    return response;
  },
  (error) => {
    // Handle unified error response format
    if (error.response?.data && typeof error.response.data === 'object') {
      const apiError = error.response.data as ApiResponse;

      // If it's a unified error response, extract the error details
      if ('error' in apiError && 'message' in apiError) {
        // Store error details for better error handling
        error.message = apiError.message;
        error.errorDetails = apiError.error;
      }
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      // Don't redirect if we are already on the login or signup page
      if (
        window.location.pathname === '/login' ||
        window.location.pathname === '/signup'
      ) {
        return Promise.reject(error);
      }
      // Clear token and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
