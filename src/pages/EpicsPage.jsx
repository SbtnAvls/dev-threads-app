import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus } from 'lucide-react'
import { EpicCard, EpicFormModal } from '../components/epic'
import { Button, Input, EmptyState, useToast } from '../components/ui'
import { useEpics, useDebounce } from '../hooks'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'

const statusFilters = [
  { value: 'all', label: 'Todas', color: 'bg-text-muted' },
  { value: 'planning', label: 'Planificacion', color: 'bg-accent-blue' },
  { value: 'active', label: 'Activas', color: 'bg-status-approved' },
  { value: 'completed', label: 'Completadas', color: 'bg-purple-400' },
  { value: 'cancelled', label: 'Canceladas', color: 'bg-status-rejected' },
]

export function EpicsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const statusFilter = searchParams.get('status') || 'all'
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingEpic, setEditingEpic] = useState(null)
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

  const { epics, loading, createEpic, updateEpic, deleteEpic } = useEpics(apiFilters)

  // Count by status from loaded epics (for pills)
  const getCounts = (statusValue) => {
    if (statusValue === 'all') return epics.length
    return epics.filter(e => e.status === statusValue).length
  }

  const handleCreate = async (data) => {
    try {
      await createEpic(data)
      toast.success('Epica creada correctamente')
      setShowFormModal(false)
    } catch (err) {
      toast.error(err.message || 'Error al crear la epica')
      throw err
    }
  }

  const handleEdit = (epic) => {
    setEditingEpic(epic)
    setShowFormModal(true)
  }

  const handleUpdate = async (data) => {
    try {
      await updateEpic(editingEpic.id, data)
      toast.success('Epica actualizada correctamente')
      setEditingEpic(null)
      setShowFormModal(false)
    } catch (err) {
      toast.error(err.message || 'Error al actualizar la epica')
      throw err
    }
  }

  const handleDelete = async (epic) => {
    if (!confirm(`Eliminar epica "${epic.name}"? Los issues asociados quedaran sin epica.`)) return
    try {
      await deleteEpic(epic.id, 'unlink')
      toast.success('Epica eliminada correctamente')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar la epica')
    }
  }

  const handleCloseModal = () => {
    setShowFormModal(false)
    setEditingEpic(null)
  }

  const canManageEpics = hasPermission('manage_epics')

  return (
    <div className="space-y-6">
      {/* Form Modal */}
      <EpicFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        onSubmit={editingEpic ? handleUpdate : handleCreate}
        epic={editingEpic}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Epicas</h1>
          <p className="text-text-secondary mt-1">
            {epics.length} epica{epics.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' ? ` (${statusFilters.find(f => f.value === statusFilter)?.label})` : ''}
          </p>
        </div>
        {canManageEpics && (
          <Button icon={Plus} onClick={() => setShowFormModal(true)}>
            Nueva Epica
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Buscar epicas por nombre..."
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

      {/* Epic list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : epics.length === 0 ? (
        <EmptyState
          icon="default"
          title="No se encontraron epicas"
          description={statusFilter !== 'all' || searchInput
            ? 'Intenta con otros filtros o terminos de busqueda'
            : 'Crea tu primera epica para organizar el alcance del equipo'
          }
          action={canManageEpics ? 'Crear nueva epica' : undefined}
          onAction={canManageEpics ? () => setShowFormModal(true) : undefined}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {epics.map((epic, index) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              index={index}
              onEdit={canManageEpics ? handleEdit : undefined}
              onDelete={canManageEpics ? handleDelete : undefined}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
