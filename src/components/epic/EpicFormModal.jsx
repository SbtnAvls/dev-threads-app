import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Check } from 'lucide-react'
import clsx from 'clsx'
import { Modal, ModalFooter, Button, Input, Textarea, Select } from '../ui'
import { useDevelopers } from '../../hooks'
import { fullName } from '../../utils/helpers'
import { COLOR_PRESETS, DEFAULT_EPIC_COLOR } from './epicConstants'

const statusOptions = [
  { value: 'planning', label: 'Planificacion' },
  { value: 'active', label: 'Activo' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const priorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
]

export function EpicFormModal({ isOpen, onClose, onSubmit, epic = null }) {
  const isEditing = !!epic
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('planning')
  const [priority, setPriority] = useState('medium')
  const [ownerId, setOwnerId] = useState('')
  const [color, setColor] = useState(DEFAULT_EPIC_COLOR)
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [dateError, setDateError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { developers } = useDevelopers()
  const ownerOptions = [
    { value: '', label: 'Sin asignar' },
    ...developers.map(d => ({ value: String(d.id), label: fullName(d) || d.email })),
  ]

  // Populate fields when editing / reset when creating
  useEffect(() => {
    if (epic) {
      setName(epic.name || '')
      setDescription(epic.description || '')
      setStatus(epic.status || 'planning')
      setPriority(epic.priority || 'medium')
      setOwnerId(epic.owner ? String(epic.owner.id) : '')
      setColor(epic.color || DEFAULT_EPIC_COLOR)
      setStartDate(epic.start_date || '')
      setTargetDate(epic.target_date || '')
    } else {
      setName('')
      setDescription('')
      setStatus('planning')
      setPriority('medium')
      setOwnerId('')
      setColor(DEFAULT_EPIC_COLOR)
      setStartDate('')
      setTargetDate('')
    }
    setDateError(null)
  }, [epic, isOpen])

  const validateDates = () => {
    if (startDate && targetDate && targetDate < startDate) {
      setDateError('La fecha objetivo debe ser igual o posterior a la de inicio')
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
        status,
        priority,
        color,
        owner_id: ownerId ? Number(ownerId) : null,
        start_date: startDate || null,
        target_date: targetDate || null,
      }
      await onSubmit?.(data)
      handleClose()
    } catch {
      // Error handled by parent via toast — keep form open
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setStatus('planning')
    setPriority('medium')
    setOwnerId('')
    setColor(DEFAULT_EPIC_COLOR)
    setStartDate('')
    setTargetDate('')
    setDateError(null)
    setSubmitting(false)
    onClose()
  }

  const isValid = name.trim().length > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Epica' : 'Nueva Epica'}
      description={isEditing ? 'Modifica los datos de la epica' : 'Crea una nueva epica para organizar el alcance'}
      size="md"
    >
      <div className="space-y-5">
        {/* Icon header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center -mt-2 mb-4"
        >
          <div className="p-4 rounded-2xl" style={{ backgroundColor: color }}>
            <Target className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Name */}
        <Input
          label="Nombre"
          placeholder="Ej: Onboarding de nuevos usuarios"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Description */}
        <Textarea
          label="Descripcion"
          placeholder="Describe el alcance y objetivo de esta epica..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {/* Status + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Estado"
            options={statusOptions}
            value={status}
            onChange={setStatus}
          />
          <Select
            label="Prioridad"
            options={priorityOptions}
            value={priority}
            onChange={setPriority}
          />
        </div>

        {/* Owner */}
        <Select
          label="Responsable"
          options={ownerOptions}
          value={ownerId}
          onChange={setOwnerId}
          placeholder="Sin asignar"
        />

        {/* Colour presets */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                aria-label={`Color ${preset}`}
                aria-pressed={color === preset}
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  color === preset
                    ? 'ring-2 ring-offset-2 ring-offset-bg-secondary ring-white scale-110'
                    : 'hover:scale-105'
                )}
                style={{ backgroundColor: preset }}
              >
                {color === preset && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

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
              Fecha objetivo
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => { setTargetDate(e.target.value); setDateError(null) }}
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
          {submitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Epica'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
