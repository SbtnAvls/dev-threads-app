import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tag, X, Github, Lock, Unlock, Loader2 } from 'lucide-react'
import { Modal, ModalFooter, Button, Input, Textarea, Select, Avatar } from '../ui'
import { useDevelopers, useComplexityLevels } from '../../hooks'
import { fullName } from '../../utils/helpers'
import githubService from '../../services/githubService'

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
  const [complexityId, setComplexityId] = useState('')
  const [selectedRepos, setSelectedRepos] = useState(new Set())
  const [orgRepos, setOrgRepos] = useState([])
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState(false)
  const { developers } = useDevelopers()
  const { levels: complexityLevels, loading: complexityLoading } = useComplexityLevels({ enabled: isOpen })

  // Load org repos when modal opens
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const loadRepos = async () => {
      setReposLoading(true)
      setReposError(false)
      try {
        const data = await githubService.getRepos({ active: 'true' })
        if (!cancelled) setOrgRepos(data.results || data)
      } catch {
        if (!cancelled) { setOrgRepos([]); setReposError(true) }
      } finally {
        if (!cancelled) setReposLoading(false)
      }
    }
    loadRepos()
    return () => { cancelled = true }
  }, [isOpen])

  const developerOptions = developers.map(d => ({
    value: String(d.id),
    label: fullName(d),
  }))

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !assignedTo || submitting) return

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        assigned_to_id: Number(assignedTo),
        priority,
        tags,
        repo_ids: [...selectedRepos],
      }
      if (complexityId) payload.complexity_id = Number(complexityId)
      await onSubmit?.(payload)
      // Only close/reset on success — parent controls the close
      handleClose()
    } catch {
      // Error handled by parent via toast — keep form open
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setAssignedTo('')
    setPriority('medium')
    setComplexityId('')
    setTags([])
    setCustomTag('')
    setSelectedRepos(new Set())
    onClose()
  }

  const toggleTag = (tag) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const toggleRepo = (repoId) => {
    setSelectedRepos(prev => {
      const next = new Set(prev)
      next.has(repoId) ? next.delete(repoId) : next.add(repoId)
      return next
    })
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

        {/* Assignee, Priority, and Complexity row */}
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

        {/* Complexity */}
        {complexityLoading ? (
          <div className="flex items-center gap-2 py-1 text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Cargando niveles de complejidad...</span>
          </div>
        ) : complexityLevels.length > 0 && (
          <Select
            label="Complejidad"
            options={[
              { value: '', label: 'Sin complejidad' },
              ...complexityLevels.map(l => ({
                value: String(l.id),
                label: `${l.label} (${l.value} pts)`,
              })),
            ]}
            value={complexityId}
            onChange={setComplexityId}
            placeholder="Seleccionar complejidad"
          />
        )}

        {/* GitHub Repos */}
        {(orgRepos.length > 0 || reposLoading || reposError) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary flex items-center gap-1.5">
              <Github className="w-4 h-4" />
              Repositorios
              <span className="text-text-muted font-normal">(opcional)</span>
            </label>
            {reposLoading ? (
              <div className="flex items-center gap-2 py-3 text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Cargando repositorios...</span>
              </div>
            ) : reposError ? (
              <p className="text-xs text-text-muted py-2">
                No se pudieron cargar los repositorios
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border-primary p-1.5 space-y-0.5">
                {orgRepos.map(repo => (
                  <label
                    key={repo.id}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                      selectedRepos.has(repo.id)
                        ? 'bg-accent-blue/10 border border-accent-blue/20'
                        : 'hover:bg-bg-elevated border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRepos.has(repo.id)}
                      onChange={() => toggleRepo(repo.id)}
                      className="rounded border-border-primary text-accent-blue focus:ring-accent-blue"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      {repo.private ? (
                        <Lock className="w-3 h-3 text-text-muted flex-shrink-0" />
                      ) : (
                        <Unlock className="w-3 h-3 text-text-muted flex-shrink-0" />
                      )}
                      <span className="text-sm text-text-primary truncate">{repo.full_name}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {selectedRepos.size > 0 && (
              <p className="text-xs text-text-muted">
                {selectedRepos.size} {selectedRepos.size === 1 ? 'repositorio seleccionado' : 'repositorios seleccionados'}
              </p>
            )}
          </div>
        )}

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
        <Button onClick={handleSubmit} disabled={!isValid || submitting}>
          {submitting ? 'Creando...' : 'Crear Issue'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
