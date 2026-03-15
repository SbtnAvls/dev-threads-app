import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Loader2, ChevronDown, ChevronUp, Trash2,
  GripVertical, Calendar, CheckCircle, AlertCircle,
  ArrowRight, Pencil, X, Plus, ArrowLeftRight,
} from 'lucide-react'
import { Button, Modal, ModalFooter } from '../ui'
import { priorityConfig, issueStatusConfig } from './sprintConstants'
import sprintService from '../../services/sprintService'
import clsx from 'clsx'


// ─── Step 1: Config ─────────────────────────────────────────────────────────

function GenerateConfigStep({ onGenerate, loading }) {
  const [durationWeeks, setDurationWeeks] = useState(2)
  const [maxSprints, setMaxSprints] = useState(3)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 mx-auto">
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">Generar Sprints con AI</h3>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          La AI analizara los issues del backlog (sin sprint asignado) y propondra
          sprints organizados por prioridad, tema y carga de trabajo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Duracion por sprint (semanas)
          </label>
          <select
            value={durationWeeks}
            onChange={e => setDurationWeeks(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-lg border border-border-primary bg-bg-elevated text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
          >
            {[1, 2, 3, 4].map(w => (
              <option key={w} value={w}>{w} semana{w !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Maximo de sprints
          </label>
          <select
            value={maxSprints}
            onChange={e => setMaxSprints(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-lg border border-border-primary bg-bg-elevated text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <ModalFooter>
        <Button
          icon={loading ? Loader2 : Sparkles}
          onClick={() => onGenerate({ sprint_duration_weeks: durationWeeks, max_sprints: maxSprints })}
          disabled={loading}
        >
          {loading ? 'Analizando backlog...' : 'Generar propuestas'}
        </Button>
      </ModalFooter>
    </div>
  )
}


// ─── Step 2: Loading ────────────────────────────────────────────────────────

function GeneratingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent-blue rounded-full flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-text-primary">Generando propuestas de sprints...</p>
        <p className="text-xs text-text-muted">La AI esta analizando tu backlog. Esto puede tomar unos segundos.</p>
      </div>
    </div>
  )
}


// ─── Editable Issue Row ─────────────────────────────────────────────────────

function IssueRow({ issue, onRemove, onMove, sprintCount }) {
  const pConfig = priorityConfig[issue.priority] || priorityConfig.medium
  const sConfig = issueStatusConfig[issue.status] || issueStatusConfig.open

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-primary border border-border-primary group hover:border-border-secondary transition-colors"
    >
      <GripVertical className="w-3.5 h-3.5 text-text-muted/50 shrink-0" />

      {/* Status dot */}
      <span className={clsx('w-2 h-2 rounded-full shrink-0', sConfig.dot)} />

      {/* Priority indicator */}
      <span className={clsx('w-1 h-5 rounded-full shrink-0', pConfig.dot)} />

      {/* Title */}
      <span className="text-sm text-text-primary truncate flex-1" title={issue.title}>
        {issue.title}
      </span>

      {/* Assignee */}
      {issue.assigned_to && (
        <span className="text-xs text-text-muted truncate max-w-[80px] hidden sm:inline" title={`${issue.assigned_to.first_name} ${issue.assigned_to.last_name}`}>
          {issue.assigned_to.first_name}
        </span>
      )}

      {/* Complexity */}
      {issue.complexity && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: issue.complexity.color + '20', color: issue.complexity.color }}
        >
          {issue.complexity.value}p
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {sprintCount > 1 && (
          <button
            onClick={onMove}
            className="p-1 rounded text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
            title="Mover a otro sprint"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="p-1 rounded text-text-muted hover:text-status-rejected hover:bg-status-rejected/10 transition-colors"
          title="Quitar del sprint"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}


// ─── Editable Sprint Card ───────────────────────────────────────────────────

function SprintProposalCard({
  sprint, index, issues, allSprints,
  onUpdateSprint, onRemoveIssue, onMoveIssue, onDeleteSprint,
}) {
  const [expanded, setExpanded] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [nameValue, setNameValue] = useState(sprint.name)
  const [descValue, setDescValue] = useState(sprint.description || '')

  const handleSaveName = () => {
    if (nameValue.trim()) {
      onUpdateSprint(index, { name: nameValue.trim() })
    }
    setEditingName(false)
  }

  const handleSaveDesc = () => {
    onUpdateSprint(index, { description: descValue })
    setEditingDesc(false)
  }

  const totalPoints = issues.reduce((sum, i) => sum + (i.complexity?.value || 0), 0)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border border-border-primary bg-bg-secondary overflow-hidden"
    >
      {/* Sprint header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                autoFocus
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                className="w-full px-2 py-1 rounded-lg border border-accent-blue bg-bg-primary text-sm font-semibold text-text-primary focus:outline-none"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-text-primary hover:text-accent-blue transition-colors group"
              >
                {sprint.name}
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            {editingDesc ? (
              <textarea
                autoFocus
                value={descValue}
                onChange={e => setDescValue(e.target.value)}
                onBlur={handleSaveDesc}
                rows={2}
                className="w-full mt-1 px-2 py-1 rounded-lg border border-accent-blue bg-bg-primary text-xs text-text-muted focus:outline-none resize-none"
              />
            ) : (
              <button
                onClick={() => setEditingDesc(true)}
                className="block mt-0.5 text-xs text-text-muted hover:text-text-secondary transition-colors text-left"
              >
                {sprint.description || 'Agregar descripcion...'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onDeleteSprint(index)}
              className="p-1.5 rounded-lg text-text-muted hover:text-status-rejected hover:bg-status-rejected/10 transition-colors"
              title="Eliminar sprint propuesto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {sprint.start_date && sprint.end_date ? (
              <>
                <DateInput value={sprint.start_date} onChange={v => onUpdateSprint(index, { start_date: v })} />
                <ArrowRight className="w-3 h-3" />
                <DateInput value={sprint.end_date} onChange={v => onUpdateSprint(index, { end_date: v })} />
              </>
            ) : (
              'Sin fechas'
            )}
          </span>
          <span>{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
          {totalPoints > 0 && <span>{totalPoints} pts</span>}
        </div>
      </div>

      {/* Issues */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5 max-h-[300px] overflow-y-auto">
              <AnimatePresence>
                {issues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    sprintCount={allSprints.length}
                    onRemove={() => onRemoveIssue(index, issue.id)}
                    onMove={() => onMoveIssue(index, issue.id)}
                  />
                ))}
              </AnimatePresence>

              {issues.length === 0 && (
                <p className="text-xs text-text-muted text-center py-4">
                  Sin issues. Este sprint sera ignorado al confirmar.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


// ─── Inline Date Input ──────────────────────────────────────────────────────

function DateInput({ value, onChange }) {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="bg-transparent border-b border-border-primary text-xs text-text-secondary focus:outline-none focus:border-accent-blue cursor-pointer hover:text-text-primary transition-colors"
    />
  )
}


// ─── Move Issue Dropdown ────────────────────────────────────────────────────

function MoveIssueDropdown({ sprints, currentIndex, onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 top-full mt-1 z-10 bg-bg-elevated border border-border-primary rounded-lg shadow-xl py-1 min-w-[200px]"
    >
      <p className="px-3 py-1.5 text-xs text-text-muted font-medium">Mover a:</p>
      {sprints.map((sprint, i) => {
        if (i === currentIndex) return null
        return (
          <button
            key={i}
            onClick={() => { onSelect(i); onClose() }}
            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover transition-colors"
          >
            {sprint.name}
          </button>
        )
      })}
    </motion.div>
  )
}


// ─── Step 3: Review ─────────────────────────────────────────────────────────

function ReviewStep({
  proposals, backlogIssues, onConfirm, onRegenerate, confirming, backlogCount,
}) {
  const [sprints, setSprints] = useState(() => proposals.map(p => ({ ...p })))
  const [moveState, setMoveState] = useState(null) // { sprintIndex, issueId }
  const [unassigned, setUnassigned] = useState(() => {
    // Issues in backlog that weren't assigned to any proposal
    const usedIds = new Set(proposals.flatMap(p => p.issue_ids || []))
    return backlogIssues.filter(i => !usedIds.has(i.id))
  })

  // Build issue lookup map
  const issueMap = {}
  backlogIssues.forEach(i => { issueMap[i.id] = i })

  const handleUpdateSprint = useCallback((index, updates) => {
    setSprints(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s))
  }, [])

  const handleDeleteSprint = useCallback((index) => {
    setSprints(prev => {
      const removed = prev[index]
      // Move issues back to unassigned
      const issueIds = removed.issue_ids || []
      const issuesToReturn = issueIds.map(id => issueMap[id]).filter(Boolean)
      setUnassigned(u => [...u, ...issuesToReturn])
      return prev.filter((_, i) => i !== index)
    })
  }, [issueMap])

  const handleRemoveIssue = useCallback((sprintIndex, issueId) => {
    setSprints(prev => prev.map((s, i) => {
      if (i !== sprintIndex) return s
      return { ...s, issue_ids: (s.issue_ids || []).filter(id => id !== issueId) }
    }))
    const issue = issueMap[issueId]
    if (issue) setUnassigned(u => [...u, issue])
  }, [issueMap])

  const handleMoveIssue = useCallback((fromIndex, issueId) => {
    if (sprints.length < 2) return
    setMoveState({ sprintIndex: fromIndex, issueId })
  }, [sprints.length])

  const handleMoveConfirm = useCallback((toIndex) => {
    if (!moveState) return
    const { sprintIndex: fromIndex, issueId } = moveState
    setSprints(prev => prev.map((s, i) => {
      if (i === fromIndex) return { ...s, issue_ids: (s.issue_ids || []).filter(id => id !== issueId) }
      if (i === toIndex) return { ...s, issue_ids: [...(s.issue_ids || []), issueId] }
      return s
    }))
    setMoveState(null)
  }, [moveState])

  const handleAddToSprint = useCallback((sprintIndex, issueId) => {
    setSprints(prev => prev.map((s, i) => {
      if (i !== sprintIndex) return s
      return { ...s, issue_ids: [...(s.issue_ids || []), issueId] }
    }))
    setUnassigned(u => u.filter(i => i.id !== issueId))
  }, [])

  // Filter out sprints with no issues for confirmation
  const validSprints = sprints.filter(s => (s.issue_ids || []).length > 0)

  const totalAssigned = sprints.reduce((sum, s) => sum + (s.issue_ids || []).length, 0)

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>{sprints.length} sprint{sprints.length !== 1 ? 's' : ''} propuesto{sprints.length !== 1 ? 's' : ''}</span>
          <span>{totalAssigned} issue{totalAssigned !== 1 ? 's' : ''} asignado{totalAssigned !== 1 ? 's' : ''}</span>
          {unassigned.length > 0 && (
            <span className="text-status-in-review">{unassigned.length} sin asignar</span>
          )}
        </div>
      </div>

      {/* Move issue dropdown (global) */}
      <AnimatePresence>
        {moveState && (
          <div className="relative">
            <MoveIssueDropdown
              sprints={sprints}
              currentIndex={moveState.sprintIndex}
              onSelect={handleMoveConfirm}
              onClose={() => setMoveState(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Sprint proposals */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        <AnimatePresence>
          {sprints.map((sprint, index) => (
            <SprintProposalCard
              key={index}
              sprint={sprint}
              index={index}
              issues={(sprint.issue_ids || []).map(id => issueMap[id]).filter(Boolean)}
              allSprints={sprints}
              onUpdateSprint={handleUpdateSprint}
              onRemoveIssue={handleRemoveIssue}
              onMoveIssue={handleMoveIssue}
              onDeleteSprint={handleDeleteSprint}
            />
          ))}
        </AnimatePresence>

        {sprints.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">Todos los sprints fueron eliminados.</p>
          </div>
        )}
      </div>

      {/* Unassigned issues */}
      {unassigned.length > 0 && (
        <div className="rounded-xl border border-border-primary border-dashed bg-bg-primary p-4 space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Issues sin asignar ({unassigned.length})
          </p>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {unassigned.map(issue => {
              const pConfig = priorityConfig[issue.priority] || priorityConfig.medium
              return (
                <div
                  key={issue.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary group hover:border-border-secondary transition-colors"
                >
                  <span className={clsx('w-1 h-5 rounded-full shrink-0', pConfig.dot)} />
                  <span className="text-sm text-text-primary truncate flex-1">{issue.title}</span>

                  {/* Add to sprint buttons */}
                  {sprints.length > 0 && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {sprints.map((s, si) => (
                        <button
                          key={si}
                          onClick={() => handleAddToSprint(si, issue.id)}
                          className="px-2 py-0.5 rounded text-xs text-accent-blue hover:bg-accent-blue/10 transition-colors whitespace-nowrap"
                          title={`Agregar a ${s.name}`}
                        >
                          <Plus className="w-3 h-3 inline mr-0.5" />
                          S{si + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <ModalFooter>
        <Button
          variant="secondary"
          onClick={onRegenerate}
          disabled={confirming}
        >
          Regenerar
        </Button>
        <Button
          icon={confirming ? Loader2 : CheckCircle}
          onClick={() => onConfirm(validSprints)}
          disabled={confirming || validSprints.length === 0}
        >
          {confirming
            ? 'Creando sprints...'
            : `Confirmar ${validSprints.length} sprint${validSprints.length !== 1 ? 's' : ''}`
          }
        </Button>
      </ModalFooter>
    </div>
  )
}


// ─── Main Modal ─────────────────────────────────────────────────────────────

export function SprintAIGenerateModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('config') // config | generating | review | error
  const [proposals, setProposals] = useState([])
  const [backlogIssues, setBacklogIssues] = useState([])
  const [backlogCount, setBacklogCount] = useState(0)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const handleGenerate = useCallback(async (options = {}) => {
    setStep('generating')
    setError('')
    try {
      const data = await sprintService.generateAISprints(options)
      setProposals(data.proposals || [])
      setBacklogCount(data.backlog_count || 0)

      // Fetch backlog issues for the review UI
      const { default: issueService } = await import('../../services/issueService')
      const issues = await issueService.getIssues({ sprint: 'none', ordering: '-priority' })
      setBacklogIssues(Array.isArray(issues) ? issues : (issues?.results || []))

      setStep('review')
    } catch (err) {
      setError(err?.data?.detail || err?.message || 'Error al generar propuestas')
      setStep('error')
    }
  }, [])

  const handleConfirm = useCallback(async (sprintsToCreate) => {
    setConfirming(true)
    try {
      await sprintService.confirmAISprints(
        sprintsToCreate.map(s => ({
          name: s.name,
          description: s.description || '',
          start_date: s.start_date || null,
          end_date: s.end_date || null,
          issue_ids: s.issue_ids || [],
        }))
      )
      onSuccess?.()
      handleClose()
    } catch (err) {
      setError(err?.data?.detail || err?.message || 'Error al crear sprints')
    } finally {
      setConfirming(false)
    }
  }, [onSuccess])

  const handleClose = useCallback(() => {
    setStep('config')
    setProposals([])
    setBacklogIssues([])
    setError('')
    setConfirming(false)
    onClose()
  }, [onClose])

  const handleRegenerate = useCallback(() => {
    setStep('config')
    setProposals([])
  }, [])

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'generating' ? undefined : handleClose}
      title={
        step === 'config' ? 'Generar Sprints con AI' :
        step === 'generating' ? 'Generando...' :
        step === 'review' ? 'Revisar propuestas' :
        'Error'
      }
      description={
        step === 'review' ? 'Revisa, edita y confirma los sprints propuestos por la AI' : undefined
      }
      size={step === 'review' ? 'xl' : 'lg'}
      showClose={step !== 'generating'}
    >
      {step === 'config' && (
        <GenerateConfigStep onGenerate={handleGenerate} loading={false} />
      )}

      {step === 'generating' && (
        <GeneratingStep />
      )}

      {step === 'review' && (
        <ReviewStep
          proposals={proposals}
          backlogIssues={backlogIssues}
          backlogCount={backlogCount}
          onConfirm={handleConfirm}
          onRegenerate={handleRegenerate}
          confirming={confirming}
        />
      )}

      {step === 'error' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-status-rejected/10 border border-status-rejected/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-status-rejected shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-status-rejected">Error al generar sprints</p>
              <p className="text-xs text-text-muted mt-1">{error}</p>
            </div>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
            <Button onClick={handleRegenerate}>Reintentar</Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  )
}
