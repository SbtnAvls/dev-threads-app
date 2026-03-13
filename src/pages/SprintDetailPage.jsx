import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Pencil,
  Plus,
} from 'lucide-react'
import clsx from 'clsx'
import {
  SprintFormModal,
  SprintIssueList,
  AssignIssueModal,
  SprintAISummary,
  SprintMetrics,
  SprintRepositories,
} from '../components/sprint'
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
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const statusMenuRef = useRef(null)
  const { hasPermission } = useAuth()
  const toast = useToast()

  const canManage = hasPermission('manage_sprints')
  const canAssign = hasPermission('assign_sprint')

  // Close status menu on click outside
  useEffect(() => {
    const handler = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const handleStatusChange = useCallback(async (newStatus) => {
    if (newStatus === sprint?.status) {
      setShowStatusMenu(false)
      return
    }
    setUpdatingStatus(true)
    setShowStatusMenu(false)
    try {
      await updateSprint({ status: newStatus })
      toast.success(`Sprint cambiado a "${statusConfig[newStatus]?.label || newStatus}"`)
    } catch (err) {
      toast.error(err.message || 'Error al cambiar el estado')
    } finally {
      setUpdatingStatus(false)
    }
  }, [sprint?.status, updateSprint, toast])

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
        <div className="text-6xl mb-4">???</div>
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
        {/* Left column - Sprint details, AI summary, and issues */}
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
                  <div className="relative" ref={statusMenuRef}>
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => canManage && setShowStatusMenu(!showStatusMenu)}
                      disabled={updatingStatus}
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                        config.bg, config.text, config.border,
                        canManage && 'cursor-pointer hover:brightness-125',
                        updatingStatus && 'opacity-60'
                      )}
                    >
                      <span className={clsx('w-2 h-2 rounded-full', config.dot, sprint.status === 'active' && 'animate-pulse')} />
                      {updatingStatus ? 'Cambiando...' : config.label}
                      {canManage && <ChevronDown className={clsx('w-3 h-3 transition-transform', showStatusMenu && 'rotate-180')} />}
                    </motion.button>

                    <AnimatePresence>
                      {showStatusMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-full left-0 mt-1.5 w-44 rounded-xl border border-border-primary bg-bg-secondary shadow-xl z-50 overflow-hidden"
                        >
                          {Object.entries(statusConfig).map(([key, cfg]) => (
                            <button
                              key={key}
                              onClick={() => handleStatusChange(key)}
                              className={clsx(
                                'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors text-left',
                                key === sprint.status
                                  ? 'bg-bg-elevated text-text-primary font-medium'
                                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                              )}
                            >
                              <span className={clsx('w-2 h-2 rounded-full', cfg.dot)} />
                              {cfg.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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

          {/* AI Summary */}
          <SprintAISummary
            sprintId={sprint.id}
            aiSummary={sprint.ai_summary}
            canGenerate={canManage}
          />
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
              <Card hover={false}>
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
              <Card hover={false}>
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

          {/* Metrics */}
          <SprintMetrics sprint={sprint} />

          {/* Repositories */}
          {sprint.repositories && sprint.repositories.length > 0 && (
            <SprintRepositories repositories={sprint.repositories} />
          )}
        </div>
      </div>
    </div>
  )
}
