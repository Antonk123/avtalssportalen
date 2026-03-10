import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'active' | 'warning' | 'muted';
  index?: number;
}

const variantStyles = {
  default: 'border-border',
  active: 'border-status-active/30',
  warning: 'border-status-warning/30',
  muted: 'border-muted-foreground/20',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  active: 'bg-status-active/10 text-status-active',
  warning: 'bg-status-warning/10 text-status-warning',
  muted: 'bg-muted text-muted-foreground',
};

export function KpiCard({ title, value, icon: Icon, variant = 'default', index = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.34, 1.56, 0.64, 1], // Bounce ease
        scale: { duration: 0.35 }
      }}
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={cn(
        'rounded-xl border bg-card p-5 card-elevated',
        variantStyles[variant]
      )}
      style={{ perspective: 1000 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 font-heading text-3xl font-bold text-card-foreground">{value}</p>
        </div>
        <div className={cn('rounded-lg p-2.5', iconVariantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
