import { motion } from 'framer-motion'
import { BarChart3, Target, TrendingUp, Clock } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '../ui'
import { issueStatusConfig, getDaysUrgency, formatDuration } from './sprintConstants'

function MetricBox({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="p-3 rounded-lg bg-bg-elevated text-center">
      {Icon && <Icon className={clsx('w-4 h-4 mx-auto mb-1', color || 'text-text-muted')} />}
      <p className={clsx('text-xl font-bold', color || 'text-text-primary')}>{value}</p>
      <p className="text-[10px] text-text-muted leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function StatusBar({ label, count, total, dotClass }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={clsx('w-2 h-2 rounded-full shrink-0', dotClass)} />
      <span className="text-text-secondary w-24 truncate">{label}</span>
      <div
        className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${count} de ${total}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={clsx('h-full rounded-full', dotClass)}
        />
      </div>
      <span className="text-text-muted w-8 text-right">{count}</span>
    </div>
  )
}

export function SprintMetrics({ sprint }) {
  if (!sprint) return null

  const statusCounts = sprint.status_counts || {}
  const issueCount = sprint.issue_count ?? 0
  const spTotal = sprint.story_points_total ?? 0
  const spCompleted = sprint.story_points_completed ?? 0
  const spPct = spTotal > 0 ? Math.min(Math.round((spCompleted / spTotal) * 100), 100) : 0
  const progress = Math.min(sprint.progress_percentage ?? 0, 100)

  // Velocity: story points completed / elapsed working days
  let velocity = null
  if (sprint.start_date && sprint.total_working_days && sprint.working_days_remaining != null) {
    const elapsed = sprint.total_working_days - sprint.working_days_remaining
    if (elapsed > 0 && spCompleted > 0) {
      velocity = Math.round((spCompleted / elapsed) * 10) / 10
    }
  }

  return (
    <Card hover={false} className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-text-muted" />
        <h3 className="text-sm font-medium text-text-primary">Metricas</h3>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 gap-2">
        <MetricBox
          label="Issues"
          value={issueCount}
          icon={Target}
          sub={`${progress}% completado`}
        />
        <MetricBox
          label="Story Points"
          value={`${spCompleted}/${spTotal}`}
          icon={TrendingUp}
          sub={spTotal > 0 ? `${spPct}%` : null}
          color={spPct >= 80 ? 'text-status-approved' : spPct >= 40 ? 'text-status-in-review' : 'text-accent-blue'}
        />
        {sprint.total_days != null && (
          <MetricBox
            label="Duracion"
            value={formatDuration(sprint.total_days, sprint.total_weeks)}
            icon={Clock}
            sub={sprint.total_working_days ? `${sprint.total_working_days}d laborables` : null}
          />
        )}
        {velocity != null && (
          <MetricBox
            label="Velocidad"
            value={velocity}
            icon={TrendingUp}
            sub="SP/dia laboral"
            color="text-purple-400"
          />
        )}
        {velocity == null && sprint.days_remaining != null && (
          <MetricBox
            label="Dias restantes"
            value={sprint.days_remaining < 0 ? `${Math.abs(sprint.days_remaining)}d vencido` : sprint.days_remaining}
            icon={Clock}
            color={getDaysUrgency(sprint.days_remaining)}
            sub={sprint.working_days_remaining != null ? `${sprint.working_days_remaining}d laborables` : null}
          />
        )}
      </div>

      {/* Status distribution bars */}
      {issueCount > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Distribucion por estado</p>
          {Object.entries(issueStatusConfig).map(([key, cfg]) => {
            const count = statusCounts[key] ?? 0
            if (count === 0) return null
            return (
              <StatusBar
                key={key}
                label={cfg.label}
                count={count}
                total={issueCount}
                dotClass={cfg.dot}
              />
            )
          })}
        </div>
      )}

      {/* Story points progress bar */}
      {spTotal > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-text-muted">
            <span>Story Points completados</span>
            <span>{spCompleted} / {spTotal}</span>
          </div>
          <div
            className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={spPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Story points: ${spCompleted} de ${spTotal}`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={clsx(
                'h-full rounded-full',
                spPct >= 80 ? 'bg-status-approved'
                  : spPct >= 40 ? 'bg-status-in-review'
                  : 'bg-accent-blue'
              )}
            />
          </div>
        </div>
      )}
    </Card>
  )
}
