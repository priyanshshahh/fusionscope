import { CountryData, Alert, FeedItem, getSeverity, type RiskScores } from './types';

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

const raw: Omit<CountryData, 'fusionScore' | 'severity' | 'trend' | 'summary'>[] = [
  { id: 'SOM', name: 'Somalia', region: 'East Africa', lat: 5.15, lon: 46.2, risks: { waterStress: 92, drought: 88, flood: 45, foodInsecurity: 95, migrationPressure: 87, infrastructureDisruption: 82 } },
  { id: 'YEM', name: 'Yemen', region: 'Middle East', lat: 15.55, lon: 48.52, risks: { waterStress: 95, drought: 78, flood: 35, foodInsecurity: 91, migrationPressure: 72, infrastructureDisruption: 88 } },
  { id: 'SSD', name: 'South Sudan', region: 'East Africa', lat: 6.88, lon: 31.6, risks: { waterStress: 85, drought: 82, flood: 72, foodInsecurity: 89, migrationPressure: 91, infrastructureDisruption: 78 } },
  { id: 'AFG', name: 'Afghanistan', region: 'South Asia', lat: 33.94, lon: 67.71, risks: { waterStress: 88, drought: 85, flood: 62, foodInsecurity: 82, migrationPressure: 78, infrastructureDisruption: 91 } },
  { id: 'ETH', name: 'Ethiopia', region: 'East Africa', lat: 9.15, lon: 40.49, risks: { waterStress: 78, drought: 82, flood: 55, foodInsecurity: 75, migrationPressure: 68, infrastructureDisruption: 62 } },
  { id: 'SDN', name: 'Sudan', region: 'North Africa', lat: 12.86, lon: 30.22, risks: { waterStress: 82, drought: 79, flood: 68, foodInsecurity: 85, migrationPressure: 88, infrastructureDisruption: 85 } },
  { id: 'SYR', name: 'Syria', region: 'Middle East', lat: 34.8, lon: 38.99, risks: { waterStress: 75, drought: 68, flood: 42, foodInsecurity: 72, migrationPressure: 65, infrastructureDisruption: 92 } },
  { id: 'PAK', name: 'Pakistan', region: 'South Asia', lat: 30.38, lon: 69.35, risks: { waterStress: 72, drought: 58, flood: 88, foodInsecurity: 65, migrationPressure: 55, infrastructureDisruption: 72 } },
  { id: 'NGA', name: 'Nigeria', region: 'West Africa', lat: 9.08, lon: 7.49, risks: { waterStress: 65, drought: 58, flood: 72, foodInsecurity: 68, migrationPressure: 62, infrastructureDisruption: 55 } },
  { id: 'BGD', name: 'Bangladesh', region: 'South Asia', lat: 23.68, lon: 90.36, risks: { waterStress: 58, drought: 42, flood: 92, foodInsecurity: 55, migrationPressure: 48, infrastructureDisruption: 68 } },
  { id: 'MLI', name: 'Mali', region: 'West Africa', lat: 17.57, lon: -4.0, risks: { waterStress: 78, drought: 82, flood: 38, foodInsecurity: 72, migrationPressure: 65, infrastructureDisruption: 58 } },
  { id: 'TCD', name: 'Chad', region: 'Central Africa', lat: 15.45, lon: 18.73, risks: { waterStress: 85, drought: 78, flood: 42, foodInsecurity: 82, migrationPressure: 58, infrastructureDisruption: 72 } },
  { id: 'MMR', name: 'Myanmar', region: 'Southeast Asia', lat: 21.91, lon: 95.96, risks: { waterStress: 52, drought: 45, flood: 78, foodInsecurity: 62, migrationPressure: 72, infrastructureDisruption: 68 } },
  { id: 'MOZ', name: 'Mozambique', region: 'Southern Africa', lat: -18.67, lon: 35.53, risks: { waterStress: 62, drought: 55, flood: 82, foodInsecurity: 68, migrationPressure: 45, infrastructureDisruption: 72 } },
  { id: 'HTI', name: 'Haiti', region: 'Caribbean', lat: 18.97, lon: -72.29, risks: { waterStress: 68, drought: 52, flood: 75, foodInsecurity: 78, migrationPressure: 72, infrastructureDisruption: 85 } },
  { id: 'IRQ', name: 'Iraq', region: 'Middle East', lat: 33.22, lon: 43.68, risks: { waterStress: 82, drought: 72, flood: 48, foodInsecurity: 55, migrationPressure: 52, infrastructureDisruption: 65 } },
  { id: 'MDG', name: 'Madagascar', region: 'East Africa', lat: -18.77, lon: 46.87, risks: { waterStress: 55, drought: 68, flood: 72, foodInsecurity: 75, migrationPressure: 32, infrastructureDisruption: 62 } },
  { id: 'NER', name: 'Niger', region: 'West Africa', lat: 17.61, lon: 8.08, risks: { waterStress: 88, drought: 85, flood: 35, foodInsecurity: 78, migrationPressure: 55, infrastructureDisruption: 52 } },
  { id: 'BFA', name: 'Burkina Faso', region: 'West Africa', lat: 12.24, lon: -1.56, risks: { waterStress: 72, drought: 75, flood: 42, foodInsecurity: 68, migrationPressure: 72, infrastructureDisruption: 62 } },
  { id: 'COD', name: 'DR Congo', region: 'Central Africa', lat: -4.04, lon: 21.76, risks: { waterStress: 48, drought: 42, flood: 65, foodInsecurity: 72, migrationPressure: 78, infrastructureDisruption: 75 } },
  { id: 'LBY', name: 'Libya', region: 'North Africa', lat: 26.34, lon: 17.23, risks: { waterStress: 85, drought: 72, flood: 28, foodInsecurity: 48, migrationPressure: 62, infrastructureDisruption: 78 } },
  { id: 'VEN', name: 'Venezuela', region: 'South America', lat: 6.42, lon: -66.59, risks: { waterStress: 45, drought: 38, flood: 52, foodInsecurity: 72, migrationPressure: 82, infrastructureDisruption: 68 } },
  { id: 'CMR', name: 'Cameroon', region: 'Central Africa', lat: 7.37, lon: 12.35, risks: { waterStress: 52, drought: 48, flood: 62, foodInsecurity: 58, migrationPressure: 55, infrastructureDisruption: 48 } },
  { id: 'KEN', name: 'Kenya', region: 'East Africa', lat: -0.02, lon: 37.91, risks: { waterStress: 68, drought: 72, flood: 55, foodInsecurity: 58, migrationPressure: 42, infrastructureDisruption: 45 } },
  { id: 'UGA', name: 'Uganda', region: 'East Africa', lat: 1.37, lon: 32.29, risks: { waterStress: 52, drought: 48, flood: 58, foodInsecurity: 55, migrationPressure: 62, infrastructureDisruption: 42 } },
  { id: 'ZWE', name: 'Zimbabwe', region: 'Southern Africa', lat: -19.02, lon: 29.15, risks: { waterStress: 72, drought: 68, flood: 42, foodInsecurity: 75, migrationPressure: 55, infrastructureDisruption: 62 } },
  { id: 'LKA', name: 'Sri Lanka', region: 'South Asia', lat: 7.87, lon: 80.77, risks: { waterStress: 48, drought: 42, flood: 65, foodInsecurity: 52, migrationPressure: 38, infrastructureDisruption: 45 } },
  { id: 'GTM', name: 'Guatemala', region: 'Central America', lat: 15.78, lon: -90.23, risks: { waterStress: 52, drought: 58, flood: 62, foodInsecurity: 55, migrationPressure: 68, infrastructureDisruption: 42 } },
  { id: 'HND', name: 'Honduras', region: 'Central America', lat: 15.2, lon: -86.24, risks: { waterStress: 48, drought: 52, flood: 72, foodInsecurity: 52, migrationPressure: 65, infrastructureDisruption: 55 } },
  { id: 'EGY', name: 'Egypt', region: 'North Africa', lat: 26.82, lon: 30.8, risks: { waterStress: 78, drought: 62, flood: 32, foodInsecurity: 48, migrationPressure: 35, infrastructureDisruption: 38 } },
  { id: 'JOR', name: 'Jordan', region: 'Middle East', lat: 30.59, lon: 36.24, risks: { waterStress: 92, drought: 65, flood: 22, foodInsecurity: 38, migrationPressure: 55, infrastructureDisruption: 32 } },
  { id: 'TUN', name: 'Tunisia', region: 'North Africa', lat: 33.89, lon: 9.54, risks: { waterStress: 72, drought: 58, flood: 35, foodInsecurity: 35, migrationPressure: 42, infrastructureDisruption: 28 } },
  { id: 'IND', name: 'India', region: 'South Asia', lat: 20.59, lon: 78.96, risks: { waterStress: 68, drought: 55, flood: 72, foodInsecurity: 42, migrationPressure: 32, infrastructureDisruption: 45 } },
  { id: 'PHL', name: 'Philippines', region: 'Southeast Asia', lat: 12.88, lon: 121.77, risks: { waterStress: 42, drought: 35, flood: 82, foodInsecurity: 38, migrationPressure: 28, infrastructureDisruption: 55 } },
  { id: 'IDN', name: 'Indonesia', region: 'Southeast Asia', lat: -0.79, lon: 113.92, risks: { waterStress: 45, drought: 38, flood: 75, foodInsecurity: 32, migrationPressure: 25, infrastructureDisruption: 48 } },
  { id: 'COL', name: 'Colombia', region: 'South America', lat: 4.57, lon: -74.3, risks: { waterStress: 38, drought: 35, flood: 62, foodInsecurity: 35, migrationPressure: 55, infrastructureDisruption: 42 } },
  { id: 'UKR', name: 'Ukraine', region: 'Europe', lat: 48.38, lon: 31.17, risks: { waterStress: 42, drought: 38, flood: 35, foodInsecurity: 45, migrationPressure: 72, infrastructureDisruption: 85 } },
  { id: 'MRT', name: 'Mauritania', region: 'West Africa', lat: 21.01, lon: -10.94, risks: { waterStress: 82, drought: 78, flood: 28, foodInsecurity: 62, migrationPressure: 42, infrastructureDisruption: 48 } },
  { id: 'NPL', name: 'Nepal', region: 'South Asia', lat: 28.39, lon: 84.12, risks: { waterStress: 45, drought: 42, flood: 72, foodInsecurity: 48, migrationPressure: 38, infrastructureDisruption: 52 } },
  { id: 'TZA', name: 'Tanzania', region: 'East Africa', lat: -6.37, lon: 34.89, risks: { waterStress: 55, drought: 52, flood: 48, foodInsecurity: 52, migrationPressure: 35, infrastructureDisruption: 38 } },
  { id: 'MWI', name: 'Malawi', region: 'Southern Africa', lat: -13.25, lon: 34.3, risks: { waterStress: 58, drought: 62, flood: 68, foodInsecurity: 72, migrationPressure: 28, infrastructureDisruption: 55 } },
  { id: 'SEN', name: 'Senegal', region: 'West Africa', lat: 14.5, lon: -14.45, risks: { waterStress: 62, drought: 55, flood: 42, foodInsecurity: 42, migrationPressure: 48, infrastructureDisruption: 35 } },
  { id: 'DJI', name: 'Djibouti', region: 'East Africa', lat: 11.59, lon: 43.15, risks: { waterStress: 88, drought: 82, flood: 32, foodInsecurity: 58, migrationPressure: 55, infrastructureDisruption: 45 } },
  { id: 'ERI', name: 'Eritrea', region: 'East Africa', lat: 15.18, lon: 39.78, risks: { waterStress: 78, drought: 75, flood: 28, foodInsecurity: 68, migrationPressure: 72, infrastructureDisruption: 65 } },
  { id: 'CAF', name: 'Central African Republic', region: 'Central Africa', lat: 6.61, lon: 20.94, risks: { waterStress: 52, drought: 48, flood: 55, foodInsecurity: 78, migrationPressure: 75, infrastructureDisruption: 82 } },
  { id: 'LBN', name: 'Lebanon', region: 'Middle East', lat: 33.85, lon: 35.86, risks: { waterStress: 62, drought: 45, flood: 38, foodInsecurity: 55, migrationPressure: 58, infrastructureDisruption: 72 } },
  { id: 'AGO', name: 'Angola', region: 'Southern Africa', lat: -11.2, lon: 17.87, risks: { waterStress: 55, drought: 52, flood: 48, foodInsecurity: 55, migrationPressure: 32, infrastructureDisruption: 45 } },
  { id: 'PRY', name: 'Paraguay', region: 'South America', lat: -23.44, lon: -58.44, risks: { waterStress: 42, drought: 48, flood: 55, foodInsecurity: 32, migrationPressure: 22, infrastructureDisruption: 35 } },
];

function computeFusion(risks: RiskScores): number {
  return Math.round(
    risks.waterStress * 0.25 +
    risks.drought * 0.20 +
    risks.flood * 0.20 +
    risks.foodInsecurity * 0.15 +
    risks.migrationPressure * 0.10 +
    risks.infrastructureDisruption * 0.10
  );
}

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
  const fusion = computeFusion(c.risks);
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
