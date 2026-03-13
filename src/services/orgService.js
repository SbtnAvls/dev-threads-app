import apiClient from './apiClient'

const orgService = {
  // --- Organization ---
  async getOrgDetails() {
    return apiClient('/org/')
  },

  async updateOrg(data) {
    return apiClient('/org/', { method: 'PATCH', body: data })
  },

  // --- Roles ---
  async getOrgRoles() {
    return apiClient('/org/roles/')
  },

  async createRole(data) {
    return apiClient('/org/roles/', { method: 'POST', body: data })
  },

  async updateRole(id, data) {
    return apiClient(`/org/roles/${id}/`, { method: 'PATCH', body: data })
  },

  async deleteRole(id) {
    return apiClient(`/org/roles/${id}/`, { method: 'DELETE' })
  },

  // --- Complexity Levels ---
  async getComplexityLevels() {
    return apiClient('/org/complexity-levels/')
  },

  async createComplexityLevel(data) {
    return apiClient('/org/complexity-levels/', { method: 'POST', body: data })
  },

  async updateComplexityLevel(id, data) {
    return apiClient(`/org/complexity-levels/${id}/`, { method: 'PATCH', body: data })
  },

  async deleteComplexityLevel(id) {
    return apiClient(`/org/complexity-levels/${id}/`, { method: 'DELETE' })
  },

  // --- Invitations ---
  async getInvitations() {
    return apiClient('/org/invitations/list/')
  },

  async createInvitation(data) {
    return apiClient('/org/invitations/', { method: 'POST', body: data })
  },

  async revokeInvitation(id) {
    return apiClient(`/org/invitations/${id}/revoke/`, { method: 'POST' })
  },

  // --- Members ---
  async getMembers() {
    return apiClient('/org/members/')
  },

  async updateMember(membershipId, data) {
    return apiClient(`/org/members/${membershipId}/`, { method: 'PATCH', body: data })
  },

  // --- Gemini AI Token ---
  async getGeminiTokenStatus() {
    return apiClient('/org/gemini-token/')
  },

  async setGeminiToken(token) {
    return apiClient('/org/gemini-token/', { method: 'PUT', body: { token } })
  },

  async deleteGeminiToken() {
    return apiClient('/org/gemini-token/', { method: 'DELETE' })
  },

  async updateGeminiSettings(settings) {
    return apiClient('/org/gemini-token/', { method: 'PATCH', body: settings })
  },
}

export default orgService
