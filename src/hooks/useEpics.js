import { useState, useEffect, useCallback } from 'react'
import epicService from '../services/epicService'

export function useEpics(filters = {}) {
  const [epics, setEpics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEpics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await epicService.getEpics(filters)
      setEpics(data.results || data)
    } catch (err) {
      setError(err.message || 'Error loading epics')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchEpics()
  }, [fetchEpics])

  const createEpic = useCallback(async (data) => {
    const newEpic = await epicService.createEpic(data)
    await fetchEpics()
    return newEpic
  }, [fetchEpics])

  const updateEpic = useCallback(async (id, data) => {
    const updated = await epicService.updateEpic(id, data)
    await fetchEpics()
    return updated
  }, [fetchEpics])

  const deleteEpic = useCallback(async (id, action = 'unlink') => {
    await epicService.deleteEpic(id, action)
    await fetchEpics()
  }, [fetchEpics])

  return {
    epics,
    loading,
    error,
    refetch: fetchEpics,
    createEpic,
    updateEpic,
    deleteEpic,
  }
}

export function useEpicDetail(id) {
  const [epic, setEpic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEpic = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await epicService.getEpic(id)
      setEpic(data)
    } catch (err) {
      setError(err.message || 'Error loading epic')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchEpic()
  }, [fetchEpic])

  const updateEpic = useCallback(async (data) => {
    const updated = await epicService.updateEpic(id, data)
    await fetchEpic()
    return updated
  }, [id, fetchEpic])

  const assignIssues = useCallback(async (issueIds) => {
    const result = await epicService.assignIssues(id, issueIds)
    await fetchEpic()
    return result
  }, [id, fetchEpic])

  const removeIssues = useCallback(async (issueIds) => {
    const result = await epicService.removeIssues(id, issueIds)
    await fetchEpic()
    return result
  }, [id, fetchEpic])

  return {
    epic,
    loading,
    error,
    refetch: fetchEpic,
    updateEpic,
    assignIssues,
    removeIssues,
  }
}
