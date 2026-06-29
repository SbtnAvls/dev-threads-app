export function fullName(user) {
  if (!user) return ''
  return `${user.first_name || ''} ${user.last_name || ''}`.trim()
}

export function parseDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr)
}

/**
 * Short, Spanish relative time (e.g. "ahora", "hace 5 min", "hace 2 h", "hace 3 d").
 */
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 45) return 'ahora' // also covers small clock skew / future timestamps
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `hace ${weeks} sem`
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(days / 365)
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`
}
