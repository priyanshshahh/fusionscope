import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feedItems as feedItemsMock } from '@/data/mockData';
import { CATEGORY_LABELS, type Severity, type RiskScores, type FeedItem } from '@/data/types';
import { SeverityBadge } from '@/components/SeverityBadge';
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { apiClient } from '@/lib/api';
import { convertApiFeedItemToFrontend, type DataStatus } from '@/lib/convert';
import { Activity, Rss, Filter, ExternalLink } from 'lucide-react';

const severities: Severity[] = ['critical', 'high', 'elevated', 'low'];
const categories: (keyof RiskScores)[] = ['waterStress', 'drought', 'flood', 'foodInsecurity', 'migrationPressure', 'infrastructureDisruption'];

export default function FeedPage() {
  const [sevFilter, setSevFilter] = useState<Severity | 'all'>('all');
  const [catFilter, setCatFilter] = useState<keyof RiskScores | 'all'>('all');
  const [feedItems, setFeedItems] = useState<FeedItem[]>(feedItemsMock);
  const [dataStatus, setDataStatus] = useState<DataStatus>('offline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [feedResult, metricsResult] = await Promise.all([
        apiClient.getFeed(200),
        apiClient.getGlobalMetrics(),
      ]);
      if (feedResult.status === 'success' && feedResult.data) {
        setFeedItems(feedResult.data.map(convertApiFeedItemToFrontend));
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
    return feedItems.filter(f => {
      if (sevFilter !== 'all' && f.severity !== sevFilter) return false;
      if (catFilter !== 'all' && f.category !== catFilter) return false;
      return true;
    });
  }, [feedItems, sevFilter, catFilter]);

  return (
    <div className="min-h-screen bg-background terminal-grid">
      <div className="h-10 border-b border-border bg-card/50 flex items-center px-4 gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <Link to="/" className="font-mono font-bold text-xs tracking-wider text-foreground hover:text-primary transition-colors">FUSIONSCOPE</Link>
        <span className="text-muted-foreground font-mono text-[10px]">/ GLOBAL FEED</span>
        <div className="flex-1" />
        <DataSourceBadge status={dataStatus} />
        <Link to="/dashboard" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">DASHBOARD</Link>
        <Link to="/alerts" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">ALERTS</Link>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Rss className="w-5 h-5 text-primary" />
            Global Intelligence Feed
            <span className="text-xs font-mono text-muted-foreground ml-2">{filtered.length} items</span>
          </h1>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4 p-3 border border-border rounded-sm bg-card">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-muted-foreground mr-1">URGENCY:</span>
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

        {/* Feed grid */}
        {loading && <p className="text-xs font-mono text-muted-foreground p-4">Loading feed…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-xs font-mono text-muted-foreground p-4 border border-border rounded-sm bg-card">
            No feed items match the current filters.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map(item => (
            <div key={item.id} className="p-3 border border-border rounded-sm bg-card hover:border-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <SeverityBadge severity={item.severity} />
                <span className="text-[10px] font-mono text-muted-foreground">{CATEGORY_LABELS[item.category] ?? item.category}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{item.timestamp}</span>
              </div>
              <p className="text-xs font-mono text-foreground mb-1">{item.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.body}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 text-[9px] font-mono bg-secondary text-secondary-foreground rounded-sm">{tag}</span>
                ))}
                {item.sourceUrl ? (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[9px] font-mono text-primary hover:underline ml-auto">
                    {item.source || 'source'} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <Link to={`/country/${item.countryId}`} className="text-[9px] font-mono text-primary hover:underline ml-auto">{item.countryName}</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
