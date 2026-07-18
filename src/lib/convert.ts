import { type CountryData, type Alert, type FeedItem, type RiskScores } from '@/data/types';

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
    updatedAt: apiCountry.updated_at,
  };
}

export type DataStatus = 'live' | 'demo' | 'offline';

/** Normalize an API alert payload (snake_case, `summary`) to the frontend
 * Alert shape (camelCase, `description`). */
export function convertApiAlertToFrontend(a: any): Alert {
  return {
    id: a.id,
    countryId: a.country_code,
    countryName: a.country_name,
    category: snakeVectorToCamel(a.category),
    severity: a.severity,
    title: a.title,
    description: a.summary ?? a.description ?? '',
    timestamp: a.timestamp,
    source: a.source ?? '',
    sourceUrl: a.source_url ?? '',
  };
}

/** Normalize an API feed payload (snake_case, `urgency`, `summary`) to the
 * frontend FeedItem shape (camelCase, `severity`, `body`). */
export function convertApiFeedItemToFrontend(f: any): FeedItem {
  return {
    id: f.id,
    countryId: f.country_code,
    countryName: f.country_name,
    category: snakeVectorToCamel(f.category),
    severity: f.urgency ?? f.severity,
    title: f.title,
    body: f.summary ?? f.body ?? '',
    timestamp: f.timestamp,
    tags: [f.country_name, f.urgency ?? f.severity].filter(Boolean),
    source: f.source ?? '',
    sourceUrl: f.source_url ?? '',
  };
}

const VECTOR_MAP: Record<string, keyof RiskScores> = {
  water_stress: 'waterStress',
  drought: 'drought',
  flood: 'flood',
  food_insecurity: 'foodInsecurity',
  migration_pressure: 'migrationPressure',
  infrastructure_disruption: 'infrastructureDisruption',
};

/** Map a snake_case vector/category name to its camelCase RiskScores key,
 * tolerating already-camelCase or unknown values (falls back to waterStress
 * only for filtering, never shown as a fabricated score). */
function snakeVectorToCamel(category: string): keyof RiskScores {
  return VECTOR_MAP[category] ?? (category as keyof RiskScores);
}
