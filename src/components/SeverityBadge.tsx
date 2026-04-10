import { cn } from '@/lib/utils';
import { type Severity, getSeverityBg } from '@/data/types';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-xs font-mono font-semibold uppercase tracking-wider border rounded-sm',
      getSeverityBg(severity),
      className
    )}>
      {severity}
    </span>
  );
}
