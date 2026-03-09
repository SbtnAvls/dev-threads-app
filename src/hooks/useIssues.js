import { useState, useEffect, useCallback } from 'react'
import issueService from '../services/issueService'

export function useIssues(filters = {}) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await issueService.getIssues(filters)
      // Handle paginated response
      setIssues(data.results || data)
    } catch (err) {
      setError(err.message || 'Error loading issues')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const createIssue = useCallback(async (data) => {
    const newIssue = await issueService.createIssue(data)
    await fetchIssues()
    return newIssue
  }, [fetchIssues])

  const updateIssue = useCallback(async (id, data) => {
    const updated = await issueService.updateIssue(id, data)
    await fetchIssues()
    return updated
  }, [fetchIssues])

  const deleteIssue = useCallback(async (id) => {
    await issueService.deleteIssue(id)
    await fetchIssues()
  }, [fetchIssues])

  return {
    issues,
    loading,
    error,
    refetch: fetchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
  }
}

export function useIssueDetail(id) {
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchIssue = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await issueService.getIssue(id)
      setIssue(data)
    } catch (err) {
      setError(err.message || 'Error loading issue')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchIssue()
  }, [fetchIssue])

  const updateIssue = useCallback(async (data) => {
    const updated = await issueService.updateIssue(id, data)
    await fetchIssue()
    return updated
  }, [id, fetchIssue])

  return { issue, loading, error, refetch: fetchIssue, updateIssue }
}

export function useIssueStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const data = await issueService.getStats()
      setStats(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

export function useDevStats(developerId) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    if (!developerId) return
    setLoading(true)
    try {
      const data = await issueService.getDevStats(developerId)
      setStats(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [developerId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
