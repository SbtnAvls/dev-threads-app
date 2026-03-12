import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Tag,
  Zap,
  AlertTriangle,
  Activity,
  Calendar,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { Card } from '../components/ui'
import { Skeleton } from '../components/ui/Skeleton'
import { useMetricsData } from '../hooks/useMetrics'
import clsx from 'clsx'

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border-primary bg-bg-elevated px-3 py-2 shadow-xl">
      {label && <p className="text-xs text-text-muted mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="text-text-primary font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Metric Card Wrapper ────────────────────────────────────────────────────

function MetricCard({ title, icon: Icon, children, className }) {
  return (
    <Card hover={false} padding="none" className={clsx('overflow-hidden', className)}>
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <Icon className="w-4.5 h-4.5 text-accent-blue" />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </Card>
  )
}

// ─── Stat Summary Cards ─────────────────────────────────────────────────────

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border-primary bg-bg-secondary p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        <Icon className={clsx('w-4 h-4', color)} />
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </motion.div>
  )
}

// ─── Date Range Filter ──────────────────────────────────────────────────────

function DateRangeFilter({ dateRange, onChange }) {
  const presets = [
    { label: 'Hoy', days: 0 },
    { label: '7 dias', days: 7 },
    { label: '30 dias', days: 30 },
    { label: '90 dias', days: 90 },
  ]

  const [activePreset, setActivePreset] = useState(null)

  const applyPreset = (days) => {
    if (days === activePreset) {
      setActivePreset(null)
      onChange({ from: null, to: null })
      return
    }
    setActivePreset(days)
    const to = new Date()
    const from = new Date()
    if (days === 0) {
      from.setHours(0, 0, 0, 0)
    } else {
      from.setDate(from.getDate() - days)
    }
    onChange({ from, to })
  }

  const handleCustomDate = (field, value) => {
    setActivePreset(null)
    const date = value ? new Date(value + 'T00:00:00') : null
    onChange({ ...dateRange, [field]: date })
  }

  const clearDates = () => {
    setActivePreset(null)
    onChange({ from: null, to: null })
  }

  const hasDateFilter = dateRange.from || dateRange.to

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Calendar className="w-4 h-4 text-text-muted" />

      {/* Preset buttons */}
      {presets.map(p => (
        <button
          key={p.days}
          onClick={() => applyPreset(p.days)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            activePreset === p.days
              ? 'bg-accent-blue text-white'
              : 'bg-bg-elevated text-text-secondary hover:bg-bg-hover'
          )}
        >
          {p.label}
        </button>
      ))}

      <span className="text-text-muted text-xs">|</span>

      {/* Custom date inputs */}
      <input
        type="date"
        value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
        onChange={(e) => handleCustomDate('from', e.target.value)}
        className="px-2.5 py-1.5 rounded-lg border border-border-primary bg-bg-tertiary text-xs text-text-primary focus:outline-none focus:border-accent-blue transition-all"
      />
      <span className="text-text-muted text-xs">a</span>
      <input
        type="date"
        value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
        onChange={(e) => handleCustomDate('to', e.target.value)}
        className="px-2.5 py-1.5 rounded-lg border border-border-primary bg-bg-tertiary text-xs text-text-primary focus:outline-none focus:border-accent-blue transition-all"
      />

      {hasDateFilter && (
        <button
          onClick={clearDates}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
          title="Limpiar filtro"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function MetricsPage() {
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const {
    loading,
    issuesByStatus,
    issuesByPriority,
    workloadByDev,
    issuesByTag,
    sprintVelocity,
    rejectionRate,
    totalIssues,
  } = useMetricsData(dateRange)

  const statusTotal = useMemo(
    () => issuesByStatus.reduce((sum, s) => sum + s.value, 0),
    [issuesByStatus]
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const approvedCount = issuesByStatus.find(s => s.name === 'Aprobados')?.value || 0
  const rejectedCount = issuesByStatus.find(s => s.name === 'Rechazados')?.value || 0
  const reviewCount = issuesByStatus.find(s => s.name === 'En Revision')?.value || 0
  const approvalRate = totalIssues > 0 ? Math.round((approvedCount / totalIssues) * 100) : 0

  const RADIAN = Math.PI / 180
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#f0f0f5" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Metricas</h1>
        <p className="text-text-secondary mt-1">
          Panorama general del equipo y los issues
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
        <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Issues" value={totalIssues} color="text-accent-blue" icon={BarChart3} />
        <StatCard label="En Revision" value={reviewCount} color="text-status-in-review" icon={Activity} />
        <StatCard label="Tasa Aprobacion" value={`${approvalRate}%`} color="text-status-approved" icon={TrendingUp} />
        <StatCard label="Rechazados" value={rejectedCount} color="text-status-rejected" icon={AlertTriangle} />
      </div>

      {/* Row 1: Status donut + Priority bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Status - Donut */}
        <MetricCard title="Issues por Estado" icon={PieChartIcon}>
          {statusTotal === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">Sin datos para mostrar</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={issuesByStatus.filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {issuesByStatus.filter(s => s.value > 0).map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </MetricCard>

        {/* Issues by Priority - Bar */}
        <MetricCard title="Issues por Prioridad" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={issuesByPriority} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#a0a0b5', fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a0a0b5', fontSize: 12 }} width={55} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Issues" radius={[0, 6, 6, 0]} barSize={24}>
                {issuesByPriority.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </MetricCard>
      </div>

      {/* Row 2: Workload per dev + Rejection rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload per developer - Stacked bar */}
        <MetricCard title="Carga por Desarrollador" icon={Users} className="lg:col-span-1">
          {workloadByDev.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">Sin datos para mostrar</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, workloadByDev.length * 50)}>
              <BarChart data={workloadByDev} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#a0a0b5', fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a0a0b5', fontSize: 11 }} width={120} />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>}
                />
                <Bar dataKey="open" name="Abiertos" stackId="a" fill="#3b82f6" barSize={22} />
                <Bar dataKey="in_review" name="En Revision" stackId="a" fill="#f59e0b" />
                <Bar dataKey="approved" name="Aprobados" stackId="a" fill="#10b981" />
                <Bar dataKey="rejected" name="Rechazados" stackId="a" fill="#ef4444" />
                <Bar dataKey="tech_debt" name="Deuda Tecnica" stackId="a" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </MetricCard>

        {/* Rejection rate per developer */}
        <MetricCard title="Tasa de Rechazo por Desarrollador" icon={AlertTriangle}>
          {rejectionRate.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">Sin datos para mostrar</p>
          ) : (
            <div className="space-y-3">
              {rejectionRate.map((dev, i) => (
                <motion.div
                  key={dev.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-primary font-medium truncate">{dev.name}</span>
                    <span className={clsx(
                      'text-xs font-semibold',
                      dev.rate > 40 ? 'text-status-rejected' : dev.rate > 20 ? 'text-status-in-review' : 'text-status-approved'
                    )}>
                      {dev.rate}% ({dev.rejected}/{dev.total})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dev.rate}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className={clsx(
                        'h-full rounded-full',
                        dev.rate > 40 ? 'bg-status-rejected' : dev.rate > 20 ? 'bg-status-in-review' : 'bg-status-approved'
                      )}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </MetricCard>
      </div>

      {/* Row 3: Sprint velocity + Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Velocity - Area chart */}
        <MetricCard title="Velocidad de Sprints" icon={Zap}>
          {sprintVelocity.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">Sin sprints completados o activos</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={sprintVelocity}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" />
                <XAxis dataKey="name" tick={{ fill: '#a0a0b5', fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#a0a0b5', fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>} />
                <Area type="monotone" dataKey="total" name="Total Issues" stroke="#3b82f6" fill="url(#gradTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="approved" name="Aprobados" stroke="#10b981" fill="url(#gradApproved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </MetricCard>

        {/* Issues by Tag - Horizontal bar */}
        <MetricCard title="Issues por Etiqueta" icon={Tag}>
          {issuesByTag.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">Sin etiquetas para mostrar</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, issuesByTag.length * 32)}>
              <BarChart data={issuesByTag} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#a0a0b5', fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a0a0b5', fontSize: 11 }} width={100} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Issues" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </MetricCard>
      </div>

      {/* Row 4: Activity summary */}
      <MetricCard title="Resumen de Actividad por Desarrollador" icon={Activity}>
        {workloadByDev.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">Sin datos para mostrar</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left py-2.5 px-3 text-text-muted font-medium text-xs uppercase">Desarrollador</th>
                  <th className="text-center py-2.5 px-3 text-text-muted font-medium text-xs uppercase">Total</th>
                  <th className="text-center py-2.5 px-3 text-text-muted font-medium text-xs uppercase">Abiertos</th>
                  <th className="text-center py-2.5 px-3 text-text-muted font-medium text-xs uppercase">En Revision</th>
                  <th className="text-center py-2.5 px-3 text-text-muted font-medium text-xs uppercase">Aprobados</th>
                  <th className="text-center py-2.5 px-3 text-text-muted font-medium text-xs uppercase">Rechazados</th>
                  <th className="text-center py-2.5 px-3 text-text-muted font-medium text-xs uppercase">Deuda T.</th>
                  <th className="text-center py-2.5 px-3 text-text-muted font-medium text-xs uppercase">% Aprob.</th>
                </tr>
              </thead>
              <tbody>
                {workloadByDev.map((dev, i) => {
                  const devApprovalRate = dev.total > 0 ? Math.round((dev.approved / dev.total) * 100) : 0
                  return (
                    <motion.tr
                      key={dev.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border-primary/50 hover:bg-bg-elevated/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-text-primary font-medium">{dev.name}</td>
                      <td className="py-2.5 px-3 text-center text-text-primary font-semibold">{dev.total}</td>
                      <td className="py-2.5 px-3 text-center"><span className="text-status-open">{dev.open}</span></td>
                      <td className="py-2.5 px-3 text-center"><span className="text-status-in-review">{dev.in_review}</span></td>
                      <td className="py-2.5 px-3 text-center"><span className="text-status-approved">{dev.approved}</span></td>
                      <td className="py-2.5 px-3 text-center"><span className="text-status-rejected">{dev.rejected}</span></td>
                      <td className="py-2.5 px-3 text-center"><span className="text-status-tech-debt">{dev.tech_debt}</span></td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={clsx(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          devApprovalRate >= 70 ? 'bg-status-approved/15 text-status-approved'
                            : devApprovalRate >= 40 ? 'bg-status-in-review/15 text-status-in-review'
                            : 'bg-status-rejected/15 text-status-rejected'
                        )}>
                          {devApprovalRate}%
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </MetricCard>
    </div>
  )
}
