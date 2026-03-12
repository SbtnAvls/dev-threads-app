import apiClient from './apiClient'

const sprintService = {
  async getSprints(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value)
      }
    })
    const qs = query.toString()
    return apiClient(`/sprints/${qs ? `?${qs}` : ''}`)
  },

  async getSprint(id) {
    return apiClient(`/sprints/${id}/`)
  },

  async createSprint(data) {
    return apiClient('/sprints/', { method: 'POST', body: data })
  },

  async updateSprint(id, data) {
    return apiClient(`/sprints/${id}/`, { method: 'PATCH', body: data })
  },

  async deleteSprint(id, action = 'unlink') {
    return apiClient(`/sprints/${id}/?action=${action}`, { method: 'DELETE' })
  },

  async assignIssues(sprintId, issueIds) {
    return apiClient(`/sprints/${sprintId}/issues/`, {
      method: 'POST',
      body: { issue_ids: issueIds },
    })
  },

  async removeIssues(sprintId, issueIds) {
    return apiClient(`/sprints/${sprintId}/issues/`, {
      method: 'DELETE',
      body: { issue_ids: issueIds },
    })
  },
}

export default sprintService
