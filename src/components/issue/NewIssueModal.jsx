import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bug, Tag, X } from 'lucide-react'
import { Modal, ModalFooter, Button, Input, Textarea, Select, Avatar } from '../ui'
import { useDevelopers } from '../../hooks'
import { fullName } from '../../utils/helpers'

const priorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
]

const commonTags = ['frontend', 'backend', 'api', 'autenticacion', 'interfaz', 'rendimiento', 'error', 'funcionalidad']

export function NewIssueModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState('medium')
  const [tags, setTags] = useState([])
  const [customTag, setCustomTag] = useState('')
  const { developers } = useDevelopers()

  const developerOptions = developers.map(d => ({
    value: String(d.id),
    label: fullName(d),
  }))

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !assignedTo) return

    onSubmit?.({
      title: title.trim(),
      description: description.trim(),
      assigned_to_id: Number(assignedTo),
      priority,
      tags,
    })

    handleClose()
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setAssignedTo('')
    setPriority('medium')
    setTags([])
    setCustomTag('')
    onClose()
  }

  const toggleTag = (tag) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim().toLowerCase())) {
      setTags(prev => [...prev, customTag.trim().toLowerCase()])
      setCustomTag('')
    }
  }

  const selectedDev = developers.find(d => String(d.id) === assignedTo)
  const isValid = title.trim() && description.trim() && assignedTo

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo Issue"
      description="Crea un nuevo issue para el equipo"
      size="lg"
    >
      <div className="space-y-5">
        {/* Icon header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center -mt-2 mb-4"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent-blue to-purple-600">
            <Bug className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <Input
          label="Titulo"
          placeholder="Ej: Error en validacion del formulario de login"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Description */}
        <Textarea
          label="Descripcion"
          placeholder="Describe el problema o la funcionalidad que necesita revision..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        {/* Assignee and Priority row */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Asignar a"
            options={developerOptions}
            value={assignedTo}
            onChange={setAssignedTo}
            placeholder="Seleccionar desarrollador"
          />
          <Select
            label="Prioridad"
            options={priorityOptions}
            value={priority}
            onChange={setPriority}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            Etiquetas
          </label>
          <div className="flex flex-wrap gap-2">
            {commonTags.map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tags.includes(tag)
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg-elevated text-text-secondary hover:bg-bg-hover'
                }`}
              >
                #{tag}
              </motion.button>
            ))}
          </div>

          {/* Custom tag input */}
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Etiqueta personalizada..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
              className="flex-1"
            />
            <Button variant="secondary" onClick={addCustomTag} disabled={!customTag.trim()}>
              Agregar
            </Button>
          </div>

          {/* Selected tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm bg-accent-blue/20 text-accent-blue"
                >
                  #{tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="p-0.5 rounded hover:bg-accent-blue/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Preview of assigned dev */}
        {selectedDev && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-bg-elevated border border-border-primary"
          >
            <p className="text-xs text-text-muted mb-2">Asignado a:</p>
            <div className="flex items-center gap-3">
              <Avatar
                name={fullName(selectedDev)}
                size="sm"
              />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {fullName(selectedDev)}
                </p>
                <p className="text-xs text-text-muted">
                  {selectedDev.email}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid}>
          Crear Issue
        </Button>
      </ModalFooter>
    </Modal>
  )
}
