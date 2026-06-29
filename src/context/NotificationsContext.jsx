import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import notificationService from '../services/notificationService'
import { useNotificationsSocket } from '../hooks/useNotificationsSocket'
import { useAuth } from './AuthContext'

const PAGE_SIZE = 20
const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const offsetRef = useRef(0)
  const connectedOnceRef = useRef(false)
  // Ids we've already shown — guards against double-counting duplicate pushes.
  const seenIdsRef = useRef(new Set())

  const reset = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
    setHasMore(false)
    offsetRef.current = 0
    seenIdsRef.current = new Set()
  }, [])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationService.list({ limit: PAGE_SIZE })
      const results = data.results || []
      setNotifications(results)
      setUnreadCount(typeof data.unread_count === 'number' ? data.unread_count : 0)
      setHasMore(!!data.next)
      offsetRef.current = results.length
      seenIdsRef.current = new Set(results.map((n) => n.id))
    } catch {
      // keep whatever we had; the socket/next refresh will recover
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load (and clear on logout).
  useEffect(() => {
    if (isAuthenticated) {
      loadInitial()
    } else {
      connectedOnceRef.current = false
      reset()
    }
  }, [isAuthenticated, loadInitial, reset])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    setLoading(true)
    try {
      const data = await notificationService.list({ limit: PAGE_SIZE, offset: offsetRef.current })
      const results = data.results || []
      setNotifications((prev) => {
        const ids = new Set(prev.map((n) => n.id))
        return [...prev, ...results.filter((n) => !ids.has(n.id))]
      })
      results.forEach((n) => seenIdsRef.current.add(n.id))
      setHasMore(!!data.next)
      offsetRef.current += results.length
      if (typeof data.unread_count === 'number') setUnreadCount(data.unread_count)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [hasMore, loading])

  // --- live socket ----------------------------------------------------------

  const handleSocketMessage = useCallback((msg) => {
    if (!msg || !msg.type) return
    if (msg.type === 'unread_count') {
      setUnreadCount(msg.count ?? 0)
    } else if (msg.type === 'notification' && msg.notification) {
      const incoming = msg.notification
      // Dedupe by id so a duplicate push never inflates the list, badge or offset.
      if (seenIdsRef.current.has(incoming.id)) return
      seenIdsRef.current.add(incoming.id)
      setNotifications((prev) => [incoming, ...prev])
      if (!incoming.is_read) setUnreadCount((c) => c + 1)
      offsetRef.current += 1
    }
  }, [])

  const handleSocketOpen = useCallback(() => {
    // Skip the very first connect (mount already did the initial load); on every
    // *re*connect, refresh so we don't miss notifications created while offline.
    if (!connectedOnceRef.current) {
      connectedOnceRef.current = true
      return
    }
    loadInitial()
  }, [loadInitial])

  useNotificationsSocket({
    enabled: isAuthenticated,
    onMessage: handleSocketMessage,
    onOpen: handleSocketOpen,
  })

  // --- mutations (optimistic) ----------------------------------------------

  const markRead = useCallback(async (id) => {
    let wasUnread = false
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.is_read) {
          wasUnread = true
          return { ...n, is_read: true }
        }
        return n
      }),
    )
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await notificationService.markRead(id)
    } catch {
      if (wasUnread) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)))
        setUnreadCount((c) => c + 1)
      }
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => (n.is_read ? n : { ...n, is_read: true })))
    setUnreadCount(0)
    try {
      await notificationService.markAllRead()
    } catch {
      loadInitial()
    }
  }, [loadInitial])

  const value = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    reload: loadInitial,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return ctx
}

export default NotificationsContext
