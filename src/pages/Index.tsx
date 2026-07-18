import { Link } from 'react-router-dom';
import { Activity, Droplets, CloudRain, Flame, Wheat, Users, Wrench, ArrowRight, Shield, Globe, Zap } from 'lucide-react';

const crisisCards = [
  { icon: Droplets, label: 'Water Stress', desc: 'Aquifer depletion and freshwater scarcity threatening stability', color: 'text-primary' },
  { icon: Flame, label: 'Drought', desc: 'Prolonged dry conditions disrupting agriculture and livelihoods', color: 'text-elevated' },
  { icon: CloudRain, label: 'Flood', desc: 'Extreme precipitation events overwhelming infrastructure capacity', color: 'text-primary' },
  { icon: Wheat, label: 'Food Insecurity', desc: 'Supply chain disruptions driving acute malnutrition risk', color: 'text-critical' },
  { icon: Users, label: 'Migration Pressure', desc: 'Climate-driven displacement creating geopolitical friction', color: 'text-elevated' },
  { icon: Wrench, label: 'Infrastructure', desc: 'Cascading system failures across critical networks', color: 'text-high' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background terminal-grid relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="fixed inset-0 scanline z-10 pointer-events-none" />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/10 animate-radar opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/5" />
        {/* Grid dots representing global monitoring points */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30 animate-pulse-glow"
            style={{
              top: `${10 + (i * 17) % 80}%`,
              left: `${5 + (i * 23) % 90}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-20 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-mono font-bold text-sm tracking-wider text-foreground">FUSIONSCOPE</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">DASHBOARD</Link>
            <Link to="/alerts" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">ALERTS</Link>
            <Link to="/feed" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">FEED</Link>
            <Link to="/methodology" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">METHODOLOGY</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/30 rounded-full bg-primary/5 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs font-mono text-primary">OPEN-DATA CRISIS INDEX · INFORM-ALIGNED</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4 text-glow-primary">
          Global Crisis Fusion
          <br />
          <span className="text-primary">Index</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Six climate and humanitarian risk vectors, grouped under the INFORM Risk
          Index dimensions and scored from openly published World Bank, GDACS and
          UNHCR data. Point-in-time snapshots, with live-or-baseline provenance
          labeled on every value — no forecasts, no black box.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-sm font-mono font-semibold text-sm hover:bg-primary/90 transition-all glow-primary"
        >
          EXPLORE DASHBOARD
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Stats bar */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
          {[
            { icon: Globe, label: 'Countries', value: '60' },
            { icon: Shield, label: 'Risk Vectors', value: '6' },
            { icon: Zap, label: 'Data Sources', value: '3' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1 p-4 border border-border rounded-sm bg-card/50">
              <s.icon className="w-4 h-4 text-primary mb-1" />
              <span className="text-2xl font-mono font-bold text-foreground">{s.value}</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Crisis Vectors */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">Crisis Fusion Vectors</h2>
          <p className="text-sm text-muted-foreground">Six risk domains grouped under the INFORM Risk Index's three dimensions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crisisCards.map(card => (
            <div key={card.label} className="border border-border rounded-sm bg-card p-5 hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <card.icon className={`w-5 h-5 ${card.color}`} />
                <h3 className="font-mono font-semibold text-sm text-foreground">{card.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fusion Logic */}
      <section className="relative z-20 max-w-5xl mx-auto px-6 pb-20">
        <div className="border border-border rounded-sm bg-card p-8">
          <h2 className="text-lg font-mono font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            FUSION SCORING MODEL
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono text-foreground">Water Stress → Migration Risk</span>
              </div>
              <p>Freshwater scarcity drives population displacement and cross-border migration pressure, destabilizing receiving regions.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-elevated" />
                <span className="font-mono text-foreground">Drought → Food Crisis</span>
              </div>
              <p>Sustained drought conditions collapse agricultural output, triggering acute food insecurity and market volatility.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CloudRain className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono text-foreground">Flood → Infrastructure Disruption</span>
              </div>
              <p>Extreme flooding events compromise critical infrastructure, severing supply chains and communications networks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground">FUSIONSCOPE v1.0</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">INTELLIGENCE CLASSIFICATION: UNCLASSIFIED</span>
        </div>
      </footer>
    </div>
  );
}
