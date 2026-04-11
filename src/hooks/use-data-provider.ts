/**
 * useDataProvider Hook
 * Fetches data from API with automatic fallback to mock data
 * Allows frontend to work even if backend is unavailable
 */

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api";

interface UseDataProviderOptions {
  useMockData?: boolean;
  enableLogging?: boolean;
}

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  source: "api" | "mock";
}

/**
 * Hook for fetching data with fallback to mock data
 */
export function useDataProvider<T>(
  fetchFn: () => Promise<{ data?: T; error?: string; status: string }>,
  mockData: T,
  options: UseDataProviderOptions = {}
): DataState<T> {
  const { useMockData = false, enableLogging = false } = options;
  const [state, setState] = useState<DataState<T>>({
    data: useMockData ? mockData : null,
    loading: !useMockData,
    error: null,
    source: useMockData ? "mock" : "api",
  });

  const fetchData = useCallback(async () => {
    try {
      if (enableLogging) console.log("Fetching from API...");

      const result = await fetchFn();

      if (result.status === "success" && result.data) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          source: "api",
        });
        if (enableLogging) console.log("✓ API fetch successful");
      } else {
        throw new Error(result.error || "API returned error status");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      if (enableLogging)
        console.warn(`API failed (${errorMsg}), falling back to mock data`);

      // Fallback to mock data
      setState({
        data: mockData,
        loading: false,
        error: errorMsg,
        source: "mock",
      });
    }
  }, [fetchFn, mockData, enableLogging]);

  useEffect(() => {
    if (!useMockData) {
      fetchData();
    }
  }, [fetchData, useMockData]);

  return state;
}

/**
 * Hook for fetching a single country
 */
export function useCountry(code: string, mockData: any) {
  return useDataProvider(
    () => apiClient.getCountry(code),
    mockData,
    { useMockData: false, enableLogging: false }
  );
}

/**
 * Hook for fetching all countries
 */
export function useCountries(mockData: any[]) {
  return useDataProvider(
    () => apiClient.getCountries(),
    mockData,
    { useMockData: false, enableLogging: false }
  );
}

/**
 * Hook for fetching global metrics
 */
export function useGlobalMetrics(mockData: any) {
  return useDataProvider(
    () => apiClient.getGlobalMetrics(),
    mockData,
    { useMockData: false, enableLogging: false }
  );
}

/**
 * Hook for checking API health
 */
export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    apiClient.healthCheck().then(setIsHealthy);
  }, []);

  return isHealthy;
}
