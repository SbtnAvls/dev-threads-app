import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Users, Mail, Shield, Save, Plus, Trash2,
  Copy, Check, X, RefreshCw, UserMinus, UserPlus,
  Github, ExternalLink, Eye, EyeOff, Lock, Unlock,
  GitBranch, AlertCircle, CheckCircle, Loader2,
  Layers, Pencil,
} from 'lucide-react'
import { useAuth } from '../hooks'
import { Button, Badge, Modal, ModalFooter } from '../components/ui'
import orgService from '../services/orgService'
import githubService from '../services/githubService'

const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'members', label: 'Miembros', icon: Users },
  { id: 'invitations', label: 'Invitaciones', icon: Mail },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'complexity', label: 'Complejidad', icon: Layers },
  { id: 'github', label: 'GitHub', icon: Github },
]

const AVAILABLE_PERMISSIONS = [
  { key: 'view_all', label: 'Ver todos los issues' },
  { key: 'view_assigned', label: 'Ver issues asignados' },
  { key: 'create_dev', label: 'Crear issues' },
  { key: 'assign_dev', label: 'Asignar issues' },
  { key: 'close_dev', label: 'Cerrar issues' },
  { key: 'approve_dev', label: 'Aprobar issues' },
  { key: 'reject_dev', label: 'Rechazar issues' },
  { key: 'mark_tech_debt', label: 'Marcar deuda tecnica' },
  { key: 'change_status', label: 'Cambiar estado' },
  { key: 'comment', label: 'Comentar' },
  { key: 'add_commit', label: 'Agregar commits' },
  { key: 'manage_users', label: 'Gestionar usuarios' },
  { key: 'manage_sprints', label: 'Gestionar sprints' },
  { key: 'assign_sprint', label: 'Asignar issues a sprints' },
  { key: 'manage_repos', label: 'Gestionar repositorios GitHub' },
]

export function OrgSettingsPage() {
  const { isOrgAdmin, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const canAccess = isOrgAdmin || hasPermission('manage_users') || hasPermission('manage_repos')

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Shield className="w-12 h-12 text-text-muted" />
        <h1 className="text-xl font-bold text-text-primary">Acceso restringido</h1>
        <p className="text-text-secondary text-sm">No tienes permisos para acceder a esta seccion.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Configuracion</h1>
        <p className="text-text-secondary mt-1">Administra tu organizacion</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-bg-secondary border border-border-primary">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all sm:px-4 sm:gap-2 ${
              activeTab === tab.id
                ? 'bg-accent-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'general' && <GeneralTab isAdmin={isOrgAdmin} />}
        {activeTab === 'members' && <MembersTab isAdmin={isOrgAdmin} />}
        {activeTab === 'invitations' && <InvitationsTab isAdmin={isOrgAdmin} />}
        {activeTab === 'roles' && <RolesTab isAdmin={isOrgAdmin} />}
        {activeTab === 'complexity' && <ComplexityTab isAdmin={isOrgAdmin} />}
        {activeTab === 'github' && <GitHubTab canManage={isOrgAdmin || hasPermission('manage_repos')} />}
      </motion.div>
    </div>
  )
}

// ─── General Tab ────────────────────────────────────────────────────────────

function GeneralTab({ isAdmin }) {
  const [org, setOrg] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', org_type: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)

  const loadOrg = useCallback(async () => {
    setError(null)
    try {
      const data = await orgService.getOrgDetails()
      setOrg(data)
      setForm({ name: data.name, description: data.description || '', org_type: data.org_type || '' })
    } catch (err) {
      setError(err.message || 'Error al cargar datos de la organizacion')
    }
  }, [])

  useEffect(() => { loadOrg() }, [loadOrg])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const updated = await orgService.updateOrg(form)
      setOrg(updated)
      setMessage('Guardado correctamente')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorMessage message={error} onRetry={loadOrg} />
  if (!org) return <LoadingSpinner />

  return (
    <div className="rounded-xl border border-border-primary bg-bg-secondary p-6 space-y-5">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Nombre</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            disabled={!isAdmin}
            className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary disabled:opacity-60 focus:outline-none focus:border-accent-blue transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Tipo</label>
          <input
            value={form.org_type}
            onChange={e => setForm(f => ({ ...f, org_type: e.target.value }))}
            disabled={!isAdmin}
            className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary disabled:opacity-60 focus:outline-none focus:border-accent-blue transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Descripcion</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            disabled={!isAdmin}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary disabled:opacity-60 focus:outline-none focus:border-accent-blue transition-all resize-none"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <span>Slug: <span className="font-mono text-text-secondary">{org.slug}</span></span>
          <span>Miembros: <span className="font-semibold text-text-primary">{org.member_count}</span></span>
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-3">
          <Button icon={Save} onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          {message && <span className="text-sm text-status-approved">{message}</span>}
        </div>
      )}
    </div>
  )
}

