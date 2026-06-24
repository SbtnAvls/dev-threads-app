import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Loader2, Trash2, CheckCircle, AlertCircle,
  Pencil, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button, Modal, ModalFooter } from '../ui'
import { priorityConfig } from './epicConstants'
import { useComplexityLevels } from '../../hooks'
import epicService from '../../services/epicService'
import clsx from 'clsx'

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical']

// Stable local id for each proposal row, so removing an issue from the middle of
// the list does not shuffle the local state (expanded/focus) of the sibling cards
// (React would otherwise reconcile by position when keyed by index).
let _proposalKeySeq = 0
function makeProposalKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  _proposalKeySeq += 1
  return `proposal-${Date.now()}-${_proposalKeySeq}`
}


// ─── Step 1: Config ─────────────────────────────────────────────────────────

function BreakdownConfigStep({ epic, onGenerate, loading }) {
  const [maxIssues, setMaxIssues] = useState(8)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 mx-auto">
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">Desglosar Epica con AI</h3>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          La AI leera el nombre y la descripcion de la epica
          {epic?.name ? <> <span className="text-text-secondary font-medium">"{epic.name}"</span></> : ''}
          {' '}y propondra una lista de issues NUEVOS para implementarla. Podras revisarlos
          y editarlos antes de crearlos.
        </p>
      </div>

      <div className="max-w-xs mx-auto">
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Maximo de issues a proponer
        </label>
        <select
          value={maxIssues}
          onChange={e => setMaxIssues(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-lg border border-border-primary bg-bg-elevated text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
        >
          {[3, 5, 8, 10, 12, 15].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <ModalFooter>
        <Button
          icon={loading ? Loader2 : Sparkles}
          onClick={() => onGenerate({ max_issues: maxIssues })}
          disabled={loading}
        >
          {loading ? 'Analizando epica...' : 'Generar propuestas'}
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
        <p className="text-sm font-medium text-text-primary">Desglosando la epica en issues...</p>
        <p className="text-xs text-text-muted">La AI esta analizando la descripcion. Esto puede tomar unos segundos.</p>
      </div>
    </div>
  )
}


// ─── Editable proposed-issue card ───────────────────────────────────────────

function ProposalCard({ issue, index, complexityLevels, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const pConfig = priorityConfig[issue.priority] || priorityConfig.medium

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-xl border border-border-primary bg-bg-secondary overflow-hidden"
    >
      <div className="p-3 space-y-2">
        {/* Title row */}
        <div className="flex items-start gap-2">
          <span className={clsx('w-1 h-5 mt-1 rounded-full shrink-0', pConfig.dot)} />
          <input
            value={issue.title}
            onChange={e => onUpdate(index, { title: e.target.value })}
            placeholder="Titulo del issue"
            className="flex-1 px-2 py-1 rounded-lg border border-transparent bg-transparent text-sm font-medium text-text-primary hover:border-border-primary focus:border-accent-blue focus:bg-bg-primary focus:outline-none transition-all"
          />
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors shrink-0"
            title={expanded ? 'Contraer' : 'Editar detalles'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg text-text-muted hover:text-status-rejected hover:bg-status-rejected/10 transition-colors shrink-0"
            title="Quitar del listado"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Meta row (priority + complexity always visible/editable) */}
        <div className="flex flex-wrap items-center gap-2 pl-3">
          <select
            value={issue.priority || 'medium'}
            onChange={e => onUpdate(index, { priority: e.target.value })}
            className="px-2 py-1 rounded-lg border border-border-primary bg-bg-elevated text-xs text-text-secondary focus:outline-none focus:border-accent-blue transition-all"
            aria-label="Prioridad"
          >
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p}>{priorityConfig[p]?.label || p}</option>
            ))}
          </select>

          {complexityLevels.length > 0 && (
            <select
              value={issue.complexity || ''}
              onChange={e => onUpdate(index, { complexity: e.target.value || null })}
              className="px-2 py-1 rounded-lg border border-border-primary bg-bg-elevated text-xs text-text-secondary focus:outline-none focus:border-accent-blue transition-all"
              aria-label="Complejidad"
            >
              <option value="">Sin complejidad</option>
              {complexityLevels.map(l => (
                <option key={l.id} value={l.name}>{l.label} ({l.value}p)</option>
              ))}
            </select>
          )}

          {issue.tags && issue.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {issue.tags.map((tag, ti) => (
                <span
                  key={ti}
                  className="px-1.5 py-0.5 rounded-full text-[10px] bg-bg-elevated text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description (collapsible) */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pl-3"
            >
              <textarea
                value={issue.description || ''}
                onChange={e => onUpdate(index, { description: e.target.value })}
                rows={3}
                placeholder="Descripcion del issue..."
                className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border-primary bg-bg-primary text-xs text-text-secondary focus:outline-none focus:border-accent-blue resize-none transition-all"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}


// ─── Step 3: Review ─────────────────────────────────────────────────────────

function ReviewStep({ proposals, complexityLevels, onConfirm, onRegenerate, confirming }) {
  const [issues, setIssues] = useState(() => proposals.map(p => ({ ...p, _key: makeProposalKey() })))

  const handleUpdate = useCallback((index, updates) => {
    setIssues(prev => prev.map((it, i) => (i === index ? { ...it, ...updates } : it)))
  }, [])

  const handleRemove = useCallback((index) => {
    setIssues(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Only issues with a non-empty title are valid for creation
  const validIssues = issues.filter(it => (it.title || '').trim().length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>{issues.length} issue{issues.length !== 1 ? 's' : ''} propuesto{issues.length !== 1 ? 's' : ''}</span>
          {validIssues.length !== issues.length && (
            <span className="text-status-in-review">
              {issues.length - validIssues.length} sin titulo (se ignoran)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        <AnimatePresence>
          {issues.map((issue, index) => (
            <ProposalCard
              key={issue._key}
              issue={issue}
              index={index}
              complexityLevels={complexityLevels}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
            />
          ))}
        </AnimatePresence>

        {issues.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">No quedan issues propuestos.</p>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onRegenerate} disabled={confirming}>
          Regenerar
        </Button>
        <Button
          icon={confirming ? Loader2 : CheckCircle}
          onClick={() => onConfirm(validIssues)}
          disabled={confirming || validIssues.length === 0}
        >
          {confirming
            ? 'Creando issues...'
            : `Crear ${validIssues.length} issue${validIssues.length !== 1 ? 's' : ''}`}
        </Button>
      </ModalFooter>
    </div>
  )
}


// ─── Main Modal ─────────────────────────────────────────────────────────────

export function EpicAIBreakdownModal({ isOpen, onClose, epic, onSuccess }) {
  const [step, setStep] = useState('config') // config | generating | review | error
  const [proposals, setProposals] = useState([])
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const { levels: complexityLevels } = useComplexityLevels({ enabled: isOpen })

  const epicId = epic?.id

  const handleGenerate = useCallback(async (options = {}) => {
    if (!epicId) return
    setStep('generating')
    setError('')
    try {
      const data = await epicService.breakdownEpicAI(epicId, options)
      const list = data?.proposals || []
      if (list.length === 0) {
        setError('La AI no propuso ningun issue. Intenta enriquecer la descripcion de la epica.')
        setStep('error')
        return
      }
      setProposals(list)
      setStep('review')
    } catch (err) {
      setError(err?.data?.detail || err?.message || 'Error al generar propuestas')
      setStep('error')
    }
  }, [epicId])

  const handleConfirm = useCallback(async (issuesToCreate) => {
    if (!epicId) return
    setConfirming(true)
    setError('')
    try {
      await epicService.confirmEpicBreakdown(
        epicId,
        issuesToCreate.map(it => ({
          title: it.title,
          description: it.description || '',
          priority: it.priority || 'medium',
          complexity: it.complexity || null,
          tags: Array.isArray(it.tags) ? it.tags : [],
        }))
      )
      onSuccess?.()
      handleClose()
    } catch (err) {
      setError(err?.data?.detail || err?.message || 'Error al crear los issues')
    } finally {
      setConfirming(false)
    }
  }, [epicId, onSuccess])

  const handleClose = useCallback(() => {
    setStep('config')
    setProposals([])
    setError('')
    setConfirming(false)
    onClose()
  }, [onClose])

  const handleRegenerate = useCallback(() => {
    setStep('config')
    setProposals([])
    setError('')
  }, [])

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'generating' ? undefined : handleClose}
      title={
        step === 'config' ? 'Desglosar Epica con AI' :
        step === 'generating' ? 'Generando...' :
        step === 'review' ? 'Revisar issues propuestos' :
        'Error'
      }
      description={
        step === 'review'
          ? 'Revisa, edita y crea los issues propuestos por la AI. Quedaran ligados a esta epica.'
          : undefined
      }
      size={step === 'review' ? 'xl' : 'lg'}
      showClose={step !== 'generating'}
    >
      {step === 'config' && (
        <BreakdownConfigStep epic={epic} onGenerate={handleGenerate} loading={false} />
      )}

      {step === 'generating' && <GeneratingStep />}

      {step === 'review' && (
        <ReviewStep
          proposals={proposals}
          complexityLevels={complexityLevels}
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
              <p className="text-sm font-medium text-status-rejected">No se pudo desglosar la epica</p>
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
