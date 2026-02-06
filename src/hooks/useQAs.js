import { useState, useEffect, useCallback } from 'react'
import qaService from '../services/qaService'

export function useQAs(filters = {}) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await qaService.getIssues(filters)
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
    const newIssue = await qaService.createIssue(data)
    await fetchIssues()
    return newIssue
  }, [fetchIssues])

  const updateIssue = useCallback(async (id, data) => {
    const updated = await qaService.updateIssue(id, data)
    await fetchIssues()
    return updated
  }, [fetchIssues])

  const deleteIssue = useCallback(async (id) => {
    await qaService.deleteIssue(id)
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

export function useQADetail(id) {
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchIssue = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await qaService.getIssue(id)
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
    const updated = await qaService.updateIssue(id, data)
    await fetchIssue()
    return updated
  }, [id, fetchIssue])

  return { issue, loading, error, refetch: fetchIssue, updateIssue }
}

export function useQAStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const data = await qaService.getStats()
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
      const data = await qaService.getDevStats(developerId)
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
