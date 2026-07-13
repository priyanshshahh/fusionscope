import { Radio, Database, WifiOff } from 'lucide-react';
import { type DataStatus } from '@/lib/convert';

/**
 * Honest data-provenance indicator:
 * - LIVE: backend served data scored from World Bank / GDACS / UNHCR
 * - DEMO DATA: backend served the curated baseline dataset
 * - OFFLINE · DEMO: API unreachable, bundled demo dataset shown
 */
export function DataSourceBadge({ status }: { status: DataStatus }) {
  if (status === 'live') {
    return (
      <div className="flex items-center gap-1" title="Scored from live World Bank, GDACS and UNHCR data">
        <Radio className="w-3 h-3 text-low animate-pulse-glow" />
        <span className="text-[10px] font-mono text-low">LIVE</span>
      </div>
    );
  }
  if (status === 'demo') {
    return (
      <div className="flex items-center gap-1" title="Curated demo baseline dataset, not live measurements">
        <Database className="w-3 h-3 text-elevated" />
        <span className="text-[10px] font-mono text-elevated">DEMO DATA</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1" title="API unreachable — showing bundled demo dataset">
      <WifiOff className="w-3 h-3 text-high" />
      <span className="text-[10px] font-mono text-high">OFFLINE · DEMO</span>
    </div>
  );
}
