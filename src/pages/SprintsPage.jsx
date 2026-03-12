import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus } from 'lucide-react'
import { SprintCard, SprintFormModal } from '../components/sprint'
import { Button, Input, EmptyState, useToast } from '../components/ui'
import { useSprints, useDebounce } from '../hooks'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'

const statusFilters = [
  { value: 'all', label: 'Todos', color: 'bg-text-muted' },
  { value: 'planning', label: 'Planificacion', color: 'bg-accent-blue' },
  { value: 'active', label: 'Activos', color: 'bg-status-approved' },
  { value: 'completed', label: 'Completados', color: 'bg-purple-400' },
  { value: 'cancelled', label: 'Cancelados', color: 'bg-status-rejected' },
]

export function SprintsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const statusFilter = searchParams.get('status') || 'all'
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingSprint, setEditingSprint] = useState(null)
  const toast = useToast()
  const { hasPermission } = useAuth()

  const setStatusFilter = useCallback((value) => {
    setSearchParams(value === 'all' ? {} : { status: value }, { replace: true })
  }, [setSearchParams])

  const searchQuery = useDebounce(searchInput)

  // Build API filters
  const apiFilters = useMemo(() => {
    const filters = {}
    if (statusFilter !== 'all') filters.status = statusFilter
    if (searchQuery.trim()) filters.search = searchQuery.trim()
    return filters
  }, [statusFilter, searchQuery])

  const { sprints, loading, createSprint, updateSprint, deleteSprint } = useSprints(apiFilters)

  // Count by status from loaded sprints (for pills)
  const getCounts = (statusValue) => {
    if (statusValue === 'all') return sprints.length
    return sprints.filter(s => s.status === statusValue).length
  }

  const handleCreate = async (data) => {
    try {
      await createSprint(data)
      toast.success('Sprint creado correctamente')
      setShowFormModal(false)
    } catch (err) {
      toast.error(err.message || 'Error al crear el sprint')
      throw err
    }
  }

  const handleEdit = (sprint) => {
    setEditingSprint(sprint)
    setShowFormModal(true)
  }

  const handleUpdate = async (data) => {
    try {
      await updateSprint(editingSprint.id, data)
      toast.success('Sprint actualizado correctamente')
      setEditingSprint(null)
      setShowFormModal(false)
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el sprint')
      throw err
    }
  }

  const handleDelete = async (sprint) => {
    if (!confirm(`Eliminar sprint "${sprint.name}"? Los issues asociados volveran al backlog.`)) return
    try {
      await deleteSprint(sprint.id, 'unlink')
      toast.success('Sprint eliminado correctamente')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar el sprint')
    }
  }

  const handleCloseModal = () => {
    setShowFormModal(false)
    setEditingSprint(null)
  }

  const canManageSprints = hasPermission('manage_sprints')

  return (
    <div className="space-y-6">
      {/* Form Modal */}
      <SprintFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        onSubmit={editingSprint ? handleUpdate : handleCreate}
        sprint={editingSprint}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sprints</h1>
          <p className="text-text-secondary mt-1">
            {sprints.length} sprint{sprints.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' ? ` (${statusFilters.find(f => f.value === statusFilter)?.label})` : ''}
          </p>
        </div>
        {canManageSprints && (
          <Button icon={Plus} onClick={() => setShowFormModal(true)}>
            Nuevo Sprint
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Buscar sprints por nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <motion.button
            key={filter.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter(filter.value)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              statusFilter === filter.value
                ? 'bg-bg-elevated border-2 border-accent-blue text-text-primary'
                : 'bg-bg-secondary border border-border-primary text-text-secondary hover:border-border-secondary'
            )}
          >
            <span className={clsx('w-2 h-2 rounded-full', filter.color)} />
            {filter.label}
            {statusFilter === 'all' && (
              <span className="text-text-muted">({getCounts(filter.value)})</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Sprint list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sprints.length === 0 ? (
        <EmptyState
          icon="default"
          title="No se encontraron sprints"
          description={statusFilter !== 'all' || searchInput
            ? 'Intenta con otros filtros o terminos de busqueda'
            : 'Crea tu primer sprint para organizar los issues del equipo'
          }
          action={canManageSprints ? 'Crear nuevo sprint' : undefined}
          onAction={canManageSprints ? () => setShowFormModal(true) : undefined}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {sprints.map((sprint, index) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              index={index}
              onEdit={canManageSprints ? handleEdit : undefined}
              onDelete={canManageSprints ? handleDelete : undefined}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
