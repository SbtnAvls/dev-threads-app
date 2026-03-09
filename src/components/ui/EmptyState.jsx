import { motion } from 'framer-motion'
import { Inbox, Search, Users, Bug, FileX } from 'lucide-react'
import clsx from 'clsx'
import { Button } from './Button'

const icons = {
  default: Inbox,
  search: Search,
  users: Users,
  issue: Bug,
  file: FileX,
}

export function EmptyState({
  icon = 'default',
  title,
  description,
  action,
  onAction,
  className,
}) {
  const Icon = icons[icon] || icons.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative mb-6"
      >
        {/* Background circles */}
        <div className="absolute inset-0 -m-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-24 h-24 rounded-full bg-accent-blue/10"
          />
        </div>
        <div className="relative p-4 rounded-2xl bg-bg-elevated border border-border-primary">
          <Icon className="w-12 h-12 text-text-muted" />
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-text-primary mb-2"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-text-secondary max-w-sm"
        >
          {description}
        </motion.p>
      )}

      {action && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Button onClick={onAction}>{action}</Button>
        </motion.div>
      )}
    </motion.div>
  )
}
