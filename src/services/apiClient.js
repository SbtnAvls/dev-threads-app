const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/qa'

const TOKEN_KEY = 'qa_access_token'
const REFRESH_KEY = 'qa_refresh_token'

export function getTokens() {
  return {
    access: localStorage.getItem(TOKEN_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  }
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(TOKEN_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function refreshAccessToken() {
  const { refresh } = getTokens()
  if (!refresh) throw new ApiError('No refresh token', 401)

  const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!res.ok) {
    clearTokens()
    throw new ApiError('Session expired', 401)
  }

  const data = await res.json()
  setTokens(data)
  return data.access
}

let refreshPromise = null

async function apiClient(endpoint, options = {}) {
  const { body, method = 'GET', auth = true, ...rest } = options
  const url = `${API_BASE_URL}${endpoint}`

  const headers = { 'Content-Type': 'application/json', ...rest.headers }

  if (auth) {
    const { access } = getTokens()
    if (access) headers['Authorization'] = `Bearer ${access}`
  }

  let res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Auto-refresh on 401
  if (res.status === 401 && auth) {
    try {
      // Deduplicate concurrent refresh calls
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken()
      }
      const newToken = await refreshPromise
      refreshPromise = null

      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch {
      refreshPromise = null
      clearTokens()
      window.dispatchEvent(new CustomEvent('qa-auth-expired'))
      throw new ApiError('Session expired. Please log in again.', 401)
    }
  }

  if (res.status === 204) return null

  const data = await res.json()

  if (!res.ok) {
    const message = data.detail
      || data.non_field_errors?.[0]
      || Object.values(data)?.[0]?.[0]
      || 'Request failed'
    throw new ApiError(message, res.status, data)
  }

  return data
}

export { apiClient, ApiError, API_BASE_URL }
export default apiClient
