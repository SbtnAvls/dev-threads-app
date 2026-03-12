import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, List, X, ClipboardList } from 'lucide-react'
import { IssueCard, IssueCardCompact } from '../issue'
import { EmptyState } from '../ui'
import clsx from 'clsx'

export function SprintIssueList({ issues = [], onRemoveIssue, canManage = false }) {
  const [viewMode, setViewMode] = useState('grid')

  return (
    <div className="space-y-4">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">
            Issues del Sprint
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-elevated text-text-muted">
            {issues.length}
          </span>
        </div>

        {issues.length > 0 && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-secondary border border-border-primary">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-accent-blue text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-accent-blue text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Issues */}
      {issues.length === 0 ? (
        <EmptyState
          icon="issue"
          title="Sin issues asignados"
          description="Agrega issues a este sprint para comenzar a trabajar"
        />
      ) : viewMode === 'grid' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {issues.map((issue, index) => (
              <motion.div
                key={issue.id}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group/issue"
              >
                <IssueCard issue={issue} index={index} />
                {canManage && onRemoveIssue && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onRemoveIssue(issue)
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-bg-elevated/90 text-text-muted hover:text-status-rejected hover:bg-bg-elevated transition-all opacity-0 group-hover/issue:opacity-100 z-10"
                    title="Quitar del sprint"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border-primary bg-bg-secondary divide-y divide-border-primary overflow-hidden"
        >
          <AnimatePresence mode="popLayout">
            {issues.map((issue, index) => (
              <motion.div
                key={issue.id}
                layout
                exit={{ opacity: 0, x: -20 }}
                className="relative group/issue"
              >
                <IssueCardCompact issue={issue} index={index} />
                {canManage && onRemoveIssue && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onRemoveIssue(issue)
                    }}
                    className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-bg-elevated/90 text-text-muted hover:text-status-rejected hover:bg-bg-elevated transition-all opacity-0 group-hover/issue:opacity-100 z-10"
                    title="Quitar del sprint"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
