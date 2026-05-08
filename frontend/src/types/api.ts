// API Response Types for ChainSecure
export interface BitcoinAddress {
  address: string;
  risk_score: number;
  risk_level: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  is_flagged: boolean;
  confidence: number;
  fraud_probability?: number;
  risk_factors?: string[];
  positive_indicators?: string[];
}

export interface AnalysisSummary {
  transaction_count: number;
  total_received_btc: number;
  total_sent_btc: number;
  current_balance_btc: number;
  risk_indicators: number;
  network_centrality?: number;
  cluster_size?: number;
}

export interface ModelPerformance {
  ensemble_confidence: number;
  model_count: number;
  agreement_score: number;
}

export interface DataLimitations {
  rate_limit_detected: boolean;
  real_time_data: boolean;
  api_status: string;
  description?: string;
  accuracy_note?: string;
  recommendation?: string;
}

export interface DetailedAnalysis {
  blockchain_analysis: Record<string, unknown>;
  ml_prediction: Record<string, unknown>;
}

export interface ModelPerformanceMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  ensemble_confidence?: number;
  model_count?: number;
  agreement_score?: number;
  [key: string]: unknown;
}

export interface AnalysisResponse {
  address: string;
  risk_score: number;
  risk_level: string;
  is_flagged: boolean;
  confidence: number;
  fraud_probability?: number;
  risk_factors?: string[];
  positive_indicators?: string[];
  analysis_summary: AnalysisSummary;
  model_performance?: ModelPerformance;
  data_limitations?: DataLimitations;
  detailed_analysis?: DetailedAnalysis;
  timestamp: string;
}

export interface SystemStats {
  total_analyses_performed: string | number;
  unique_addresses_analyzed: string | number;
  fraud_detection_rate: number;
  average_analysis_time: string | number;
  system_status: string;
  api_version?: string;
  last_updated?: string;
}

export interface ApiError {
  error: string;
  message: string;
  detail?: string;
  status_code?: number;
}

// Form Types
export interface AddressAnalysisForm {
  address: string;
  include_detailed: boolean;
}

// UI State Types
export interface LoadingState {
  analyzing: boolean;
  loadingStats: boolean;
}

export interface UIAlert {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  id: string;
}

// ── Auth Types ──────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface OtpRequest {
  email: string;
  name: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp_code: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// ── Market / Prices Types ────────────────────────
export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  color: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

export interface CryptoPriceResponse {
  coins: CryptoPrice[];
  updated_at: string;
  currency: string;
  stale?: boolean;
}

// ── News Types ──────────────────────────────────
export interface NewsCurrency {
  code: string;
  title: string;
}

export interface NewsItem {
  id: number;
  title: string;
  url: string;
  source: string;
  source_domain: string;
  published_at: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  currencies: NewsCurrency[];
  votes: {
    positive: number;
    negative: number;
  };
}

export interface NewsResponse {
  articles: NewsItem[];
  updated_at: string;
  error?: string;
}

// ── Scan History (DB-backed) ────────────────────
export interface ScanHistoryEntry {
  id: number;
  address: string;
  risk_score: number;
  risk_level: string;
  result: AnalysisResponse | null;
  scanned_at: string;
}