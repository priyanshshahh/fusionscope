/**
 * FusionScope API Client
 * One typed generic request helper; each method is a thin one-liner over it.
 * Every call fails fast (5s timeout) so callers can fall back to bundled demo
 * data when the backend is unreachable.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: "success" | "error";
}

// Response shapes mirror backend/app/schemas/country.py.
export interface ApiRiskScores {
  water_stress: number;
  drought: number;
  flood: number;
  food_insecurity: number;
  migration_pressure: number;
  infrastructure_disruption: number;
}

export interface ApiDimensions {
  hazard_exposure: number;
  vulnerability: number;
  coping_capacity: number;
}

export interface ApiCountry {
  code: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  risks: ApiRiskScores;
  dimensions: ApiDimensions;
  fusion_score: number;
  severity: string;
  ai_summary: string;
  data_source: string;
  estimated_vectors: string[];
  updated_at: string;
}

export interface ApiAlert {
  id: string;
  country_code: string;
  country_name: string;
  title: string;
  category: string;
  severity: string;
  summary: string;
  timestamp: string;
  source: string;
  source_url: string;
}

export interface ApiFeedItem {
  id: string;
  country_code: string;
  country_name: string;
  title: string;
  category: string;
  urgency: string;
  summary: string;
  timestamp: string;
  source: string;
  source_url: string;
}

export interface ApiGlobalMetrics {
  active_alerts: number;
  critical_countries: number;
  elevated_countries: number;
  avg_fusion_score: number;
  top_hotspot: string;
  data_source: string;
  updated_at: string | null;
}

export interface ApiHistoryPoint {
  recorded_at: string;
  fusion_score: number;
  severity: string;
  data_source: string;
}

class FusionScopeAPI {
  private baseUrl: string;
  private timeout = 5000;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** Single typed request path shared by every endpoint method. */
  private async request<T>(endpoint: string): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const data = (await response.json()) as T;
      return { data, status: "success" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async healthCheck(): Promise<boolean> {
    const result = await this.request("/api/health");
    return result.status === "success";
  }

  getGlobalMetrics = () => this.request<ApiGlobalMetrics>("/api/global-metrics");
  getCountries = () => this.request<ApiCountry[]>("/api/countries");
  getCountry = (code: string) => this.request<ApiCountry>(`/api/country/${code}`);
  getCountrySummary = (code: string) => this.request<any>(`/api/summary/${code}`);
  getAlerts = () => this.request<ApiAlert[]>("/api/alerts");
  getCountryAlerts = (code: string) =>
    this.request<ApiAlert[]>(`/api/country/${code}/alerts`);
  getFeed = (limit = 100) => this.request<ApiFeedItem[]>(`/api/feed?limit=${limit}`);
  getCountryFeed = (code: string) =>
    this.request<ApiFeedItem[]>(`/api/country/${code}/feed`);
  getCountryHistory = (code: string) =>
    this.request<ApiHistoryPoint[]>(`/api/history/${code}`);

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const apiClient = new FusionScopeAPI();
