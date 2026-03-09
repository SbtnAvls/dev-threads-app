import apiClient, { setTokens, clearTokens } from './apiClient'

const authService = {
  /**
   * Authenticate with a Google ID token.
   * Returns one of:
   *  - { access, refresh, user }              → direct login (single org)
   *  - { action: 'select_org', organizations, user } → multi-org
   *  - { action: 'register', google_data }    → user doesn't exist yet
   */
  async loginWithGoogle(googleToken) {
    const data = await apiClient('/auth/google/', {
      method: 'POST',
      body: { google_token: googleToken },
      auth: false,
    })

    // Direct login (has JWT tokens)
    if (data.access && data.refresh) {
      setTokens({ access: data.access, refresh: data.refresh })
      return { type: 'authenticated', user: data.user }
    }

    // Multi-org selector
    if (data.action === 'select_org') {
      return {
        type: 'select_org',
        organizations: data.organizations,
        user: data.user,
      }
    }

    // Needs registration
    if (data.action === 'register') {
      return {
        type: 'register',
        googleData: data.google_data,
      }
    }

    throw new Error('Unexpected response from server')
  },

  /**
   * Select an org when user belongs to multiple orgs.
   */
  async selectOrg(googleToken, orgId) {
    const data = await apiClient('/auth/google/select-org/', {
      method: 'POST',
      body: { google_token: googleToken, org_id: orgId },
      auth: false,
    })
    setTokens({ access: data.access, refresh: data.refresh })
    return data.user
  },

  /**
   * Register a new organization with Google account.
   */
  async registerOrg(googleToken, orgName, orgType = '') {
    const data = await apiClient('/auth/register/', {
      method: 'POST',
      body: { google_token: googleToken, org_name: orgName, org_type: orgType },
      auth: false,
    })
    setTokens({ access: data.access, refresh: data.refresh })
    return data.user
  },

  /**
   * Accept an invitation using a Google token and invite UUID.
   */
  async acceptInvitation(googleToken, inviteToken) {
    const data = await apiClient('/auth/accept-invitation/', {
      method: 'POST',
      body: { google_token: googleToken, invite_token: inviteToken },
      auth: false,
    })
    setTokens({ access: data.access, refresh: data.refresh })
    return data.user
  },

  async getProfile() {
    return apiClient('/auth/me/')
  },

  async updateProfile(data) {
    return apiClient('/auth/me/', { method: 'PATCH', body: data })
  },

  logout() {
    clearTokens()
  },
}

export default authService
