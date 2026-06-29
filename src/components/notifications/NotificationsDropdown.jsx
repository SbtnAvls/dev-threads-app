import { motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { NotificationItem } from './NotificationItem'

export function NotificationsDropdown({
  notifications,
  unreadCount,
  loading,
  hasMore,
  onItemClick,
  onMarkAllRead,
  onLoadMore,
}) {
  const isEmpty = notifications.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      role="dialog"
      aria-label="Notificaciones"
      className="absolute top-full right-0 mt-2 w-[min(92vw,22rem)] rounded-xl border border-border-primary bg-bg-secondary shadow-xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[28rem] overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center text-center px-6 py-10">
            <div className="p-3 rounded-2xl bg-bg-elevated border border-border-primary mb-3">
              <Bell className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              {loading ? 'Cargando…' : 'Sin notificaciones'}
            </p>
            {!loading && (
              <p className="text-xs text-text-muted mt-1">
                Aquí verás la actividad de tus issues.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border-primary/60">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={onItemClick} />
            ))}
          </div>
        )}

        {hasMore && !isEmpty && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-2.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-50 border-t border-border-primary/60"
          >
            {loading ? 'Cargando…' : 'Ver más'}
          </button>
        )}
      </div>
    </motion.div>
  )
}
