import apiClient from './apiClient'

const qaService = {
  async getIssues(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value)
      }
    })
    const qs = query.toString()
    return apiClient(`/issues/${qs ? `?${qs}` : ''}`)
  },

  async getIssue(id) {
    return apiClient(`/issues/${id}/`)
  },

  async createIssue(data) {
    return apiClient('/issues/', { method: 'POST', body: data })
  },

  async updateIssue(id, data) {
    return apiClient(`/issues/${id}/`, { method: 'PATCH', body: data })
  },

  async deleteIssue(id) {
    return apiClient(`/issues/${id}/`, { method: 'DELETE' })
  },

  // Timeline
  async getTimeline(issueId) {
    return apiClient(`/issues/${issueId}/timeline/`)
  },

  async addTimelineEntry(issueId, data) {
    return apiClient(`/issues/${issueId}/timeline/`, {
      method: 'POST',
      body: data,
    })
  },

  // Stats
  async getStats() {
    return apiClient('/stats/')
  },

  async getDevStats(developerId) {
    return apiClient(`/stats/developer/${developerId}/`)
  },
}

export default qaService
