import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationsContext'
import { NotificationsDropdown } from './NotificationsDropdown'

export function NotificationBell() {
  const navigate = useNavigate()
  const {
    notifications, unreadCount, loading, hasMore, loadMore, markRead, markAllRead,
  } = useNotifications()

  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleItemClick = (n) => {
    if (!n.is_read) markRead(n.id)
    setOpen(false)
    if (n.issue_id) navigate(`/issue/${n.issue_id}`)
  }

  const badge = unreadCount > 9 ? '9+' : unreadCount

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-bg-elevated transition-colors"
        aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-status-rejected text-white text-[10px] font-bold leading-none">
            {badge}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <NotificationsDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            hasMore={hasMore}
            onItemClick={handleItemClick}
            onMarkAllRead={markAllRead}
            onLoadMore={loadMore}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
