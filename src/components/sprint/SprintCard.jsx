import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Calendar,
  ChevronRight,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react'
import clsx from 'clsx'
import { Avatar } from '../ui'
import { fullName } from '../../utils/helpers'
import {
  statusConfig,
  issueStatusConfig,
  priorityConfig,
  formatSprintDate,
  formatDuration,
  getDaysUrgency,
} from './sprintConstants'

/* ------------------------------------------------------------------ */
/*  Issue preview row (compact single-line item inside sprint card)   */
/* ------------------------------------------------------------------ */
function IssuePreviewRow({ issue }) {
  const stCfg = issueStatusConfig[issue.status] || issueStatusConfig.open
  const prCfg = priorityConfig[issue.priority] || priorityConfig.medium
  const name = fullName(issue.assigned_to)

  return (
    <div className="flex items-center gap-2 py-1 min-w-0">
      {/* Status dot */}
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', stCfg.dot)} />

      {/* Title */}
      <span className="text-xs text-text-secondary truncate flex-1 min-w-0">
        {issue.title}
      </span>

      {/* Priority mini-badge */}
      <span className={clsx('text-[10px] font-medium shrink-0', prCfg.text)}>
        {prCfg.label}
      </span>

      {/* Assigned avatar */}
      {issue.assigned_to && (
        <Avatar
          name={name}
          src={issue.assigned_to.avatar_url}
          size="xs"
          className="shrink-0"
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Status count mini-badges row                                       */
/* ------------------------------------------------------------------ */
function StatusCounts({ counts, issueCount }) {
  if (!counts || issueCount === 0) return null

  // Only show statuses with count > 0
  const entries = Object.entries(issueStatusConfig).filter(
    ([key]) => (counts[key] || 0) > 0
  )
  if (entries.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {entries.map(([key, cfg]) => (
        <span
          key={key}
          className={clsx(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
            cfg.bg,
            cfg.text
          )}
          title={cfg.label}
        >
          <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {counts[key]}
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Progress bar                                                       */
/* ------------------------------------------------------------------ */
function ProgressBar({ percentage }) {
  const clamped = Math.min(Math.max(percentage, 0), 100)
  return (
    <div
      className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progreso del sprint: ${clamped}%`}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={clsx(
          'h-full rounded-full',
          clamped >= 80 ? 'bg-status-approved'
            : clamped >= 40 ? 'bg-status-in-review'
            : clamped > 0 ? 'bg-accent-blue'
            : 'bg-transparent'
        )}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main SprintCard                                                    */
/* ------------------------------------------------------------------ */
export function SprintCard({ sprint, index = 0, onEdit, onDelete }) {
  const config = statusConfig[sprint.status] || statusConfig.planning
  const progress = Math.min(sprint.progress_percentage ?? 0, 100)
  const issueCount = sprint.issue_count ?? 0
  const preview = sprint.issues_preview || []
  const moreCount = issueCount - preview.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={clsx(
        'relative group rounded-xl border border-border-primary bg-bg-secondary',
        'transition-all duration-300 overflow-hidden',
        config.glow,
        config.hoverBorder
      )}
    >
      {/* Status indicator line */}
      <div
        className={clsx(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300',
          config.dot,
          'group-hover:w-1.5'
        )}
      />

      {/* Link area */}
      <Link to={`/sprint/${sprint.id}`} className="block p-4 pl-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-white transition-colors">
              {sprint.name}
            </h3>
            {sprint.description && (
              <p className="text-sm text-text-secondary line-clamp-1 mt-0.5">
                {sprint.description}
              </p>
            )}
          </div>
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0',
              config.bg, config.text, config.border
            )}
          >
            <span className={clsx('w-2 h-2 rounded-full', config.dot, sprint.status === 'active' && 'animate-pulse')} />
            {config.label}
          </motion.span>
        </div>

        {/* Progress bar + percentage */}
        {issueCount > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <StatusCounts counts={sprint.status_counts} issueCount={issueCount} />
              <span className="text-[10px] text-text-muted font-medium shrink-0 ml-2">
                {progress}%
              </span>
            </div>
            <ProgressBar percentage={progress} />
          </div>
        )}

        {/* Time info row */}
        <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
          {/* Dates */}
          {(sprint.start_date || sprint.end_date) && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-text-muted" />
              <span>
                {formatSprintDate(sprint.start_date) || '--'}
                {' - '}
                {formatSprintDate(sprint.end_date) || '--'}
              </span>
            </div>
          )}

          {/* Duration */}
          {sprint.total_days != null && (
            <span className="text-text-muted">
              {formatDuration(sprint.total_days, sprint.total_weeks)}
            </span>
          )}

          {/* Days remaining */}
          {sprint.days_remaining != null && sprint.status !== 'completed' && sprint.status !== 'cancelled' && (
            <div className={clsx('flex items-center gap-1 font-medium', getDaysUrgency(sprint.days_remaining))}>
              <Clock className="w-3 h-3" />
              <span>
                {sprint.days_remaining < 0
                  ? `Vencido hace ${Math.abs(sprint.days_remaining)}d`
                  : sprint.days_remaining === 0
                    ? 'Vence hoy'
                    : `${sprint.days_remaining}d restantes`}
              </span>
            </div>
          )}
        </div>

        {/* Issues preview */}
        {preview.length > 0 && (
          <div className="border-t border-border-primary pt-2">
            <div className="space-y-0">
              {preview.map((issue) => (
                <IssuePreviewRow key={issue.id} issue={issue} />
              ))}
            </div>
            {moreCount > 0 && (
              <p className="text-[10px] text-text-muted mt-1">
                +{moreCount} mas
              </p>
            )}
          </div>
        )}

        {/* Bottom meta row */}
        <div className="flex items-center justify-between pt-2 border-t border-border-primary mt-2">
          <span className="text-xs text-text-muted">
            {issueCount} issue{issueCount !== 1 ? 's' : ''}
            {sprint.working_days_remaining != null && sprint.days_remaining !== sprint.working_days_remaining && (
              <span className="ml-2 text-text-muted">
                ({sprint.working_days_remaining}d laborables)
              </span>
            )}
          </span>
          <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      {/* Action buttons (shown on hover) */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-12 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(sprint) }}
              className="p-1.5 rounded-lg bg-bg-elevated/80 text-text-muted hover:text-accent-blue hover:bg-bg-elevated transition-colors"
              title="Editar sprint"
            >
              <Pencil className="w-3.5 h-3.5" />
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(sprint) }}
              className="p-1.5 rounded-lg bg-bg-elevated/80 text-text-muted hover:text-status-rejected hover:bg-bg-elevated transition-colors"
              title="Eliminar sprint"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  )
}
