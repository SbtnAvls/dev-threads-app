import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Clock,
  ChevronRight,
  AlertCircle,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Avatar, StatusBadge, PriorityBadge } from '../ui'
import { fullName, parseDate } from '../../utils/helpers'

const glowByStatus = {
  open: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]',
  in_review: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
  rejected: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
  approved: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
  tech_debt: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
}

const borderByStatus = {
  open: 'hover:border-status-open/50',
  in_review: 'hover:border-status-in-review/50',
  rejected: 'hover:border-status-rejected/50',
  approved: 'hover:border-status-approved/50',
  tech_debt: 'hover:border-status-tech-debt/50',
}

export function IssueCard({ issue, index = 0 }) {
  const assigneeName = fullName(issue.assigned_to)
  const updatedAt = parseDate(issue.updated_at)
  const timelineCount = issue.timeline_count ?? issue.timeline?.length ?? 0

  return (
    <Link to={`/issue/${issue.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -2, scale: 1.005 }}
        className={clsx(
          'relative group rounded-xl border border-border-primary bg-bg-secondary p-4 h-full',
          'transition-all duration-300 cursor-pointer overflow-hidden',
          glowByStatus[issue.status],
          borderByStatus[issue.status]
        )}
      >
        {/* Priority indicator line */}
        <div
          className={clsx(
            'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300',
            issue.priority === 'critical' && 'bg-priority-critical',
            issue.priority === 'high' && 'bg-priority-high',
            issue.priority === 'medium' && 'bg-priority-medium',
            issue.priority === 'low' && 'bg-priority-low',
            'group-hover:w-1.5'
          )}
        />

        {/* Main content */}
        <div className="pl-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-white transition-colors">
                {issue.title}
              </h3>
              <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                {issue.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} size="sm" />
              {issue.complexity && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                  style={{
                    backgroundColor: `${issue.complexity.color}15`,
                    borderColor: `${issue.complexity.color}40`,
                    color: issue.complexity.color,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: issue.complexity.color }}
                  />
                  {issue.complexity.label}
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {issue.tags && issue.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {issue.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-xs bg-bg-elevated text-text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between pt-3 border-t border-border-primary">
            {/* Left side - Assignee and metadata */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar name={assigneeName} size="xs" />
                <span className="text-sm text-text-secondary">
                  {assigneeName}
                </span>
              </div>

              <div className="flex items-center gap-3 text-text-muted">
                <div className="flex items-center gap-1" title="Eventos en timeline">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">{timelineCount}</span>
                </div>
                {issue.sprint && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                    title={`Sprint: ${issue.sprint.name}`}
                  >
                    <Zap className="w-3 h-3" />
                    <span className="max-w-[100px] truncate">{issue.sprint.name}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right side - Time and arrow */}
            <div className="flex items-center gap-2">
              {updatedAt && (
                <span className="text-xs text-text-muted">
                  {formatDistanceToNow(updatedAt, { addSuffix: true, locale: es })}
                </span>
              )}
              <motion.div
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 0.5 }}
                whileHover={{ x: 0, opacity: 1 }}
                className="text-text-muted group-hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </div>
          </div>

          {/* Rejected/Tech Debt warning */}
          {(issue.status === 'rejected' || issue.status === 'tech_debt') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={clsx(
                'mt-3 p-2 rounded-lg flex items-start gap-2 text-sm',
                issue.status === 'rejected' && 'bg-status-rejected/10 text-status-rejected',
                issue.status === 'tech_debt' && 'bg-status-tech-debt/10 text-status-tech-debt'
              )}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                {issue.status === 'rejected'
                  ? 'Rechazado - Requiere correcciones'
                  : `Deuda tecnica - Fecha tentativa: ${issue.due_date ? new Date(issue.due_date).toLocaleDateString('es') : 'Por definir'}`}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

// Compact version for lists
export function IssueCardCompact({ issue, index = 0 }) {
  const assigneeName = fullName(issue.assigned_to)
  const updatedAt = parseDate(issue.updated_at)

  return (
    <Link to={`/issue/${issue.id}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        whileHover={{ x: 4 }}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-elevated/50 transition-all cursor-pointer group"
      >
        <div
          className={clsx(
            'w-2 h-2 rounded-full flex-shrink-0',
            issue.status === 'open' && 'bg-status-open',
            issue.status === 'in_review' && 'bg-status-in-review animate-pulse',
            issue.status === 'rejected' && 'bg-status-rejected',
            issue.status === 'approved' && 'bg-status-approved',
            issue.status === 'tech_debt' && 'bg-status-tech-debt'
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate group-hover:text-white transition-colors">
            {issue.title}
          </p>
          <p className="text-xs text-text-muted">
            {assigneeName}{updatedAt ? ` \u2022 ${formatDistanceToNow(updatedAt, { addSuffix: true, locale: es })}` : ''}
          </p>
        </div>
        {issue.sprint && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
            title={`Sprint: ${issue.sprint.name}`}
          >
            <Zap className="w-3 h-3" />
            <span className="max-w-[80px] truncate hidden sm:inline">{issue.sprint.name}</span>
          </span>
        )}
        {issue.complexity && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{
              backgroundColor: `${issue.complexity.color}15`,
              borderColor: `${issue.complexity.color}40`,
              color: issue.complexity.color,
            }}
          >
            {issue.complexity.label}
          </span>
        )}
        <StatusBadge status={issue.status} size="sm" />
      </motion.div>
    </Link>
  )
}
