import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus } from 'lucide-react'
import { DevCard } from '../components/dev'
import { Button, InviteModal } from '../components/ui'
import { useDevelopers, useAuth } from '../hooks'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function DevelopersPage() {
  const { developers, loading, refetch } = useDevelopers()
  const { isOrgAdmin, hasPermission } = useAuth()
  const [showInvite, setShowInvite] = useState(false)

  const canInvite = isOrgAdmin || hasPermission('manage_users')

  const countByRole = (roleName) =>
    developers.filter(d => d.role?.name === roleName).length

  return (
    <div className="space-y-6">
      {/* Invite Modal */}
      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        onInvited={refetch}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Miembros</h1>
          <p className="text-text-secondary mt-1">
            Gestiona el equipo y sus issues asignados
          </p>
        </div>
        {canInvite && (
          <Button icon={Plus} onClick={() => setShowInvite(true)}>
            Invitar Miembro
          </Button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-bg-secondary border border-border-primary">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-blue/10">
            <Users className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{developers.length}</p>
            <p className="text-sm text-text-muted">Total Miembros</p>
          </div>
        </div>
        <div className="h-10 w-px bg-border-primary" />
        <div>
          <p className="text-2xl font-bold text-status-approved">
            {countByRole('developer')}
          </p>
          <p className="text-sm text-text-muted">Miembros</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-status-in-review">
            {countByRole('qa')}
          </p>
          <p className="text-sm text-text-muted">QA</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-status-tech-debt">
            {countByRole('lead')}
          </p>
          <p className="text-sm text-text-muted">Lideres</p>
        </div>
      </div>

      {/* Developers grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {developers.map((developer) => (
            <motion.div key={developer.id} variants={item}>
              <DevCard developer={developer} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
