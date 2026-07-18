import { Link } from 'react-router-dom';
import { Activity, Droplets, Flame, CloudRain, Wheat, Users, Wrench } from 'lucide-react';
import { TerminalCard } from '@/components/TerminalCard';

const weights = [
  { key: 'waterStress', label: 'Water Stress', weight: 25, icon: Droplets, color: '#0ea5e9', dim: 'Lack of Coping Capacity' },
  { key: 'drought', label: 'Drought', weight: 20, icon: Flame, color: '#f59e0b', dim: 'Hazard & Exposure' },
  { key: 'flood', label: 'Flood', weight: 20, icon: CloudRain, color: '#3b82f6', dim: 'Hazard & Exposure' },
  { key: 'foodInsecurity', label: 'Food Insecurity', weight: 15, icon: Wheat, color: '#ef4444', dim: 'Vulnerability' },
  { key: 'migrationPressure', label: 'Migration Pressure', weight: 10, icon: Users, color: '#f97316', dim: 'Vulnerability' },
  { key: 'infrastructureDisruption', label: 'Infrastructure Disruption', weight: 10, icon: Wrench, color: '#a855f7', dim: 'Lack of Coping Capacity' },
];

const dimensions = [
  { label: 'Hazard & Exposure', members: 'Drought, Flood', desc: 'The natural hazards actively affecting a country (GDACS events).' },
  { label: 'Vulnerability', members: 'Food Insecurity, Migration Pressure', desc: 'Socio-economic fragility and displaced/vulnerable populations.' },
  { label: 'Lack of Coping Capacity', members: 'Water Stress, Infrastructure Disruption', desc: 'Structural resource and infrastructure constraints on response.' },
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
            FusionScope scores six risk vectors 0–100 per country from openly published indicators —
            World Bank development indicators, GDACS disaster events, and UNHCR displacement statistics —
            and groups them under the three dimensions of the{' '}
            <a href="https://drmkc.jrc.ec.europa.eu/inform-index/INFORM-Risk/Methodology" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">INFORM Risk Index</a>{' '}
            (EC Joint Research Centre / DG ECHO). Where no live indicator exists for a vector, the score
            falls back to a curated baseline and is explicitly flagged as estimated. Country summaries are
            template-generated from the scores — there is no satellite, sensor, or NLP pipeline behind this
            project, and any data shown in demo mode is labeled as such.
          </p>
        </div>

        {/* INFORM dimensions */}
        <TerminalCard title="INFORM Risk Dimensions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dimensions.map(d => (
              <div key={d.label} className="p-3 border border-border rounded-sm">
                <h3 className="text-xs font-mono font-bold text-foreground mb-1">{d.label}</h3>
                <p className="text-[10px] font-mono text-primary mb-1">{d.members}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-mono text-muted-foreground mt-3 leading-relaxed">
            This mirrors the industry-standard structure used by INFORM (JRC), and reused by ACAPS'
            INFORM Severity Index and Kontur's composite risk index. It is a documented framework, not
            an invented one.
          </p>
        </TerminalCard>

        {/* Weights */}
        <TerminalCard title="Vector Weights & Aggregation">
          <div className="space-y-3">
            {weights.map(w => (
              <div key={w.key} className="flex items-center gap-3">
                <w.icon className="w-4 h-4 shrink-0" style={{ color: w.color }} />
                <span className="text-xs font-mono text-foreground w-44">{w.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground w-40 hidden md:inline">{w.dim}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${w.weight * 4}%`, backgroundColor: w.color, opacity: 0.8 }} />
                </div>
                <span className="text-xs font-mono text-foreground w-8 text-right">{w.weight}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-secondary/30 rounded-sm space-y-2">
            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Step 1 — dimension scores.</strong> Each INFORM dimension
              is the weighted mean of its two vectors, using the weights above renormalized within the
              dimension (e.g. Coping = (Water × 0.25 + Infrastructure × 0.10) ÷ 0.35).
            </p>
            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Step 2 — composite.</strong> Fusion Score ={' '}
              ∛(Hazard&nbsp;&amp;&nbsp;Exposure × Vulnerability × Lack&nbsp;of&nbsp;Coping) — the{' '}
              <em>geometric</em> mean of the three dimensions, as INFORM/JRC prescribes. A single severe
              dimension is not averaged away, and a dimension near zero pulls the composite down sharply
              (disaster risk requires hazard, vulnerability and lack of coping to coincide).
            </p>
            <p className="text-[10px] font-mono text-muted-foreground/70 leading-relaxed">
              Scores are on a 0–100 scale (INFORM itself uses 0–10; this project keeps 0–100 for the
              per-vector indicators). Switching from the earlier arithmetic mean to the geometric mean
              shifts most composite scores lower — this is expected and documented, not a regression.
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
              Six vectors, three sources — several vectors rely on structural proxies (e.g. electricity
              access for infrastructure). Scores are point-in-time; real trend lines accumulate only as
              scheduled refreshes append history. Update cadence is a 6-hour GitHub Actions cron against
              the live APIs. ReliefWeb headlines are integrated but disabled until an approved API appname
              is configured. Demo mode uses a curated baseline dataset, always labeled DEMO DATA.
            </div>
          </div>
        </TerminalCard>

        {/* Explicitly not claimed */}
        <TerminalCard title="Explicitly De-scoped (Not Claimed)">
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Naming what this project does <em>not</em> do is itself an INFORM/IDMC-style honesty signal.
            FusionScope deliberately does not include:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside font-mono">
            <li>Field-data collection or in-country partner triangulation (IDMC, FEWS NET, ACAPS).</li>
            <li>Curated multi-source verification or generative "sourced answers" (GANNET, HAPI).</li>
            <li>Analyst consensus / convergence-of-evidence panels (IPC, INFORM governance).</li>
            <li>Anticipatory-action trigger frameworks tied to funding (OCHA / CERF).</li>
            <li>Forecasts or predictions — every score is a measurement or a labeled baseline, never a projection.</li>
          </ul>
        </TerminalCard>

        {/* Citations */}
        <TerminalCard title="Frameworks & Citations">
          <ul className="text-xs text-muted-foreground space-y-1.5 font-mono">
            <li><a href="https://drmkc.jrc.ec.europa.eu/inform-index/INFORM-Risk/Methodology" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">INFORM Risk Index — methodology (EC JRC / DG ECHO)</a> — the three-dimension structure and geometric-mean aggregation.</li>
            <li><a href="https://www.acaps.org/en/thematics/all-topics/inform-severity-index" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ACAPS INFORM Severity Index</a> — reuse of the INFORM dimensions for current-crisis severity.</li>
            <li><a href="https://data.humdata.org/signals" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OCHA HDX Signals & Data Freshness</a> — provenance and freshness as first-class fields.</li>
            <li><a href="https://www.ipcinfo.org/ipcinfo-website/ipc-overview-and-classification-system/en/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">IPC classification system</a> — bounded, human-readable severity scales.</li>
            <li><a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">World Bank Open Data</a>, <a href="https://www.gdacs.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GDACS</a>, <a href="https://www.unhcr.org/refugee-statistics/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">UNHCR Refugee Data Finder</a> — the live indicator sources.</li>
          </ul>
        </TerminalCard>
      </div>
    </div>
  );
}
