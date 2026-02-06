import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Briefcase } from 'lucide-react'
import { QACard } from '../components/qa'
import { Button, Avatar, Card } from '../components/ui'
import { useDeveloperDetail, useDevStats } from '../hooks'
import { fullName } from '../utils/helpers'
import clsx from 'clsx'

const roleLabels = {
  admin: 'Administrador',
  lead: 'Lider Tecnico',
  product_manager: 'Product Manager',
  qa: 'QA',
  developer: 'Desarrollador',
}

const tabs = [
  { id: 'all', label: 'Todos' },
  { id: 'open', label: 'Abiertos' },
  { id: 'in_review', label: 'En Revision' },
  { id: 'rejected', label: 'Rechazados' },
  { id: 'approved', label: 'Aprobados' },
  { id: 'tech_debt', label: 'Deuda Tecnica' },
]

export function DevDetailPage() {
  const { id } = useParams()
  const { developer, loading: devLoading, error: devError } = useDeveloperDetail(id)
  const { stats, loading: statsLoading } = useDevStats(id)
  const [activeTab, setActiveTab] = useState('all')

  if (devLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (devError || !developer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Desarrollador no encontrado</h1>
        <p className="text-text-secondary mb-4">{devError || 'El desarrollador que buscas no existe'}</p>
        <Link to="/developers">
          <Button variant="secondary" icon={ArrowLeft}>
            Volver a Desarrolladores
          </Button>
        </Link>
      </div>
    )
  }

  const name = fullName(developer)
  const roleName = developer.role?.name || 'developer'

  // Issues from the dev stats endpoint
  const allQAs = stats?.issues || []
  const filteredQAs = activeTab === 'all'
    ? allQAs
    : allQAs.filter(qa => qa.status === activeTab)

  const getStatValue = (key) => {
    if (!stats) return 0
    return stats[key] ?? 0
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/developers" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Desarrolladores</span>
      </Link>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border-primary bg-bg-secondary p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar
            name={name}
            size="xl"
            showRing
            ringColor="ring-accent-blue"
          />

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary mb-1">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-text-secondary">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>{roleLabels[roleName] || roleName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{developer.email}</span>
              </div>
            </div>
          </div>

          <Button variant="secondary" disabled title="Proximamente">
            Editar Perfil
          </Button>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="flex justify-center py-4 mt-6 pt-6 border-t border-border-primary">
            <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-border-primary">
            <StatCard label="Total QAs" value={getStatValue('total')} />
            <StatCard label="Abiertos" value={getStatValue('open')} color="text-status-open" />
            <StatCard label="En Revision" value={getStatValue('in_review')} color="text-status-in-review" />
            <StatCard label="Aprobados" value={getStatValue('approved')} color="text-status-approved" />
            <StatCard label="Rechazados" value={getStatValue('rejected')} color="text-status-rejected" />
            <StatCard label="Deuda Tecnica" value={getStatValue('tech_debt')} color="text-status-tech-debt" />
          </div>
        )}
      </motion.div>

      {/* QAs section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">QAs Asignados</h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const count = tab.id === 'all'
              ? getStatValue('total')
              : getStatValue(tab.id)

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* QAs list */}
        {statsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredQAs.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <p className="text-lg">No hay QAs en esta categoria</p>
            </div>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {filteredQAs.map((qa, index) => (
              <QACard key={qa.id} qa={qa} index={index} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-text-primary' }) {
  return (
    <div className="p-3 rounded-xl bg-bg-elevated text-center">
      <p className={clsx('text-2xl font-bold', color)}>{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  )
}
