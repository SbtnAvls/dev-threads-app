import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bug, Building2, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks'

export function OrgSelectorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectOrg } = useAuth()

  const organizations = location.state?.organizations || []
  const googleToken = location.state?.googleToken || null
  const userData = location.state?.user || null

  const [error, setError] = useState('')
  const [loadingOrgId, setLoadingOrgId] = useState(null)

  // If no state, redirect to login
  if (!googleToken || !organizations.length) {
    return <Navigate to="/login" replace />
  }

  const handleSelectOrg = async (orgId) => {
    setError('')
    setLoadingOrgId(orgId)
    try {
      await selectOrg(googleToken, orgId)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al seleccionar organizacion')
      setLoadingOrgId(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-accent-blue to-purple-600 mb-4"
          >
            <Bug className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-text-primary">Dev Threads</h1>
          <p className="text-text-secondary mt-1">Selecciona tu organizacion</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border-primary bg-bg-secondary p-6 space-y-4"
        >
          {/* User info */}
          {userData && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary border border-border-primary mb-2">
              {userData.avatar_url && (
                <img
                  src={userData.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {userData.first_name} {userData.last_name}
                </p>
                <p className="text-xs text-text-muted truncate">{userData.email}</p>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-sm"
            >
              {error}
            </motion.div>
          )}

          <p className="text-text-secondary text-sm">
            Perteneces a {organizations.length} organizaciones. Selecciona con cual quieres trabajar:
          </p>

          {/* Org list */}
          <div className="space-y-2">
            {organizations.map((org, index) => (
              <motion.button
                key={org.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => handleSelectOrg(org.id)}
                disabled={loadingOrgId !== null}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border-primary bg-bg-primary hover:border-accent-blue hover:bg-accent-blue/5 disabled:opacity-50 transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-accent-blue/10 text-accent-blue">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {org.name}
                  </p>
                  {org.org_type && (
                    <p className="text-xs text-text-muted truncate">{org.org_type}</p>
                  )}
                </div>
                {loadingOrgId === org.id ? (
                  <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-blue transition-colors" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
