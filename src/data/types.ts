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
  trend: number[]; // 12 months
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
