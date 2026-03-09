import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Users, Mail, Shield, Save, Plus, Trash2,
  Copy, Check, X, RefreshCw, UserMinus, UserPlus,
} from 'lucide-react'
import { useAuth } from '../hooks'
import { Button, Badge, Modal, ModalFooter } from '../components/ui'
import orgService from '../services/orgService'

const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'members', label: 'Miembros', icon: Users },
  { id: 'invitations', label: 'Invitaciones', icon: Mail },
  { id: 'roles', label: 'Roles', icon: Shield },
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
]

export function OrgSettingsPage() {
  const { isOrgAdmin, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const canAccess = isOrgAdmin || hasPermission('manage_users')

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
      <div className="flex gap-1 p-1 rounded-xl bg-bg-secondary border border-border-primary">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-accent-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}
          >
            <tab.icon className="w-4 h-4" />
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

      <div className="rounded-xl border border-border-primary bg-bg-secondary overflow-hidden">
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
      <div className="flex gap-2">
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
        <div className="rounded-xl border border-border-primary bg-bg-secondary overflow-hidden">
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
