export interface RiskScores {
  waterStress: number;
  drought: number;
  flood: number;
  foodInsecurity: number;
  migrationPressure: number;
  infrastructureDisruption: number;
}

export type Severity = 'low' | 'elevated' | 'high' | 'critical';

export interface CountryData {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  risks: RiskScores;
  fusionScore: number;
  severity: Severity;
  summary: string;
  /** Historical trend. Only present for demo data — the backend does not
   * yet store time series, so live countries have no trend. */
  trend?: number[];
  /** Provenance: 'live' = scored from World Bank/GDACS/UNHCR data,
   * 'demo' = curated baseline dataset. */
  dataSource?: 'live' | 'demo';
  /** Vectors that fell back to the curated baseline in live mode. */
  estimatedVectors?: string[];
  /** ISO timestamp of the refresh that produced these scores. */
  updatedAt?: string;
}

export interface Alert {
  id: string;
  countryId: string;
  countryName: string;
  category: keyof RiskScores;
  severity: Severity;
  title: string;
  description: string;
  timestamp: string;
  /** Provenance (present on API-sourced alerts). */
  source?: string;
  sourceUrl?: string;
}

export interface FeedItem {
  id: string;
  countryId: string;
  countryName: string;
  category: keyof RiskScores;
  severity: Severity;
  title: string;
  body: string;
  timestamp: string;
  tags: string[];
  /** Provenance (present on API-sourced feed items). */
  source?: string;
  sourceUrl?: string;
}

export const CATEGORY_LABELS: Record<keyof RiskScores, string> = {
  waterStress: 'Water Stress',
  drought: 'Drought',
  flood: 'Flood',
  foodInsecurity: 'Food Insecurity',
  migrationPressure: 'Migration Pressure',
  infrastructureDisruption: 'Infrastructure Disruption',
};

export const RISK_WEIGHTS: Record<keyof RiskScores, number> = {
  waterStress: 0.25,
  drought: 0.20,
  flood: 0.20,
  foodInsecurity: 0.15,
  migrationPressure: 0.10,
  infrastructureDisruption: 0.10,
};

/** INFORM Risk Index dimension key. */
export type Dimension = 'hazardExposure' | 'vulnerability' | 'copingCapacity';

/** INFORM dimensions -> the FusionScope vectors that populate them.
 * Mirrors DIMENSIONS in backend/app/etl/scoring.py. */
export const DIMENSIONS: Record<Dimension, (keyof RiskScores)[]> = {
  hazardExposure: ['drought', 'flood'],
  vulnerability: ['foodInsecurity', 'migrationPressure'],
  copingCapacity: ['waterStress', 'infrastructureDisruption'],
};

export const DIMENSION_LABELS: Record<Dimension, string> = {
  hazardExposure: 'Hazard & Exposure',
  vulnerability: 'Vulnerability',
  copingCapacity: 'Lack of Coping Capacity',
};

/** Weighted mean of each dimension's member vectors (weights renormalized
 * within the dimension). Mirrors calculate_dimensions in scoring.py. */
export function calculateDimensions(risks: RiskScores): Record<Dimension, number> {
  const out = {} as Record<Dimension, number>;
  (Object.keys(DIMENSIONS) as Dimension[]).forEach(dim => {
    const members = DIMENSIONS[dim];
    const totalWeight = members.reduce((s, v) => s + RISK_WEIGHTS[v], 0);
    const weighted = members.reduce((s, v) => s + risks[v] * RISK_WEIGHTS[v], 0);
    out[dim] = Math.round(weighted / totalWeight);
  });
  return out;
}

/** Composite fusion score: geometric mean of the three INFORM dimensions.
 * Mirrors calculate_fusion_score in scoring.py. */
export function calculateFusionScore(risks: RiskScores): number {
  const dims = calculateDimensions(risks);
  const product = Object.values(dims).reduce((p, v) => p * v, 1);
  return Math.round(Math.cbrt(product));
}

export function getSeverity(score: number): Severity {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'elevated';
  return 'low';
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'text-critical';
    case 'high': return 'text-high';
    case 'elevated': return 'text-elevated';
    case 'low': return 'text-low';
  }
}

export function getSeverityBg(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'bg-critical/20 text-critical border-critical/30';
    case 'high': return 'bg-high/20 text-high border-high/30';
    case 'elevated': return 'bg-elevated/20 text-elevated border-elevated/30';
    case 'low': return 'bg-low/20 text-low border-low/30';
  }
}
