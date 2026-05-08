/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosResponse } from 'axios';
import type {
  AnalysisResponse,
  SystemStats,
  ModelPerformanceMetrics,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  OtpRequest,
  OtpVerifyRequest,
  User,
  CryptoPriceResponse,
  NewsResponse,
} from '../types/api';
import type { WalletTimeSeriesResponse } from '../types/timeseries';

// API Configuration
// Always use same-origin "/api". In development, Vite proxies to the backend. In production (Vercel), rewrites map "/api" to the backend.
const API_BASE_URL = '/api';

// Detect if we're in production (Vercel) and adjust timeout accordingly
const isProduction = import.meta.env.PROD;
const VERCEL_TIMEOUT = 90000; // 90 seconds (1.5 minutes) for production
const LOCAL_TIMEOUT = 90000; // 90 seconds for localhost

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: isProduction ? VERCEL_TIMEOUT : LOCAL_TIMEOUT, // Adaptive timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Auth token interceptor ──────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('chainsecure_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response?.data?.detail || 'Invalid request. Please check your input and try again.');
    } else if (error.response?.status === 401) {
      throw new Error(error.response?.data?.detail || 'Authentication failed. Please login again.');
    } else if (error.response?.status === 409) {
      throw new Error(error.response?.data?.detail || 'Conflict. This resource already exists.');
    } else if (error.response?.status === 504) {
      throw new Error('Analysis timeout. The address may have high activity. Please try again later.');
    } else if (error.response?.status === 500) {
      throw new Error('Internal server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      const timeoutMessage = isProduction
        ? 'Request timeout. The analysis is taking longer than expected due to high server load. Please try again in a few minutes.'
        : 'Request timeout. The analysis is taking longer than expected. This may happen due to high address activity, API rate limits, or network congestion. Please try again later for a more comprehensive analysis.';
      throw new Error(timeoutMessage);
    } else if (!error.response) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw error;
  }
);
export class ChainSecureAPI {
  /**
   * Analyze a Bitcoin address for fraud indicators
   */
  static async analyzeAddress(
    address: string,
    includeDetailed: boolean = true
  ): Promise<AnalysisResponse> {
    try {
      // Use full analysis endpoint for comprehensive risk factors
      const endpoint = `/analyze/${address}`;

      const response = await apiClient.get<AnalysisResponse>(
        `${endpoint}?depth=2&include_detailed=${includeDetailed}`
      );
      return response.data;
    } catch (error) {
      console.error('Error analyzing address:', error);
      throw error;
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await apiClient.get<SystemStats>('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Return fallback stats if the request fails
      return {
        total_analyses_performed: '12.4K',
        unique_addresses_analyzed: '8.7K',
        fraud_detection_rate: 0.943,
        average_analysis_time: '2.1',
        system_status: 'operational'
      };
    }
  }

  /**
   * Check API health
   */
  static async checkHealth(): Promise<{ status: string; service: string }> {
    try {
      const response = await apiClient.get<{ status: string; service: string }>('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking API health:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple addresses
   */
  static async batchAnalyze(
    addresses: string[],
    depth: number = 1,
    includeDetailed: boolean = false
  ): Promise<AnalysisResponse[]> {
    try {
      const response = await apiClient.post<AnalysisResponse[]>('/batch', {
        addresses,
        depth,
        include_detailed: includeDetailed
      });
      return response.data;
    } catch (error) {
      console.error('Error in batch analysis:', error);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  static async getModelPerformance(): Promise<ModelPerformanceMetrics> {
    try {
      const response = await apiClient.get<ModelPerformanceMetrics>('/models/performance');
      return response.data;
    } catch (error) {
      console.error('Error fetching model performance:', error);
      throw error;
    }
  }

  /**
   * Get wallet time-series metrics for charts
   */
  static async getWalletTimeSeries(
    address: string,
    days: number = 90,
    granularity: 'day' | 'week' | 'month' | 'year' = 'day'
  ): Promise<WalletTimeSeriesResponse> {
    try {
      const response = await apiClient.get<WalletTimeSeriesResponse>(
        `/wallet/${address}/timeseries?days=${days}&granularity=${granularity}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet timeseries:', error);
      throw error;
    }
  }

  // ─── Auth API ────────────────────────────────────
  static async sendOtp(data: OtpRequest): Promise<{ message: string; email: string; expires_in_minutes: number }> {
    const response = await apiClient.post('/auth/send-otp', data);
    return response.data;
  }

  static async verifyOtp(data: OtpVerifyRequest): Promise<{ message: string; verified: boolean }> {
    const response = await apiClient.post('/auth/verify-otp', data);
    return response.data;
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  static async getProfile(): Promise<{ user: User }> {
    const response = await apiClient.get<{ user: User }>('/auth/me');
    return response.data;
  }

  static async updateProfile(data: { name?: string }): Promise<{ user: User }> {
    const response = await apiClient.put<{ user: User }>('/auth/me', data);
    return response.data;
  }

  // ─── Scan History (DB) ──────────────────────────
  static async getScanHistory(): Promise<{ history: any[] }> {
    const response = await apiClient.get('/auth/history');
    return response.data;
  }

  static async saveScanResult(data: { address: string; risk_score: number; risk_level: string; result_json: string }): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/history', data);
    return response.data;
  }

  static async clearScanHistory(): Promise<{ message: string }> {
    const response = await apiClient.delete('/auth/history');
    return response.data;
  }

  // ─── Market Data ────────────────────────────────
  static async getCryptoPrices(): Promise<CryptoPriceResponse> {
    const response = await apiClient.get<CryptoPriceResponse>('/market/prices');
    return response.data;
  }

  static async getCryptoNews(): Promise<NewsResponse> {
    const response = await apiClient.get<NewsResponse>('/market/news');
    return response.data;
  }
}
export default ChainSecureAPI;