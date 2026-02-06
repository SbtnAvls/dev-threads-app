import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'

export const Select = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Seleccionar...',
  error,
  className,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="space-y-1.5 relative" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between rounded-lg border bg-bg-tertiary px-4 py-2.5 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue',
          'transition-all duration-200',
          error
            ? 'border-status-rejected'
            : 'border-border-primary hover:border-border-secondary',
          className
        )}
      >
        <span className={selectedOption ? 'text-text-primary' : 'text-text-muted'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={clsx(
            'w-4 h-4 text-text-muted transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-1 py-1 rounded-lg border border-border-primary bg-bg-elevated shadow-xl"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-2 text-sm',
                    'hover:bg-bg-hover transition-colors',
                    option.value === value
                      ? 'text-accent-blue'
                      : 'text-text-primary'
                  )}
                >
                  {option.label}
                  {option.value === value && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-xs text-status-rejected">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'
