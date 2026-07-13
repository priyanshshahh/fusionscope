import { Link } from 'react-router-dom';
import { Activity, Droplets, Flame, CloudRain, Wheat, Users, Wrench } from 'lucide-react';
import { TerminalCard } from '@/components/TerminalCard';
import { RISK_WEIGHTS } from '@/data/types';

const weights = [
  { key: 'waterStress', label: 'Water Stress', weight: 25, icon: Droplets, color: '#0ea5e9' },
  { key: 'drought', label: 'Drought', weight: 20, icon: Flame, color: '#f59e0b' },
  { key: 'flood', label: 'Flood', weight: 20, icon: CloudRain, color: '#3b82f6' },
  { key: 'foodInsecurity', label: 'Food Insecurity', weight: 15, icon: Wheat, color: '#ef4444' },
  { key: 'migrationPressure', label: 'Migration Pressure', weight: 10, icon: Users, color: '#f97316' },
  { key: 'infrastructureDisruption', label: 'Infrastructure Disruption', weight: 10, icon: Wrench, color: '#a855f7' },
];

const severityBands = [
  { range: '75–100', label: 'CRITICAL', color: 'text-critical', desc: 'Imminent systemic failure. Multiple converging crises with high probability of cascading humanitarian emergency.' },
  { range: '55–74', label: 'HIGH', color: 'text-high', desc: 'Significant multi-domain stress with accelerating deterioration trajectory. Preemptive intervention recommended.' },
  { range: '35–54', label: 'ELEVATED', color: 'text-elevated', desc: 'Moderate but concerning indicators. Potential for escalation under sustained climate stress.' },
  { range: '0–34', label: 'LOW', color: 'text-low', desc: 'Stable conditions within manageable thresholds. Routine monitoring sufficient.' },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background terminal-grid">
      <div className="h-10 border-b border-border bg-card/50 flex items-center px-4 gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <Link to="/" className="font-mono font-bold text-xs tracking-wider text-foreground hover:text-primary transition-colors">FUSIONSCOPE</Link>
        <span className="text-muted-foreground font-mono text-[10px]">/ METHODOLOGY</span>
        <div className="flex-1" />
        <Link to="/dashboard" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">DASHBOARD</Link>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Fusion Methodology</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            FusionScope combines six risk vectors into a single weighted instability score per country.
            Vectors are scored 0–100 from openly published indicators: World Bank development indicators,
            GDACS disaster events, and UNHCR displacement statistics. Where no live indicator exists for
            a vector, the score falls back to a curated baseline and is explicitly flagged as estimated.
            Country summaries are template-generated from the scores — there is no satellite, sensor,
            or NLP pipeline behind this project, and any data shown in demo mode is labeled as such.
          </p>
        </div>

        {/* Weights */}
        <TerminalCard title="Fusion Score Weights">
          <div className="space-y-3">
            {weights.map(w => (
              <div key={w.key} className="flex items-center gap-3">
                <w.icon className="w-4 h-4 shrink-0" style={{ color: w.color }} />
                <span className="text-xs font-mono text-foreground w-44">{w.label}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${w.weight * 4}%`, backgroundColor: w.color, opacity: 0.8 }} />
                </div>
                <span className="text-xs font-mono text-foreground w-8 text-right">{w.weight}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-secondary/30 rounded-sm">
            <p className="text-[11px] font-mono text-muted-foreground">
              <strong className="text-foreground">Formula:</strong> Fusion Score = (Water Stress × 0.25) + (Drought × 0.20) + (Flood × 0.20) + (Food Insecurity × 0.15) + (Migration × 0.10) + (Infrastructure × 0.10)
            </p>
          </div>
        </TerminalCard>

        {/* Severity Bands */}
        <TerminalCard title="Severity Classification">
          <div className="space-y-3">
            {severityBands.map(band => (
              <div key={band.label} className="flex items-start gap-3 p-2 border border-border rounded-sm">
                <span className={`text-xs font-mono font-bold w-16 shrink-0 ${band.color}`}>{band.label}</span>
                <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">{band.range}</span>
                <p className="text-xs text-muted-foreground">{band.desc}</p>
              </div>
            ))}
          </div>
        </TerminalCard>

        {/* Causal Logic */}
        <TerminalCard title="Causal Propagation Logic">
          <div className="space-y-4">
            <div className="p-3 border border-border rounded-sm">
              <h3 className="text-xs font-mono font-bold text-primary mb-1">Water Stress → Migration Risk</h3>
              <p className="text-xs text-muted-foreground">Depletion of freshwater resources beyond sustainable yield triggers agricultural collapse and urban resource competition, driving internal and cross-border population displacement.</p>
            </div>
            <div className="p-3 border border-border rounded-sm">
              <h3 className="text-xs font-mono font-bold text-elevated mb-1">Drought → Food Crisis</h3>
              <p className="text-xs text-muted-foreground">Sustained precipitation deficit destroys crop yields and livestock viability, collapsing food production capacity and creating acute dependence on external supply chains.</p>
            </div>
            <div className="p-3 border border-border rounded-sm">
              <h3 className="text-xs font-mono font-bold text-primary mb-1">Flood → Infrastructure Disruption</h3>
              <p className="text-xs text-muted-foreground">Extreme precipitation events overwhelm drainage and structural capacity, destroying transportation networks, power systems, and communications infrastructure.</p>
            </div>
          </div>
        </TerminalCard>

        <TerminalCard title="Data Sources & Vector Mapping">
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="p-2 border border-border rounded-sm">
              <span className="font-mono text-foreground block mb-1">World Bank Open Data</span>
              Water stress = ER.H2O.FWST.ZS (freshwater withdrawal as % of resources, clamped at 100).
              Food insecurity = SN.ITK.DEFC.ZS (undernourishment %, scaled ×2.5, 40%+ maps to 100).
              Infrastructure fragility = 100 − EG.ELC.ACCS.ZS (electricity access %) — a structural
              proxy, not a live outage measure.
            </div>
            <div className="p-2 border border-border rounded-sm">
              <span className="font-mono text-foreground block mb-1">GDACS</span>
              Drought and flood scores from active disaster events in a 180-day window:
              Red alert → 92, Orange → 68, Green → 42, no event → curated baseline (flagged estimated).
              Current events also drive the alerts list and intelligence feed, with links to
              the original GDACS reports.
            </div>
            <div className="p-2 border border-border rounded-sm">
              <span className="font-mono text-foreground block mb-1">UNHCR Refugee Data Finder</span>
              Migration pressure from total displaced persons originating per country
              (refugees + asylum seekers + IDPs), on a log scale: 10k → 40, 1M → 80, 10M → 100.
            </div>
            <div className="p-2 border border-border rounded-sm">
              <span className="font-mono text-foreground block mb-1">Known Limitations</span>
              Scores are point-in-time (no historical series yet). Six vectors, three sources — several
              vectors rely on structural proxies. ReliefWeb report headlines are integrated but disabled
              until an approved API appname is configured. Demo mode uses a curated baseline dataset,
              always labeled DEMO DATA in the UI.
            </div>
          </div>
        </TerminalCard>
      </div>
    </div>
  );
}
