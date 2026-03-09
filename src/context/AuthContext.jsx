import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authService from '../services/authService'
import { getTokens, clearTokens } from '../services/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Derived state from user profile
  const organization = user?.membership?.organization || null
  const membership = user?.membership || null
  const isOrgAdmin = membership?.role?.permissions?.includes('*') || false

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
    window.addEventListener('dev-auth-expired', handler)
    return () => window.removeEventListener('dev-auth-expired', handler)
  }, [])

  /**
   * Google login — handles the 3-way response from the backend.
   * Returns { type, user?, organizations?, googleData? }
   */
  const loginWithGoogle = useCallback(async (googleToken) => {
    const result = await authService.loginWithGoogle(googleToken)

    if (result.type === 'authenticated') {
      setUser(result.user)
    }

    return result
  }, [])

  /**
   * Select an org (for multi-org users).
   */
  const selectOrg = useCallback(async (googleToken, orgId) => {
    const profile = await authService.selectOrg(googleToken, orgId)
    setUser(profile)
    return profile
  }, [])

  /**
   * Register a new organization.
   */
  const registerOrg = useCallback(async (googleToken, orgName, orgType) => {
    const profile = await authService.registerOrg(googleToken, orgName, orgType)
    setUser(profile)
    return profile
  }, [])

  /**
   * Accept an invitation.
   */
  const acceptInvitation = useCallback(async (googleToken, inviteToken) => {
    const profile = await authService.acceptInvitation(googleToken, inviteToken)
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const hasPermission = useCallback((permission) => {
    const perms = membership?.role?.permissions
    if (!perms) return false
    if (perms.includes('*')) return true
    return perms.includes(permission)
  }, [membership])

  const refreshProfile = useCallback(async () => {
    const profile = await authService.getProfile()
    setUser(profile)
    return profile
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    organization,
    membership,
    isOrgAdmin,
    loginWithGoogle,
    selectOrg,
    registerOrg,
    acceptInvitation,
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
