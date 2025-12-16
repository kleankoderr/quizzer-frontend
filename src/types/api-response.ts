/**
 * Pagination metadata for paginated API responses
 */
export interface PaginationMeta {
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  total: number;
}

/**
 * Error details that can be a string or validation errors object
 */
export type ApiError = string | Record<string, any> | null;

/**
 * Unified API response structure
 * @template T - Type of the data payload
 */
export interface ApiResponse<T = any> {
  message: string;
  status: number;
  error: ApiError;
  data: T | null;
  pagination?: PaginationMeta;
}

/**
 * Paginated response type helper
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}
