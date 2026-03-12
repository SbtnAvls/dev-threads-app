import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  Pencil,
  Trash2,
} from 'lucide-react'
import clsx from 'clsx'
import { statusConfig, formatSprintDate } from './sprintConstants'

export function SprintCard({ sprint, index = 0, onEdit, onDelete }) {
  const config = statusConfig[sprint.status] || statusConfig.planning

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
              <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                {sprint.description}
              </p>
            )}
          </div>
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
              config.bg, config.text, config.border
            )}
          >
            <span className={clsx('w-2 h-2 rounded-full', config.dot, sprint.status === 'active' && 'animate-pulse')} />
            {config.label}
          </motion.span>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between pt-3 border-t border-border-primary">
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            {/* Dates */}
            {(sprint.start_date || sprint.end_date) && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs">
                  {formatSprintDate(sprint.start_date) || '—'}
                  {' → '}
                  {formatSprintDate(sprint.end_date) || '—'}
                </span>
              </div>
            )}

            {/* Issue count */}
            <div className="flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs">
                {sprint.issue_count ?? 0} issue{(sprint.issue_count ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
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
