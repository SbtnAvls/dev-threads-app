import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Pencil,
  Plus,
} from 'lucide-react'
import clsx from 'clsx'
import { SprintFormModal, SprintIssueList, AssignIssueModal } from '../components/sprint'
import { statusConfig, formatSprintDate } from '../components/sprint/sprintConstants'
import { Button, Card, useToast } from '../components/ui'
import { useSprintDetail, useIssues } from '../hooks'
import { useAuth } from '../context/AuthContext'
import { fullName } from '../utils/helpers'
import sprintService from '../services/sprintService'

export function SprintDetailPage() {
  const { id } = useParams()
  const { sprint, loading: sprintLoading, error, refetch: refetchSprint, updateSprint } = useSprintDetail(id)
  const { issues, loading: issuesLoading, refetch: refetchIssues } = useIssues({ sprint: id })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const { hasPermission } = useAuth()
  const toast = useToast()

  const canManage = hasPermission('manage_sprints')
  const canAssign = hasPermission('assign_sprint')

  const handleUpdate = async (data) => {
    try {
      await updateSprint(data)
      toast.success('Sprint actualizado correctamente')
      setShowEditModal(false)
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el sprint')
      throw err
    }
  }

  const handleAssignIssues = useCallback(async (issueIds) => {
    try {
      await sprintService.assignIssues(id, issueIds)
      toast.success(`${issueIds.length} issue${issueIds.length !== 1 ? 's' : ''} asignado${issueIds.length !== 1 ? 's' : ''} al sprint`)
      await Promise.all([refetchSprint(), refetchIssues()])
    } catch (err) {
      toast.error(err.message || 'Error al asignar issues')
      throw err
    }
  }, [id, refetchSprint, refetchIssues, toast])

  const handleRemoveIssue = useCallback(async (issue) => {
    if (!confirm(`Quitar "${issue.title}" del sprint?`)) return
    try {
      await sprintService.removeIssues(id, [issue.id])
      toast.success(`"${issue.title}" removido del sprint`)
      await Promise.all([refetchSprint(), refetchIssues()])
    } catch (err) {
      toast.error(err.message || 'Error al remover issue del sprint')
    }
  }, [id, refetchSprint, refetchIssues, toast])

  if (sprintLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !sprint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Sprint no encontrado</h1>
        <p className="text-text-secondary mb-4">{error || 'El sprint que buscas no existe'}</p>
        <Link to="/sprints">
          <Button variant="secondary" icon={ArrowLeft}>
            Volver a Sprints
          </Button>
        </Link>
      </div>
    )
  }

  const config = statusConfig[sprint.status] || statusConfig.planning
  const creatorName = fullName(sprint.created_by)

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      <SprintFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdate}
        sprint={sprint}
      />

      {/* Assign Issues Modal */}
      <AssignIssueModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignIssues}
        currentIssueIds={issues.map(i => i.id)}
      />

      {/* Back button */}
      <Link to="/sprints" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Sprints</span>
      </Link>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Sprint details and issues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border-primary bg-bg-secondary p-6 relative overflow-hidden"
          >
            {/* Status glow */}
            {sprint.status === 'active' && (
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
                  <motion.span
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                      config.bg, config.text, config.border
                    )}
                  >
                    <span className={clsx('w-2 h-2 rounded-full', config.dot, sprint.status === 'active' && 'animate-pulse')} />
                    {config.label}
                  </motion.span>
                </div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {sprint.name}
                </h1>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {canAssign && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => setShowAssignModal(true)}
                  >
                    Agregar Issues
                  </Button>
                )}
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            {sprint.description && (
              <p className="text-text-secondary leading-relaxed">
                {sprint.description}
              </p>
            )}
          </motion.div>

          {/* Issues list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border-primary bg-bg-secondary p-6"
          >
            <SprintIssueList
              issues={issues}
              onRemoveIssue={canAssign ? handleRemoveIssue : undefined}
              canManage={canAssign}
            />
          </motion.div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-4">
          {/* Dates */}
          {(sprint.start_date || sprint.end_date) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <h3 className="text-sm font-medium text-text-muted mb-3">Fechas</h3>
                <div className="space-y-3">
                  {sprint.start_date && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bg-elevated">
                        <Calendar className="w-4 h-4 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Inicio</p>
                        <p className="text-sm text-text-primary">
                          {formatSprintDate(sprint.start_date, 'long')}
                        </p>
                      </div>
                    </div>
                  )}
                  {sprint.end_date && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bg-elevated">
                        <Calendar className="w-4 h-4 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Fin</p>
                        <p className="text-sm text-text-primary">
                          {formatSprintDate(sprint.end_date, 'long')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Created by */}
          {sprint.created_by && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <h3 className="text-sm font-medium text-text-muted mb-3">Creado por</h3>
                <Link
                  to={`/developer/${sprint.created_by.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-elevated transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                    {(creatorName || sprint.created_by?.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{creatorName}</p>
                    <p className="text-xs text-text-muted">{sprint.created_by.email}</p>
                  </div>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h3 className="text-sm font-medium text-text-muted mb-3">Estadisticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Total Issues" value={issues.length} />
                <StatBox label="Abiertos" value={issues.filter(i => i.status === 'open').length} />
                <StatBox label="En Revision" value={issues.filter(i => i.status === 'in_review').length} />
                <StatBox label="Aprobados" value={issues.filter(i => i.status === 'approved').length} />
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
        initial={{ scale: 1.2, color: 'var(--color-accent-blue)' }}
        animate={{ scale: 1, color: 'var(--color-text-primary)' }}
        className="text-2xl font-bold"
      >
        {value}
      </motion.p>
      <p className="text-xs text-text-muted">{label}</p>
    </motion.div>
  )
}
