import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  AlertCircle,
  Calendar,
  ChevronDown,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Target,
  Layers,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { EpicFormModal, AssignEpicIssueModal, EpicAIBreakdownModal } from '../components/epic'
import { statusConfig, issueStatusConfig, priorityConfig, formatEpicDate } from '../components/epic/epicConstants'
import { IssueCard } from '../components/issue'
import { Button, Card, Modal, ModalFooter, Avatar, EmptyState, useToast } from '../components/ui'
import { useEpicDetail } from '../hooks'
import { useAuth } from '../context/AuthContext'
import { fullName } from '../utils/helpers'
import epicService from '../services/epicService'
import orgService from '../services/orgService'

/* ------------------------------------------------------------------ */
/*  Rollup metrics panel                                              */
/* ------------------------------------------------------------------ */
function EpicMetrics({ epic }) {
  if (!epic) return null

  const statusCounts = epic.status_counts || {}
  const issueCount = epic.issue_count ?? 0
  const progress = Math.min(epic.progress_percentage ?? 0, 100)
  const complexityTotal = epic.complexity_total ?? 0
  const sprintCount = epic.sprint_count ?? 0

  return (
    <Card hover={false} className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-text-muted" />
        <h3 className="text-sm font-medium text-text-primary">Metricas</h3>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-bg-elevated text-center">
          <Target className="w-4 h-4 mx-auto mb-1 text-text-muted" />
          <p className="text-xl font-bold text-text-primary">{issueCount}</p>
          <p className="text-[10px] text-text-muted leading-tight">Issues</p>
          <p className="text-[10px] text-text-muted mt-0.5">{progress}% completado</p>
        </div>
        <div className="p-3 rounded-lg bg-bg-elevated text-center">
          <Layers className="w-4 h-4 mx-auto mb-1 text-text-muted" />
          <p className="text-xl font-bold text-text-primary">{sprintCount}</p>
          <p className="text-[10px] text-text-muted leading-tight">Sprints</p>
          <p className="text-[10px] text-text-muted mt-0.5">{complexityTotal} pts</p>
        </div>
      </div>

      {/* Progress bar */}
      {issueCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-text-muted">
            <span>Progreso</span>
            <span>{progress}%</span>
          </div>
          <div
            className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso de la epica: ${progress}%`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={clsx(
                'h-full rounded-full',
                progress >= 80 ? 'bg-status-approved'
                  : progress >= 40 ? 'bg-status-in-review'
                  : 'bg-accent-blue'
              )}
            />
          </div>
        </div>
      )}

      {/* Status distribution */}
      {issueCount > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Distribucion por estado</p>
          {Object.entries(issueStatusConfig).map(([key, cfg]) => {
            const count = statusCounts[key] ?? 0
            if (count === 0) return null
            const pct = issueCount > 0 ? Math.round((count / issueCount) * 100) : 0
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className={clsx('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
                <span className="text-text-secondary w-24 truncate">{cfg.label}</span>
                <div
                  className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cfg.label}: ${count} de ${issueCount}`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={clsx('h-full rounded-full', cfg.dot)}
                  />
                </div>
                <span className="text-text-muted w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Delete confirmation modal (unlink vs delete_issues)               */
/* ------------------------------------------------------------------ */
function DeleteEpicModal({ isOpen, onClose, onConfirm, epic, deleting }) {
  const [action, setAction] = useState('unlink')

  const issueCount = epic?.issue_count ?? 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Epica"
      description={`Vas a eliminar la epica "${epic?.name || ''}"`}
      size="md"
    >
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setAction('unlink')}
          className={clsx(
            'w-full text-left p-4 rounded-xl border transition-all',
            action === 'unlink'
              ? 'border-accent-blue bg-accent-blue/10'
              : 'border-border-primary hover:border-border-secondary'
          )}
        >
          <p className="text-sm font-medium text-text-primary">Solo eliminar la epica</p>
          <p className="text-xs text-text-muted mt-1">
            Los {issueCount} issue{issueCount !== 1 ? 's' : ''} asociado{issueCount !== 1 ? 's' : ''} quedan sin epica (no se borran).
          </p>
        </button>
        <button
          type="button"
          onClick={() => setAction('delete_issues')}
          className={clsx(
            'w-full text-left p-4 rounded-xl border transition-all',
            action === 'delete_issues'
              ? 'border-status-rejected bg-status-rejected/10'
              : 'border-border-primary hover:border-border-secondary'
          )}
        >
          <p className="text-sm font-medium text-status-rejected">Eliminar epica e issues</p>
          <p className="text-xs text-text-muted mt-1">
            Se borran la epica Y sus {issueCount} issue{issueCount !== 1 ? 's' : ''}. Esta accion no se puede deshacer.
          </p>
        </button>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={deleting}>
          Cancelar
        </Button>
        <Button
          icon={Trash2}
          onClick={() => onConfirm(action)}
          disabled={deleting}
          className={action === 'delete_issues' ? '!bg-status-rejected hover:!bg-status-rejected/80' : ''}
        >
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Epic Detail Page                                                  */
/* ------------------------------------------------------------------ */
export function EpicDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    epic,
    loading,
    error,
    refetch,
    updateEpic,
    assignIssues,
    removeIssues,
  } = useEpicDetail(id)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [hasGeminiToken, setHasGeminiToken] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const statusMenuRef = useRef(null)
  const { hasPermission } = useAuth()
  const toast = useToast()

  const canManage = hasPermission('manage_epics')
  const canAssign = hasPermission('assign_epic')

  // Group the epic's issues by their sprint (+ a trailing "Sin sprint" group).
  // This surfaces the orthogonality: an epic spans several sprints.
  const sprintGroups = useMemo(() => {
    const issueList = epic?.issues || []
    const map = new Map()      // sprintId -> { sprint, issues: [] }
    const noSprint = []
    issueList.forEach((issue) => {
      if (issue.sprint) {
        const key = issue.sprint.id
        if (!map.has(key)) map.set(key, { sprint: issue.sprint, issues: [] })
        map.get(key).issues.push(issue)
      } else {
        noSprint.push(issue)
      }
    })
    const groups = Array.from(map.values())
    if (noSprint.length > 0) {
      groups.push({ sprint: null, issues: noSprint })
    }
    return groups
  }, [epic?.issues])

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

  // Check if Gemini is configured (gates the AI breakdown button)
  useEffect(() => {
    let cancelled = false
    orgService.getGeminiTokenStatus()
      .then(data => { if (!cancelled) setHasGeminiToken(data.has_token) })
      .catch(() => { if (!cancelled) setHasGeminiToken(false) })
    return () => { cancelled = true }
  }, [])

  const handleAISuccess = useCallback(() => {
    refetch()
    toast.success('Issues creados y ligados a la epica')
  }, [refetch, toast])

  const handleUpdate = async (data) => {
    try {
      await updateEpic(data)
      toast.success('Epica actualizada correctamente')
      setShowEditModal(false)
    } catch (err) {
      toast.error(err.message || 'Error al actualizar la epica')
      throw err
    }
  }

  const handleStatusChange = useCallback(async (newStatus) => {
    if (newStatus === epic?.status) {
      setShowStatusMenu(false)
      return
    }
    setUpdatingStatus(true)
    setShowStatusMenu(false)
    try {
      await updateEpic({ status: newStatus })
      toast.success(`Epica cambiada a "${statusConfig[newStatus]?.label || newStatus}"`)
    } catch (err) {
      toast.error(err.message || 'Error al cambiar el estado')
    } finally {
      setUpdatingStatus(false)
    }
  }, [epic?.status, updateEpic, toast])

  const handleAssignIssues = useCallback(async (issueIds) => {
    try {
      await assignIssues(issueIds)
      toast.success(`${issueIds.length} issue${issueIds.length !== 1 ? 's' : ''} asignado${issueIds.length !== 1 ? 's' : ''} a la epica`)
    } catch (err) {
      toast.error(err.message || 'Error al asignar issues')
      throw err
    }
  }, [assignIssues, toast])

  const handleRemoveIssue = useCallback(async (issue) => {
    if (!confirm(`Quitar "${issue.title}" de la epica?`)) return
    try {
      await removeIssues([issue.id])
      toast.success(`"${issue.title}" removido de la epica`)
    } catch (err) {
      toast.error(err.message || 'Error al remover issue de la epica')
    }
  }, [removeIssues, toast])

  const handleDelete = useCallback(async (action) => {
    setDeleting(true)
    try {
      await epicService.deleteEpic(id, action)
      toast.success('Epica eliminada correctamente')
      navigate('/epics')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar la epica')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }, [id, navigate, toast])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !epic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Target className="w-16 h-16 text-text-muted mb-4" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">Epica no encontrada</h1>
        <p className="text-text-secondary mb-4">{error || 'La epica que buscas no existe'}</p>
        <Link to="/epics">
          <Button variant="secondary" icon={ArrowLeft}>
            Volver a Epicas
          </Button>
        </Link>
      </div>
    )
  }

  const config = statusConfig[epic.status] || statusConfig.planning
  const prCfg = priorityConfig[epic.priority] || priorityConfig.medium
  const accent = epic.color || '#3b82f6'
  const ownerName = fullName(epic.owner)
  const creatorName = fullName(epic.created_by)
  const issues = epic.issues || []
  const currentIssueIds = issues.map(i => i.id)

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      <EpicFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdate}
        epic={epic}
      />

      {/* Assign Issues Modal */}
      <AssignEpicIssueModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignIssues}
        currentIssueIds={currentIssueIds}
      />

      {/* Delete Modal (keyed so the action choice resets each time it opens) */}
      <DeleteEpicModal
        key={showDeleteModal ? 'delete-open' : 'delete-closed'}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        epic={epic}
        deleting={deleting}
      />

      {/* AI breakdown Modal (propose NEW issues → confirm creates them) */}
      <EpicAIBreakdownModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        epic={epic}
        onSuccess={handleAISuccess}
      />

      {/* Back button */}
      <Link to="/epics" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Epicas</span>
      </Link>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border-primary bg-bg-secondary p-6 relative overflow-hidden"
          >
            {/* Colour accent strip */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{ backgroundColor: accent }}
            />

            {/* Title row */}
            <div className="flex items-start justify-between gap-4 mb-4 relative pl-2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {/* Status (changeable) */}
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
                      <span className={clsx('w-2 h-2 rounded-full', config.dot, epic.status === 'active' && 'animate-pulse')} />
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
                                key === epic.status
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

                  {/* Priority badge */}
                  <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium', prCfg.text)}>
                    <span className={clsx('w-2 h-2 rounded-full', prCfg.dot)} />
                    {prCfg.label}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: accent }} />
                  <h1 className="text-2xl font-bold text-text-primary">
                    {epic.name}
                  </h1>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {canManage && hasGeminiToken && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Sparkles}
                    onClick={() => setShowAIModal(true)}
                    className="!border-purple-500/30 !text-purple-400 hover:!bg-purple-500/10"
                  >
                    Desglosar con IA
                  </Button>
                )}
                {canManage && hasGeminiToken === false && (
                  <button
                    onClick={() => navigate('/settings?tab=ai')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                    title="Configura Gemini AI para desglosar epicas automaticamente"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Configurar IA</span>
                  </button>
                )}
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
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="w-4 h-4 text-status-rejected" />
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            {epic.description && (
              <p className="text-text-secondary leading-relaxed pl-2">
                {epic.description}
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
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-text-muted" />
              <h3 className="text-lg font-semibold text-text-primary">Issues de la Epica</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-elevated text-text-muted">
                {issues.length}
              </span>
            </div>

            {issues.length === 0 ? (
              <EmptyState
                icon="issue"
                title="Sin issues asignados"
                description="Agrega issues a esta epica para comenzar a trabajar"
                action={canAssign ? 'Agregar issues' : undefined}
                onAction={canAssign ? () => setShowAssignModal(true) : undefined}
              />
            ) : (
              <div className="space-y-6">
                {sprintGroups.map((group) => {
                  const groupKey = group.sprint ? `sprint-${group.sprint.id}` : 'no-sprint'
                  return (
                    <div key={groupKey} className="space-y-3">
                      {/* Group header (sprint name + issue count) */}
                      <div className="flex items-center gap-2">
                        {group.sprint ? (
                          <Link
                            to={`/sprint/${group.sprint.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="max-w-[180px] truncate">{group.sprint.name}</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg-elevated text-text-muted border border-border-primary">
                            <Layers className="w-3.5 h-3.5" />
                            Sin sprint
                          </span>
                        )}
                        <span className="text-xs text-text-muted">
                          {group.issues.length} issue{group.issues.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Group issue grid */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                      >
                        <AnimatePresence mode="popLayout">
                          {group.issues.map((issue, index) => (
                            <motion.div
                              key={issue.id}
                              layout
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="relative group/issue"
                            >
                              <IssueCard issue={issue} index={index} />
                              {canAssign && (
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleRemoveIssue(issue)
                                  }}
                                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-bg-elevated/90 text-text-muted hover:text-status-rejected hover:bg-bg-elevated transition-all opacity-0 group-hover/issue:opacity-100 z-10"
                                  title="Quitar de la epica"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </motion.button>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-4">
          {/* Dates */}
          {(epic.start_date || epic.target_date) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card hover={false}>
                <h3 className="text-sm font-medium text-text-muted mb-3">Fechas</h3>
                <div className="space-y-3">
                  {epic.start_date && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bg-elevated">
                        <Calendar className="w-4 h-4 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Inicio</p>
                        <p className="text-sm text-text-primary">
                          {formatEpicDate(epic.start_date, 'long')}
                        </p>
                      </div>
                    </div>
                  )}
                  {epic.target_date && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bg-elevated">
                        <Calendar className="w-4 h-4 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Objetivo</p>
                        <p className="text-sm text-text-primary">
                          {formatEpicDate(epic.target_date, 'long')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Owner */}
          {epic.owner && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 }}
            >
              <Card hover={false}>
                <h3 className="text-sm font-medium text-text-muted mb-3">Responsable</h3>
                <Link
                  to={`/developer/${epic.owner.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-elevated transition-colors"
                >
                  <Avatar name={ownerName} src={epic.owner.avatar_url} size="sm" />
                  <div>
                    <p className="font-medium text-text-primary text-sm">{ownerName}</p>
                    <p className="text-xs text-text-muted">{epic.owner.email}</p>
                  </div>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* Created by */}
          {epic.created_by && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card hover={false}>
                <h3 className="text-sm font-medium text-text-muted mb-3">Creado por</h3>
                <Link
                  to={`/developer/${epic.created_by.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-elevated transition-colors"
                >
                  <Avatar name={creatorName} src={epic.created_by.avatar_url} size="sm" />
                  <div>
                    <p className="font-medium text-text-primary text-sm">{creatorName}</p>
                    <p className="text-xs text-text-muted">{epic.created_by.email}</p>
                  </div>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* Metrics */}
          <EpicMetrics epic={epic} />
        </div>
      </div>
    </div>
  )
}
