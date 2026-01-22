import axios, {
  type AxiosInstance,
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { API_BASE_URL } from '../config/api';
import type { ApiResponse, PaginationMeta } from '../types/api-response';

// Token management utilities
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class TokenService {
  static getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('user');
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: true, // Include cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenService.getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response type guards
function isApiResponse<T = any>(data: unknown): data is ApiResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    'status' in data &&
    'error' in data &&
    'data' in data
  );
}

// Fixed type predicate - check pagination on the actual response object
function hasPagination<T = any>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { pagination: PaginationMeta } {
  return (
    'pagination' in response &&
    response.pagination !== undefined &&
    response.pagination !== null
  );
}

// Transformed response types for frontend consumption
interface TransformedPaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
}

// Transform API response - unwrap data from unified response
function transformResponse<T = any>(response: AxiosResponse): AxiosResponse {
  const responseData = response.data;

  // If not in ApiResponse format, return as-is (backwards compatibility)
  if (!isApiResponse<T>(responseData)) {
    return response;
  }

  // For paginated responses, keep both data and pagination metadata
  if (hasPagination(responseData)) {
    const transformed: TransformedPaginatedResponse<any> = {
      data: Array.isArray(responseData.data) ? responseData.data : [],
      meta: {
        page: responseData.pagination.pageNumber,
        limit: responseData.pagination.pageSize,
        totalPages: responseData.pagination.totalPages,
        total: responseData.pagination.total,
      },
    };

    return {
      ...response,
      data: transformed,
    };
  }

  // For non-paginated responses, unwrap and return just the data
  return {
    ...response,
    data: responseData.data,
  };
}

// Check if current route is public
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  return publicRoutes.some(route => pathname.startsWith(route));
}

// Handle authentication errors
function handleAuthError(): void {
  // Skip redirect if on public routes
  if (isPublicRoute(globalThis.location.pathname)) {
    return;
  }

  // Clear tokens and redirect to login
  TokenService.clearTokens();

  // Store the current URL for redirect after login
  const currentPath = globalThis.location.pathname + globalThis.location.search;
  if (currentPath !== '/') {
    sessionStorage.setItem('redirect_after_login', currentPath);
  }

  globalThis.location.href = '/login';
}

// Extract error details from API response
function extractErrorDetails(error: AxiosError): {
  message: string;
  details: unknown;
} {
  const data = error.response?.data;

  // Check if response is in ApiResponse format
  if (isApiResponse(data)) {
    return {
      message: data.message,
      details: data.error,
    };
  }

  // Fallback for non-standard error responses
  return {
    message: error.message || 'An unexpected error occurred',
    details: null,
  };
}

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => transformResponse(response),
  (error: AxiosError) => {
    const { message, details } = extractErrorDetails(error);

    // Enhance error object with API error details
    error.message = message;
    (error as any).errorDetails = details;

    // Handle specific HTTP status codes
    switch (error.response?.status) {
      case 401:
        handleAuthError();
        break;

      case 403:
        console.error('Access forbidden:', message);
        break;

      case 429:
        console.warn('Rate limit exceeded:', message);
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        console.error('Server error:', message);
        break;

      default:
        if (error.response?.status && error.response.status >= 400) {
          console.error(`HTTP ${error.response.status}:`, message);
        }
    }

    return Promise.reject(error);
  }
);

// Export token service for use in auth flows
export { TokenService };

// Helper function for setting auth tokens after login
export function setAuthTokens(accessToken: string, refreshToken?: string): void {
  TokenService.setAccessToken(accessToken);
  if (refreshToken) {
    TokenService.setRefreshToken(refreshToken);
  }
}

// Helper function to logout
export function logout(): void {
  TokenService.clearTokens();
  globalThis.location.href = '/login';
}

// Helper to check if error is an API error
export function isApiError(error: unknown): error is AxiosError & { errorDetails?: unknown } {
  return axios.isAxiosError(error) && 'errorDetails' in error;
}

// Helper to check if response is paginated
export function isPaginatedResponse<T>(
  data: unknown
): data is TransformedPaginatedResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'meta' in data &&
    Array.isArray((data as any).data)
  );
}

export default apiClient;