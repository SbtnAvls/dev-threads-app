import apiClient from './apiClient'

const userService = {
  async getUsers(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value)
      }
    })
    const qs = query.toString()
    return apiClient(`/users/${qs ? `?${qs}` : ''}`)
  },

  async getUser(id) {
    return apiClient(`/users/${id}/`)
  },

  async createUser(data) {
    return apiClient('/users/create/', { method: 'POST', body: data })
  },

  async updateUser(id, data) {
    return apiClient(`/users/${id}/`, { method: 'PATCH', body: data })
  },

  async getRoles() {
    return apiClient('/roles/')
  },
}

export default userService
