import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Menu, LogOut, Building2, ChevronDown, RefreshCw, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../ui'
import { useAuth } from '../../hooks'
import { fullName } from '../../utils/helpers'

export function Header({ onMenuClick }) {
  const { user, organization, membership, logout } = useAuth()
  const navigate = useNavigate()
  const [showOrgMenu, setShowOrgMenu] = useState(false)
  const orgMenuRef = useRef(null)

  // Close menu on click outside
  useEffect(() => {
    const handler = (e) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target)) {
        setShowOrgMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchOrg = () => {
    setShowOrgMenu(false)
    logout()
    // Use window.location to ensure clean navigation after logout
    window.location.href = '/login'
  }

  const handleCreateOrg = () => {
    setShowOrgMenu(false)
    logout()
    // Use window.location with a flag in URL to survive the redirect
    window.location.href = '/register?create=true'
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
              whileHover={{ scale: 1.05 }}
              className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
            >
              <img src="/devthreads-icon.png" alt="Dev Threads" className="w-full h-full object-cover" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Dev Threads</h1>
              {organization ? (
                <div className="relative" ref={orgMenuRef}>
                  <button
                    onClick={(e) => { e.preventDefault(); setShowOrgMenu(!showOrgMenu) }}
                    className="flex items-center gap-1.5 hover:bg-bg-elevated rounded px-1 -ml-1 py-0.5 transition-colors"
                  >
                    <Building2 className="w-3 h-3 text-text-muted" />
                    <p className="text-xs text-text-muted truncate max-w-[150px]">
                      {organization.name}
                    </p>
                    <ChevronDown className="w-3 h-3 text-text-muted" />
                  </button>

                  <AnimatePresence>
                    {showOrgMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-border-primary bg-bg-secondary shadow-xl z-50 overflow-hidden"
                      >
                        {/* Current org info */}
                        <div className="px-4 py-3 border-b border-border-primary">
                          <p className="text-xs text-text-muted">Organizacion actual</p>
                          <p className="text-sm font-medium text-text-primary truncate">{organization.name}</p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={handleSwitchOrg}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors text-left"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <div>
                              <p>Cambiar organizacion</p>
                              <p className="text-xs text-text-muted">Inicia sesion en otra org</p>
                            </div>
                          </button>
                          <button
                            onClick={handleCreateOrg}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors text-left"
                          >
                            <Plus className="w-4 h-4" />
                            <div>
                              <p>Crear nueva organizacion</p>
                              <p className="text-xs text-text-muted">Registra tu propia org</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-primary bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all"
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
