import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Check, ClipboardList } from 'lucide-react'
import { Modal, ModalFooter, Button, Input, StatusBadge, PriorityBadge } from '../ui'
import { useIssues } from '../../hooks'
import { fullName } from '../../utils/helpers'
import clsx from 'clsx'

export function AssignIssueModal({ isOpen, onClose, onAssign, currentIssueIds = [] }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Only fetch backlog issues when modal is open (pass null to skip)
  const { issues: backlogIssues, loading } = useIssues(isOpen ? { sprint: 'none' } : null)

  // Filter out issues already in the current sprint and apply search
  const filteredIssues = useMemo(() => {
    if (!backlogIssues || !isOpen) return []
    // Exclude issues already assigned to this sprint
    const available = currentIssueIds.length > 0
      ? backlogIssues.filter(issue => !currentIssueIds.includes(issue.id))
      : backlogIssues
    const query = searchInput.toLowerCase().trim()
    if (!query) return available
    return available.filter(issue =>
      issue.title.toLowerCase().includes(query) ||
      (issue.description && issue.description.toLowerCase().includes(query)) ||
      fullName(issue.assigned_to).toLowerCase().includes(query)
    )
  }, [backlogIssues, searchInput, currentIssueIds, isOpen])

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([])
      setSearchInput('')
    }
  }, [isOpen])

  const toggleIssue = (issueId) => {
    setSelectedIds(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    )
  }

  const handleAssign = async () => {
    if (selectedIds.length === 0) return
    setSubmitting(true)
    try {
      await onAssign(selectedIds)
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Issues al Sprint"
      description="Selecciona los issues del backlog para asignar a este sprint"
      size="lg"
    >
      <div className="space-y-4">
        {/* Icon header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center -mt-2 mb-4"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent-blue to-emerald-600">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Search */}
        <Input
          icon={Search}
          placeholder="Buscar issues por titulo, descripcion o desarrollador..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        {/* Selected count */}
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20"
          >
            <Check className="w-4 h-4 text-accent-blue" />
            <span className="text-sm text-accent-blue font-medium">
              {selectedIds.length} issue{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
            </span>
          </motion.div>
        )}

        {/* Issues list */}
        <div className="max-h-80 overflow-y-auto rounded-xl border border-border-primary bg-bg-tertiary divide-y divide-border-primary">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-accent-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-muted text-sm">
                {searchInput
                  ? 'No se encontraron issues que coincidan con la busqueda'
                  : 'No hay issues disponibles en el backlog'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredIssues.map((issue, index) => {
                const isSelected = selectedIds.includes(issue.id)
                return (
                  <motion.button
                    key={issue.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => toggleIssue(issue.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-3 text-left transition-all hover:bg-bg-elevated/50',
                      isSelected && 'bg-accent-blue/5'
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={clsx(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        isSelected
                          ? 'bg-accent-blue border-accent-blue'
                          : 'border-border-secondary hover:border-accent-blue/50'
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>

                    {/* Issue info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {issue.title}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {fullName(issue.assigned_to) || 'Sin asignar'}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityBadge priority={issue.priority} size="sm" />
                      <StatusBadge status={issue.status} size="sm" />
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          icon={Plus}
          onClick={handleAssign}
          disabled={selectedIds.length === 0 || submitting}
        >
          {submitting
            ? 'Asignando...'
            : `Asignar ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
