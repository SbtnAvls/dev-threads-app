import { useState, useEffect, useCallback, useMemo } from 'react'
import issueService from '../services/issueService'
import userService from '../services/userService'
import sprintService from '../services/sprintService'
import { fullName } from '../utils/helpers'

export function useMetricsData(dateRange = {}) {
  const [issues, setIssues] = useState([])
  const [developers, setDevelopers] = useState([])
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [issuesData, devsData, sprintsData] = await Promise.all([
        issueService.getIssues({ ordering: '-created_at' }),
        userService.getUsers(),
        sprintService.getSprints(),
      ])
      setIssues(issuesData.results || issuesData)
      setDevelopers(devsData.results || devsData)
      setSprints(sprintsData.results || sprintsData)
    } catch (err) {
      setError(err.message || 'Error loading metrics data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Filter issues by date range
  const filteredIssues = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return issues
    return issues.filter(issue => {
      const created = new Date(issue.created_at)
      if (dateRange.from && created < dateRange.from) return false
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to)
        endOfDay.setHours(23, 59, 59, 999)
        if (created > endOfDay) return false
      }
      return true
    })
  }, [issues, dateRange.from, dateRange.to])

  // Issues by status
  const issuesByStatus = useMemo(() => {
    const counts = { open: 0, in_review: 0, approved: 0, rejected: 0, tech_debt: 0 }
    filteredIssues.forEach(i => {
      if (counts[i.status] !== undefined) counts[i.status]++
    })
    return [
      { name: 'Abiertos', value: counts.open, color: '#3b82f6' },
      { name: 'En Revision', value: counts.in_review, color: '#f59e0b' },
      { name: 'Aprobados', value: counts.approved, color: '#10b981' },
      { name: 'Rechazados', value: counts.rejected, color: '#ef4444' },
      { name: 'Deuda Tecnica', value: counts.tech_debt, color: '#8b5cf6' },
    ]
  }, [filteredIssues])

  // Issues by priority
  const issuesByPriority = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 }
    filteredIssues.forEach(i => {
      if (counts[i.priority] !== undefined) counts[i.priority]++
    })
    return [
      { name: 'Baja', value: counts.low, color: '#6b7280' },
      { name: 'Media', value: counts.medium, color: '#3b82f6' },
      { name: 'Alta', value: counts.high, color: '#f59e0b' },
      { name: 'Critica', value: counts.critical, color: '#ef4444' },
    ]
  }, [filteredIssues])

  // Workload per developer (stacked by status)
  const workloadByDev = useMemo(() => {
    const devMap = {}
    filteredIssues.forEach(issue => {
      if (!issue.assigned_to) return
      const devId = issue.assigned_to.id
      if (!devMap[devId]) {
        devMap[devId] = {
          name: fullName(issue.assigned_to),
          open: 0,
          in_review: 0,
          approved: 0,
          rejected: 0,
          tech_debt: 0,
          total: 0,
        }
      }
      devMap[devId][issue.status]++
      devMap[devId].total++
    })
    return Object.values(devMap).sort((a, b) => b.total - a.total)
  }, [filteredIssues])

  // Issues by tag
  const issuesByTag = useMemo(() => {
    const tagMap = {}
    filteredIssues.forEach(issue => {
      (issue.tags || []).forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1
      })
    })
    return Object.entries(tagMap)
      .map(([name, value]) => ({ name: `#${name}`, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)
  }, [filteredIssues])

  // Sprint velocity (all sprints, not date-filtered)
  const sprintVelocity = useMemo(() => {
    return sprints
      .filter(s => s.status === 'completed' || s.status === 'active')
      .map(sprint => {
        const sprintIssues = issues.filter(i => i.sprint?.id === sprint.id || i.sprint === sprint.id)
        const approved = sprintIssues.filter(i => i.status === 'approved').length
        return {
          name: sprint.name,
          total: sprint.issue_count || sprintIssues.length,
          approved,
          rate: sprint.issue_count > 0
            ? Math.round((approved / sprint.issue_count) * 100)
            : 0,
        }
      })
  }, [sprints, issues])

  // Issues by complexity level
  const issuesByComplexity = useMemo(() => {
    const levelMap = {}
    filteredIssues.forEach(issue => {
      if (!issue.complexity) return
      const key = issue.complexity.id
      if (!levelMap[key]) {
        levelMap[key] = {
          name: issue.complexity.label,
          value: 0,
          color: issue.complexity.color,
          points: issue.complexity.value,
        }
      }
      levelMap[key].value++
    })
    return Object.values(levelMap).sort((a, b) => a.points - b.points)
  }, [filteredIssues])

  // Total story points
  const totalStoryPoints = useMemo(() => {
    return filteredIssues.reduce((sum, issue) => {
      return sum + (issue.complexity?.value || 0)
    }, 0)
  }, [filteredIssues])

  // Story points per developer
  const storyPointsByDev = useMemo(() => {
    const devMap = {}
    filteredIssues.forEach(issue => {
      if (!issue.assigned_to || !issue.complexity) return
      const devId = issue.assigned_to.id
      if (!devMap[devId]) {
        devMap[devId] = { name: fullName(issue.assigned_to), points: 0, issues: 0 }
      }
      devMap[devId].points += issue.complexity.value
      devMap[devId].issues++
    })
    return Object.values(devMap).sort((a, b) => b.points - a.points)
  }, [filteredIssues])

  // Story points per sprint
  const storyPointsBySprint = useMemo(() => {
    return sprints
      .filter(s => s.status === 'completed' || s.status === 'active')
      .map(sprint => {
        const sprintIssues = issues.filter(i => i.sprint?.id === sprint.id || i.sprint === sprint.id)
        const totalPts = sprintIssues.reduce((sum, i) => sum + (i.complexity?.value || 0), 0)
        const approvedPts = sprintIssues
          .filter(i => i.status === 'approved')
          .reduce((sum, i) => sum + (i.complexity?.value || 0), 0)
        return {
          name: sprint.name,
          total: totalPts,
          approved: approvedPts,
        }
      })
  }, [sprints, issues])

  // Rejection rate per developer
  const rejectionRate = useMemo(() => {
    const devMap = {}
    filteredIssues.forEach(issue => {
      if (!issue.assigned_to) return
      const devId = issue.assigned_to.id
      if (!devMap[devId]) {
        devMap[devId] = { name: fullName(issue.assigned_to), total: 0, rejected: 0 }
      }
      devMap[devId].total++
      if (issue.status === 'rejected') devMap[devId].rejected++
    })
    return Object.values(devMap)
      .map(d => ({
        ...d,
        rate: d.total > 0 ? Math.round((d.rejected / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
  }, [filteredIssues])

  return {
    loading,
    error,
    refetch: fetchAll,
    filteredIssues,
    issuesByStatus,
    issuesByPriority,
    issuesByComplexity,
    workloadByDev,
    issuesByTag,
    sprintVelocity,
    storyPointsByDev,
    storyPointsBySprint,
    rejectionRate,
    developers,
    sprints,
    totalIssues: filteredIssues.length,
    totalStoryPoints,
  }
}
