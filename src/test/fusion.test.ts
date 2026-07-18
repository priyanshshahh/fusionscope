import { describe, it, expect } from 'vitest';
import { RISK_WEIGHTS, DIMENSIONS, getSeverity, calculateDimensions, calculateFusionScore } from '@/data/types';
import { convertApiCountryToFrontend } from '@/lib/convert';

// These mirror backend/app/etl/scoring.py — if one side changes, both must.
describe('fusion formula parity with backend', () => {
  it('weights sum to 1.0', () => {
    const total = Object.values(RISK_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it('uses the documented weights', () => {
    expect(RISK_WEIGHTS).toEqual({
      waterStress: 0.25,
      drought: 0.20,
      flood: 0.20,
      foodInsecurity: 0.15,
      migrationPressure: 0.10,
      infrastructureDisruption: 0.10,
    });
  });

  it.each([
    [0, 'low'], [34, 'low'],
    [35, 'elevated'], [54, 'elevated'],
    [55, 'high'], [74, 'high'],
    [75, 'critical'], [100, 'critical'],
  ] as const)('severity band: %i -> %s', (score, expected) => {
    expect(getSeverity(score)).toBe(expected);
  });
});

describe('INFORM dimension aggregation parity with backend', () => {
  const risks = {
    waterStress: 80, drought: 60, flood: 40,
    foodInsecurity: 100, migrationPressure: 50, infrastructureDisruption: 30,
  };

  it('groups all six vectors across the three dimensions once', () => {
    const grouped = Object.values(DIMENSIONS).flat().sort();
    expect(grouped).toEqual(Object.keys(RISK_WEIGHTS).sort());
  });

  it('computes each dimension as a weighted mean of its members', () => {
    const dims = calculateDimensions(risks);
    expect(dims.hazardExposure).toBe(50);   // (60+40)/2
    expect(dims.vulnerability).toBe(80);     // (100*.15 + 50*.10)/.25
    expect(dims.copingCapacity).toBe(66);    // (80*.25 + 30*.10)/.35
  });

  it('composites via geometric mean of the dimensions', () => {
    // cbrt(50 * 80 * 66) ~= 64.16 -> 64
    expect(calculateFusionScore(risks)).toBe(64);
  });

  it('lets a near-zero dimension pull the composite down sharply', () => {
    const balanced = {
      waterStress: 60, drought: 60, flood: 60,
      foodInsecurity: 60, migrationPressure: 60, infrastructureDisruption: 60,
    };
    expect(calculateFusionScore(balanced)).toBe(60);
    expect(calculateFusionScore({ ...balanced, drought: 0, flood: 0 })).toBe(0);
  });
});

describe('convertApiCountryToFrontend', () => {
  const apiCountry = {
    code: 'SOM',
    name: 'Somalia',
    region: 'East Africa',
    lat: 5.15,
    lon: 46.2,
    risks: {
      water_stress: 90, drought: 88, flood: 45,
      food_insecurity: 95, migration_pressure: 87, infrastructure_disruption: 82,
    },
    fusion_score: 82,
    severity: 'critical',
    ai_summary: 'summary text',
    data_source: 'live',
    estimated_vectors: ['drought'],
  };

  it('maps snake_case fields and provenance', () => {
    const converted = convertApiCountryToFrontend(apiCountry);
    expect(converted.id).toBe('SOM');
    expect(converted.risks.waterStress).toBe(90);
    expect(converted.risks.infrastructureDisruption).toBe(82);
    expect(converted.dataSource).toBe('live');
    expect(converted.estimatedVectors).toEqual(['drought']);
  });

  it('never fabricates a trend for API data', () => {
    expect(convertApiCountryToFrontend(apiCountry).trend).toBeUndefined();
  });

  it('defaults provenance to demo when unlabeled', () => {
    const converted = convertApiCountryToFrontend({
      ...apiCountry, data_source: undefined, estimated_vectors: undefined,
    });
    expect(converted.dataSource).toBe('demo');
    expect(converted.estimatedVectors).toEqual([]);
  });
});
