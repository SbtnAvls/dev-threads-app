import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authService from '../services/authService'
import { getTokens, clearTokens } from '../services/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check existing session on mount
  useEffect(() => {
    const { access } = getTokens()
    if (!access) {
      setLoading(false)
      return
    }

    authService.getProfile()
      .then(profile => setUser(profile))
      .catch(() => {
        clearTokens()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Listen for auth expiration from apiClient
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('qa-auth-expired', handler)
    return () => window.removeEventListener('qa-auth-expired', handler)
  }, [])

  const login = useCallback(async (email, password) => {
    const profile = await authService.login(email, password)
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const hasPermission = useCallback((permission) => {
    if (!user?.role?.permissions) return false
    const perms = user.role.permissions
    if (perms.includes('*')) return true
    return perms.includes(permission)
  }, [user])

  const refreshProfile = useCallback(async () => {
    const profile = await authService.getProfile()
    setUser(profile)
    return profile
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
