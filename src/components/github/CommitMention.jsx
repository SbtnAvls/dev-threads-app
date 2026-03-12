import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCommit, ExternalLink, Plus, Minus, FileText, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import githubService from '../../services/githubService'

// Simple in-memory cache for commit data
const commitCache = new Map()

function getCacheKey(repoId, sha) {
  return `${repoId}:${sha}`
}

export function CommitMention({ repoId, repoName, sha }) {
  const [commit, setCommit] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [popoverPos, setPopoverPos] = useState('bottom')
  const badgeRef = useRef(null)
  const popoverRef = useRef(null)
  const timeoutRef = useRef(null)

  const shortSha = sha.slice(0, 7)
  const cacheKey = getCacheKey(repoId, sha)

  const fetchCommit = useCallback(async () => {
    // Check cache first
    const cached = commitCache.get(cacheKey)
    if (cached) {
      setCommit(cached)
      return
    }

    setLoading(true)
    setError(false)
    try {
      const data = await githubService.getCommit(repoId, sha)
      commitCache.set(cacheKey, data)
      setCommit(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [repoId, sha, cacheKey])

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setShowPopover(true)
      if (!commit && !loading && !error) {
        fetchCommit()
      }

      // Calculate popover position
      if (badgeRef.current) {
        const rect = badgeRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        setPopoverPos(spaceBelow < 200 ? 'top' : 'bottom')
      }
    }, 300)
  }

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setShowPopover(false)
    }, 200)
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  // Close popover on click outside
  useEffect(() => {
    if (!showPopover) return
    const handleClick = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        badgeRef.current && !badgeRef.current.contains(e.target)
      ) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPopover])

  const commitUrl = commit?.html_url || (repoName
    ? `https://github.com/${repoName}/commit/${sha}`
    : null)

  return (
    <span className="relative inline-block align-baseline">
      {/* Badge */}
      <a
        ref={badgeRef}
        href={commitUrl || '#'}
        target={commitUrl ? '_blank' : undefined}
        rel="noopener noreferrer"
        onClick={e => { if (!commitUrl) e.preventDefault() }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={clsx(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-mono',
          'bg-status-tech-debt/15 text-status-tech-debt border border-status-tech-debt/20',
          'hover:bg-status-tech-debt/25 hover:border-status-tech-debt/40',
          'transition-all cursor-pointer no-underline'
        )}
      >
        <GitCommit className="w-3 h-3 flex-shrink-0" />
        <span>{shortSha}</span>
      </a>

      {/* Popover */}
      <AnimatePresence>
        {showPopover && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: popoverPos === 'bottom' ? -4 : 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: popoverPos === 'bottom' ? -4 : 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => clearTimeout(timeoutRef.current)}
            onMouseLeave={handleMouseLeave}
            className={clsx(
              'absolute z-50 w-80 rounded-xl border border-border-primary bg-bg-elevated shadow-xl',
              popoverPos === 'bottom' ? 'top-full mt-2 left-0' : 'bottom-full mb-2 left-0'
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-accent-blue animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-xs text-text-muted">No se pudo cargar el commit</p>
                <a
                  href={commitUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent-blue hover:underline mt-1 inline-block"
                >
                  Ver en GitHub
                </a>
              </div>
            ) : commit ? (
              <div className="p-4 space-y-3">
                {/* Author */}
                <div className="flex items-center gap-2">
                  {commit.author_avatar_url ? (
                    <img
                      src={commit.author_avatar_url}
                      alt={commit.author_name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-bg-primary flex items-center justify-center">
                      <span className="text-[10px] text-text-muted font-medium">
                        {(commit.author_name || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">
                      {commit.author_name}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {commit.authored_date
                        ? new Date(commit.authored_date).toLocaleDateString('es', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })
                        : ''
                      }
                    </p>
                  </div>
                </div>

                {/* Commit message */}
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                  {commit.message}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-text-muted">{sha.slice(0, 10)}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    {commit.additions !== undefined && (
                      <span className="flex items-center gap-0.5 text-status-approved">
                        <Plus className="w-3 h-3" />
                        {commit.additions}
                      </span>
                    )}
                    {commit.deletions !== undefined && (
                      <span className="flex items-center gap-0.5 text-status-rejected">
                        <Minus className="w-3 h-3" />
                        {commit.deletions}
                      </span>
                    )}
                    {commit.changed_files !== undefined && (
                      <span className="flex items-center gap-0.5 text-text-muted">
                        <FileText className="w-3 h-3" />
                        {commit.changed_files}
                      </span>
                    )}
                  </div>
                </div>

                {/* GitHub link */}
                {commit.html_url && (
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-accent-blue hover:underline pt-1 border-t border-border-primary"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver en GitHub
                  </a>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
