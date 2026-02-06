import { motion } from 'framer-motion'
import clsx from 'clsx'

export function Card({
  children,
  className,
  hover = true,
  glow,
  padding = 'md',
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const glowClasses = {
    blue: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    green: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    yellow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    red: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
    purple: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      className={clsx(
        'rounded-xl border border-border-primary bg-bg-secondary',
        'transition-all duration-300',
        hover && 'hover:border-border-secondary cursor-pointer',
        glow && glowClasses[glow],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ children, className }) {
  return (
    <div className={clsx('mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={clsx('text-lg font-semibold text-text-primary', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className }) {
  return (
    <p className={clsx('text-sm text-text-secondary mt-1', className)}>
      {children}
    </p>
  )
}

export function CardContent({ children, className }) {
  return (
    <div className={clsx(className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-border-primary', className)}>
      {children}
    </div>
  )
}
