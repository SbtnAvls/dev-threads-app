import { Target } from 'lucide-react'
import clsx from 'clsx'
import { getContrastText } from './epicConstants'

/**
 * Coloured pill badge for an issue's epic. Mirrors the sprint badge in
 * IssueCard (Zap icon) but is painted inline from `epic.color`, with the
 * label colour derived via getContrastText so it stays legible on any preset.
 *
 * Sizes:
 *  - 'md' (default): large card badge (matches IssueCard sprint badge).
 *  - 'sm': compact list badge (matches IssueCardCompact sprint badge).
 *
 * Renders nothing when no epic is provided, so callers can drop it in
 * unconditionally next to the sprint badge.
 */
export function EpicBadge({ epic, size = 'md', className }) {
  if (!epic) return null

  const color = epic.color || '#3b82f6'
  const textColor = getContrastText(color)
  const isSm = size === 'sm'

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        isSm
          ? 'px-1.5 py-0.5 text-[10px]'
          : 'px-2 py-0.5 text-[11px]',
        className,
      )}
      style={{
        backgroundColor: color,
        borderColor: color,
        color: textColor,
      }}
      title={`Epica: ${epic.name}`}
    >
      <Target className="w-3 h-3 shrink-0" />
      <span
        className={clsx(
          'truncate',
          isSm ? 'max-w-[80px] hidden sm:inline' : 'max-w-[100px]',
        )}
      >
        {epic.name}
      </span>
    </span>
  )
}
