export const statusConfig = {
  planning: {
    label: 'Planificacion',
    bg: 'bg-accent-blue/20',
    text: 'text-accent-blue',
    border: 'border-accent-blue/30',
    dot: 'bg-accent-blue',
    glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    hoverBorder: 'hover:border-accent-blue/50',
  },
  active: {
    label: 'Activo',
    bg: 'bg-status-approved/20',
    text: 'text-status-approved',
    border: 'border-status-approved/30',
    dot: 'bg-status-approved',
    glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    hoverBorder: 'hover:border-status-approved/50',
  },
  completed: {
    label: 'Completado',
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    dot: 'bg-purple-400',
    glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
    hoverBorder: 'hover:border-purple-500/50',
  },
  cancelled: {
    label: 'Cancelado',
    bg: 'bg-status-rejected/20',
    text: 'text-status-rejected',
    border: 'border-status-rejected/30',
    dot: 'bg-status-rejected',
    glow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
    hoverBorder: 'hover:border-status-rejected/50',
  },
}

// Issue status config for mini-badges and preview dots
export const issueStatusConfig = {
  open:      { label: 'Abierto',       dot: 'bg-status-open',      text: 'text-status-open',      bg: 'bg-status-open/20' },
  in_review: { label: 'En Revision',   dot: 'bg-status-in-review', text: 'text-status-in-review', bg: 'bg-status-in-review/20' },
  approved:  { label: 'Aprobado',      dot: 'bg-status-approved',  text: 'text-status-approved',  bg: 'bg-status-approved/20' },
  rejected:  { label: 'Rechazado',     dot: 'bg-status-rejected',  text: 'text-status-rejected',  bg: 'bg-status-rejected/20' },
  tech_debt: { label: 'Deuda Tecnica', dot: 'bg-status-tech-debt', text: 'text-status-tech-debt', bg: 'bg-status-tech-debt/20' },
}

// Priority config for mini-badges
export const priorityConfig = {
  low:      { label: 'Baja',    dot: 'bg-priority-low',      text: 'text-priority-low' },
  medium:   { label: 'Media',   dot: 'bg-priority-medium',   text: 'text-priority-medium' },
  high:     { label: 'Alta',    dot: 'bg-priority-high',     text: 'text-priority-high' },
  critical: { label: 'Critica', dot: 'bg-priority-critical', text: 'text-priority-critical' },
}

export function formatSprintDate(dateStr, style = 'short') {
  if (!dateStr) return null
  const options = style === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short' }
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es', options)
}

/**
 * Format sprint duration as human-readable string.
 * e.g. "2 semanas", "10 dias", "1.5 semanas"
 */
export function formatDuration(totalDays, totalWeeks) {
  if (totalDays == null) return null
  if (totalWeeks != null && totalWeeks >= 1) {
    const w = Math.round(totalWeeks * 10) / 10
    return w === 1 ? '1 semana' : `${w} semanas`
  }
  return totalDays === 1 ? '1 dia' : `${totalDays} dias`
}

/**
 * Get urgency color class for days remaining.
 * Green > 5, Yellow 2-5, Red 0-1, Gray if null/finished.
 */
export function getDaysUrgency(daysRemaining) {
  if (daysRemaining == null) return 'text-text-muted'
  if (daysRemaining < 0) return 'text-status-rejected'
  if (daysRemaining <= 1) return 'text-status-rejected'
  if (daysRemaining <= 5) return 'text-status-in-review'
  return 'text-status-approved'
}
