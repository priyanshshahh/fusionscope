import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { alerts as alertsMock } from '@/data/mockData';
import { CATEGORY_LABELS, type Severity, type RiskScores, type Alert, getSeverityColor } from '@/data/types';
import { SeverityBadge } from '@/components/SeverityBadge';
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { apiClient } from '@/lib/api';
import { convertApiAlertToFrontend, type DataStatus } from '@/lib/convert';
import { Activity, AlertTriangle, Filter, ExternalLink } from 'lucide-react';

const severities: Severity[] = ['critical', 'high', 'elevated', 'low'];
const categories: (keyof RiskScores)[] = ['waterStress', 'drought', 'flood', 'foodInsecurity', 'migrationPressure', 'infrastructureDisruption'];

export default function AlertsPage() {
  const [sevFilter, setSevFilter] = useState<Severity | 'all'>('all');
  const [catFilter, setCatFilter] = useState<keyof RiskScores | 'all'>('all');
  const [alerts, setAlerts] = useState<Alert[]>(alertsMock);
  const [dataStatus, setDataStatus] = useState<DataStatus>('offline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [alertsResult, metricsResult] = await Promise.all([
        apiClient.getAlerts(),
        apiClient.getGlobalMetrics(),
      ]);
      if (alertsResult.status === 'success' && alertsResult.data) {
        setAlerts(alertsResult.data.map(convertApiAlertToFrontend));
        const source = metricsResult.data?.data_source;
        setDataStatus(source === 'live' ? 'live' : 'demo');
      } else {
        setDataStatus('offline'); // bundled mock stays visible, labeled as such
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (sevFilter !== 'all' && a.severity !== sevFilter) return false;
      if (catFilter !== 'all' && a.category !== catFilter) return false;
      return true;
    });
  }, [alerts, sevFilter, catFilter]);

  return (
    <div className="min-h-screen bg-background terminal-grid">
      <div className="h-10 border-b border-border bg-card/50 flex items-center px-4 gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <Link to="/" className="font-mono font-bold text-xs tracking-wider text-foreground hover:text-primary transition-colors">FUSIONSCOPE</Link>
        <span className="text-muted-foreground font-mono text-[10px]">/ ALERTS CENTER</span>
        <div className="flex-1" />
        <DataSourceBadge status={dataStatus} />
        <Link to="/dashboard" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">DASHBOARD</Link>
        <Link to="/feed" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">FEED</Link>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-critical" />
            Alerts Center
            <span className="text-xs font-mono text-muted-foreground ml-2">{filtered.length} alerts</span>
          </h1>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4 p-3 border border-border rounded-sm bg-card">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-muted-foreground mr-1">SEVERITY:</span>
            <button onClick={() => setSevFilter('all')} className={`px-2 py-0.5 text-[10px] font-mono rounded-sm transition-all ${sevFilter === 'all' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>ALL</button>
            {severities.map(s => (
              <button key={s} onClick={() => setSevFilter(s)} className={`px-2 py-0.5 text-[10px] font-mono rounded-sm uppercase transition-all ${sevFilter === s ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>{s}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground mr-1">CATEGORY:</span>
            <button onClick={() => setCatFilter('all')} className={`px-2 py-0.5 text-[10px] font-mono rounded-sm transition-all ${catFilter === 'all' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>ALL</button>
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} className={`px-2 py-0.5 text-[10px] font-mono rounded-sm transition-all ${catFilter === c ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>{CATEGORY_LABELS[c].toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Alert list */}
        <div className="space-y-1">
          {loading && (
            <p className="text-xs font-mono text-muted-foreground p-4">Loading alerts…</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-xs font-mono text-muted-foreground p-4 border border-border rounded-sm bg-card">
              No alerts match the current filters.
            </p>
          )}
          {filtered.map(alert => (
            <div key={alert.id} className="flex items-start gap-3 p-3 border border-border rounded-sm bg-card hover:border-primary/20 transition-all">
              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-1 ${getSeverityColor(alert.severity)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-[10px] font-mono text-muted-foreground">{CATEGORY_LABELS[alert.category] ?? alert.category}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">·</span>
                  <Link to={`/country/${alert.countryId}`} className="text-[10px] font-mono text-primary hover:underline">{alert.countryName}</Link>
                  {alert.sourceUrl && (
                    <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[10px] font-mono text-primary hover:underline">
                      {alert.source || 'source'} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <p className="text-xs font-mono text-foreground">{alert.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{alert.description}</p>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{alert.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
