import { useEffect, useRef } from 'react'
import { getTokens, API_BASE_URL } from '../services/apiClient'

/**
 * Derive the WebSocket base (origin) from the REST base URL, or from an explicit
 * VITE_WS_URL override. e.g. http://localhost:8001/api/dev -> ws://localhost:8001
 */
function getWsBase() {
  const override = import.meta.env.VITE_WS_URL
  if (override) return override.replace(/\/+$/, '')
  try {
    const u = new URL(API_BASE_URL, window.location.origin)
    const proto = u.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${u.host}`
  } catch {
    return window.location.origin.replace(/^http/, 'ws')
  }
}

const MAX_BACKOFF_MS = 30000
const PING_INTERVAL_MS = 25000

/**
 * Maintains a single WebSocket connection to /ws/notifications/ while `enabled`,
 * authenticating with the current access token. Reconnects with exponential
 * backoff and sends periodic pings to keep the connection alive.
 *
 * @param {{ enabled: boolean, onMessage?: (data: any) => void, onOpen?: () => void }} opts
 */
export function useNotificationsSocket({ enabled, onMessage, onOpen }) {
  const onMessageRef = useRef(onMessage)
  const onOpenRef = useRef(onOpen)

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])
  useEffect(() => { onOpenRef.current = onOpen }, [onOpen])

  useEffect(() => {
    if (!enabled) return

    let ws = null
    let pingTimer = null
    let reconnectTimer = null
    let attempts = 0
    let stopped = false

    const clearTimers = () => {
      if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    }

    const scheduleReconnect = () => {
      if (stopped) return
      const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts)
      attempts += 1
      reconnectTimer = setTimeout(connect, delay)
    }

    function connect() {
      const { access } = getTokens()
      if (!access) {
        // No token yet — retry shortly (e.g. right after login).
        scheduleReconnect()
        return
      }

      const url = `${getWsBase()}/ws/notifications/?token=${encodeURIComponent(access)}`
      try {
        ws = new WebSocket(url)
      } catch {
        scheduleReconnect()
        return
      }

      ws.onopen = () => {
        attempts = 0
        onOpenRef.current?.()
        pingTimer = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, PING_INTERVAL_MS)
      }

      ws.onmessage = (event) => {
        try {
          onMessageRef.current?.(JSON.parse(event.data))
        } catch {
          // ignore malformed frames
        }
      }

      ws.onclose = () => {
        if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
        scheduleReconnect()
      }

      ws.onerror = () => {
        try { ws?.close() } catch { /* noop */ }
      }
    }

    // When the access token is refreshed, retry now with the fresh token if we
    // aren't already connected (a healthy open socket keeps its session).
    const onTokenRefreshed = () => {
      if (ws && ws.readyState === WebSocket.OPEN) return
      attempts = 0
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
      if (ws) {
        ws.onclose = null
        try { ws.close() } catch { /* noop */ }
        ws = null
      }
      connect()
    }
    window.addEventListener('dev-token-refreshed', onTokenRefreshed)

    connect()

    return () => {
      stopped = true
      window.removeEventListener('dev-token-refreshed', onTokenRefreshed)
      clearTimers()
      if (ws) {
        ws.onclose = null // prevent reconnect on intentional teardown
        try { ws.close() } catch { /* noop */ }
      }
    }
  }, [enabled])
}
