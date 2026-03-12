import { motion } from 'framer-motion'
import {
  Bug,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, Badge, StatusBadge, Avatar, Button } from '../components/ui'
import { useIssues, useIssueStats, useDevelopers } from '../hooks'
import { fullName, parseDate } from '../utils/helpers'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function Dashboard() {
  const { stats, loading: statsLoading } = useIssueStats()
  const { issues: recentIssues, loading: issuesLoading } = useIssues({ ordering: '-updated_at' })
  const { developers, loading: devsLoading } = useDevelopers()

  const statCards = stats ? [
    {
      label: 'Total Issues',
      value: stats.total,
      icon: Bug,
      color: 'text-accent-blue',
      bgColor: 'bg-accent-blue/10',
    },
    {
      label: 'En Revision',
      value: stats.in_review,
      icon: Clock,
      color: 'text-status-in-review',
      bgColor: 'bg-status-in-review/10',
    },
    {
      label: 'Aprobados',
      value: stats.approved,
      icon: CheckCircle2,
      color: 'text-status-approved',
      bgColor: 'bg-status-approved/10',
    },
    {
      label: 'Rechazados',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-status-rejected',
      bgColor: 'bg-status-rejected/10',
    },
  ] : []

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Panel</h1>
        <p className="text-text-secondary mt-1">
          Resumen general del estado de los issues
        </p>
      </div>

      {/* Stats grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-bg-secondary border border-border-primary animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <Card hover={false} className="relative overflow-hidden">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-secondary">{stat.label}</p>
                      <p className="text-3xl font-bold text-text-primary mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  {/* Decorative gradient */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 ${stat.bgColor}`}
                    style={{
                      background: `linear-gradient(90deg, transparent, ${stat.color.replace('text-', 'var(--color-')}))`
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Developers section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card padding="none">
            <div className="p-4 border-b border-border-primary">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">Miembros</h2>
                <Link to="/developers">
                  <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                    Ver todos
                  </Button>
                </Link>
              </div>
            </div>
            <div className="divide-y divide-border-primary">
              {devsLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                developers.slice(0, 4).map((dev) => (
                  <Link
                    key={dev.id}
                    to={`/developer/${dev.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-bg-elevated/50 transition-colors"
                  >
                    <Avatar name={fullName(dev)} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {fullName(dev)}
                      </p>
                      <p className="text-sm text-text-muted">
                        {dev.role?.name || 'developer'}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card padding="none">
            <div className="p-4 border-b border-border-primary">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">Issues Recientes</h2>
                <Link to="/issues">
                  <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                    Ver todos
                  </Button>
                </Link>
              </div>
            </div>
            <div className="divide-y divide-border-primary">
              {issuesLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                recentIssues.slice(0, 5).map((issue) => {
                  const assigneeName = fullName(issue.assigned_to)
                  const updatedAt = parseDate(issue.updated_at)
                  const timelineCount = issue.timeline_count ?? 0

                  return (
                    <Link
                      key={issue.id}
                      to={`/issue/${issue.id}`}
                      className="flex items-start gap-4 p-4 hover:bg-bg-elevated/50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <Avatar name={assigneeName} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-text-primary line-clamp-1">
                            {issue.title}
                          </p>
                          <StatusBadge status={issue.status} size="sm" />
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-1 mt-1">
                          {issue.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-text-muted">
                            {assigneeName}
                          </span>
                          <span className="text-xs text-text-muted">&bull;</span>
                          {updatedAt && (
                            <span className="text-xs text-text-muted">
                              {formatDistanceToNow(updatedAt, { addSuffix: true, locale: es })}
                            </span>
                          )}
                          <span className="text-xs text-text-muted">&bull;</span>
                          <span className="text-xs text-text-muted">
                            {timelineCount} {timelineCount === 1 ? 'evento' : 'eventos'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick actions or alerts */}
      {stats && stats.rejected > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-status-rejected/30 bg-status-rejected/5">
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-status-rejected/20">
                  <AlertTriangle className="w-6 h-6 text-status-rejected" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">
                    {stats.rejected} issue{stats.rejected > 1 ? 's' : ''} rechazado{stats.rejected > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Hay issues que necesitan atencion inmediata
                  </p>
                </div>
                <Link to="/issues?status=rejected">
                  <Button variant="danger" size="sm">
                    Revisar ahora
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
