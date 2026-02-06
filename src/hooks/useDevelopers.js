import { useState, useEffect, useCallback } from 'react'
import userService from '../services/userService'

export function useDevelopers(params = {}) {
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDevelopers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await userService.getUsers(params)
      setDevelopers(data.results || data)
    } catch (err) {
      setError(err.message || 'Error loading developers')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => {
    fetchDevelopers()
  }, [fetchDevelopers])

  return { developers, loading, error, refetch: fetchDevelopers }
}

export function useDeveloperDetail(id) {
  const [developer, setDeveloper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDeveloper = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await userService.getUser(id)
      setDeveloper(data)
    } catch (err) {
      setError(err.message || 'Error loading developer')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDeveloper()
  }, [fetchDeveloper])

  return { developer, loading, error, refetch: fetchDeveloper }
}

export function useRoles() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userService.getRoles()
      .then(data => setRoles(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { roles, loading }
}
