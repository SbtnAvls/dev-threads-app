import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  X
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  {
    label: 'Panel',
    icon: LayoutDashboard,
    to: '/',
  },
  {
    label: 'Desarrolladores',
    icon: Users,
    to: '/developers',
  },
  {
    label: 'Todos los Issues',
    icon: ClipboardList,
    to: '/issues',
  },
]

const quickFilters = [
  {
    label: 'En Revision',
    icon: Clock,
    to: '/issues?status=in_review',
    color: 'text-status-in-review',
  },
  {
    label: 'Rechazados',
    icon: AlertTriangle,
    to: '/issues?status=rejected',
    color: 'text-status-rejected',
  },
  {
    label: 'Aprobados',
    icon: CheckCircle2,
    to: '/issues?status=approved',
    color: 'text-status-approved',
  },
]

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 border-r border-border-primary bg-bg-secondary',
          'lg:relative lg:translate-x-0 lg:z-auto',
          'transition-transform duration-300 ease-in-out'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="flex items-center justify-end p-4 lg:hidden">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <p className="px-3 mb-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
              Navegación
            </p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent-blue/10 text-accent-blue'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}

            {/* Quick filters */}
            <div className="pt-6">
              <p className="px-3 mb-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Filtros Rápidos
              </p>
              {quickFilters.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={clsx('w-5 h-5', item.color)} />
                    {item.label}
                  </div>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border-primary">
            <NavLink
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <Settings className="w-5 h-5" />
              Configuración
            </NavLink>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
