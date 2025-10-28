export interface NetworkError {
  message: string;
  status?: number;
  code?: string;
  isNetworkError?: boolean;
  isTimeout?: boolean;
}

export class NetworkErrorHandler {
  static async handleRequest<T>(
    requestFn: () => Promise<Response>,
    options: {
      timeout?: number;
      retries?: number;
      retryDelay?: number;
      context?: string;
    } = {}
  ): Promise<T> {
    const {
      timeout = 30000, // 30 seconds default timeout
      retries = 3,
      retryDelay = 1000,
      context = 'Request'
    } = options;

    let lastError: NetworkError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await Promise.race([
          requestFn(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error: NetworkError = {
            message: this.getErrorMessage(response.status, errorData.error, context),
            status: response.status,
            code: errorData.code,
            isNetworkError: true
          };
          
          // Don't retry on client errors (4xx) except 408, 429
          if (response.status >= 400 && response.status < 500 && 
              response.status !== 408 && response.status !== 429) {
            throw error;
          }
          
          lastError = error;
        } else {
          return await response.json();
        }
      } catch (error) {
        const networkError: NetworkError = {
          message: this.parseErrorMessage(error, context),
          isNetworkError: true,
          isTimeout: error instanceof Error && error.message.includes('timeout')
        };
        
        lastError = networkError;
        
        // Don't retry on certain errors
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          lastError.message = `${context} failed: Please check your internet connection and try again.`;
          break;
        }
      }

      // Wait before retrying (except on last attempt)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    throw lastError;
  }

  static getErrorMessage(status: number, errorMessage?: string, context = 'Request'): string {
    const defaultMessage = errorMessage || 'An unexpected error occurred';
    
    switch (status) {
      case 400:
        return `${context} failed: ${defaultMessage}`;
      case 401:
        return 'Authentication required. Please sign in again.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return `${context} failed: The requested resource was not found.`;
      case 408:
        return `${context} timed out. Please try again.`;
      case 409:
        return `${context} failed: ${defaultMessage}`;
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return `${context} failed: Server error. Please try again later.`;
      case 502:
        return `${context} failed: Service temporarily unavailable. Please try again.`;
      case 503:
        return `${context} failed: Service temporarily unavailable. Please try again later.`;
      case 504:
        return `${context} timed out. Please try again.`;
      default:
        return `${context} failed: ${defaultMessage}`;
    }
  }

  static parseErrorMessage(error: any, context = 'Request'): string {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return `${context} timed out. Please check your connection and try again.`;
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        return `${context} failed: Please check your internet connection and try again.`;
      }
      return error.message.startsWith(context) ? error.message : `${context} failed: ${error.message}`;
    }
    return `${context} failed: An unexpected error occurred. Please try again.`;
  }

  static isRetryable(error: NetworkError): boolean {
    if (error.isTimeout) return true;
    if (error.status && error.status >= 500) return true;
    if (error.status === 408 || error.status === 429) return true;
    return false;
  }

  static getRetryDelay(attempt: number, baseDelay = 1000): number {
    // Exponential backoff with jitter
    const delay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, 10000); // Max 10 seconds
  }
}

// Utility function for common fetch patterns
export const fetchWithErrorHandling = async <T>(
  url: string,
  options: RequestInit & {
    timeout?: number;
    retries?: number;
    context?: string;
  } = {}
): Promise<T> => {
  const { timeout, retries, context, ...fetchOptions } = options;
  
  return NetworkErrorHandler.handleRequest<T>(
    () => fetch(url, fetchOptions),
    { timeout, retries, context: context || `Request to ${url}` }
  );
};