import apiClient from './apiClient'

const notificationService = {
  /**
   * List the current user's notifications (org-scoped, newest first).
   * The paginated response includes `unread_count`.
   * @param {{ limit?: number, offset?: number, unread?: boolean }} params
   */
  async list(params = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value)
      }
    })
    const qs = query.toString()
    return apiClient(`/notifications/${qs ? `?${qs}` : ''}`)
  },

  async markRead(id) {
    return apiClient(`/notifications/${id}/`, {
      method: 'PATCH',
      body: { is_read: true },
    })
  },

  async markAllRead() {
    return apiClient('/notifications/mark-all-read/', { method: 'POST' })
  },
}

export default notificationService
