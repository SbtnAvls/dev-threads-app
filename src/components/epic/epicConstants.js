// Epic constants mirror the Sprint pattern. Status, issue-status and priority
// configs are shared with Sprint (epics reuse Sprint's Status choices and
// Issue's Priority choices on the backend), so we re-export them here to keep a
// single source of truth instead of duplicating the colour maps.
export {
  statusConfig,
  issueStatusConfig,
  priorityConfig,
} from '../sprint/sprintConstants'

// Fixed colour presets for the epic form (decision SUP-3: presets, not a free
// colour picker). All values are hex pulled from the app theme palette.
export const COLOR_PRESETS = [
  '#3b82f6', // accent-blue
  '#10b981', // status-approved (green)
  '#8b5cf6', // status-tech-debt (purple)
  '#f59e0b', // status-in-review (amber)
  '#ef4444', // status-rejected (red)
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
]

export const DEFAULT_EPIC_COLOR = COLOR_PRESETS[0]

/**
 * Format an epic date (start_date / target_date).
 * 'short' -> "5 jun", 'long' -> "5 de junio de 2025".
 */
export function formatEpicDate(dateStr, style = 'short') {
  if (!dateStr) return null
  const options = style === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short' }
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es', options)
}

/**
 * Pick a readable text colour (#fff or #1a1a2e) for a given hex background,
 * using the relative-luminance heuristic. Used for badges painted with
 * epic.color so the label stays legible on any preset.
 *
 * NOTE: helper prepared deliberately ahead of its consumer. Its consumer is
 * the EpicBadge component built in Fase 3 (AC-10), which paints the epic name
 * over epic.color and needs a legible text colour. It is intentionally NOT
 * dead code — it is a forward-declared helper for the next phase. See
 * developing/sistema-epicas/REVIEW-phase-2.md F1 and context/phase-3.md.
 */
export function getContrastText(hex) {
  if (!hex || typeof hex !== 'string') return '#ffffff'
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return '#ffffff'
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  // Perceived luminance (sRGB weights)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1a1a2e' : '#ffffff'
}
