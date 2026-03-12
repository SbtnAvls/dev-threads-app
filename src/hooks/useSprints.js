import { useState, useEffect, useCallback } from 'react'
import sprintService from '../services/sprintService'

export function useSprints(filters = {}) {
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSprints = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await sprintService.getSprints(filters)
      setSprints(data.results || data)
    } catch (err) {
      setError(err.message || 'Error loading sprints')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchSprints()
  }, [fetchSprints])

  const createSprint = useCallback(async (data) => {
    const newSprint = await sprintService.createSprint(data)
    await fetchSprints()
    return newSprint
  }, [fetchSprints])

  const updateSprint = useCallback(async (id, data) => {
    const updated = await sprintService.updateSprint(id, data)
    await fetchSprints()
    return updated
  }, [fetchSprints])

  const deleteSprint = useCallback(async (id, action = 'unlink') => {
    await sprintService.deleteSprint(id, action)
    await fetchSprints()
  }, [fetchSprints])

  return {
    sprints,
    loading,
    error,
    refetch: fetchSprints,
    createSprint,
    updateSprint,
    deleteSprint,
  }
}

export function useSprintDetail(id) {
  const [sprint, setSprint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSprint = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await sprintService.getSprint(id)
      setSprint(data)
    } catch (err) {
      setError(err.message || 'Error loading sprint')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSprint()
  }, [fetchSprint])

  const updateSprint = useCallback(async (data) => {
    const updated = await sprintService.updateSprint(id, data)
    await fetchSprint()
    return updated
  }, [id, fetchSprint])

  return { sprint, loading, error, refetch: fetchSprint, updateSprint }
}
