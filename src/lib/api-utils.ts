/**
 * Utility functions for handling API requests and errors.
 */

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
  message?: string;
}

/**
 * Handle API errors in a consistent way
 * @param error The error object from a catch block
 * @returns A standardized error response
 */
export function handleApiError(error: any): ApiResponse {
  console.error("API Error:", error);
  
  // Handle Axios errors
  if (error.response) {
    return {
      error: error.response.data?.error || "Server error",
      status: error.response.status,
      message: error.response.data?.message || error.message
    };
  }
  
  // Handle network errors
  if (error.request) {
    return {
      error: "Network error",
      message: "Could not connect to the server"
    };
  }
  
  // Handle other errors
  return {
    error: "Error",
    message: error.message || "An unknown error occurred"
  };
}

/**
 * Create a successful API response
 * @param data The data to include in the response
 * @returns A standardized success response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    status: 200
  };
}

/**
 * Create an error API response
 * @param message Error message
 * @param status HTTP status code
 * @returns A standardized error response
 */
export function createErrorResponse(message: string, status: number = 500): ApiResponse {
  return {
    error: "Error",
    message,
    status
  };
} 