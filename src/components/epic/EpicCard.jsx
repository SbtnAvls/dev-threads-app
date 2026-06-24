import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Calendar,
  ChevronRight,
  Layers,
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
  formatEpicDate,
} from './epicConstants'

/* ------------------------------------------------------------------ */
/*  Issue preview row (compact single-line item inside epic card)     */
/* ------------------------------------------------------------------ */
function IssuePreviewRow({ issue }) {
  const stCfg = issueStatusConfig[issue.status] || issueStatusConfig.open
  const prCfg = priorityConfig[issue.priority] || priorityConfig.medium
  const name = fullName(issue.assigned_to)

  return (
    <div className="flex items-center gap-2 py-1 min-w-0">
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', stCfg.dot)} />
      <span className="text-xs text-text-secondary truncate flex-1 min-w-0">
        {issue.title}
      </span>
      <span className={clsx('text-[10px] font-medium shrink-0', prCfg.text)}>
        {prCfg.label}
      </span>
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
      aria-label={`Progreso de la epica: ${clamped}%`}
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
/*  Main EpicCard                                                      */
/* ------------------------------------------------------------------ */
export function EpicCard({ epic, index = 0, onEdit, onDelete }) {
  const config = statusConfig[epic.status] || statusConfig.planning
  const progress = Math.min(epic.progress_percentage ?? 0, 100)
  const issueCount = epic.issue_count ?? 0
  const preview = epic.issues_preview || []
  const moreCount = issueCount - preview.length
  const accent = epic.color || '#3b82f6'
  const ownerName = fullName(epic.owner)
  const sprintCount = epic.sprint_count ?? 0
  const complexityTotal = epic.complexity_total ?? 0

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
      {/* Colour accent line (epic.color) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300 group-hover:w-1.5"
        style={{ backgroundColor: accent }}
      />

      {/* Link area */}
      <Link to={`/epic/${epic.id}`} className="block p-4 pl-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: accent }}
              />
              <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-white transition-colors">
                {epic.name}
              </h3>
            </div>
            {epic.description && (
              <p className="text-sm text-text-secondary line-clamp-1 mt-0.5">
                {epic.description}
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
            <span className={clsx('w-2 h-2 rounded-full', config.dot, epic.status === 'active' && 'animate-pulse')} />
            {config.label}
          </motion.span>
        </div>

        {/* Progress bar + percentage */}
        {issueCount > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <StatusCounts counts={epic.status_counts} issueCount={issueCount} />
              <span className="text-[10px] text-text-muted font-medium shrink-0 ml-2">
                {progress}%
              </span>
            </div>
            <ProgressBar percentage={progress} />
          </div>
        )}

        {/* Meta row: dates + sprint count */}
        <div className="flex items-center gap-3 text-xs text-text-secondary mb-3 flex-wrap">
          {(epic.start_date || epic.target_date) && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-text-muted" />
              <span>
                {formatEpicDate(epic.start_date) || '--'}
                {' - '}
                {formatEpicDate(epic.target_date) || '--'}
              </span>
            </div>
          )}
          {sprintCount > 0 && (
            <div className="flex items-center gap-1 text-text-muted">
              <Layers className="w-3 h-3" />
              <span>{sprintCount} sprint{sprintCount !== 1 ? 's' : ''}</span>
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
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-text-muted">
              {issueCount} issue{issueCount !== 1 ? 's' : ''}
            </span>
            {complexityTotal > 0 && (
              <span className="text-xs text-text-muted">
                {complexityTotal} pts
              </span>
            )}
            {epic.owner && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar
                  name={ownerName}
                  src={epic.owner.avatar_url}
                  size="xs"
                  className="shrink-0"
                />
                <span className="text-xs text-text-muted truncate">{ownerName}</span>
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      </Link>

      {/* Action buttons (shown on hover) */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-12 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(epic) }}
              className="p-1.5 rounded-lg bg-bg-elevated/80 text-text-muted hover:text-accent-blue hover:bg-bg-elevated transition-colors"
              title="Editar epica"
            >
              <Pencil className="w-3.5 h-3.5" />
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(epic) }}
              className="p-1.5 rounded-lg bg-bg-elevated/80 text-text-muted hover:text-status-rejected hover:bg-bg-elevated transition-colors"
              title="Eliminar epica"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  )
}
