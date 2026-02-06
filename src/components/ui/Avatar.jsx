import { motion } from 'framer-motion'
import clsx from 'clsx'

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const colors = [
  'bg-gradient-to-br from-blue-500 to-blue-600',
  'bg-gradient-to-br from-purple-500 to-purple-600',
  'bg-gradient-to-br from-green-500 to-green-600',
  'bg-gradient-to-br from-orange-500 to-orange-600',
  'bg-gradient-to-br from-pink-500 to-pink-600',
  'bg-gradient-to-br from-cyan-500 to-cyan-600',
]

function getColorFromName(name) {
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

function getInitials(name) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
  showRing = false,
  ringColor = 'ring-accent-blue',
  ...props
}) {
  const initials = getInitials(name || 'U')
  const bgColor = getColorFromName(name || 'User')

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full font-semibold text-white',
        'ring-2 ring-offset-2 ring-offset-bg-primary',
        showRing ? ringColor : 'ring-transparent',
        sizes[size],
        !src && bgColor,
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span>{initials}</span>
      )}
    </motion.div>
  )
}

export function AvatarGroup({ children, max = 4, size = 'sm' }) {
  const childrenArray = Array.isArray(children) ? children : [children]
  const visibleChildren = childrenArray.slice(0, max)
  const remainingCount = childrenArray.length - max

  return (
    <div className="flex -space-x-2">
      {visibleChildren}
      {remainingCount > 0 && (
        <div
          className={clsx(
            'inline-flex items-center justify-center rounded-full bg-bg-elevated border-2 border-bg-primary text-text-secondary font-medium',
            sizes[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
