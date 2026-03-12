import apiClient from './apiClient'

const githubService = {
  // --- Token validation ---

  async validateToken(token) {
    return apiClient('/github/validate-token/', {
      method: 'POST',
      body: { token },
    })
  },

  // --- Connections ---

  async getConnections() {
    return apiClient('/github/connections/')
  },

  async getConnection(id) {
    return apiClient(`/github/connections/${id}/`)
  },

  async createConnection({ label, token, auth_type = 'pat' }) {
    return apiClient('/github/connections/', {
      method: 'POST',
      body: { label, token, auth_type },
    })
  },

  async updateConnection(id, data) {
    return apiClient(`/github/connections/${id}/`, {
      method: 'PATCH',
      body: data,
    })
  },

  async deleteConnection(id) {
    return apiClient(`/github/connections/${id}/`, { method: 'DELETE' })
  },

  // --- Available repos (from a connection) ---

  async getAvailableRepos(connectionId) {
    return apiClient(`/github/connections/${connectionId}/available-repos/`)
  },

  // --- Repos (added to org) ---

  async getRepos(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value)
      }
    })
    const qs = query.toString()
    return apiClient(`/github/repos/${qs ? `?${qs}` : ''}`)
  },

  async getRepo(id) {
    return apiClient(`/github/repos/${id}/`)
  },

  async addRepos(connectionId, repos) {
    return apiClient('/github/repos/', {
      method: 'POST',
      body: { connection_id: connectionId, repos },
    })
  },

  async toggleRepo(id, isActive) {
    return apiClient(`/github/repos/${id}/`, {
      method: 'PATCH',
      body: { is_active: isActive },
    })
  },

  async deleteRepo(id) {
    return apiClient(`/github/repos/${id}/`, { method: 'DELETE' })
  },

  // --- Issue-Repo links ---

  async getIssueRepos(issueId) {
    return apiClient(`/issues/${issueId}/repos/`)
  },

  async linkRepos(issueId, repoIds) {
    return apiClient(`/issues/${issueId}/repos/`, {
      method: 'POST',
      body: { repo_ids: repoIds },
    })
  },

  async unlinkRepos(issueId, repoIds) {
    return apiClient(`/issues/${issueId}/repos/`, {
      method: 'DELETE',
      body: { repo_ids: repoIds },
    })
  },

  // --- Branches, PRs, Commits (Phase 2 endpoints) ---

  async getBranches(repoId) {
    return apiClient(`/github/repos/${repoId}/branches/`)
  },

  async getPullRequests(repoId, state = 'open') {
    return apiClient(`/github/repos/${repoId}/pulls/?state=${state}`)
  },

  async createPullRequest(repoId, { title, body, head, base }) {
    return apiClient(`/github/repos/${repoId}/pulls/create/`, {
      method: 'POST',
      body: { title, body, head, base },
    })
  },

  async getCommit(repoId, sha) {
    return apiClient(`/github/repos/${repoId}/commits/${sha}/`)
  },

  async searchCommits(repoId, { q, branch } = {}) {
    const query = new URLSearchParams()
    if (q) query.append('q', q)
    if (branch) query.append('branch', branch)
    const qs = query.toString()
    return apiClient(`/github/repos/${repoId}/commits/${qs ? `?${qs}` : ''}`)
  },
}

export default githubService
