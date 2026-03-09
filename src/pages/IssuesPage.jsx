import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus, LayoutGrid, List } from 'lucide-react'
import { IssueCard, IssueCardCompact, NewIssueModal } from '../components/issue'
import { Button, Input, EmptyState, useToast } from '../components/ui'
import { useIssues, useIssueStats } from '../hooks'
import { useAuth } from '../context/AuthContext'
import { fullName } from '../utils/helpers'
import clsx from 'clsx'

const statusFilters = [
  { value: 'all', label: 'Todos', color: 'bg-text-muted' },
  { value: 'open', label: 'Abiertos', color: 'bg-status-open' },
  { value: 'in_review', label: 'En Revision', color: 'bg-status-in-review' },
  { value: 'rejected', label: 'Rechazados', color: 'bg-status-rejected' },
  { value: 'approved', label: 'Aprobados', color: 'bg-status-approved' },
  { value: 'tech_debt', label: 'Deuda Tecnica', color: 'bg-status-tech-debt' },
]

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function IssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const searchQuery = useDebounce(searchInput)
  const statusFilter = searchParams.get('status') || 'all'
  const [viewMode, setViewMode] = useState('grid')
  const [showNewIssueModal, setShowNewIssueModal] = useState(false)
  const toast = useToast()
  const { hasPermission } = useAuth()
  const { stats, loading: statsLoading } = useIssueStats()

  const setStatusFilter = useCallback((value) => {
    setSearchParams(value === 'all' ? {} : { status: value }, { replace: true })
  }, [setSearchParams])

  // Build API filters
  const apiFilters = useMemo(() => {
    const filters = {}
    if (statusFilter !== 'all') filters.status = statusFilter
    if (searchQuery.trim()) filters.search = searchQuery.trim()
    return filters
  }, [statusFilter, searchQuery])

  const { issues, loading, createIssue, refetch } = useIssues(apiFilters)

  const handleNewIssue = async (data) => {
    try {
      await createIssue(data)
      toast.success('Issue creado correctamente')
      setShowNewIssueModal(false)
    } catch (err) {
      toast.error(err.message || 'Error al crear el issue')
    }
  }

  const getStatCount = (filterValue) => {
    if (!stats) return 0
    if (filterValue === 'all') return stats.total
    return stats[filterValue] ?? 0
  }

  return (
    <div className="space-y-6">
      {/* New Issue Modal */}
      <NewIssueModal
        isOpen={showNewIssueModal}
        onClose={() => setShowNewIssueModal(false)}
        onSubmit={handleNewIssue}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Issues</h1>
          <p className="text-text-secondary mt-1">
            {issues.length} issues{statusFilter !== 'all' ? ` (${statusFilters.find(f => f.value === statusFilter)?.label})` : ''}
          </p>
        </div>
        {hasPermission('create_dev') && (
          <Button icon={Plus} onClick={() => setShowNewIssueModal(true)}>
            Nuevo Issue
          </Button>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Buscar por titulo, descripcion o desarrollador..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-secondary border border-border-primary">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'grid'
                ? 'bg-accent-blue text-white'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'list'
                ? 'bg-accent-blue text-white'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <List className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const count = getStatCount(filter.value)

          return (
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
              {!statsLoading && <span className="text-text-muted">({count})</span>}
            </motion.button>
          )
        })}
      </div>

      {/* Issues list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          icon="search"
          title="No se encontraron issues"
          description="Intenta con otros filtros o terminos de busqueda"
          action="Crear nuevo issue"
          onAction={() => setShowNewIssueModal(true)}
        />
      ) : viewMode === 'grid' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {issues.map((issue, index) => (
            <IssueCard key={issue.id} issue={issue} index={index} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border-primary bg-bg-secondary divide-y divide-border-primary overflow-hidden"
        >
          {issues.map((issue, index) => (
            <IssueCardCompact key={issue.id} issue={issue} index={index} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
