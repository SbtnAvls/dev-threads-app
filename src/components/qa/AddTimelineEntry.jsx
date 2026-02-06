import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  GitCommit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image,
  Plus,
  X,
  Send
} from 'lucide-react'
import clsx from 'clsx'
import { Button, Input, Textarea } from '../ui'
import { useAuth } from '../../context/AuthContext'

const actionTypes = [
  {
    type: 'comment',
    label: 'Comentario',
    icon: MessageSquare,
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    description: 'Agregar un comentario o nota',
  },
  {
    type: 'commit',
    label: 'Commit',
    icon: GitCommit,
    color: 'text-status-tech-debt',
    bgColor: 'bg-status-tech-debt/10',
    description: 'Vincular un commit de GitHub',
  },
  {
    type: 'approval',
    label: 'Aprobar',
    icon: CheckCircle2,
    color: 'text-status-approved',
    bgColor: 'bg-status-approved/10',
    description: 'Marcar el QA como aprobado',
  },
  {
    type: 'rejection',
    label: 'Rechazar',
    icon: XCircle,
    color: 'text-status-rejected',
    bgColor: 'bg-status-rejected/10',
    description: 'Rechazar y solicitar cambios',
  },
  {
    type: 'tech_debt',
    label: 'Deuda Técnica',
    icon: AlertTriangle,
    color: 'text-status-tech-debt',
    bgColor: 'bg-status-tech-debt/10',
    description: 'Marcar como deuda técnica',
  },
]

const permissionMap = {
  comment: 'comment',
  commit: 'add_commit',
  approval: 'approve_qa',
  rejection: 'reject_qa',
  tech_debt: 'mark_tech_debt',
}

export function AddTimelineEntry({ onAdd, currentStatus }) {
  const { hasPermission } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [content, setContent] = useState('')
  const [commitHash, setCommitHash] = useState('')
  const [branch, setBranch] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [techDebtDate, setTechDebtDate] = useState('')

  const handleSubmit = () => {
    if (!selectedType || !content.trim()) return

    const entry = {
      type: selectedType,
      content: content.trim(),
      metadata: {},
    }

    if (selectedType === 'commit') {
      entry.metadata.commit_hash = commitHash
      entry.metadata.branch = branch
      entry.metadata.commit_url = commitHash ? `https://github.com/company/app/commit/${commitHash}` : null
    }

    if (selectedType === 'rejection') {
      entry.metadata.rejection_reason = rejectionReason
    }

    if (selectedType === 'tech_debt') {
      entry.metadata.tech_debt_date = techDebtDate || null
    }

    onAdd?.(entry)
    resetForm()
  }

  const resetForm = () => {
    setIsExpanded(false)
    setSelectedType(null)
    setContent('')
    setCommitHash('')
    setBranch('')
    setRejectionReason('')
    setTechDebtDate('')
  }

  // Filter available actions based on current status and user permissions
  const availableActions = actionTypes.filter((action) => {
    const perm = permissionMap[action.type]
    if (perm && !hasPermission(perm)) return false
    if (currentStatus === 'approved') return false
    if (currentStatus === 'tech_debt') return action.type === 'comment'
    if (action.type === 'approval' || action.type === 'rejection') {
      return currentStatus === 'in_review'
    }
    return true
  })

  return (
    <div className="border border-border-primary rounded-xl bg-bg-secondary overflow-hidden">
      {/* Toggle button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'w-full flex items-center justify-between p-4',
          'hover:bg-bg-elevated/50 transition-colors',
          isExpanded && 'border-b border-border-primary'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-blue/10">
            <Plus className="w-5 h-5 text-accent-blue" />
          </div>
          <span className="font-medium text-text-primary">Agregar al Timeline</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="w-5 h-5 text-text-muted" />
        </motion.div>
      </motion.button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Action type selector */}
              {!selectedType ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableActions.map((action) => (
                    <motion.button
                      key={action.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(action.type)}
                      className={clsx(
                        'p-3 rounded-xl border border-border-primary',
                        'hover:border-border-secondary transition-all',
                        'flex flex-col items-center gap-2 text-center'
                      )}
                    >
                      <div className={clsx('p-2 rounded-lg', action.bgColor)}>
                        <action.icon className={clsx('w-5 h-5', action.color)} />
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {action.label}
                      </span>
                      <span className="text-xs text-text-muted line-clamp-2">
                        {action.description}
                      </span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Selected type header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const action = actionTypes.find(a => a.type === selectedType)
                        const Icon = action?.icon || MessageSquare
                        return (
                          <>
                            <div className={clsx('p-2 rounded-lg', action?.bgColor)}>
                              <Icon className={clsx('w-4 h-4', action?.color)} />
                            </div>
                            <span className="font-medium text-text-primary">
                              {action?.label}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                    <button
                      onClick={() => setSelectedType(null)}
                      className="p-1 rounded-lg hover:bg-bg-elevated transition-colors"
                    >
                      <X className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>

                  {/* Content textarea */}
                  <Textarea
                    label="Descripción"
                    placeholder={
                      selectedType === 'comment' ? 'Escribe tu comentario...' :
                      selectedType === 'commit' ? 'Describe los cambios realizados...' :
                      selectedType === 'approval' ? 'Comentario de aprobación (opcional)...' :
                      selectedType === 'rejection' ? 'Describe qué necesita ser corregido...' :
                      'Describe el motivo de la deuda técnica...'
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                  />

                  {/* Commit specific fields */}
                  {selectedType === 'commit' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Hash del Commit"
                        placeholder="a3f2b1c"
                        value={commitHash}
                        onChange={(e) => setCommitHash(e.target.value)}
                      />
                      <Input
                        label="Rama"
                        placeholder="fix/login-validation"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Rejection specific fields */}
                  {selectedType === 'rejection' && (
                    <Textarea
                      label="Motivo del Rechazo"
                      placeholder="Explica detalladamente qué necesita ser corregido..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                    />
                  )}

                  {/* Tech debt specific fields */}
                  {selectedType === 'tech_debt' && (
                    <Input
                      label="Fecha Tentativa de Resolución"
                      type="date"
                      value={techDebtDate}
                      onChange={(e) => setTechDebtDate(e.target.value)}
                    />
                  )}

                  {/* Submit buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!content.trim()}
                      icon={Send}
                    >
                      Enviar
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
