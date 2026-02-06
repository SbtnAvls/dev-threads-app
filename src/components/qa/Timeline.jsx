import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { StatusNode } from './StatusNode'

export function Timeline({ entries = [], className }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <Clock className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">No hay actividad en este QA</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {/* Timeline header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Historial de Actividad
        </h3>
        <span className="text-sm text-text-muted">
          {entries.length} {entries.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      {/* Timeline entries */}
      <div className="relative">
        {entries.map((entry, index) => (
          <StatusNode
            key={entry.id}
            entry={entry}
            index={index}
            isFirst={index === 0}
            isLast={index === entries.length - 1}
          />
        ))}
      </div>
    </motion.div>
  )
}

// Compact timeline for previews
export function TimelinePreview({ entries = [], maxItems = 3 }) {
  const visibleEntries = entries.slice(-maxItems)
  const hiddenCount = entries.length - maxItems

  return (
    <div className="space-y-2">
      {hiddenCount > 0 && (
        <p className="text-xs text-text-muted pl-4">
          + {hiddenCount} eventos anteriores
        </p>
      )}
      {visibleEntries.map((entry, index) => (
        <TimelinePreviewItem key={entry.id} entry={entry} />
      ))}
    </div>
  )
}

function TimelinePreviewItem({ entry }) {
  const typeIcons = {
    created: '🆕',
    comment: '💬',
    commit: '📝',
    status_change: '🔄',
    rejection: '❌',
    approval: '✅',
    tech_debt: '⚠️',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 text-sm"
    >
      <span>{typeIcons[entry.type] || '📌'}</span>
      <span className="text-text-secondary truncate flex-1">
        {entry.content.slice(0, 50)}{entry.content.length > 50 ? '...' : ''}
      </span>
    </motion.div>
  )
}
