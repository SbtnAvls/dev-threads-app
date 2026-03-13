import { useState, useEffect, useCallback } from 'react'
import orgService from '../services/orgService'

export function useComplexityLevels({ enabled = true } = {}) {
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLevels = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const data = await orgService.getComplexityLevels()
      const activeLevels = (data.results || data).filter(l => l.is_active)
      setLevels(activeLevels)
    } catch (err) {
      setError(err.message || 'Error loading complexity levels')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetchLevels()
  }, [fetchLevels])

  return { levels, loading, error, refetch: fetchLevels }
}
