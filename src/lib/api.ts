/**
 * FusionScope API Client
 * Provides typed API calls with fallback to mock data
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: "success" | "error";
}

class FusionScopeAPI {
  private baseUrl: string;
  private timeout: number = 5000;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout("/api/health");
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get global metrics
   */
  async getGlobalMetrics(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout("/api/global-metrics");
      if (!response.ok) throw new Error("Failed to fetch global metrics");
      const data = await response.json();
      return { data, status: "success" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Get all countries
   */
  async getCountries(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.fetchWithTimeout("/api/countries");
      if (!response.ok) throw new Error("Failed to fetch countries");
      const data = await response.json();
      return { data, status: "success" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Get country by code
   */
  async getCountry(code: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`/api/country/${code}`);
      if (!response.ok) throw new Error("Failed to fetch country");
      const data = await response.json();
      return { data, status: "success" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Get country summary
   */
  async getCountrySummary(code: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`/api/summary/${code}`);
      if (!response.ok) throw new Error("Failed to fetch summary");
      const data = await response.json();
      return { data, status: "success" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Get all alerts
   */
  async getAlerts(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.fetchWithTimeout("/api/alerts");
      if (!response.ok) throw new Error("Failed to fetch alerts");
      const data = await response.json();
      return { data, status: "success" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Get country alerts
   */
  async getCountryAlerts(code: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.fetchWithTimeout(`/api/country/${code}/alerts`);
      if (!response.ok) throw new Error("Failed to fetch country alerts");
      const data = await response.json();
      return { data, status: "success" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Get global feed
   */
  async getFeed(limit: number = 100): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.fetchWithTimeout(
        `/api/feed?limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch feed");
      const data = await response.json();
      return { data, status: "success" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Get country feed
   */
  async getCountryFeed(code: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.fetchWithTimeout(
        `/api/country/${code}/feed`
      );
      if (!response.ok) throw new Error("Failed to fetch country feed");
      const data = await response.json();
      return { data, status: "success" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Update base URL (useful for runtime configuration)
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const apiClient = new FusionScopeAPI();
