import { type CountryData } from '@/data/types';

/**
 * Convert an API country payload to the frontend shape.
 * No trend is synthesized: the backend has no historical series yet,
 * so live data renders without a trend chart instead of a fabricated one.
 */
export function convertApiCountryToFrontend(apiCountry: any): CountryData {
  return {
    id: apiCountry.code,
    name: apiCountry.name,
    region: apiCountry.region,
    lat: apiCountry.lat,
    lon: apiCountry.lon,
    risks: {
      waterStress: apiCountry.risks.water_stress,
      drought: apiCountry.risks.drought,
      flood: apiCountry.risks.flood,
      foodInsecurity: apiCountry.risks.food_insecurity,
      migrationPressure: apiCountry.risks.migration_pressure,
      infrastructureDisruption: apiCountry.risks.infrastructure_disruption,
    },
    fusionScore: apiCountry.fusion_score,
    severity: apiCountry.severity,
    summary: apiCountry.ai_summary,
    dataSource: apiCountry.data_source === 'live' ? 'live' : 'demo',
    estimatedVectors: apiCountry.estimated_vectors ?? [],
  };
}

export type DataStatus = 'live' | 'demo' | 'offline';
