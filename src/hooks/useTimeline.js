import { useState, useEffect, useCallback } from 'react'
import issueService from '../services/issueService'

export function useTimeline(issueId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTimeline = useCallback(async () => {
    if (!issueId) return
    setLoading(true)
    setError(null)
    try {
      const data = await issueService.getTimeline(issueId)
      setEntries(data.results || data)
    } catch (err) {
      setError(err.message || 'Error loading timeline')
    } finally {
      setLoading(false)
    }
  }, [issueId])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  const addEntry = useCallback(async (data) => {
    const entry = await issueService.addTimelineEntry(issueId, data)
    await fetchTimeline()
    return entry
  }, [issueId, fetchTimeline])

  return { entries, loading, error, addEntry, refetch: fetchTimeline }
}
