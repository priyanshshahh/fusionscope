import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { countries as countriesMock, alerts as alertsMock, feedItems as feedItemsMock } from '@/data/mockData';
import { CATEGORY_LABELS, getSeverityColor, calculateDimensions, DIMENSION_LABELS, type Dimension, type CountryData } from '@/data/types';
import { TerminalCard } from '@/components/TerminalCard';
import { SeverityBadge } from '@/components/SeverityBadge';
import { Activity, ArrowLeft, AlertTriangle, ExternalLink, Radio, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { apiClient, type ApiHistoryPoint } from '@/lib/api';
import { convertApiCountryToFrontend, convertApiAlertToFrontend, convertApiFeedItemToFrontend } from '@/lib/convert';
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { countryProvenance, CONFIDENCE_STYLE } from '@/lib/provenance';

const barColors: Record<string, string> = {
  waterStress: '#0ea5e9',
  drought: '#f59e0b',
  flood: '#3b82f6',
  foodInsecurity: '#ef4444',
  migrationPressure: '#f97316',
  infrastructureDisruption: '#a855f7',
};

export default function CountryDetail() {
  const { id } = useParams<{ id: string }>();
  const [country, setCountry] = useState<CountryData | null>(null);
  const [countryAlerts, setCountryAlerts] = useState<any[]>([]);
  const [countryFeed, setCountryFeed] = useState<any[]>([]);
  const [history, setHistory] = useState<ApiHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch country data from API
  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          setCountry(null);
          return;
        }

        // Fetch country data
        const countryResult = await apiClient.getCountry(id.toUpperCase());
        if (countryResult.status === 'success' && countryResult.data) {
          const convertedCountry = convertApiCountryToFrontend(countryResult.data);
          setCountry(convertedCountry);

          // Fetch country alerts
          const alertsResult = await apiClient.getCountryAlerts(id.toUpperCase());
          if (alertsResult.status === 'success' && alertsResult.data) {
            setCountryAlerts(alertsResult.data.map(convertApiAlertToFrontend));
          }

          // Fetch country feed
          const feedResult = await apiClient.getCountryFeed(id.toUpperCase());
          if (feedResult.status === 'success' && feedResult.data) {
            setCountryFeed(feedResult.data.map(convertApiFeedItemToFrontend));
          }

          // Fetch accumulated score history (real trend when >= 2 points)
          const historyResult = await apiClient.getCountryHistory(id.toUpperCase());
          if (historyResult.status === 'success' && historyResult.data) {
            setHistory(historyResult.data);
          }
        } else {
          // Try mock data as fallback
          const mockCountry = countriesMock.find(c => c.id.toLowerCase() === id?.toLowerCase());
          if (mockCountry) {
            setCountry(mockCountry);
            setCountryAlerts(alertsMock.filter(a => a.countryId === mockCountry.id));
            setCountryFeed(feedItemsMock.filter(f => f.countryId === mockCountry.id));
          } else {
            setCountry(null);
          }
        }
      } catch (error) {
        console.warn('Fetch failed, falling back to mock data:', error);
        // Fallback to mock data
        const mockCountry = countriesMock.find(c => c.id.toLowerCase() === id?.toLowerCase());
        if (mockCountry) {
          setCountry(mockCountry);
          setCountryAlerts(alertsMock.filter(a => a.countryId === mockCountry.id));
          setCountryFeed(feedItemsMock.filter(f => f.countryId === mockCountry.id));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCountryData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-muted-foreground mb-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-muted-foreground mb-4">Country not found</p>
          <Link to="/dashboard" className="text-xs font-mono text-primary hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const demoTrend = (country.trend ?? []).map((v, i) => ({ month: months[i], score: v }));
  // Real accumulated history takes precedence once >= 2 snapshots exist.
  const historyTrend = history.map(p => ({
    month: new Date(p.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: Math.round(p.fusion_score),
  }));
  const riskBars = Object.entries(country.risks).map(([key, val]) => ({
    name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
    key,
    value: val,
  }));
  const dimensions = calculateDimensions(country.risks);
  const provenance = countryProvenance(country);

  return (
    <div className="min-h-screen bg-background terminal-grid">
      {/* Top bar */}
      <div className="h-10 border-b border-border bg-card/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <Link to="/" className="font-mono font-bold text-xs tracking-wider text-foreground hover:text-primary transition-colors">FUSIONSCOPE</Link>
          <span className="text-muted-foreground font-mono text-[10px]">/ <Link to="/dashboard" className="hover:text-primary transition-colors">DASHBOARD</Link> / {country.name.toUpperCase()}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> BACK
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{country.name}</h1>
              <p className="text-xs font-mono text-muted-foreground">{country.region} · {country.lat.toFixed(2)}°, {country.lon.toFixed(2)}°</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DataSourceBadge status={country.dataSource ?? 'offline'} />
            <div className="text-right">
              <span className="text-3xl font-mono font-bold text-foreground">{country.fusionScore}</span>
              <span className="text-xs text-muted-foreground ml-1">/ 100</span>
            </div>
            <SeverityBadge severity={country.severity} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Risk Breakdown */}
          <TerminalCard title="Risk Breakdown" className="col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskBars} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={95} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 7%)', border: '1px solid hsl(220, 16%, 14%)', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                  {riskBars.map((entry) => (
                    <Cell key={entry.key} fill={barColors[entry.key]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TerminalCard>

          {/* Summary */}
          <TerminalCard title="Situation Summary">
            <p className="text-xs text-muted-foreground leading-relaxed font-mono">{country.summary}</p>
            {country.dataSource === 'live' && country.estimatedVectors && country.estimatedVectors.length > 0 && (
              <p className="text-[10px] text-muted-foreground/70 font-mono mt-2">
                * Estimated from baseline (no live source): {country.estimatedVectors.join(', ').replace(/_/g, ' ')}
              </p>
            )}
            <div className="mt-4 space-y-2">
              {Object.entries(country.risks).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS]}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: barColors[key] }} />
                    </div>
                    <span className="font-mono text-foreground w-6 text-right">{val}</span>
                  </div>
                </div>
              ))}
            </div>
          </TerminalCard>
        </div>

        {/* INFORM dimension breakdown */}
        <TerminalCard title="INFORM Risk Dimensions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.keys(dimensions) as Dimension[]).map(dim => (
              <div key={dim} className="p-3 border border-border rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-muted-foreground">{DIMENSION_LABELS[dim]}</span>
                  <span className="text-lg font-mono font-bold text-foreground">{dimensions[dim]}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${dimensions[dim]}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/70 mt-3 leading-relaxed">
            Vectors grouped under the three dimensions of the{' '}
            <a href="https://drmkc.jrc.ec.europa.eu/inform-index" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">INFORM Risk Index (EC JRC)</a>.
            The composite fusion score is the geometric mean of these three dimensions.
          </p>
        </TerminalCard>

        {/* Per-vector provenance, confidence and source links */}
        <TerminalCard title="Vector Provenance & Sources">
          <div className="space-y-1.5">
            {provenance.map(row => (
              <div key={row.vector} className="flex flex-wrap items-center gap-2 p-2 border border-border rounded-sm text-xs">
                <span className="font-mono text-foreground w-40 shrink-0">{CATEGORY_LABELS[row.vector]}</span>
                <span className="font-mono text-foreground w-8 text-right">{row.score}</span>
                {row.isLive ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono rounded-sm border border-low/30 bg-low/10 text-low">
                    <Radio className="w-2.5 h-2.5" /> LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono rounded-sm border border-elevated/30 bg-elevated/10 text-elevated">
                    <Database className="w-2.5 h-2.5" /> BASELINE
                  </span>
                )}
                <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded-sm border uppercase ${CONFIDENCE_STYLE[row.confidence]}`} title="live+fresh = high, live+stale = medium, baseline = low">
                  {row.confidence} confidence
                </span>
                <a href={row.source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[10px] font-mono text-primary hover:underline ml-auto" title={row.source.detail}>
                  {row.source.source} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            ))}
          </div>
          {country.updatedAt && (
            <p className="text-[10px] font-mono text-muted-foreground/70 mt-3">
              Snapshot fetched {new Date(country.updatedAt).toLocaleString()}.
            </p>
          )}
        </TerminalCard>

        {/* Trend: real accumulated history preferred; demo series or an honest
            empty state otherwise. */}
        {(() => {
          const isReal = historyTrend.length >= 2;
          const trendData = isReal ? historyTrend : demoTrend;
          if (trendData.length === 0) {
            return (
              <TerminalCard title="Fusion Score History">
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                  {history.length === 1
                    ? 'One snapshot recorded so far — a trend line appears once a second refresh accumulates.'
                    : 'No historical series yet — scores are point-in-time snapshots. A trend chart will appear once score history accumulates across refreshes.'}
                </p>
              </TerminalCard>
            );
          }
          return (
            <TerminalCard title={isReal ? `Fusion Score History (${history.length} snapshots)` : '12-Month Fusion Score Trend (demo data)'}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(200, 100%, 50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(200, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(220, 18%, 7%)', border: '1px solid hsl(220, 16%, 14%)', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Area type="monotone" dataKey="score" stroke="hsl(200, 100%, 50%)" fill="url(#trendGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </TerminalCard>
          );
        })()}

        <div className="grid grid-cols-2 gap-4">
          {/* Alerts */}
          <TerminalCard title={`Alerts (${countryAlerts.length})`}>
            <div className="space-y-2 max-h-64 overflow-auto">
              {countryAlerts.length === 0 && <p className="text-xs text-muted-foreground font-mono">No active alerts</p>}
              {countryAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-border last:border-0">
                  <AlertTriangle className={`w-3 h-3 shrink-0 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                  <div>
                    <p className="font-mono text-foreground text-[11px]">{alert.title}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">{alert.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-[10px] text-muted-foreground">{alert.timestamp}</span>
                      {alert.sourceUrl && (
                        <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-0.5 text-[10px] font-mono text-primary hover:underline">
                          {alert.source || 'source'} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TerminalCard>

          {/* Feed */}
          <TerminalCard title="Intelligence Feed">
            <div className="space-y-2 max-h-64 overflow-auto">
              {countryFeed.length === 0 && <p className="text-xs text-muted-foreground font-mono">No intelligence items</p>}
              {countryFeed.map(item => (
                <div key={item.id} className="py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={item.severity} />
                    <span className="text-[10px] text-muted-foreground font-mono">{item.timestamp}</span>
                    {item.sourceUrl && (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-0.5 text-[10px] font-mono text-primary hover:underline">
                        {item.source || 'source'} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-mono text-foreground">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.body}</p>
                </div>
              ))}
            </div>
          </TerminalCard>
        </div>
      </div>
    </div>
  );
}