// ─── Members Tab ────────────────────────────────────────────────────────────

function MembersTab({ isAdmin }) {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [membersData, rolesData] = await Promise.all([
        orgService.getMembers(),
        orgService.getOrgRoles(),
      ])
      setMembers(membersData.results || membersData)
      setRoles(rolesData)
    } catch (err) {
      setError(err.message || 'Error al cargar miembros')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRoleChange = async (membershipId, roleId) => {
    setUpdatingId(membershipId)
    try {
      await orgService.updateMember(membershipId, { role_id: Number(roleId) })
      loadData()
    } catch (err) {
      alert(err.message || 'Error al cambiar rol')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleActive = async (membership) => {
    const action = membership.is_active ? 'desactivar' : 'reactivar'
    if (!confirm(`Seguro que deseas ${action} a ${membership.user.first_name} ${membership.user.last_name}?`)) return
    setUpdatingId(membership.id)
    try {
      await orgService.updateMember(membership.id, { is_active: !membership.is_active })
      loadData()
    } catch (err) {
      alert(err.message || `Error al ${action}`)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={loadData} />

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button icon={UserPlus} onClick={() => setShowInviteModal(true)}>
            Invitar Miembro
          </Button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border-primary bg-bg-secondary overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Miembro</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Estado</th>
              {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const isSelf = m.user.id === user?.id
              const isAdminRole = m.role?.permissions?.includes('*')
              return (
                <tr key={m.id} className={`border-b border-border-primary last:border-0 hover:bg-bg-elevated/50 transition-colors ${!m.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.user.avatar_url ? (
                        <img src={m.user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs font-bold text-accent-blue">
                          {m.user.first_name?.[0]}{m.user.last_name?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {m.user.first_name} {m.user.last_name}
                          {isSelf && <span className="text-xs text-text-muted ml-1">(tu)</span>}
                        </p>
                        <p className="text-xs text-text-muted">{m.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !isSelf && m.is_active ? (
                      <select
                        value={m.role?.id || ''}
                        onChange={e => handleRoleChange(m.id, e.target.value)}
                        disabled={updatingId === m.id}
                        className="px-2 py-1 rounded-lg border border-border-primary bg-bg-primary text-xs text-text-primary focus:outline-none focus:border-accent-blue transition-all disabled:opacity-50"
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge>{m.role?.name || '-'}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.is_active ? 'approved' : 'rejected'}>
                      {m.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {!isSelf && (
                        <Button
                          variant={m.is_active ? 'danger' : 'secondary'}
                          size="sm"
                          icon={m.is_active ? UserMinus : RefreshCw}
                          onClick={() => handleToggleActive(m)}
                          disabled={updatingId === m.id}
                        >
                          {m.is_active ? 'Desactivar' : 'Reactivar'}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {members.map(m => {
          const isSelf = m.user.id === user?.id
          return (
            <div key={m.id} className={`rounded-xl border border-border-primary bg-bg-secondary p-4 space-y-3 ${!m.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                {m.user.avatar_url ? (
                  <img src={m.user.avatar_url} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs font-bold text-accent-blue flex-shrink-0">
                    {m.user.first_name?.[0]}{m.user.last_name?.[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {m.user.first_name} {m.user.last_name}
                    {isSelf && <span className="text-xs text-text-muted ml-1">(tu)</span>}
                  </p>
                  <p className="text-xs text-text-muted truncate">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isAdmin && !isSelf && m.is_active ? (
                    <select
                      value={m.role?.id || ''}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                      disabled={updatingId === m.id}
                      className="px-2 py-1 rounded-lg border border-border-primary bg-bg-primary text-xs text-text-primary focus:outline-none focus:border-accent-blue transition-all disabled:opacity-50"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge>{m.role?.name || '-'}</Badge>
                  )}
                  <Badge variant={m.is_active ? 'approved' : 'rejected'}>
                    {m.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                {isAdmin && !isSelf && (
                  <Button
                    variant={m.is_active ? 'danger' : 'secondary'}
                    size="sm"
                    icon={m.is_active ? UserMinus : RefreshCw}
                    onClick={() => handleToggleActive(m)}
                    disabled={updatingId === m.id}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showInviteModal && (
        <InviteModal
          roles={roles}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => { setShowInviteModal(false); loadData() }}
        />
      )}
    </div>
  )
}

// ─── Invite Modal ───────────────────────────────────────────────────────────

function InviteModal({ roles, onClose, onInvited }) {
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState(roles[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const invitation = await orgService.createInvitation({
        email: email.trim(),
        role_id: Number(roleId),
      })
      const link = `${window.location.origin}/invite/${invitation.token}`
      setInviteLink(link)
    } catch (err) {
      setError(err.message || 'Error al crear invitacion')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal isOpen onClose={onClose} title="Invitar Miembro">
      {inviteLink ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Invitacion creada. Comparte este enlace con <span className="font-medium text-text-primary">{email}</span>:
          </p>
          <div className="flex gap-2">
            <input
              value={inviteLink}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg border border-border-primary bg-bg-primary text-xs font-mono text-text-secondary"
            />
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopy}
            >
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            <Button onClick={onInvited}>Listo</Button>
          </ModalFooter>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nuevo@miembro.com"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Rol</label>
            <select
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name} — {r.description}</option>
              ))}
            </select>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? 'Enviando...' : 'Crear Invitacion'}
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  )
}

// ─── Invitations Tab ────────────────────────────────────────────────────────

function InvitationsTab({ isAdmin }) {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const loadInvitations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await orgService.getInvitations()
      setInvitations(data.results || data)
    } catch (err) {
      setError(err.message || 'Error al cargar invitaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadInvitations() }, [loadInvitations])

  const handleRevoke = async (id) => {
    try {
      await orgService.revokeInvitation(id)
      loadInvitations()
    } catch (err) {
      alert(err.message || 'Error al revocar')
    }
  }

  const filtered = filter === 'all'
    ? invitations
    : invitations.filter(i => i.status === filter)

  const statusColors = {
    pending: 'bg-status-in-review/20 text-status-in-review',
    accepted: 'bg-status-approved/20 text-status-approved',
    expired: 'bg-text-muted/20 text-text-muted',
    revoked: 'bg-status-rejected/20 text-status-rejected',
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={loadInvitations} />

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'accepted', 'expired', 'revoked'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-accent-blue text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-elevated border border-border-primary'
            }`}
          >
            {f === 'all' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          No hay invitaciones{filter !== 'all' ? ` con estado "${filter}"` : ''}
        </div>
      ) : (
        <>
        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-border-primary bg-bg-secondary overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Expira</th>
                {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-border-primary last:border-0 hover:bg-bg-elevated/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-primary">{inv.email}</p>
                    {inv.invited_by_name && (
                      <p className="text-xs text-text-muted">por {inv.invited_by_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{inv.role?.name || '-'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || ''}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {inv.status === 'pending' && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={X}
                          onClick={() => handleRevoke(inv.id)}
                        >
                          Revocar
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map(inv => (
            <div key={inv.id} className="rounded-xl border border-border-primary bg-bg-secondary p-4 space-y-2">
              <div className="min-w-0">
                <p className="text-sm text-text-primary font-medium truncate">{inv.email}</p>
                {inv.invited_by_name && (
                  <p className="text-xs text-text-muted">por {inv.invited_by_name}</p>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <Badge>{inv.role?.name || '-'}</Badge>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || ''}`}>
                  {inv.status}
                </span>
                <span className="text-xs text-text-muted">
                  Expira: {new Date(inv.expires_at).toLocaleDateString()}
                </span>
              </div>
              {isAdmin && inv.status === 'pending' && (
                <div className="pt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={X}
                    onClick={() => handleRevoke(inv.id)}
                  >
                    Revocar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  )
}

// ─── Roles Tab ──────────────────────────────────────────────────────────────

function RolesTab({ isAdmin }) {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)

  const loadRoles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await orgService.getOrgRoles()
      setRoles(data)
    } catch (err) {
      setError(err.message || 'Error al cargar roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRoles() }, [loadRoles])

  const handleDelete = async (id, name) => {
    if (!confirm(`Eliminar el rol "${name}"?`)) return
    try {
      await orgService.deleteRole(id)
      loadRoles()
    } catch (err) {
      alert(err.message || 'Error al eliminar')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={loadRoles} />

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            Crear Rol
          </Button>
        </div>
      )}

      <div className="grid gap-3">
        {roles.map(role => (
          <div
            key={role.id}
            className="rounded-xl border border-border-primary bg-bg-secondary p-4 flex items-start justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent-blue" />
                <h3 className="text-sm font-semibold text-text-primary">{role.name}</h3>
                {role.permissions?.includes('*') && (
                  <Badge variant="approved" size="sm">Admin</Badge>
                )}
              </div>
              {role.description && (
                <p className="text-xs text-text-muted">{role.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {role.permissions?.includes('*') ? (
                  <span className="text-xs text-status-approved">Todos los permisos</span>
                ) : (
                  role.permissions?.map(p => (
                    <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-bg-elevated text-text-muted border border-border-primary">
                      {p}
                    </span>
                  ))
                )}
              </div>
            </div>
            {isAdmin && role.name !== 'admin' && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingRole(role)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(role.id, role.name)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {(showCreateModal || editingRole) && (
        <RoleModal
          role={editingRole}
          onClose={() => { setShowCreateModal(false); setEditingRole(null) }}
          onSaved={() => { setShowCreateModal(false); setEditingRole(null); loadRoles() }}
        />
      )}
    </div>
  )
}

// ─── Role Modal ─────────────────────────────────────────────────────────────

function RoleModal({ role, onClose, onSaved }) {
  const isEdit = !!role
  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [permissions, setPermissions] = useState(role?.permissions || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const togglePermission = (perm) => {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = { name: name.trim(), description, permissions }
      if (isEdit) {
        await orgService.updateRole(role.id, data)
      } else {
        await orgService.createRole(data)
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Editar Rol' : 'Crear Rol'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Nombre</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Descripcion</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Permisos</label>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_PERMISSIONS.map(p => (
              <label
                key={p.key}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-elevated cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={permissions.includes(p.key)}
                  onChange={() => togglePermission(p.key)}
                  className="rounded border-border-primary text-accent-blue focus:ring-accent-blue"
                />
                <span className="text-xs text-text-primary">{p.label}</span>
              </label>
            ))}
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

// ─── Complexity Tab ─────────────────────────────────────────────────────────

function ComplexityTab({ isAdmin }) {
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLevel, setEditingLevel] = useState(null)

  const loadLevels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await orgService.getComplexityLevels()
      setLevels(data)
    } catch (err) {
      setError(err.message || 'Error al cargar niveles de complejidad')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLevels() }, [loadLevels])

  const handleDelete = async (id, label) => {
    if (!confirm(`Eliminar el nivel "${label}"?`)) return
    try {
      await orgService.deleteComplexityLevel(id)
      loadLevels()
    } catch (err) {
      alert(err.message || 'Error al eliminar')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={loadLevels} />

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-primary bg-bg-secondary p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Niveles de Complejidad</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Define los niveles de complejidad para clasificar issues. El valor numerico se usa para calcular story points en metricas.
            </p>
          </div>
          {isAdmin && (
            <Button icon={Plus} size="sm" onClick={() => setShowCreateModal(true)}>
              Crear Nivel
            </Button>
          )}
        </div>

        {levels.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            No hay niveles de complejidad configurados
          </div>
        ) : (
          <div className="space-y-2">
            {levels.map(level => (
              <div
                key={level.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border-primary bg-bg-primary"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
                    style={{ backgroundColor: level.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{level.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-bg-elevated text-text-muted border border-border-primary">
                        {level.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-text-muted">
                        Valor: <span className="font-semibold text-text-secondary">{level.value}</span> pts
                      </span>
                      <span className="text-xs text-text-muted">
                        Orden: {level.order}
                      </span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Pencil}
                      onClick={() => setEditingLevel(level)}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(level.id, level.label)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border-primary bg-bg-secondary p-5">
        <h4 className="text-xs font-semibold text-text-secondary mb-2">Como funcionan los valores</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          El <span className="font-medium text-text-secondary">valor numerico</span> de cada nivel se usa para calcular story points
          en la pagina de metricas. Los valores por defecto siguen una escala tipo Fibonacci (1, 2, 3, 5, 8) para reflejar
          el incremento no lineal del esfuerzo. Puedes personalizarlos segun las necesidades de tu equipo.
        </p>
      </div>

      {(showCreateModal || editingLevel) && (
        <ComplexityModal
          level={editingLevel}
          onClose={() => { setShowCreateModal(false); setEditingLevel(null) }}
          onSaved={() => { setShowCreateModal(false); setEditingLevel(null); loadLevels() }}
        />
      )}
    </div>
  )
}

// ─── Complexity Modal ───────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#6b7280', '#22c55e', '#f59e0b', '#ef4444', '#9333ea',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
]

function ComplexityModal({ level, onClose, onSaved }) {
  const isEdit = !!level
  const [name, setName] = useState(level?.name || '')
  const [label, setLabel] = useState(level?.label || '')
  const [color, setColor] = useState(level?.color || '#6b7280')
  const [value, setValue] = useState(level?.value ?? 1)
  const [order, setOrder] = useState(level?.order ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      setError('El color debe ser un hex valido (ej: #ef4444)')
      return
    }
    const numValue = Number(value)
    if (!Number.isInteger(numValue) || numValue < 1 || numValue > 100) {
      setError('El valor debe ser un entero entre 1 y 100')
      return
    }
    const numOrder = Number(order)
    if (!Number.isInteger(numOrder) || numOrder < 0) {
      setError('El orden debe ser un entero mayor o igual a 0')
      return
    }

    setLoading(true)
    try {
      const data = {
        name: name.trim().toLowerCase(),
        label: label.trim(),
        color,
        value: numValue,
        order: numOrder,
      }
      if (isEdit) {
        await orgService.updateComplexityLevel(level.id, data)
      } else {
        await orgService.createComplexityLevel(data)
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Editar Nivel' : 'Crear Nivel de Complejidad'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Nombre interno</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej: medium"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary font-mono focus:outline-none focus:border-accent-blue transition-all"
            />
            <p className="text-[10px] text-text-muted mt-1">Identificador unico (minusculas)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Etiqueta</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="ej: Media"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
            />
            <p className="text-[10px] text-text-muted mt-1">Nombre visible en la UI</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Valor (story points)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={value}
              onChange={e => setValue(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
            />
            <p className="text-[10px] text-text-muted mt-1">Para metricas (1-100)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Orden</label>
            <input
              type="number"
              min={0}
              value={order}
              onChange={e => setOrder(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
            />
            <p className="text-[10px] text-text-muted mt-1">Posicion en listas (menor = primero)</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Color</label>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition-all ${
                    color === c
                      ? 'ring-2 ring-accent-blue ring-offset-2 ring-offset-bg-secondary scale-110'
                      : 'hover:scale-105 ring-1 ring-white/10'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              type="text"
              value={color}
              onChange={e => setColor(e.target.value)}
              pattern="^#[0-9a-fA-F]{6}$"
              className="w-24 px-2.5 py-1.5 rounded-lg border border-border-primary bg-bg-primary text-xs text-text-primary font-mono focus:outline-none focus:border-accent-blue transition-all"
            />
          </div>
          {/* Preview */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-text-muted">Vista previa:</span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {label || 'Etiqueta'}
            </span>
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" disabled={loading || !name.trim() || !label.trim()}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

// ─── GitHub Tab ─────────────────────────────────────────────────────────────

function GitHubTab({ canManage }) {
  const [connections, setConnections] = useState([])
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showAddReposModal, setShowAddReposModal] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [connsData, reposData] = await Promise.all([
        githubService.getConnections(),
        githubService.getRepos(),
      ])
      setConnections(connsData.results || connsData)
      setRepos(reposData.results || reposData)
    } catch (err) {
      setError(err.message || 'Error al cargar datos de GitHub')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDeleteConnection = async (conn) => {
    if (!confirm(`Eliminar la conexion "${conn.label}"? Se eliminaran todos los repos asociados y sus enlaces con issues.`)) return
    setDeletingId(conn.id)
    try {
      await githubService.deleteConnection(conn.id)
      loadData()
    } catch (err) {
      alert(err.message || 'Error al eliminar conexion')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleRepo = async (repo) => {
    try {
      await githubService.toggleRepo(repo.id, !repo.is_active)
      loadData()
    } catch (err) {
      alert(err.message || 'Error al cambiar estado del repo')
    }
  }

  const handleDeleteRepo = async (repo) => {
    if (!confirm(`Eliminar "${repo.full_name}" de la organizacion?`)) return
    try {
      await githubService.deleteRepo(repo.id)
      loadData()
    } catch (err) {
      alert(err.message || 'Error al eliminar repo')
    }
  }

  const handleAddRepos = (conn) => {
    setSelectedConnection(conn)
    setShowAddReposModal(true)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={loadData} />

  return (
    <div className="space-y-6">
      {/* Connections Section */}
      <div className="rounded-xl border border-border-primary bg-bg-secondary p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Conexiones GitHub</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Conecta cuentas de GitHub para acceder a repositorios
            </p>
          </div>
          {canManage && (
            <Button icon={Plus} size="sm" onClick={() => setShowConnectModal(true)}>
              Conectar
            </Button>
          )}
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-8">
            <Github className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No hay conexiones configuradas</p>
            {canManage && (
              <p className="text-xs text-text-muted mt-1">
                Conecta una cuenta de GitHub para empezar
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(conn => (
              <div
                key={conn.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border-primary bg-bg-primary"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {conn.github_avatar_url ? (
                    <img src={conn.github_avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center flex-shrink-0">
                      <Github className="w-4 h-4 text-text-muted" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text-primary truncate">{conn.label}</p>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                        conn.status === 'active'
                          ? 'bg-status-approved/20 text-status-approved'
                          : 'bg-status-rejected/20 text-status-rejected'
                      }`}>
                        {conn.status === 'active' ? (
                          <><CheckCircle className="w-2.5 h-2.5" /> Activa</>
                        ) : (
                          <><AlertCircle className="w-2.5 h-2.5" /> Invalida</>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      @{conn.github_username} · {conn.auth_type.toUpperCase()}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Plus}
                      onClick={() => handleAddRepos(conn)}
                      disabled={conn.status !== 'active'}
                    >
                      Repos
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDeleteConnection(conn)}
                      disabled={deletingId === conn.id}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Repos Section */}
      {repos.length > 0 && (
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Repositorios</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {repos.length} repositorio{repos.length !== 1 ? 's' : ''} conectado{repos.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-2">
            {repos.map(repo => (
              <div
                key={repo.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-border-primary bg-bg-primary transition-opacity ${
                  !repo.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GitBranch className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">{repo.full_name}</p>
                      {repo.private ? (
                        <Lock className="w-3 h-3 text-text-muted flex-shrink-0" />
                      ) : (
                        <Unlock className="w-3 h-3 text-text-muted flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {repo.default_branch} · {repo.connection_label}
                      {repo.description && ` · ${repo.description.slice(0, 60)}${repo.description.length > 60 ? '...' : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {canManage && (
                    <>
                      <button
                        onClick={() => handleToggleRepo(repo)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                        title={repo.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {repo.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteRepo(repo)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-status-rejected hover:bg-status-rejected/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showConnectModal && (
        <GitHubConnectionModal
          onClose={() => setShowConnectModal(false)}
          onConnected={() => { setShowConnectModal(false); loadData() }}
        />
      )}

      {showAddReposModal && selectedConnection && (
        <AddReposModal
          connection={selectedConnection}
          onClose={() => { setShowAddReposModal(false); setSelectedConnection(null) }}
          onAdded={() => { setShowAddReposModal(false); setSelectedConnection(null); loadData() }}
        />
      )}
    </div>
  )
}

// ─── GitHub Connection Modal ────────────────────────────────────────────────

function GitHubConnectionModal({ onClose, onConnected }) {
  const [label, setLabel] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validation, setValidation] = useState(null)
  const [error, setError] = useState('')

  const handleValidate = async () => {
    if (!token.trim()) return
    setValidating(true)
    setError('')
    setValidation(null)
    try {
      const result = await githubService.validateToken(token.trim())
      setValidation(result)
      if (!label.trim()) {
        setLabel(`GitHub - ${result.username}`)
      }
    } catch (err) {
      setError(err.message || 'Token invalido')
    } finally {
      setValidating(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validation || validation.missing_scopes?.length > 0) return
    setSaving(true)
    setError('')
    try {
      await githubService.createConnection({
        label: label.trim(),
        token: token.trim(),
        auth_type: 'pat',
      })
      onConnected()
    } catch (err) {
      setError(err.message || 'Error al guardar conexion')
    } finally {
      setSaving(false)
    }
  }

  const isValid = validation?.valid && (validation.missing_scopes?.length === 0)

  return (
    <Modal isOpen onClose={onClose} title="Conectar GitHub" size="md">
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-sm">
            {error}
          </div>
        )}

        {/* Token input */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Personal Access Token
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={e => { setToken(e.target.value); setValidation(null) }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-2.5 pr-10 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary font-mono focus:outline-none focus:border-accent-blue transition-all"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-2 p-3 rounded-lg bg-bg-elevated border border-border-primary space-y-1.5">
            <p className="text-xs font-medium text-text-secondary">
              Permisos requeridos:
            </p>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-status-tech-debt/15 text-status-tech-debt text-[10px] font-mono font-medium">
                repo
              </span>
              <span className="text-xs text-text-muted">
                Full control of private repositories
              </span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Usa un token clasico (Classic PAT) con el scope <span className="font-mono font-medium text-text-secondary">repo</span> marcado.
              Esto permite listar repos, branches, PRs, commits y crear pull requests.
            </p>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=DevThreads"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent-blue hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Crear token en GitHub
            </a>
          </div>
        </div>

        {/* Validate button */}
        {!validation && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleValidate}
            disabled={!token.trim() || validating}
            icon={validating ? Loader2 : CheckCircle}
          >
            {validating ? 'Validando...' : 'Validar Token'}
          </Button>
        )}

        {/* Validation result */}
        {validation && (
          <div className={`p-4 rounded-lg border ${
            isValid
              ? 'bg-status-approved/5 border-status-approved/20'
              : 'bg-status-rejected/5 border-status-rejected/20'
          }`}>
            <div className="flex items-center gap-3">
              {validation.avatar_url && (
                <img src={validation.avatar_url} alt="" className="w-10 h-10 rounded-full" />
              )}
              <div>
                <p className="text-sm font-medium text-text-primary">@{validation.username}</p>
                <p className="text-xs text-text-muted">{validation.name}</p>
              </div>
              {isValid ? (
                <CheckCircle className="w-5 h-5 text-status-approved ml-auto" />
              ) : (
                <AlertCircle className="w-5 h-5 text-status-rejected ml-auto" />
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {validation.scopes?.map(scope => (
                <span key={scope} className="px-1.5 py-0.5 rounded text-[10px] bg-bg-elevated text-text-muted border border-border-primary">
                  {scope}
                </span>
              ))}
            </div>
            {validation.missing_scopes?.length > 0 && (
              <p className="text-xs text-status-rejected mt-2">
                Scopes faltantes: {validation.missing_scopes.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Label */}
        {validation && isValid && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Nombre de la conexion
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Mi cuenta GitHub"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
            />
          </div>
        )}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} type="button">Cancelar</Button>
          {isValid && (
            <Button type="submit" disabled={saving || !label.trim()}>
              {saving ? 'Guardando...' : 'Conectar'}
            </Button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  )
}

// ─── Add Repos Modal ────────────────────────────────────────────────────────

function AddReposModal({ connection, onClose, onAdded }) {
  const [availableRepos, setAvailableRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const loadRepos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await githubService.getAvailableRepos(connection.id)
      setAvailableRepos(data.repos || [])
    } catch (err) {
      setError(err.message || 'Error al cargar repositorios disponibles')
    } finally {
      setLoading(false)
    }
  }, [connection.id])

  useEffect(() => { loadRepos() }, [loadRepos])

  const toggleRepo = (githubId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(githubId)) {
        next.delete(githubId)
      } else {
        next.add(githubId)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(r => r.github_id)))
    }
  }

  const handleAdd = async () => {
    if (selected.size === 0) return
    setSaving(true)
    try {
      const reposToAdd = availableRepos
        .filter(r => selected.has(r.github_id))
        .map(r => ({
          github_id: r.github_id,
          full_name: r.full_name,
          name: r.name,
          private: r.private,
          default_branch: r.default_branch,
          description: r.description || '',
          html_url: r.html_url || '',
        }))
      await githubService.addRepos(connection.id, reposToAdd)
      onAdded()
    } catch (err) {
      alert(err.message || 'Error al agregar repositorios')
    } finally {
      setSaving(false)
    }
  }

  const filtered = search
    ? availableRepos.filter(r =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : availableRepos

  return (
    <Modal isOpen onClose={onClose} title="Agregar Repositorios" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Repositorios disponibles desde <span className="font-medium text-text-secondary">{connection.label}</span> (@{connection.github_username})
        </p>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadRepos} />
        ) : availableRepos.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-8 h-8 text-status-approved mx-auto mb-2" />
            <p className="text-sm text-text-muted">Todos los repositorios ya fueron agregados</p>
          </div>
        ) : (
          <>
            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar repositorios..."
              className="w-full px-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-all"
            />

            {/* Select all */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-accent-blue hover:underline"
              >
                {selected.size === filtered.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
              <span className="text-xs text-text-muted">
                {selected.size} seleccionado{selected.size !== 1 ? 's' : ''} de {filtered.length}
              </span>
            </div>

            {/* Repo list */}
            <div className="max-h-80 overflow-y-auto space-y-1 border border-border-primary rounded-lg p-2">
              {filtered.map(repo => (
                <label
                  key={repo.github_id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    selected.has(repo.github_id)
                      ? 'bg-accent-blue/10 border border-accent-blue/20'
                      : 'hover:bg-bg-elevated border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(repo.github_id)}
                    onChange={() => toggleRepo(repo.github_id)}
                    className="rounded border-border-primary text-accent-blue focus:ring-accent-blue"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">{repo.full_name}</p>
                      {repo.private ? (
                        <Lock className="w-3 h-3 text-text-muted flex-shrink-0" />
                      ) : (
                        <Unlock className="w-3 h-3 text-text-muted flex-shrink-0" />
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-text-muted truncate">{repo.description}</p>
                    )}
                  </div>
                  {repo.language && (
                    <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-elevated border border-border-primary flex-shrink-0">
                      {repo.language}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </>
        )}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          {availableRepos.length > 0 && (
            <Button
              onClick={handleAdd}
              disabled={selected.size === 0 || saving}
            >
              {saving ? 'Agregando...' : `Agregar ${selected.size > 0 ? `(${selected.size})` : ''}`}
            </Button>
          )}
        </ModalFooter>
      </div>
    </Modal>
  )
}

// ─── Shared ─────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <p className="text-sm text-status-rejected">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
