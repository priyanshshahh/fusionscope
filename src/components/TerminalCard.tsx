import { cn } from '@/lib/utils';

interface TerminalCardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function TerminalCard({ title, className, children, headerRight }: TerminalCardProps) {
  return (
    <div className={cn(
      'bg-card border border-border rounded-sm overflow-hidden',
      className
    )}>
      {title && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}
