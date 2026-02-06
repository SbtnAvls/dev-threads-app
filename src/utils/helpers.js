export function fullName(user) {
  if (!user) return ''
  return `${user.first_name || ''} ${user.last_name || ''}`.trim()
}

export function parseDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr)
}
