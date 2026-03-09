import { motion } from 'framer-motion'
import { Bug, Bell, Search, Menu, LogOut, Building2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../ui'
import { useAuth } from '../../hooks'
import { fullName } from '../../utils/helpers'

export function Header({ onMenuClick }) {
  const { user, organization, membership, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userName = user ? fullName(user) : ''
  const roleName = membership?.role?.name || ''

  const roleLabels = {
    admin: 'Administrador',
    lead: 'Lider Tecnico',
    product_manager: 'Product Manager',
    qa: 'QA',
    developer: 'Desarrollador',
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b border-border-primary bg-bg-primary/80 backdrop-blur-lg"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-bg-elevated transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>

          <Link to="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="p-2 rounded-xl bg-gradient-to-br from-accent-blue to-purple-600"
            >
              <Bug className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Dev Threads</h1>
              {organization ? (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-text-muted" />
                  <p className="text-xs text-text-muted truncate max-w-[150px]">
                    {organization.name}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-text-muted">Gestion de Issues</p>
              )}
            </div>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar issues, desarrolladores..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-primary bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <Bell className="w-5 h-5 text-text-secondary" />
          </motion.button>

          <div className="h-6 w-px bg-border-primary" />

          <div className="flex items-center gap-3">
            <Avatar name={userName} size="sm" showRing ringColor="ring-status-approved" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-text-primary">{userName}</p>
              <p className="text-xs text-text-muted">{roleLabels[roleName] || roleName}</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-status-rejected/10 transition-colors"
            title="Cerrar sesion"
          >
            <LogOut className="w-4 h-4 text-text-muted hover:text-status-rejected" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
