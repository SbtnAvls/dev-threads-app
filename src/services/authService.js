import apiClient, { setTokens, clearTokens } from './apiClient'

const authService = {
  async login(email, password) {
    const data = await apiClient('/auth/login/', {
      method: 'POST',
      body: { email, password },
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

  async changePassword(currentPassword, newPassword) {
    const data = await apiClient('/auth/change-password/', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    })
    setTokens({ access: data.access, refresh: data.refresh })
    return data
  },

  logout() {
    clearTokens()
  },
}

export default authService
