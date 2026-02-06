import { forwardRef } from 'react'
import clsx from 'clsx'

export const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  className,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full rounded-lg border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue',
            'transition-all duration-200',
            error
              ? 'border-status-rejected focus:ring-status-rejected/50 focus:border-status-rejected'
              : 'border-border-primary hover:border-border-secondary',
            Icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-status-rejected">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export const Textarea = forwardRef(({
  label,
  error,
  className,
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'w-full rounded-lg border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary',
          'placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue',
          'transition-all duration-200 resize-none',
          error
            ? 'border-status-rejected focus:ring-status-rejected/50 focus:border-status-rejected'
            : 'border-border-primary hover:border-border-secondary',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-status-rejected">{error}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'
