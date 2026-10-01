import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Global Axios instance configured with interceptors for authentication
 */
export const apiClient = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : process.env.NEXTAUTH_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for AI generation
});

// Request Interceptor: Attach bearer token or custom headers if needed
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const customToken = localStorage.getItem('hf_app_token');
      if (customToken && !config.headers['X-HF-Token']) {
        config.headers['X-HF-Token'] = customToken;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format errors and handle global auth expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request - Token might be invalid or expired.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
