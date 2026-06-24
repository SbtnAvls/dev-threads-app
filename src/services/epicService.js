import apiClient from './apiClient'

const epicService = {
  async getEpics(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value)
      }
    })
    const qs = query.toString()
    return apiClient(`/epics/${qs ? `?${qs}` : ''}`)
  },

  async getEpic(id) {
    return apiClient(`/epics/${id}/`)
  },

  async createEpic(data) {
    return apiClient('/epics/', { method: 'POST', body: data })
  },

  async updateEpic(id, data) {
    return apiClient(`/epics/${id}/`, { method: 'PATCH', body: data })
  },

  async deleteEpic(id, action = 'unlink') {
    return apiClient(`/epics/${id}/?action=${action}`, { method: 'DELETE' })
  },

  async assignIssues(epicId, issueIds) {
    return apiClient(`/epics/${epicId}/issues/`, {
      method: 'POST',
      body: { issue_ids: issueIds },
    })
  },

  async removeIssues(epicId, issueIds) {
    return apiClient(`/epics/${epicId}/issues/`, {
      method: 'DELETE',
      body: { issue_ids: issueIds },
    })
  },

  // AI breakdown (two-step: propose issues → confirm creates them)
  async breakdownEpicAI(epicId, { model, max_issues } = {}) {
    const body = {}
    if (model) body.model = model
    if (max_issues != null) body.max_issues = max_issues
    return apiClient(`/epics/${epicId}/breakdown-ai/`, { method: 'POST', body })
  },

  async confirmEpicBreakdown(epicId, issues) {
    return apiClient(`/epics/${epicId}/breakdown-ai/confirm/`, {
      method: 'POST',
      body: { issues },
    })
  },
}

export default epicService
