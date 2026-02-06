import { motion } from 'framer-motion'
import clsx from 'clsx'

const variants = {
  default: 'bg-bg-elevated text-text-secondary border-border-primary',
  open: 'bg-status-open/20 text-status-open border-status-open/30',
  in_review: 'bg-status-in-review/20 text-status-in-review border-status-in-review/30',
  rejected: 'bg-status-rejected/20 text-status-rejected border-status-rejected/30',
  approved: 'bg-status-approved/20 text-status-approved border-status-approved/30',
  tech_debt: 'bg-status-tech-debt/20 text-status-tech-debt border-status-tech-debt/30',
  // Priority variants
  low: 'bg-priority-low/20 text-priority-low border-priority-low/30',
  medium: 'bg-priority-medium/20 text-priority-medium border-priority-medium/30',
  high: 'bg-priority-high/20 text-priority-high border-priority-high/30',
  critical: 'bg-priority-critical/20 text-priority-critical border-priority-critical/30',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

const statusLabels = {
  open: 'Abierto',
  in_review: 'En Revisión',
  rejected: 'Rechazado',
  approved: 'Aprobado',
  tech_debt: 'Deuda Técnica',
}

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className,
}) {
  const label = children || statusLabels[variant] || priorityLabels[variant] || variant

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={clsx(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                variant === 'open' && 'bg-status-open',
                variant === 'in_review' && 'bg-status-in-review',
                variant === 'rejected' && 'bg-status-rejected',
                variant === 'approved' && 'bg-status-approved',
                variant === 'tech_debt' && 'bg-status-tech-debt',
              )}
            />
          )}
          <span
            className={clsx(
              'relative inline-flex rounded-full h-2 w-2',
              variant === 'open' && 'bg-status-open',
              variant === 'in_review' && 'bg-status-in-review',
              variant === 'rejected' && 'bg-status-rejected',
              variant === 'approved' && 'bg-status-approved',
              variant === 'tech_debt' && 'bg-status-tech-debt',
              variant === 'default' && 'bg-text-muted',
            )}
          />
        </span>
      )}
      {label}
    </motion.span>
  )
}

export function StatusBadge({ status, ...props }) {
  return <Badge variant={status} dot pulse={status === 'in_review'} {...props} />
}

export function PriorityBadge({ priority, ...props }) {
  return <Badge variant={priority} {...props}>{priorityLabels[priority]}</Badge>
}
