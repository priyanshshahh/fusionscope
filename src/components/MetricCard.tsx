import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
  glowClass?: string;
}

export function MetricCard({ label, value, icon, className, glowClass }: MetricCardProps) {
  return (
    <div className={cn(
      'bg-card border border-border rounded-sm p-3 flex flex-col gap-1',
      glowClass,
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <span className="text-2xl font-mono font-bold text-foreground">{value}</span>
    </div>
  );
}
