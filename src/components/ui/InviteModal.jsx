import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { Modal, ModalFooter } from './Modal'
import { Button } from './Button'
import { orgService } from '../../services'

export function InviteModal({ isOpen, onClose, onInvited }) {
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setError('')
      setInviteLink(null)
      setCopied(false)
      orgService.getOrgRoles().then((data) => {
        const list = data.results || data
        setRoles(list)
        if (list.length > 0) setRoleId(list[0].id)
      })
    }
  }, [isOpen])

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

  const handleDone = () => {
    onInvited?.()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invitar Miembro">
      {inviteLink ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Invitacion creada. Comparte este enlace con{' '}
            <span className="font-medium text-text-primary">{email}</span>:
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
            <Button onClick={handleDone}>Listo</Button>
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
