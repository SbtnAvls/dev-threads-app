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

  // AI Summary
  async getAISummary(sprintId) {
    return apiClient(`/sprints/${sprintId}/ai-summary/`)
  },

  async regenerateAISummary(sprintId, { model, max_chars } = {}) {
    const body = {}
    if (model) body.model = model
    if (max_chars != null) body.max_chars = max_chars
    return apiClient(`/sprints/${sprintId}/ai-summary/`, {
      method: 'POST',
      body: Object.keys(body).length > 0 ? body : undefined,
    })
  },

  // AI Sprint Generation
  async generateAISprints({ model, sprint_duration_weeks, max_sprints } = {}) {
    const body = {}
    if (model) body.model = model
    if (sprint_duration_weeks != null) body.sprint_duration_weeks = sprint_duration_weeks
    if (max_sprints != null) body.max_sprints = max_sprints
    return apiClient('/sprints/generate-ai/', { method: 'POST', body })
  },

  async confirmAISprints(sprints) {
    return apiClient('/sprints/confirm-ai/', {
      method: 'POST',
      body: { sprints },
    })
  },
}

export default sprintService
