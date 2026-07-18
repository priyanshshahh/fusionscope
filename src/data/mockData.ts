import { CountryData, Alert, FeedItem, getSeverity, calculateFusionScore, type RiskScores } from './types';
// Single source of truth for the curated baseline — shared with the backend
// (backend/seed_data/countries.py loads the same JSON).
import baseline from '../../backend/seed_data/baseline.json';

interface BaselineRecord {
  code: string; name: string; region: string; lat: number; lon: number;
  water_stress: number; drought: number; flood: number;
  food_insecurity: number; migration_pressure: number; infrastructure_disruption: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);
const r = (min: number, max: number) => Math.round(min + rand() * (max - min));
const trend12 = (base: number) => Array.from({ length: 12 }, () => Math.max(0, Math.min(100, base + r(-15, 15))));

const raw: Omit<CountryData, 'fusionScore' | 'severity' | 'trend' | 'summary'>[] =
  (baseline as BaselineRecord[]).map(c => ({
    id: c.code,
    name: c.name,
    region: c.region,
    lat: c.lat,
    lon: c.lon,
    risks: {
      waterStress: c.water_stress,
      drought: c.drought,
      flood: c.flood,
      foodInsecurity: c.food_insecurity,
      migrationPressure: c.migration_pressure,
      infrastructureDisruption: c.infrastructure_disruption,
    },
  }));

// Composite scoring lives in types.ts (calculateFusionScore) — the single
// frontend mirror of backend/app/etl/scoring.py.

function generateSummary(c: typeof raw[0], fusion: number): string {
  const sev = getSeverity(fusion);
  const summaries: Record<string, string> = {
    critical: `${c.name} faces a critical convergence of climate and humanitarian stressors. Multiple risk vectors are operating at extreme levels, creating compounding instability across water, food, and displacement systems. Immediate international coordination is required to prevent cascading failure.`,
    high: `${c.name} is experiencing significant multi-domain stress with elevated risk of systemic deterioration. Key indicators suggest accelerating pressure on food systems and population stability. Enhanced monitoring and preemptive intervention is recommended.`,
    elevated: `${c.name} shows moderate but concerning risk indicators across several domains. While not yet critical, trend analysis suggests potential escalation if climate conditions deteriorate further. Continued surveillance advised.`,
    low: `${c.name} maintains relatively stable conditions across monitored risk domains. Current indicators are within manageable thresholds, though localized vulnerabilities may emerge during seasonal stress periods.`,
  };
  return summaries[sev];
}

export const countries: CountryData[] = raw.map(c => {
  const fusion = calculateFusionScore(c.risks);
  return {
    ...c,
    fusionScore: fusion,
    severity: getSeverity(fusion),
    trend: trend12(fusion),
    summary: generateSummary(c, fusion),
  };
});

const categories: (keyof RiskScores)[] = ['waterStress', 'drought', 'flood', 'foodInsecurity', 'migrationPressure', 'infrastructureDisruption'];

const alertTitles: Record<keyof RiskScores, string[]> = {
  waterStress: ['Aquifer depletion exceeds safe yield threshold', 'Municipal water rationing declared', 'Groundwater contamination detected in primary source'],
  drought: ['Consecutive failed rainy seasons confirmed', 'Crop failure imminent in primary agricultural zones', 'Pastoral migration routes disrupted by drought'],
  flood: ['Flash flood warning issued for major river basin', 'Critical infrastructure submerged in capital region', 'Displaced population exceeds shelter capacity'],
  foodInsecurity: ['Food price index exceeds 3-year high', 'Supply chain disruption affecting grain imports', 'Acute malnutrition rates rising in vulnerable populations'],
  migrationPressure: ['Cross-border displacement surge detected', 'Refugee camp capacity exceeded by 200%', 'Internal displacement corridor forming along conflict axis'],
  infrastructureDisruption: ['Power grid failure affecting 40% of territory', 'Transportation network severed by structural damage', 'Communication blackout in eastern provinces'],
};

export const alerts: Alert[] = [];
export const feedItems: FeedItem[] = [];

let alertId = 0;
let feedId = 0;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

countries.forEach(country => {
  categories.forEach(cat => {
    const score = country.risks[cat];
    if (score >= 55) {
      const sev = getSeverity(score);
      const titles = alertTitles[cat];
      const title = titles[alertId % titles.length];
      const dayOffset = r(0, 30);
      const monthIdx = r(0, 3);
      alerts.push({
        id: `alert-${alertId++}`,
        countryId: country.id,
        countryName: country.name,
        category: cat,
        severity: sev,
        title,
        description: `Intelligence assessment indicates ${title.toLowerCase()} in ${country.name}. Fusion analysis correlates this with broader regional destabilization patterns.`,
        timestamp: `2025-${String(4 - monthIdx).padStart(2, '0')}-${String(dayOffset + 1).padStart(2, '0')}`,
      });
    }
    if (score >= 45) {
      feedItems.push({
        id: `feed-${feedId++}`,
        countryId: country.id,
        countryName: country.name,
        category: cat,
        severity: getSeverity(score),
        title: `${country.name}: ${alertTitles[cat][feedId % alertTitles[cat].length]}`,
        body: `Monitoring systems have flagged escalating indicators related to ${cat.replace(/([A-Z])/g, ' $1').toLowerCase()} in ${country.name}. Current assessment suggests ${getSeverity(score)} risk level with potential for further deterioration.`,
        timestamp: `${months[r(0, 11)]} ${r(1, 28)}, 2025`,
        tags: [country.region, getSeverity(score)],
      });
    }
  });
});

// Sort alerts by severity
const sevOrder = { critical: 0, high: 1, elevated: 2, low: 3 };
alerts.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
feedItems.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

export const globalMetrics = {
  activeAlerts: alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length,
  criticalRegions: countries.filter(c => c.severity === 'critical').length,
  elevatedRegions: countries.filter(c => c.severity === 'elevated' || c.severity === 'high').length,
  globalFusionScore: Math.round(countries.reduce((s, c) => s + c.fusionScore, 0) / countries.length),
};
