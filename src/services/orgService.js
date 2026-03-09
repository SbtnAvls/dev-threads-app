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
}

export default orgService
