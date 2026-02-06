import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { Avatar, Badge } from '../ui'
import { fullName } from '../../utils/helpers'

const roleLabels = {
  admin: 'Administrador',
  lead: 'Lider Tecnico',
  product_manager: 'Product Manager',
  qa: 'QA',
  developer: 'Desarrollador',
}

const roleColors = {
  admin: 'bg-status-rejected/20 text-status-rejected',
  lead: 'bg-status-tech-debt/20 text-status-tech-debt',
  product_manager: 'bg-status-in-review/20 text-status-in-review',
  qa: 'bg-status-approved/20 text-status-approved',
  developer: 'bg-accent-blue/20 text-accent-blue',
}

export function DevCard({ developer, compact = false }) {
  const name = fullName(developer)
  const roleName = developer.role?.name || 'developer'

  if (compact) {
    return (
      <Link to={`/developer/${developer.id}`}>
        <motion.div
          whileHover={{ scale: 1.02, x: 4 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border-primary hover:border-border-secondary transition-all cursor-pointer"
        >
          <Avatar name={name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-primary text-sm truncate">
              {name}
            </p>
            <p className="text-xs text-text-muted">
              {roleLabels[roleName] || roleName}
            </p>
          </div>
        </motion.div>
      </Link>
    )
  }

  return (
    <Link to={`/developer/${developer.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          'relative group rounded-2xl border border-border-primary bg-bg-secondary p-5',
          'hover:border-accent-blue/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]',
          'transition-all duration-300 cursor-pointer overflow-hidden'
        )}
      >
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content */}
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={name}
                size="lg"
                showRing
                ringColor="ring-border-secondary group-hover:ring-accent-blue/50"
              />
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                  {name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', roleColors[roleName] || roleColors.developer)}>
                    {roleLabels[roleName] || roleName}
                  </span>
                </div>
              </div>
            </div>
            <motion.div
              initial={{ x: -5, opacity: 0 }}
              whileHover={{ x: 0, opacity: 1 }}
              className="text-text-muted group-hover:text-accent-blue"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Mail className="w-4 h-4 text-text-muted" />
            <span className="truncate">{developer.email}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
