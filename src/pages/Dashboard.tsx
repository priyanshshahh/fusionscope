import { useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { type CountryData, type RiskScores, CATEGORY_LABELS, getSeverityColor } from '@/data/types';
import { countries as allCountriesMock, alerts as alertsMock, feedItems as feedItemsMock, globalMetrics as globalMetricsMock } from '@/data/mockData';
import { TerminalCard } from '@/components/TerminalCard';
import { MetricCard } from '@/components/MetricCard';
import { SeverityBadge } from '@/components/SeverityBadge';
// Code-split the three.js globe so it stays out of the initial bundle.
const GlobeMap = lazy(() => import('@/components/GlobeMap'));
import { Link, useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Globe, Shield, Zap, Layers, Droplets, Flame, CloudRain, Wheat, Users, Wrench, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { apiClient } from '@/lib/api';
import { convertApiCountryToFrontend, convertApiAlertToFrontend, convertApiFeedItemToFrontend, type DataStatus } from '@/lib/convert';
import { DataSourceBadge } from '@/components/DataSourceBadge';

const layerConfig: { key: keyof RiskScores; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'waterStress', label: 'Water Stress', icon: Droplets, color: '#0ea5e9' },
  { key: 'drought', label: 'Drought', icon: Flame, color: '#f59e0b' },
  { key: 'flood', label: 'Flood', icon: CloudRain, color: '#3b82f6' },
  { key: 'foodInsecurity', label: 'Food Insecurity', icon: Wheat, color: '#ef4444' },
  { key: 'migrationPressure', label: 'Migration', icon: Users, color: '#f97316' },
  { key: 'infrastructureDisruption', label: 'Infrastructure', icon: Wrench, color: '#a855f7' },
];

// WorldMapPanel removed - using GlobeMap component instead
export default function Dashboard() {
  const [activeLayers, setActiveLayers] = useState<Set<keyof RiskScores>>(new Set());
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [allCountries, setAllCountries] = useState<CountryData[]>(allCountriesMock);
  const [alerts, setAlerts] = useState(alertsMock);
  const [feedItems, setFeedItems] = useState(feedItemsMock);
  const [globalMetrics, setGlobalMetrics] = useState(globalMetricsMock);
  const [loading, setLoading] = useState(true);
  // Honest provenance: 'offline' until the API answers, then live/demo per payload
  const [dataStatus, setDataStatus] = useState<DataStatus>('offline');
  const navigate = useNavigate();

  // Fetch data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch countries
        const countriesResult = await apiClient.getCountries();
        if (countriesResult.status === 'success' && countriesResult.data) {
          const convertedCountries = countriesResult.data.map(convertApiCountryToFrontend);
          setAllCountries(convertedCountries);
          setDataStatus(convertedCountries[0]?.dataSource === 'live' ? 'live' : 'demo');
        } else {
          setDataStatus('offline');
        }

        // Fetch alerts
        const alertsResult = await apiClient.getAlerts();
        if (alertsResult.status === 'success' && alertsResult.data) {
          setAlerts(alertsResult.data.map(convertApiAlertToFrontend));
        }

        // Fetch feed
        const feedResult = await apiClient.getFeed(6);
        if (feedResult.status === 'success' && feedResult.data) {
          setFeedItems(feedResult.data.map(convertApiFeedItemToFrontend));
        }

        // Fetch global metrics
        const metricsResult = await apiClient.getGlobalMetrics();
        if (metricsResult.status === 'success' && metricsResult.data) {
          setGlobalMetrics({
            activeAlerts: metricsResult.data.active_alerts,
            criticalRegions: metricsResult.data.critical_countries,
            elevatedRegions: metricsResult.data.elevated_countries,
            globalFusionScore: Math.round(metricsResult.data.avg_fusion_score),
          });
        }
      } catch (error) {
        console.warn('API fetch failed, using mock data:', error);
        setDataStatus('offline'); // mock data stays visible, labeled as such
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleLayer = (key: keyof RiskScores) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const topCountries = useMemo(() =>
    [...allCountries].sort((a, b) => b.fusionScore - a.fusionScore).slice(0, 10),
    [allCountries]
  );

  const recentAlerts = useMemo(() => alerts.slice(0, 8), [alerts]);
  const recentFeed = useMemo(() => feedItems.slice(0, 6), [feedItems]);

  const selected = selectedCountry || topCountries[0];

  const radarData = selected ? Object.entries(selected.risks).map(([key, val]) => ({
    subject: CATEGORY_LABELS[key as keyof RiskScores].split(' ')[0],
    value: val,
  })) : [];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="h-10 border-b border-border bg-card/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <Link to="/" className="font-mono font-bold text-xs tracking-wider text-foreground hover:text-primary transition-colors">FUSIONSCOPE</Link>
          <span className="text-muted-foreground font-mono text-[10px]">/ GLOBAL DASHBOARD</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/alerts" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">ALERTS</Link>
          <Link to="/feed" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">FEED</Link>
          <Link to="/methodology" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">METHOD</Link>
          <DataSourceBadge status={dataStatus} />
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-2 p-2 shrink-0">
        <MetricCard label="Active Alerts" value={globalMetrics.activeAlerts} icon={<AlertTriangle className="w-3.5 h-3.5 text-critical" />} glowClass="glow-critical" />
        <MetricCard label="Critical Regions" value={globalMetrics.criticalRegions} icon={<Shield className="w-3.5 h-3.5 text-high" />} glowClass="glow-warning" />
        <MetricCard label="Elevated Regions" value={globalMetrics.elevatedRegions} icon={<Globe className="w-3.5 h-3.5 text-elevated" />} />
        <MetricCard label="Global Fusion Score" value={globalMetrics.globalFusionScore} icon={<Zap className="w-3.5 h-3.5 text-primary" />} glowClass="glow-primary" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden p-2 pt-0 gap-2">
        {/* Left sidebar - Layer Controls */}
        <div className="w-48 shrink-0 flex flex-col gap-2">
          <TerminalCard title="Layers" className="flex-1">
            <div className="space-y-1">
              {layerConfig.map(layer => (
                <button
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs font-mono transition-all ${
                    activeLayers.has(layer.key)
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <layer.icon className="w-3.5 h-3.5" style={{ color: activeLayers.has(layer.key) ? layer.color : undefined }} />
                  <span>{layer.label}</span>
                </button>
              ))}
              <button
                onClick={() => setActiveLayers(new Set())}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Fusion Score</span>
              </button>
            </div>
          </TerminalCard>

          <TerminalCard title="Instability Ranking" className="flex-1 overflow-auto">
            <div className="space-y-0.5">
              {topCountries.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCountry(c); }}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded-sm text-xs font-mono transition-all hover:bg-secondary/50 ${
                    selected?.id === c.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground w-3">{i + 1}</span>
                    <span className="text-foreground">{c.name}</span>
                  </span>
                  <span className={getSeverityColor(c.severity)}>{c.fusionScore}</span>
                </button>
              ))}
            </div>
          </TerminalCard>
        </div>

        {/* Center - Map */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex-1">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center border border-border rounded-sm bg-background/50">
                <span className="text-xs font-mono text-muted-foreground">Loading globe…</span>
              </div>
            }>
              <GlobeMap
                countries={allCountries}
                activeLayers={activeLayers}
                onSelectCountry={(c) => setSelectedCountry(c)}
                selectedCountry={selected?.id || null}
              />
            </Suspense>
          </div>

          {/* Bottom panels */}
          <div className="h-48 grid grid-cols-2 gap-2 shrink-0">
            <TerminalCard title="Live Intelligence Feed" className="overflow-auto">
              <div className="space-y-2">
                {recentFeed.map(item => (
                  <div key={item.id} className="flex items-start gap-2 text-xs">
                    <SeverityBadge severity={item.severity} className="shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-mono text-foreground truncate">{item.title}</p>
                      <p className="text-muted-foreground text-[10px]">{item.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TerminalCard>

            <TerminalCard title="Strategic Risk Overview" className="overflow-hidden">
              {!selected?.trend ? (
                <p className="text-[11px] font-mono text-muted-foreground leading-relaxed p-2">
                  No historical series yet — live scores are point-in-time.
                  Trend charts appear once score history accumulates.
                </p>
              ) : (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={selected.trend.map((v, i) => ({ month: `M${i + 1}`, score: v }))}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(200, 100%, 50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(200, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip contentStyle={{ background: 'hsl(220, 18%, 7%)', border: '1px solid hsl(220, 16%, 14%)', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Area type="monotone" dataKey="score" stroke="hsl(200, 100%, 50%)" fill="url(#riskGrad)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </TerminalCard>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 shrink-0 flex flex-col gap-2 overflow-auto">
          {/* Selected country info */}
          <TerminalCard title={selected ? `${selected.name} Intelligence` : 'Select Country'}>
            {selected && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-mono font-bold text-foreground">{selected.fusionScore}</span>
                    <span className="text-xs text-muted-foreground ml-1">/ 100</span>
                  </div>
                  <SeverityBadge severity={selected.severity} />
                </div>
                <button
                  onClick={() => navigate(`/country/${selected.id}`)}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-primary/10 border border-primary/30 rounded-sm text-xs font-mono text-primary hover:bg-primary/20 transition-all"
                >
                  VIEW FULL ANALYSIS <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </TerminalCard>

          <TerminalCard title="Situation Summary" className="flex-shrink-0">
            <p className="text-xs text-muted-foreground leading-relaxed font-mono">
              {selected?.summary || 'Select a country to view its generated situation summary.'}
            </p>
            {selected?.dataSource === 'live' && selected.estimatedVectors && selected.estimatedVectors.length > 0 && (
              <p className="text-[10px] text-muted-foreground/70 font-mono mt-2">
                * {selected.estimatedVectors.length} of 6 vectors estimated from baseline (no live source)
              </p>
            )}
          </TerminalCard>

          <TerminalCard title="Risk Radar" className="flex-shrink-0">
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220, 16%, 14%)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: 'hsl(215, 12%, 50%)' }} />
                <Radar dataKey="value" stroke="hsl(200, 100%, 50%)" fill="hsl(200, 100%, 50%)" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </TerminalCard>

          <TerminalCard title="Active Alerts" className="flex-1 overflow-auto">
            <div className="space-y-1.5">
              {recentAlerts.filter(a => !selected || a.countryId === selected.id || true).slice(0, 5).map(alert => (
                <div key={alert.id} className="flex items-start gap-2 text-xs py-1 border-b border-border last:border-0">
                  <AlertTriangle className={`w-3 h-3 shrink-0 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                  <div className="min-w-0">
                    <p className="font-mono text-foreground text-[11px] leading-tight">{alert.title}</p>
                    <p className="text-muted-foreground text-[10px]">{alert.countryName} · {alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </TerminalCard>
        </div>
      </div>
    </div>
  );
}
