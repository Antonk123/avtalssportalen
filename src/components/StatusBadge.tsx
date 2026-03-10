import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ContractStatus } from '@/types';
import { CheckCircle, XCircle, AlertTriangle, FileText, Eye, LucideIcon } from 'lucide-react';

const statusConfig: Record<ContractStatus, { bg: string; text: string; label: string; icon: LucideIcon }> = {
  'Aktivt': { bg: 'bg-status-active/15', text: 'text-status-active', label: 'Aktivt', icon: CheckCircle },
  'Utgånget': { bg: 'bg-status-expired/15', text: 'text-status-expired', label: 'Utgånget', icon: XCircle },
  'Uppsagt': { bg: 'bg-status-terminated/15', text: 'text-status-terminated', label: 'Uppsagt', icon: AlertTriangle },
  'Utkast': { bg: 'bg-status-draft/15', text: 'text-status-draft', label: 'Utkast', icon: FileText },
  'Granskning': { bg: 'bg-status-review/15', text: 'text-status-review', label: 'Granskning', icon: Eye },
};

interface StatusBadgeProps {
  status: ContractStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.bg,
        config.text,
        status === 'Utgånget' && 'badge-pulse-urgent',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

interface DaysRemainingBadgeProps {
  days: number;
  className?: string;
}

export const DaysRemainingBadge = forwardRef<HTMLSpanElement, DaysRemainingBadgeProps>(
  ({ days, className }, ref) => {
    const color = days <= 14
      ? 'bg-status-expired/15 text-status-expired'
      : days <= 30
        ? 'bg-status-warning/15 text-status-warning'
        : days <= 60
          ? 'bg-status-terminated/15 text-status-terminated'
          : 'bg-status-active/15 text-status-active';

    return (
      <span ref={ref} className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', color, className)}>
        {days} dagar
      </span>
    );
  }
);
DaysRemainingBadge.displayName = 'DaysRemainingBadge';
