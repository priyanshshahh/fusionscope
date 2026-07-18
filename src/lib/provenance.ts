import type { CountryData, RiskScores } from '@/data/types';

/**
 * Per-vector data provenance: which source feeds each vector, a link to that
 * source, whether the value is live or a baseline estimate, and a simple
 * confidence tag. Mirrors the source mapping in backend/app/etl/scoring.py.
 */

export type Confidence = 'high' | 'medium' | 'low';

interface VectorSource {
  source: string;
  detail: string;
  url: string;
}

/** Static source per vector. World Bank links target the specific indicator. */
export const VECTOR_SOURCES: Record<keyof RiskScores, VectorSource> = {
  waterStress: {
    source: 'World Bank',
    detail: 'ER.H2O.FWST.ZS — freshwater withdrawal, % of resources',
    url: 'https://data.worldbank.org/indicator/ER.H2O.FWST.ZS',
  },
  foodInsecurity: {
    source: 'World Bank',
    detail: 'SN.ITK.DEFC.ZS — prevalence of undernourishment, %',
    url: 'https://data.worldbank.org/indicator/SN.ITK.DEFC.ZS',
  },
  infrastructureDisruption: {
    source: 'World Bank',
    detail: 'EG.ELC.ACCS.ZS — access to electricity, % (inverted)',
    url: 'https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS',
  },
  drought: {
    source: 'GDACS',
    detail: 'Active drought events, 180-day window',
    url: 'https://www.gdacs.org/',
  },
  flood: {
    source: 'GDACS',
    detail: 'Active flood/cyclone events, 180-day window',
    url: 'https://www.gdacs.org/',
  },
  migrationPressure: {
    source: 'UNHCR',
    detail: 'Refugees + asylum seekers + IDPs by origin',
    url: 'https://www.unhcr.org/refugee-statistics/',
  },
};

const CAMEL_TO_SNAKE: Record<keyof RiskScores, string> = {
  waterStress: 'water_stress',
  drought: 'drought',
  flood: 'flood',
  foodInsecurity: 'food_insecurity',
  migrationPressure: 'migration_pressure',
  infrastructureDisruption: 'infrastructure_disruption',
};

const FRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface VectorProvenance {
  vector: keyof RiskScores;
  score: number;
  isLive: boolean;
  confidence: Confidence;
  source: VectorSource;
}

/**
 * Confidence heuristic:
 *   live + fresh (<7d)  -> high
 *   live + stale        -> medium
 *   baseline / demo     -> low
 */
export function vectorConfidence(
  isLive: boolean,
  updatedAt?: string,
): Confidence {
  if (!isLive) return 'low';
  if (!updatedAt) return 'medium';
  const age = Date.now() - new Date(updatedAt).getTime();
  return Number.isNaN(age) || age > FRESH_WINDOW_MS ? 'medium' : 'high';
}

/** Build the per-vector provenance rows for a country. */
export function countryProvenance(country: CountryData): VectorProvenance[] {
  const estimated = new Set(country.estimatedVectors ?? []);
  const isDemo = country.dataSource !== 'live';
  return (Object.keys(VECTOR_SOURCES) as (keyof RiskScores)[]).map((vector) => {
    const baseline = isDemo || estimated.has(CAMEL_TO_SNAKE[vector]);
    const isLive = !baseline;
    return {
      vector,
      score: country.risks[vector],
      isLive,
      confidence: vectorConfidence(isLive, country.updatedAt),
      source: VECTOR_SOURCES[vector],
    };
  });
}

export const CONFIDENCE_STYLE: Record<Confidence, string> = {
  high: 'text-low border-low/30 bg-low/10',
  medium: 'text-elevated border-elevated/30 bg-elevated/10',
  low: 'text-muted-foreground border-border bg-secondary/40',
};
