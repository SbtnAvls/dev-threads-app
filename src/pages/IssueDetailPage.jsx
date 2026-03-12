import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  Share2,
  Github,
  GitPullRequest,
  ExternalLink,
  Plus,
  X,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
  Check,
  Link2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Timeline, AddTimelineEntry } from '../components/issue'
import { Button, Avatar, StatusBadge, PriorityBadge, Card, Modal, ModalFooter, Input, Textarea, Select, Confetti, useToast } from '../components/ui'
import { useIssueDetail, useTimeline, useAuth, useDevelopers } from '../hooks'
import { fullName, parseDate } from '../utils/helpers'
import { useState, useEffect, useCallback } from 'react'
import githubService from '../services/githubService'
import issueService from '../services/issueService'

export function IssueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { issue, loading, error, refetch: refetchIssue } = useIssueDetail(id)
  const { entries, addEntry, refetch: refetchTimeline } = useTimeline(id)
  const { hasPermission, isOrgAdmin } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showLinkReposModal, setShowLinkReposModal] = useState(false)
  const [showCreatePRModal, setShowCreatePRModal] = useState(null) // repo object or null
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  // Permission checks
  const canDelete = isOrgAdmin || hasPermission('close_dev')

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Issue no encontrado</h1>
        <p className="text-text-secondary mb-4">{error || 'El issue que buscas no existe'}</p>
        <Link to="/issues">
          <Button variant="secondary" icon={ArrowLeft}>
            Volver a Issues
          </Button>
        </Link>
      </div>
    )
  }

  const assigneeName = fullName(issue.assigned_to)
  const creatorName = fullName(issue.created_by)
  const createdAt = parseDate(issue.created_at)
  const updatedAt = parseDate(issue.updated_at)
  const dueDate = parseDate(issue.due_date)

  // Use timeline from the detail endpoint or from the separate timeline hook
  const timelineEntries = issue.timeline || entries

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Enlace copiado al portapapeles')
    }).catch(() => {
      toast.error('No se pudo copiar el enlace')
    })
    setShowMenu(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await issueService.deleteIssue(id)
      toast.success('Issue eliminado correctamente')
      navigate('/issues', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Error al eliminar el issue')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleAddEntry = async (entry) => {
    try {
      await addEntry(entry)
      await refetchIssue()

      if (entry.type === 'approval') {
        setShowConfetti(true)
        toast.success('Issue aprobado correctamente')
      } else if (entry.type === 'rejection') {
        toast.warning('Issue rechazado - pendiente de correcciones')
      } else if (entry.type === 'tech_debt') {
        toast.info('Issue marcado como deuda tecnica')
      } else if (entry.type === 'commit') {
        toast.success('Commit vinculado correctamente')
      } else {
        toast.info('Comentario agregado')
      }
    } catch (err) {
      toast.error(err.message || 'Error al agregar entrada')
    }
  }

  return (
    <div className="space-y-6">
      {/* Confetti celebration */}
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Back button */}
      <Link to="/issues" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Issues</span>
      </Link>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Issue details and timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border-primary bg-bg-secondary p-6 relative overflow-hidden"
          >
            {/* Success glow effect when approved */}
            {issue.status === 'approved' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-status-approved/5 to-transparent pointer-events-none"
              />
            )}

            {/* Title row */}
            <div className="flex items-start justify-between gap-4 mb-4 relative">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusSelector
                    currentStatus={issue.status}
                    isOpen={showStatusMenu}
                    onToggle={() => setShowStatusMenu(!showStatusMenu)}
                    onClose={() => setShowStatusMenu(false)}
                    updating={updatingStatus}
                    onChangeStatus={async (newStatus) => {
                      setShowStatusMenu(false)
                      setUpdatingStatus(true)
                      try {
                        await issueService.updateIssue(id, { status: newStatus })
                        await refetchIssue()
                        if (newStatus === 'approved') {
                          setShowConfetti(true)
                          toast.success('Issue aprobado')
                        } else {
                          toast.success('Estado actualizado')
                        }
                      } catch (err) {
                        toast.error(err.message || 'Error al cambiar estado')
                      } finally {
                        setUpdatingStatus(false)
                      }
                    }}
                    hasPermission={hasPermission}
                    isOrgAdmin={isOrgAdmin}
                  />
                  <PriorityBadge priority={issue.priority} />
                </div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {issue.title}
                </h1>
              </div>

              {/* Actions menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg border border-border-primary bg-bg-elevated shadow-xl z-50"
                    >
                      <button
                        onClick={() => { setShowMenu(false); setShowEditModal(true) }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        Compartir
                      </button>
                      {canDelete && (
                        <>
                          <hr className="my-1 border-border-primary" />
                          <button
                            onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-status-rejected hover:bg-status-rejected/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-text-secondary leading-relaxed mb-4">
              {issue.description}
            </p>

            {/* Tags */}
            {issue.tags && issue.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {issue.tags.map((tag) => (
                  <motion.span
                    key={tag}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm bg-bg-elevated text-text-secondary hover:bg-bg-hover cursor-pointer transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Add entry form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AddTimelineEntry onAdd={handleAddEntry} currentStatus={issue.status} repos={issue.github_repos || []} />
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border-primary bg-bg-secondary p-6"
          >
            <Timeline entries={timelineEntries} repos={issue.github_repos || []} />
          </motion.div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-4">
          {/* Assigned to */}
          {issue.assigned_to && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <h3 className="text-sm font-medium text-text-muted mb-3">Asignado a</h3>
                <Link
                  to={`/developer/${issue.assigned_to.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-elevated transition-colors"
                >
                  <Avatar name={assigneeName} size="md" />
                  <div>
                    <p className="font-medium text-text-primary">{assigneeName}</p>
                    <p className="text-sm text-text-muted">{issue.assigned_to.email}</p>
                  </div>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* Created by */}
          {issue.created_by && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <h3 className="text-sm font-medium text-text-muted mb-3">Creado por</h3>
                <Link
                  to={`/developer/${issue.created_by.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-elevated transition-colors"
                >
                  <Avatar name={creatorName} size="md" />
                  <div>
                    <p className="font-medium text-text-primary">{creatorName}</p>
                    <p className="text-sm text-text-muted">{issue.created_by.email}</p>
                  </div>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* Dates */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h3 className="text-sm font-medium text-text-muted mb-3">Fechas</h3>
              <div className="space-y-3">
                {createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-bg-elevated">
                      <Calendar className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Creado</p>
                      <p className="text-sm text-text-primary">
                        {format(createdAt, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                {updatedAt && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-bg-elevated">
                      <Calendar className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Ultima actualizacion</p>
                      <p className="text-sm text-text-primary">
                        {format(updatedAt, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                {dueDate && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-status-tech-debt/10">
                      <Calendar className="w-4 h-4 text-status-tech-debt" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Fecha tentativa</p>
                      <p className="text-sm text-status-tech-debt font-medium">
                        {format(dueDate, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <h3 className="text-sm font-medium text-text-muted mb-3">Estadisticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Eventos" value={timelineEntries.length} />
                <StatBox label="Commits" value={timelineEntries.filter(t => t.type === 'commit').length} />
                <StatBox label="Comentarios" value={timelineEntries.filter(t => t.type === 'comment').length} />
                <StatBox label="Rechazos" value={timelineEntries.filter(t => t.type === 'rejection').length} />
              </div>
            </Card>
          </motion.div>

          {/* GitHub Repos */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card hover={false}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-text-muted flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" />
                  Repositorios
                </h3>
                <button
                  onClick={() => setShowLinkReposModal(true)}
                  className="p-1 rounded-lg text-text-muted hover:text-accent-blue hover:bg-bg-elevated transition-colors"
                  title="Vincular repositorios"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <IssueReposList
                issueId={id}
                repos={issue.github_repos || []}
                onRefresh={refetchIssue}
                onCreatePR={(repo) => setShowCreatePRModal(repo)}
              />
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Link Repos Modal */}
      {showLinkReposModal && (
        <LinkReposModal
          issueId={id}
          linkedRepoIds={(issue.github_repos || []).map(r => r.id)}
          onClose={() => setShowLinkReposModal(false)}
          onLinked={() => { setShowLinkReposModal(false); refetchIssue() }}
        />
      )}

      {/* Create PR Modal */}
      {showCreatePRModal && (
        <CreatePRModal
          repo={showCreatePRModal}
          onClose={() => setShowCreatePRModal(null)}
          onCreated={() => { setShowCreatePRModal(null); toast.success('Pull Request creado') }}
        />
      )}

      {/* Edit Issue Modal */}
      {showEditModal && (
        <EditIssueModal
          issue={issue}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); refetchIssue(); toast.success('Issue actualizado') }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal isOpen onClose={() => !deleting && setShowDeleteConfirm(false)} title="Eliminar Issue" size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20">
              <AlertTriangle className="w-5 h-5 text-status-rejected flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-status-rejected">Esta accion no se puede deshacer</p>
                <p className="text-xs text-text-secondary mt-1">
                  Se eliminara permanentemente el issue <strong>"{issue.title}"</strong> junto con todo su historial de actividad.
                </p>
              </div>
            </div>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-status-rejected hover:bg-status-rejected/80 text-white"
              >
                {deleting ? 'Eliminando...' : 'Eliminar Issue'}
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-3 rounded-lg bg-bg-elevated text-center cursor-default"
    >
      <motion.p
        key={value}
        initial={{ scale: 1.2, color: '#3b82f6' }}
        animate={{ scale: 1, color: '#f0f0f5' }}
        className="text-2xl font-bold"
      >
        {value}
      </motion.p>
      <p className="text-xs text-text-muted">{label}</p>
    </motion.div>
  )
}

// ─── Issue Repos List (sidebar) ─────────────────────────────────────────────

function IssueReposList({ issueId, repos, onRefresh, onCreatePR }) {
  const handleUnlink = async (repoId, repoName) => {
    if (!confirm(`Desvincular "${repoName}" de este issue?`)) return
    try {
      await githubService.unlinkRepos(issueId, [repoId])
      onRefresh()
    } catch (err) {
      alert(err.message || 'Error al desvincular')
    }
  }

  if (repos.length === 0) {
    return (
      <p className="text-xs text-text-muted text-center py-2">Sin repositorios vinculados</p>
    )
  }

  return (
    <div className="space-y-1.5">
      {repos.map(repo => (
        <div
          key={repo.id}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-elevated transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            {repo.private ? (
              <Lock className="w-3 h-3 text-text-muted flex-shrink-0" />
            ) : (
              <Unlock className="w-3 h-3 text-text-muted flex-shrink-0" />
            )}
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-text-primary hover:text-accent-blue truncate"
              onClick={e => e.stopPropagation()}
            >
              {repo.full_name}
            </a>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onCreatePR(repo)}
              className="p-1 rounded text-text-muted hover:text-accent-blue"
              title="Crear Pull Request"
            >
              <GitPullRequest className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleUnlink(repo.id, repo.full_name)}
              className="p-1 rounded text-text-muted hover:text-status-rejected"
              title="Desvincular"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Link Repos Modal ───────────────────────────────────────────────────────

function LinkReposModal({ issueId, linkedRepoIds, onClose, onLinked }) {
  const [orgRepos, setOrgRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await githubService.getRepos({ active: 'true' })
        const repos = (data.results || data).filter(r => !linkedRepoIds.includes(r.id))
        setOrgRepos(repos)
      } catch (err) {
        setError(err.message || 'Error al cargar repositorios')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [linkedRepoIds])

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleLink = async () => {
    if (selected.size === 0) return
    setSaving(true)
    try {
      await githubService.linkRepos(issueId, [...selected])
      onLinked()
    } catch (err) {
      alert(err.message || 'Error al vincular repos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Vincular Repositorios" size="md">
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-status-rejected text-center py-4">{error}</p>
        ) : orgRepos.length === 0 ? (
          <div className="text-center py-8">
            <Github className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">
              No hay repositorios disponibles para vincular.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Agrega repos desde Configuracion &gt; GitHub
            </p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1 border border-border-primary rounded-lg p-2">
            {orgRepos.map(repo => (
              <label
                key={repo.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  selected.has(repo.id)
                    ? 'bg-accent-blue/10 border border-accent-blue/20'
                    : 'hover:bg-bg-elevated border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(repo.id)}
                  onChange={() => toggle(repo.id)}
                  className="rounded border-border-primary text-accent-blue focus:ring-accent-blue"
                />
                <div className="flex items-center gap-2 min-w-0">
                  {repo.private ? <Lock className="w-3 h-3 text-text-muted" /> : <Unlock className="w-3 h-3 text-text-muted" />}
                  <span className="text-sm text-text-primary truncate">{repo.full_name}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          {orgRepos.length > 0 && (
            <Button onClick={handleLink} disabled={selected.size === 0 || saving}>
              {saving ? 'Vinculando...' : `Vincular (${selected.size})`}
            </Button>
          )}
        </ModalFooter>
      </div>
    </Modal>
  )
}


// ─── Edit Issue Modal ────────────────────────────────────────────────────────

const priorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
]

const commonTags = ['frontend', 'backend', 'api', 'autenticacion', 'interfaz', 'rendimiento', 'error', 'funcionalidad']

function EditIssueModal({ issue, onClose, onSaved }) {
  const { developers } = useDevelopers()
  const [title, setTitle] = useState(issue.title || '')
  const [description, setDescription] = useState(issue.description || '')
  const [priority, setPriority] = useState(issue.priority || 'medium')
  const [assignedTo, setAssignedTo] = useState(issue.assigned_to?.id?.toString() || '')
  const [tags, setTags] = useState(issue.tags || [])
  const [customTag, setCustomTag] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Repos state
  const [orgRepos, setOrgRepos] = useState([])
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState(false)
  const [selectedRepos, setSelectedRepos] = useState(new Set())
  const [originalRepoIds, setOriginalRepoIds] = useState(new Set())

  // Load org repos and current linked repos
  useEffect(() => {
    let cancelled = false
    const loadRepos = async () => {
      setReposLoading(true)
      setReposError(false)
      try {
        const [allRepos, linkedRepos] = await Promise.all([
          githubService.getRepos({ active: 'true' }),
          githubService.getIssueRepos(issue.id),
        ])
        if (!cancelled) {
          setOrgRepos((allRepos.results || allRepos))
          const linkedIds = new Set((linkedRepos.results || linkedRepos).map(r => r.id))
          setSelectedRepos(linkedIds)
          setOriginalRepoIds(linkedIds)
        }
      } catch {
        if (!cancelled) { setOrgRepos([]); setReposError(true) }
      } finally {
        if (!cancelled) setReposLoading(false)
      }
    }
    loadRepos()
    return () => { cancelled = true }
  }, [issue.id])

  const toggleRepo = (repoId) => {
    setSelectedRepos(prev => {
      const next = new Set(prev)
      next.has(repoId) ? next.delete(repoId) : next.add(repoId)
      return next
    })
  }

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
    }
    setCustomTag('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    setError('')
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        priority,
        tags,
      }
      if (assignedTo) {
        data.assigned_to_id = parseInt(assignedTo)
      } else {
        data.assigned_to_id = null
      }
      await issueService.updateIssue(issue.id, data)

      // Sync repos: link new ones and unlink removed ones
      const toLink = [...selectedRepos].filter(id => !originalRepoIds.has(id))
      const toUnlink = [...originalRepoIds].filter(id => !selectedRepos.has(id))
      if (toLink.length > 0) await githubService.linkRepos(issue.id, toLink)
      if (toUnlink.length > 0) await githubService.unlinkRepos(issue.id, toUnlink)

      onSaved()
    } catch (err) {
      setError(err.message || 'Error al actualizar el issue')
    } finally {
      setSaving(false)
    }
  }

  const devOptions = developers.map(d => ({
    value: String(d.id),
    label: fullName(d),
  }))

  return (
    <Modal isOpen onClose={onClose} title="Editar Issue" subtitle="Modifica los datos del issue" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-sm">
            {error}
          </div>
        )}

        <Input
          label="Titulo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Descripcion"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Asignar a"
            value={assignedTo}
            onChange={setAssignedTo}
            options={[{ value: '', label: 'Sin asignar' }, ...devOptions]}
          />
          <Select
            label="Prioridad"
            value={priority}
            onChange={setPriority}
            options={priorityOptions}
          />
        </div>

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
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Etiquetas</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {commonTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  tags.includes(tag)
                    ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                    : 'bg-bg-elevated text-text-muted hover:text-text-secondary border border-transparent'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
              placeholder="Etiqueta personalizada..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-all"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addCustomTag}>
              Agregar
            </Button>
          </div>
          {tags.filter(t => !commonTags.includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.filter(t => !commonTags.includes(t)).map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
                  #{tag}
                  <button type="button" onClick={() => toggleTag(tag)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" disabled={!title.trim() || saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

// ─── Status Selector ────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'open', label: 'Abierto', color: 'bg-status-open', dotColor: 'bg-status-open', bgHover: 'hover:bg-status-open/10' },
  { value: 'in_review', label: 'En Revision', color: 'bg-status-in-review', dotColor: 'bg-status-in-review', bgHover: 'hover:bg-status-in-review/10' },
  { value: 'approved', label: 'Aprobado', color: 'bg-status-approved', dotColor: 'bg-status-approved', bgHover: 'hover:bg-status-approved/10' },
  { value: 'rejected', label: 'Rechazado', color: 'bg-status-rejected', dotColor: 'bg-status-rejected', bgHover: 'hover:bg-status-rejected/10' },
  { value: 'tech_debt', label: 'Deuda Tecnica', color: 'bg-status-tech-debt', dotColor: 'bg-status-tech-debt', bgHover: 'hover:bg-status-tech-debt/10' },
]

// Permission required to change TO each status
const STATUS_PERMISSIONS = {
  approved: 'approve_dev',
  rejected: 'reject_dev',
  tech_debt: 'mark_tech_debt',
  // open and in_review: no special permission needed
}

function StatusSelector({ currentStatus, isOpen, onToggle, onClose, updating, onChangeStatus, hasPermission, isOrgAdmin }) {
  const current = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0]

  // Filter options based on role
  const availableOptions = STATUS_OPTIONS.filter(opt => {
    if (opt.value === currentStatus) return false // Can't change to same status

    const requiredPerm = STATUS_PERMISSIONS[opt.value]

    // Admin can change to any status
    if (isOrgAdmin) return true

    // Non-admin: check if they have the specific permission for restricted statuses
    if (requiredPerm && !hasPermission(requiredPerm)) return false

    // Non-admin without admin/lead perms: can only go to in_review
    if (!requiredPerm) {
      // open and in_review don't require special perms
      // but a regular dev should only be able to set to in_review
      if (opt.value === 'open' && !hasPermission('approve_dev') && !hasPermission('reject_dev')) return false
      return true
    }

    return true
  })

  // If no options available, render non-interactive badge
  if (availableOptions.length === 0) {
    return <StatusBadge status={currentStatus} />
  }

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={updating}
        className="group cursor-pointer"
      >
        <StatusBadge status={currentStatus} className={updating ? 'opacity-50' : 'hover:ring-2 hover:ring-offset-1 hover:ring-offset-bg-secondary hover:ring-border-secondary transition-all'} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute left-0 top-full mt-2 w-52 py-1.5 rounded-lg border border-border-primary bg-bg-elevated shadow-xl z-50"
          >
            <p className="px-3 py-1.5 text-[10px] font-medium text-text-muted uppercase tracking-wider">
              Cambiar estado
            </p>
            {availableOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChangeStatus(opt.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary transition-colors ${opt.bgHover}`}
              >
                <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                {opt.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}

// ─── Create PR Modal ────────────────────────────────────────────────────────

function CreatePRModal({ repo, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [head, setHead] = useState('')
  const [base, setBase] = useState('')
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await githubService.getBranches(repo.id)
        const branchList = data.results || data
        setBranches(branchList)
        const defaultBranch = branchList.find(b => b.is_default)
        if (defaultBranch) setBase(defaultBranch.name)
      } catch (err) {
        setError('Error al cargar branches')
      } finally {
        setLoading(false)
      }
    }
    loadBranches()
  }, [repo.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !head || !base || head === base) return
    setSaving(true)
    setError('')
    try {
      await githubService.createPullRequest(repo.id, {
        title: title.trim(),
        body: body.trim(),
        head,
        base,
      })
      onCreated()
    } catch (err) {
      setError(err.message || 'Error al crear PR')
    } finally {
      setSaving(false)
    }
  }

  const isValid = title.trim() && head && base && head !== base

  return (
    <Modal isOpen onClose={onClose} title="Crear Pull Request" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-text-muted">
          Repositorio: <span className="font-medium text-text-secondary">{repo.full_name}</span>
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Titulo</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Titulo del Pull Request"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Head (origen)
                </label>
                <select
                  value={head}
                  onChange={e => setHead(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
                >
                  <option value="">Seleccionar branch</option>
                  {branches.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Base (destino)
                </label>
                <select
                  value={base}
                  onChange={e => setBase(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
                >
                  <option value="">Seleccionar branch</option>
                  {branches.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {head && base && head === base && (
              <p className="text-xs text-status-rejected">Head y base no pueden ser el mismo branch</p>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Descripcion <span className="text-text-muted">(opcional)</span>
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Describe los cambios..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all resize-none"
              />
            </div>
          </>
        )}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" disabled={!isValid || saving || loading}>
            {saving ? 'Creando...' : 'Crear Pull Request'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
