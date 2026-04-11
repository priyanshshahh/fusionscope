import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { countries as countriesMock, alerts as alertsMock, feedItems as feedItemsMock } from '@/data/mockData';
import { CATEGORY_LABELS, getSeverityColor, type CountryData } from '@/data/types';
import { TerminalCard } from '@/components/TerminalCard';
import { SeverityBadge } from '@/components/SeverityBadge';
import { Activity, ArrowLeft, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { apiClient } from '@/lib/api';

const barColors: Record<string, string> = {
  waterStress: '#0ea5e9',
  drought: '#f59e0b',
  flood: '#3b82f6',
  foodInsecurity: '#ef4444',
  migrationPressure: '#f97316',
  infrastructureDisruption: '#a855f7',
};

// Helper function to convert API response to frontend format
function convertApiCountryToFrontend(apiCountry: any): CountryData {
  const trend = Array.from({ length: 12 }, () => 
    Math.round(apiCountry.fusion_score + Math.random() * 10 - 5)
  );
  
  return {
    id: apiCountry.code,
    name: apiCountry.name,
    region: apiCountry.region,
    lat: apiCountry.lat,
    lon: apiCountry.lon,
    risks: {
      waterStress: apiCountry.risks.water_stress,
      drought: apiCountry.risks.drought,
      flood: apiCountry.risks.flood,
      foodInsecurity: apiCountry.risks.food_insecurity,
      migrationPressure: apiCountry.risks.migration_pressure,
      infrastructureDisruption: apiCountry.risks.infrastructure_disruption,
    },
    fusionScore: apiCountry.fusion_score,
    severity: apiCountry.severity,
    summary: apiCountry.ai_summary,
    trend,
  };
}

export default function CountryDetail() {
  const { id } = useParams<{ id: string }>();
  const [country, setCountry] = useState<CountryData | null>(null);
  const [countryAlerts, setCountryAlerts] = useState<any[]>([]);
  const [countryFeed, setCountryFeed] = useState<any[]>([]);
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
            setCountryAlerts(alertsResult.data);
          }

          // Fetch country feed
          const feedResult = await apiClient.getCountryFeed(id.toUpperCase());
          if (feedResult.status === 'success' && feedResult.data) {
            setCountryFeed(feedResult.data);
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
  const trendData = country.trend.map((v, i) => ({ month: months[i], score: v }));
  const riskBars = Object.entries(country.risks).map(([key, val]) => ({
    name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
    key,
    value: val,
  }));

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

          {/* AI Summary */}
          <TerminalCard title="AI Intelligence Summary">
            <p className="text-xs text-muted-foreground leading-relaxed font-mono">{country.summary}</p>
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

        {/* Trend */}
        <TerminalCard title="12-Month Fusion Score Trend">
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
