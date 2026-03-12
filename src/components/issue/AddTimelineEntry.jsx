import { useState, useEffect, useCallback, useRef } from 'react'
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
  Send,
  GitBranch,
  Loader2,
  Github,
  Search,
  Shield,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'
import { Button, Input, Textarea } from '../ui'
import { useAuth } from '../../context/AuthContext'
import githubService from '../../services/githubService'

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
    description: 'Marcar el issue como aprobado',
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
  approval: 'approve_dev',
  rejection: 'reject_dev',
  tech_debt: 'mark_tech_debt',
}

export function AddTimelineEntry({ onAdd, currentStatus, repos = [] }) {
  const { hasPermission } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [content, setContent] = useState('')
  const [commitHash, setCommitHash] = useState('')
  const [branch, setBranch] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [techDebtDate, setTechDebtDate] = useState('')

  // Commit selector state
  const [selectedRepoId, setSelectedRepoId] = useState('')
  const [branches, setBranches] = useState([])
  const [commits, setCommits] = useState([])
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [commitsLoading, setCommitsLoading] = useState(false)
  const [selectedCommit, setSelectedCommit] = useState(null)
  const [branchSearch, setBranchSearch] = useState('')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const branchDropdownRef = useRef(null)

  const hasRepos = repos.length > 0

  // Close branch dropdown on click outside
  useEffect(() => {
    if (!branchDropdownOpen) return
    const handleClick = (e) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false)
        setBranchSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [branchDropdownOpen])

  // Auto-select repo if only one (only when commit type is selected)
  useEffect(() => {
    if (selectedType !== 'commit') return
    if (hasRepos && repos.length === 1 && !selectedRepoId) {
      setSelectedRepoId(String(repos[0].id))
    }
  }, [hasRepos, repos, selectedRepoId, selectedType])

  // Load branches when repo selected (only for commit type)
  useEffect(() => {
    if (selectedType !== 'commit' || !hasRepos) return
    if (!selectedRepoId) { setBranches([]); setBranch(''); return }
    let cancelled = false
    const load = async () => {
      setBranchesLoading(true)
      setBranches([])
      setBranch('')
      setCommits([])
      setCommitHash('')
      setSelectedCommit(null)
      try {
        const data = await githubService.getBranches(selectedRepoId)
        if (!cancelled) setBranches(data.results || data)
      } catch {
        if (!cancelled) setBranches([])
      } finally {
        if (!cancelled) setBranchesLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedRepoId, selectedType, hasRepos])

  // Load commits when branch selected (only for commit type with repos)
  useEffect(() => {
    if (selectedType !== 'commit' || !hasRepos) return
    if (!selectedRepoId || !branch) { setCommits([]); setCommitHash(''); setSelectedCommit(null); return }
    let cancelled = false
    const load = async () => {
      setCommitsLoading(true)
      setCommits([])
      setCommitHash('')
      setSelectedCommit(null)
      try {
        const data = await githubService.searchCommits(selectedRepoId, { branch })
        if (!cancelled) setCommits(data.results || data)
      } catch {
        if (!cancelled) setCommits([])
      } finally {
        if (!cancelled) setCommitsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedRepoId, branch, selectedType, hasRepos])

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
      // Build real commit URL and repo name from the selected repo
      const repo = repos.find(r => String(r.id) === String(selectedRepoId))
      if (repo) {
        entry.metadata.repo_name = repo.full_name
        entry.metadata.commit_url = commitHash
          ? `https://github.com/${repo.full_name}/commit/${commitHash}`
          : null
      } else {
        entry.metadata.commit_url = null
      }
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
    setSelectedRepoId(repos.length === 1 ? String(repos[0].id) : '')
    setBranches([])
    setCommits([])
    setSelectedCommit(null)
    setBranchSearch('')
    setBranchDropdownOpen(false)
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
                    hasRepos ? (
                      <div className="space-y-3">
                        {/* Repo selector (only if multiple) */}
                        {repos.length > 1 && (
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                              Repositorio
                            </label>
                            <select
                              value={selectedRepoId}
                              onChange={e => setSelectedRepoId(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
                            >
                              <option value="">Seleccionar repositorio</option>
                              {repos.map(r => (
                                <option key={r.id} value={String(r.id)}>{r.full_name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Branch selector with search */}
                        <div className="relative" ref={branchDropdownRef}>
                          <label className="block text-sm font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5" />
                            Rama
                          </label>
                          {branchesLoading ? (
                            <div className="flex items-center gap-2 py-2.5 px-4 text-text-muted">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-xs">Cargando branches...</span>
                            </div>
                          ) : !selectedRepoId ? (
                            <p className="text-xs text-text-muted py-2 px-4">Selecciona un repo primero</p>
                          ) : (
                            <>
                              {/* Trigger button */}
                              <button
                                type="button"
                                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                                className={clsx(
                                  'w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-all text-left',
                                  branchDropdownOpen
                                    ? 'border-accent-blue bg-bg-primary'
                                    : 'border-border-primary bg-bg-primary hover:border-border-secondary',
                                  !branch && 'text-text-muted'
                                )}
                              >
                                <span className={clsx('truncate', branch ? 'font-mono text-text-primary' : '')}>
                                  {branch || 'Seleccionar branch'}
                                </span>
                                <ChevronDown className={clsx(
                                  'w-4 h-4 text-text-muted flex-shrink-0 transition-transform',
                                  branchDropdownOpen && 'rotate-180'
                                )} />
                              </button>

                              {/* Dropdown */}
                              {branchDropdownOpen && (
                                <div className="absolute z-20 mt-1 w-full rounded-lg border border-border-primary bg-bg-elevated shadow-xl overflow-hidden">
                                  {/* Search input */}
                                  <div className="p-2 border-b border-border-primary">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                                      <input
                                        type="text"
                                        value={branchSearch}
                                        onChange={e => setBranchSearch(e.target.value)}
                                        placeholder="Buscar branch..."
                                        autoFocus
                                        className="w-full pl-8 pr-3 py-2 rounded-md border border-border-primary bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
                                      />
                                    </div>
                                  </div>

                                  {/* Branch list */}
                                  <div className="max-h-48 overflow-y-auto">
                                    {branches
                                      .filter(b => !branchSearch || b.name.toLowerCase().includes(branchSearch.toLowerCase()))
                                      .map(b => (
                                        <button
                                          key={b.name}
                                          type="button"
                                          onClick={() => {
                                            setBranch(b.name)
                                            setBranchDropdownOpen(false)
                                            setBranchSearch('')
                                          }}
                                          className={clsx(
                                            'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                                            branch === b.name
                                              ? 'bg-accent-blue/10 text-accent-blue'
                                              : 'hover:bg-bg-hover text-text-primary'
                                          )}
                                        >
                                          <GitBranch className="w-3 h-3 flex-shrink-0 text-text-muted" />
                                          <span className="text-xs font-mono truncate">{b.name}</span>
                                          {b.is_default && (
                                            <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] bg-accent-blue/20 text-accent-blue font-medium flex-shrink-0">
                                              default
                                            </span>
                                          )}
                                          {b.protected && (
                                            <Shield className="w-3 h-3 text-status-in-review flex-shrink-0" />
                                          )}
                                        </button>
                                      ))
                                    }
                                    {branches.filter(b => !branchSearch || b.name.toLowerCase().includes(branchSearch.toLowerCase())).length === 0 && (
                                      <p className="text-xs text-text-muted text-center py-3">
                                        No se encontraron branches
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Commit selector */}
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                            <GitCommit className="w-3.5 h-3.5" />
                            Commit
                          </label>
                          {commitsLoading ? (
                            <div className="flex items-center gap-2 py-2.5 px-4 text-text-muted">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-xs">Cargando commits...</span>
                            </div>
                          ) : commits.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-border-primary divide-y divide-border-primary">
                              {commits.map(c => (
                                <button
                                  key={c.sha}
                                  type="button"
                                  onClick={() => {
                                    setCommitHash(c.sha)
                                    setSelectedCommit(c)
                                    if (!content.trim()) setContent(c.message || '')
                                  }}
                                  className={clsx(
                                    'w-full text-left px-3 py-2.5 transition-colors',
                                    commitHash === c.sha
                                      ? 'bg-accent-blue/10'
                                      : 'hover:bg-bg-elevated'
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    <code className="text-[11px] font-mono text-status-tech-debt flex-shrink-0 mt-0.5">
                                      {c.short_sha}
                                    </code>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-text-primary truncate">
                                        {c.message}
                                      </p>
                                      <p className="text-[10px] text-text-muted mt-0.5">
                                        {c.author_login || c.author_name}
                                        {c.date && ` · ${new Date(c.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : branch ? (
                            <p className="text-xs text-text-muted py-2 px-4">
                              No se encontraron commits en esta rama
                            </p>
                          ) : (
                            <p className="text-xs text-text-muted py-2 px-4">
                              Selecciona una rama para ver los commits
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Fallback: text inputs when no repos linked */
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-status-tech-debt/5 border border-status-tech-debt/10">
                          <Github className="w-4 h-4 text-text-muted flex-shrink-0" />
                          <p className="text-xs text-text-muted">
                            Vincula repositorios al issue para seleccionar branches y commits directamente.
                          </p>
                        </div>
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
                      </div>
                    )
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
