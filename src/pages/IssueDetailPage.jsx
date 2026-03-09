import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  Share2
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Timeline, AddTimelineEntry } from '../components/issue'
import { Button, Avatar, StatusBadge, PriorityBadge, Card, Confetti, useToast } from '../components/ui'
import { useIssueDetail, useTimeline } from '../hooks'
import { fullName, parseDate } from '../utils/helpers'
import { useState } from 'react'

export function IssueDetailPage() {
  const { id } = useParams()
  const { issue, loading, error, refetch: refetchIssue } = useIssueDetail(id)
  const { entries, addEntry, refetch: refetchTimeline } = useTimeline(id)
  const [showMenu, setShowMenu] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const toast = useToast()

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Issue no encontrado</h1>
        <p className="text-text-secondary mb-4">{error || 'El issue que buscas no existe'}</p>
        <Link to="/issues">
          <Button variant="secondary" icon={ArrowLeft}>
            Volver a Issues
          </Button>
        </Link>
      </div>
    )
  }

  const assigneeName = fullName(issue.assigned_to)
  const creatorName = fullName(issue.created_by)
  const createdAt = parseDate(issue.created_at)
  const updatedAt = parseDate(issue.updated_at)
  const dueDate = parseDate(issue.due_date)

  // Use timeline from the detail endpoint or from the separate timeline hook
  const timelineEntries = issue.timeline || entries

  const handleAddEntry = async (entry) => {
    try {
      await addEntry(entry)
      await refetchIssue()

      if (entry.type === 'approval') {
        setShowConfetti(true)
        toast.success('Issue aprobado correctamente')
      } else if (entry.type === 'rejection') {
        toast.warning('Issue rechazado - pendiente de correcciones')
      } else if (entry.type === 'tech_debt') {
        toast.info('Issue marcado como deuda tecnica')
      } else if (entry.type === 'commit') {
        toast.success('Commit vinculado correctamente')
      } else {
        toast.info('Comentario agregado')
      }
    } catch (err) {
      toast.error(err.message || 'Error al agregar entrada')
    }
  }

  return (
    <div className="space-y-6">
      {/* Confetti celebration */}
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Back button */}
      <Link to="/issues" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Issues</span>
      </Link>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Issue details and timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border-primary bg-bg-secondary p-6 relative overflow-hidden"
          >
            {/* Success glow effect when approved */}
            {issue.status === 'approved' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-status-approved/5 to-transparent pointer-events-none"
              />
            )}

            {/* Title row */}
            <div className="flex items-start justify-between gap-4 mb-4 relative">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                </div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {issue.title}
                </h1>
              </div>

              {/* Actions menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg border border-border-primary bg-bg-elevated shadow-xl z-50"
                    >
                      <button disabled title="Proximamente" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-muted cursor-not-allowed opacity-50">
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button disabled title="Proximamente" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-muted cursor-not-allowed opacity-50">
                        <Share2 className="w-4 h-4" />
                        Compartir
                      </button>
                      <hr className="my-1 border-border-primary" />
                      <button disabled title="Proximamente" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-muted cursor-not-allowed opacity-50">
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-text-secondary leading-relaxed mb-4">
              {issue.description}
            </p>

            {/* Tags */}
            {issue.tags && issue.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {issue.tags.map((tag) => (
                  <motion.span
                    key={tag}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm bg-bg-elevated text-text-secondary hover:bg-bg-hover cursor-pointer transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Add entry form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AddTimelineEntry onAdd={handleAddEntry} currentStatus={issue.status} />
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border-primary bg-bg-secondary p-6"
          >
            <Timeline entries={timelineEntries} />
          </motion.div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-4">
          {/* Assigned to */}
          {issue.assigned_to && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <h3 className="text-sm font-medium text-text-muted mb-3">Asignado a</h3>
                <Link
                  to={`/developer/${issue.assigned_to.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-elevated transition-colors"
                >
                  <Avatar name={assigneeName} size="md" />
                  <div>
                    <p className="font-medium text-text-primary">{assigneeName}</p>
                    <p className="text-sm text-text-muted">{issue.assigned_to.email}</p>
                  </div>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* Created by */}
          {issue.created_by && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <h3 className="text-sm font-medium text-text-muted mb-3">Creado por</h3>
                <Link
                  to={`/developer/${issue.created_by.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-elevated transition-colors"
                >
                  <Avatar name={creatorName} size="md" />
                  <div>
                    <p className="font-medium text-text-primary">{creatorName}</p>
                    <p className="text-sm text-text-muted">{issue.created_by.email}</p>
                  </div>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* Dates */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h3 className="text-sm font-medium text-text-muted mb-3">Fechas</h3>
              <div className="space-y-3">
                {createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-bg-elevated">
                      <Calendar className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Creado</p>
                      <p className="text-sm text-text-primary">
                        {format(createdAt, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                {updatedAt && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-bg-elevated">
                      <Calendar className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Ultima actualizacion</p>
                      <p className="text-sm text-text-primary">
                        {format(updatedAt, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                {dueDate && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-status-tech-debt/10">
                      <Calendar className="w-4 h-4 text-status-tech-debt" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Fecha tentativa</p>
                      <p className="text-sm text-status-tech-debt font-medium">
                        {format(dueDate, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <h3 className="text-sm font-medium text-text-muted mb-3">Estadisticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Eventos" value={timelineEntries.length} />
                <StatBox label="Commits" value={timelineEntries.filter(t => t.type === 'commit').length} />
                <StatBox label="Comentarios" value={timelineEntries.filter(t => t.type === 'comment').length} />
                <StatBox label="Rechazos" value={timelineEntries.filter(t => t.type === 'rejection').length} />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-3 rounded-lg bg-bg-elevated text-center cursor-default"
    >
      <motion.p
        key={value}
        initial={{ scale: 1.2, color: '#3b82f6' }}
        animate={{ scale: 1, color: '#f0f0f5' }}
        className="text-2xl font-bold"
      >
        {value}
      </motion.p>
      <p className="text-xs text-text-muted">{label}</p>
    </motion.div>
  )
}
