import { motion } from 'framer-motion'
import clsx from 'clsx'

const variants = {
  primary: 'bg-accent-blue hover:bg-accent-blue-hover text-white shadow-lg shadow-accent-blue/20',
  secondary: 'bg-bg-elevated hover:bg-bg-hover text-text-primary border border-border-primary',
  ghost: 'bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary',
  danger: 'bg-status-rejected/20 hover:bg-status-rejected/30 text-status-rejected border border-status-rejected/30',
  success: 'bg-status-approved/20 hover:bg-status-approved/30 text-status-approved border border-status-approved/30',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:ring-offset-2 focus:ring-offset-bg-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </motion.button>
  )
}
