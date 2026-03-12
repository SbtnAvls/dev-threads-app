import { motion } from 'framer-motion'
import {
  Plus,
  MessageSquare,
  GitCommit,
  ArrowRightLeft,
  Image,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  GitBranch,
  Github
} from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Avatar } from '../ui'
import { RichContent } from '../github'
import { fullName, parseDate } from '../../utils/helpers'

const typeConfig = {
  created: {
    icon: Plus,
    color: 'bg-status-open',
    bgColor: 'bg-status-open/10',
    borderColor: 'border-status-open/30',
    label: 'Creado',
  },
  comment: {
    icon: MessageSquare,
    color: 'bg-accent-blue',
    bgColor: 'bg-accent-blue/10',
    borderColor: 'border-accent-blue/30',
    label: 'Comentario',
  },
  commit: {
    icon: GitCommit,
    color: 'bg-status-tech-debt',
    bgColor: 'bg-status-tech-debt/10',
    borderColor: 'border-status-tech-debt/30',
    label: 'Commit',
  },
  status_change: {
    icon: ArrowRightLeft,
    color: 'bg-status-in-review',
    bgColor: 'bg-status-in-review/10',
    borderColor: 'border-status-in-review/30',
    label: 'Cambio de Estado',
  },
  image: {
    icon: Image,
    color: 'bg-accent-blue',
    bgColor: 'bg-accent-blue/10',
    borderColor: 'border-accent-blue/30',
    label: 'Imagen',
  },
  rejection: {
    icon: XCircle,
    color: 'bg-status-rejected',
    bgColor: 'bg-status-rejected/10',
    borderColor: 'border-status-rejected/30',
    label: 'Rechazado',
  },
  approval: {
    icon: CheckCircle2,
    color: 'bg-status-approved',
    bgColor: 'bg-status-approved/10',
    borderColor: 'border-status-approved/30',
    label: 'Aprobado',
  },
  tech_debt: {
    icon: AlertTriangle,
    color: 'bg-status-tech-debt',
    bgColor: 'bg-status-tech-debt/10',
    borderColor: 'border-status-tech-debt/30',
    label: 'Deuda Técnica',
  },
}

export function StatusNode({ entry, index, isLast = false, isFirst = false, repos = [] }) {
  const config = typeConfig[entry.type] || typeConfig.comment
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      className="relative flex gap-4"
    >
      {/* Timeline line and node */}
      <div className="flex flex-col items-center">
        {/* Node */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.1, type: 'spring', stiffness: 200 }}
          className={clsx(
            'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2',
            config.bgColor,
            config.borderColor,
            isLast && 'ring-4 ring-offset-2 ring-offset-bg-primary',
            isLast && entry.type === 'approval' && 'ring-status-approved/30',
            isLast && entry.type === 'rejection' && 'ring-status-rejected/30',
            isLast && entry.type !== 'approval' && entry.type !== 'rejection' && 'ring-accent-blue/30'
          )}
        >
          <Icon className={clsx('w-5 h-5', config.color.replace('bg-', 'text-'))} />

          {/* Pulse effect for last item */}
          {isLast && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={clsx(
                'absolute inset-0 rounded-full',
                config.color,
                'opacity-30'
              )}
            />
          )}
        </motion.div>

        {/* Connecting line */}
        {!isLast && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
            className="w-0.5 flex-1 min-h-[40px] bg-gradient-to-b from-border-secondary to-border-primary"
          />
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 + 0.15 }}
        className={clsx(
          'flex-1 pb-6 group',
          isLast && 'pb-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar name={fullName(entry.author)} size="xs" />
            <span className="text-sm font-medium text-text-primary">
              {fullName(entry.author)}
            </span>
            <span className={clsx(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              config.bgColor,
              config.color.replace('bg-', 'text-')
            )}>
              {config.label}
            </span>
          </div>
          <span className="text-xs text-text-muted">
            {format(parseDate(entry.created_at) || new Date(), "d MMM yyyy, HH:mm", { locale: es })}
          </span>
        </div>

        {/* Card content */}
        <div className={clsx(
          'rounded-xl border p-4 transition-all duration-200',
          'bg-bg-tertiary border-border-primary',
          'hover:border-border-secondary hover:bg-bg-elevated/50'
        )}>
          {/* Main content */}
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {(entry.type === 'comment' || entry.type === 'commit') && repos.length > 0
              ? <RichContent text={entry.content} repos={repos} />
              : entry.content
            }
          </p>

          {/* Commit info */}
          {entry.type === 'commit' && entry.metadata && (
            <div className="mt-3 p-3 rounded-lg bg-bg-secondary border border-border-primary space-y-2">
              {entry.metadata.repo_name && (
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Github className="w-3 h-3" />
                  <span className="font-medium">{entry.metadata.repo_name}</span>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-status-tech-debt">
                  <GitCommit className="w-4 h-4" />
                  <code className="font-mono">{entry.metadata.commit_hash}</code>
                </div>
                {entry.metadata.branch && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <GitBranch className="w-4 h-4" />
                    <span>{entry.metadata.branch}</span>
                  </div>
                )}
                {entry.metadata.commit_url && (
                  <a
                    href={entry.metadata.commit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-accent-blue hover:underline ml-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver en GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Status change info */}
          {entry.type === 'status_change' && entry.metadata && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <StatusPill status={entry.metadata.previous_status} />
              <ArrowRightLeft className="w-4 h-4 text-text-muted" />
              <StatusPill status={entry.metadata.new_status} />
            </div>
          )}

          {/* Rejection reason */}
          {entry.type === 'rejection' && entry.metadata?.rejection_reason && (
            <div className="mt-3 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20">
              <p className="text-sm text-status-rejected font-medium mb-1">Motivo del rechazo:</p>
              <p className="text-sm text-text-secondary">{entry.metadata.rejection_reason}</p>
            </div>
          )}

          {/* Tech debt date */}
          {entry.type === 'tech_debt' && entry.metadata?.tech_debt_date && (
            <div className="mt-3 p-3 rounded-lg bg-status-tech-debt/10 border border-status-tech-debt/20">
              <p className="text-sm text-status-tech-debt">
                Fecha tentativa de resolucion: {' '}
                <span className="font-medium">
                  {format(new Date(entry.metadata.tech_debt_date), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </p>
            </div>
          )}

          {/* Images */}
          {entry.metadata?.images && entry.metadata.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {entry.metadata.images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-lg bg-bg-elevated border border-border-primary flex items-center justify-center text-text-muted"
                >
                  <Image className="w-8 h-8" />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatusPill({ status }) {
  const statusConfig = {
    open: { label: 'Abierto', color: 'bg-status-open/20 text-status-open' },
    in_review: { label: 'En Revisión', color: 'bg-status-in-review/20 text-status-in-review' },
    rejected: { label: 'Rechazado', color: 'bg-status-rejected/20 text-status-rejected' },
    approved: { label: 'Aprobado', color: 'bg-status-approved/20 text-status-approved' },
    tech_debt: { label: 'Deuda Técnica', color: 'bg-status-tech-debt/20 text-status-tech-debt' },
  }

  const config = statusConfig[status] || { label: status, color: 'bg-bg-elevated text-text-muted' }

  return (
    <span className={clsx('px-2 py-1 rounded-md text-xs font-medium', config.color)}>
      {config.label}
    </span>
  )
}
