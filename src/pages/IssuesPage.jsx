import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus, LayoutGrid, List, Sparkles } from 'lucide-react'
import { IssueCard, IssueCardCompact, NewIssueModal } from '../components/issue'
import { SprintAIGenerateModal } from '../components/sprint'
import { Button, Input, Select, EmptyState, useToast } from '../components/ui'
import { useIssues, useIssueStats, useSprints, useDevelopers, useDebounce, useComplexityLevels } from '../hooks'
import { useAuth } from '../context/AuthContext'
import { fullName } from '../utils/helpers'
import orgService from '../services/orgService'
import githubService from '../services/githubService'
import clsx from 'clsx'

const statusFilters = [
  { value: 'all', label: 'Todos', color: 'bg-text-muted' },
  { value: 'open', label: 'Abiertos', color: 'bg-status-open' },
  { value: 'in_review', label: 'En Revision', color: 'bg-status-in-review' },
  { value: 'rejected', label: 'Rechazados', color: 'bg-status-rejected' },
  { value: 'approved', label: 'Aprobados', color: 'bg-status-approved' },
  { value: 'tech_debt', label: 'Deuda Tecnica', color: 'bg-status-tech-debt' },
]

export function IssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const searchQuery = useDebounce(searchInput)
  const statusFilter = searchParams.get('status') || 'all'
  const sprintFilter = searchParams.get('sprint') || 'all'
  const assigneeFilter = searchParams.get('assignee') || 'all'
  const complexityFilter = searchParams.get('complexity') || 'all'
  const [viewMode, setViewMode] = useState('grid')
  const [showNewIssueModal, setShowNewIssueModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [hasGeminiToken, setHasGeminiToken] = useState(null)
  const toast = useToast()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  // Check if Gemini is configured
  useEffect(() => {
    let cancelled = false
    orgService.getGeminiTokenStatus()
      .then(data => { if (!cancelled) setHasGeminiToken(data.has_token) })
      .catch(() => { if (!cancelled) setHasGeminiToken(false) })
    return () => { cancelled = true }
  }, [])
  const { stats, loading: statsLoading } = useIssueStats()

  // Load sprints, developers, and complexity levels for filter dropdowns
  const { sprints: allSprints } = useSprints({})
  const { developers } = useDevelopers()
  const { levels: complexityLevels } = useComplexityLevels()

  const assigneeOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'Todos los miembros' }]
    if (developers && developers.length > 0) {
      developers.forEach(d => options.push({ value: String(d.id), label: fullName(d) }))
    }
    return options
  }, [developers])

  const complexityOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Todas las complejidades' },
      { value: 'none', label: 'Sin complejidad' },
    ]
    if (complexityLevels.length > 0) {
      complexityLevels.forEach(l => options.push({
        value: String(l.id),
        label: `${l.label} (${l.value} pts)`,
      }))
    }
    return options
  }, [complexityLevels])

  const sprintOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Todos los sprints' },
      { value: 'none', label: 'Backlog (sin sprint)' },
    ]
    if (allSprints && allSprints.length > 0) {
      allSprints
        .filter(s => s.status === 'active' || s.status === 'planning')
        .forEach(s => options.push({ value: String(s.id), label: s.name }))
    }
    return options
  }, [allSprints])

  const buildParams = useCallback((overrides = {}) => {
    const current = { status: statusFilter, sprint: sprintFilter, assignee: assigneeFilter, complexity: complexityFilter }
    const merged = { ...current, ...overrides }
    const params = {}
    if (merged.status !== 'all') params.status = merged.status
    if (merged.sprint !== 'all') params.sprint = merged.sprint
    if (merged.assignee !== 'all') params.assignee = merged.assignee
    if (merged.complexity !== 'all') params.complexity = merged.complexity
    return params
  }, [statusFilter, sprintFilter, assigneeFilter, complexityFilter])

  const setStatusFilter = useCallback((value) => {
    setSearchParams(buildParams({ status: value }), { replace: true })
  }, [setSearchParams, buildParams])

  const setSprintFilter = useCallback((value) => {
    setSearchParams(buildParams({ sprint: value }), { replace: true })
  }, [setSearchParams, buildParams])

  const setAssigneeFilter = useCallback((value) => {
    setSearchParams(buildParams({ assignee: value }), { replace: true })
  }, [setSearchParams, buildParams])

  const setComplexityFilter = useCallback((value) => {
    setSearchParams(buildParams({ complexity: value }), { replace: true })
  }, [setSearchParams, buildParams])

  // Build API filters
  const apiFilters = useMemo(() => {
    const filters = {}
    if (statusFilter !== 'all') filters.status = statusFilter
    if (searchQuery.trim()) filters.search = searchQuery.trim()
    if (sprintFilter !== 'all') filters.sprint = sprintFilter
    if (assigneeFilter !== 'all') filters.assigned_to = assigneeFilter
    if (complexityFilter !== 'all') filters.complexity = complexityFilter
    return filters
  }, [statusFilter, searchQuery, sprintFilter, assigneeFilter, complexityFilter])

  const { issues: rawIssues, loading, createIssue, refetch } = useIssues(apiFilters)

  // Client-side search fallback: filter locally by title, description, and assignee name
  const issues = useMemo(() => {
    if (!searchQuery.trim()) return rawIssues
    const q = searchQuery.trim().toLowerCase()
    return rawIssues.filter(issue => {
      const title = (issue.title || '').toLowerCase()
      const desc = (issue.description || '').toLowerCase()
      const assignee = issue.assigned_to
        ? fullName(issue.assigned_to).toLowerCase()
        : ''
      return title.includes(q) || desc.includes(q) || assignee.includes(q)
    })
  }, [rawIssues, searchQuery])

  const handleNewIssue = async (data) => {
    try {
      const { repo_ids, ...issueData } = data
      const newIssue = await createIssue(issueData)

      // Link repos if any were selected
      let linkFailed = false
      if (repo_ids && repo_ids.length > 0 && newIssue?.id) {
        try {
          await githubService.linkRepos(newIssue.id, repo_ids)
        } catch {
          linkFailed = true
          toast.warning('Issue creado, pero hubo un error al vincular repositorios')
        }
      }

      if (!linkFailed) {
        toast.success('Issue creado correctamente')
      }
    } catch (err) {
      toast.error(err.message || 'Error al crear el issue')
      throw err // Re-throw so modal knows it failed and stays open
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

      {/* AI Generate Sprint Modal */}
      <SprintAIGenerateModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSuccess={() => {
          toast.success('Sprints creados exitosamente con AI')
          refetch()
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Issues</h1>
          <p className="text-text-secondary mt-1">
            {issues.length} issues{statusFilter !== 'all' ? ` (${statusFilters.find(f => f.value === statusFilter)?.label})` : ''}{sprintFilter !== 'all' ? ` - ${sprintOptions.find(o => o.value === sprintFilter)?.label || 'Sprint'}` : ''}
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

        {/* Assignee filter */}
        <div className="w-full sm:w-52">
          <Select
            options={assigneeOptions}
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            placeholder="Asignado a..."
          />
        </div>

        {/* Sprint filter */}
        <div className="w-full sm:w-52">
          <Select
            options={sprintOptions}
            value={sprintFilter}
            onChange={setSprintFilter}
            placeholder="Sprint..."
          />
        </div>

        {/* Complexity filter */}
        {complexityLevels.length > 0 && (
          <div className="w-full sm:w-52">
            <Select
              options={complexityOptions}
              value={complexityFilter}
              onChange={setComplexityFilter}
              placeholder="Complejidad..."
            />
          </div>
        )}

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
      <div className="flex items-center justify-between gap-4">
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

        {hasPermission('manage_sprints') && hasGeminiToken && (
          <Button
            variant="secondary"
            icon={Sparkles}
            onClick={() => setShowAIModal(true)}
            className="!border-purple-500/30 !text-purple-400 hover:!bg-purple-500/10 shrink-0"
          >
            Generar sprint con AI
          </Button>
        )}
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
