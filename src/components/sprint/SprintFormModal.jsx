import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import clsx from 'clsx'
import { Modal, ModalFooter, Button, Input, Textarea } from '../ui'

export function SprintFormModal({ isOpen, onClose, onSubmit, sprint = null }) {
  const isEditing = !!sprint
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateError, setDateError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Populate fields when editing
  useEffect(() => {
    if (sprint) {
      setName(sprint.name || '')
      setDescription(sprint.description || '')
      setStartDate(sprint.start_date || '')
      setEndDate(sprint.end_date || '')
    } else {
      setName('')
      setDescription('')
      setStartDate('')
      setEndDate('')
    }
    setDateError(null)
  }, [sprint, isOpen])

  const validateDates = () => {
    if (startDate && endDate && endDate < startDate) {
      setDateError('La fecha de fin debe ser igual o posterior a la de inicio')
      return false
    }
    setDateError(null)
    return true
  }

  const handleSubmit = async () => {
    if (!name.trim() || !validateDates()) return

    setSubmitting(true)
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
      }
      await onSubmit?.(data)
      handleClose()
    } catch {
      // Error handled by parent via toast
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setDateError(null)
    setSubmitting(false)
    onClose()
  }

  const isValid = name.trim().length > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Sprint' : 'Nuevo Sprint'}
      description={isEditing ? 'Modifica los datos del sprint' : 'Crea un nuevo sprint para organizar issues'}
      size="md"
    >
      <div className="space-y-5">
        {/* Icon header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center -mt-2 mb-4"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent-blue to-emerald-600">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Name */}
        <Input
          label="Nombre"
          placeholder="Ej: Sprint 1 - MVP Auth"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Description */}
        <Textarea
          label="Descripcion"
          placeholder="Describe el objetivo de este sprint..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">
              Fecha inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDateError(null) }}
              className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all duration-200 hover:border-border-secondary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">
              Fecha fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDateError(null) }}
              className={clsx(
                'w-full rounded-lg border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary',
                'focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all duration-200',
                dateError
                  ? 'border-status-rejected focus:ring-status-rejected/50 focus:border-status-rejected'
                  : 'border-border-primary hover:border-border-secondary'
              )}
            />
            {dateError && (
              <p className="text-xs text-status-rejected">{dateError}</p>
            )}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid || submitting}>
          {submitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Sprint'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
