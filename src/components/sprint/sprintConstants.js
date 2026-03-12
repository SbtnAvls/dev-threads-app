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

export function formatSprintDate(dateStr, style = 'short') {
  if (!dateStr) return null
  const options = style === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short' }
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es', options)
}
