import { useState, useEffect, useCallback } from 'react'
import githubService from '../services/githubService'

export function useGitHubConnections() {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConnections = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await githubService.getConnections()
      setConnections(data.results || data)
    } catch (err) {
      setError(err.message || 'Error al cargar conexiones GitHub')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  const createConnection = useCallback(async (data) => {
    const newConn = await githubService.createConnection(data)
    await fetchConnections()
    return newConn
  }, [fetchConnections])

  const deleteConnection = useCallback(async (id) => {
    const result = await githubService.deleteConnection(id)
    await fetchConnections()
    return result
  }, [fetchConnections])

  return {
    connections,
    loading,
    error,
    refetch: fetchConnections,
    createConnection,
    deleteConnection,
  }
}

export function useGitHubRepos(params = {}) {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRepos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await githubService.getRepos(params)
      setRepos(data.results || data)
    } catch (err) {
      setError(err.message || 'Error al cargar repositorios')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => {
    fetchRepos()
  }, [fetchRepos])

  const addRepos = useCallback(async (connectionId, reposData) => {
    const result = await githubService.addRepos(connectionId, reposData)
    await fetchRepos()
    return result
  }, [fetchRepos])

  const toggleRepo = useCallback(async (id, isActive) => {
    const result = await githubService.toggleRepo(id, isActive)
    await fetchRepos()
    return result
  }, [fetchRepos])

  const deleteRepo = useCallback(async (id) => {
    const result = await githubService.deleteRepo(id)
    await fetchRepos()
    return result
  }, [fetchRepos])

  return {
    repos,
    loading,
    error,
    refetch: fetchRepos,
    addRepos,
    toggleRepo,
    deleteRepo,
  }
}
