/**
 * Parse commit mentions in text content.
 *
 * Supported formats:
 *   - owner/repo@abc1234       (full_name with short SHA)
 *   - owner/repo@abc1234def56  (full_name with long SHA)
 *   - repo-name@abc1234        (repo name only with SHA)
 *   - abc1234def5678901234567  (bare SHA 7-40 hex chars, only if single repo linked)
 *
 * Returns an array of segments:
 *   - { type: 'text', value: 'some text' }
 *   - { type: 'commit', repoName: 'owner/repo', sha: 'abc1234', repoId: 1 }
 */

// Match owner/repo@sha or repo@sha
const REPO_SHA_PATTERN = /([\w.-]+(?:\/[\w.-]+)?)@([0-9a-fA-F]{7,40})/g

// Match bare SHA (7-40 hex chars, word boundaries)
const BARE_SHA_PATTERN = /\b([0-9a-fA-F]{7,40})\b/g

export function parseCommitMentions(text, repos = []) {
  if (!text || repos.length === 0) {
    return [{ type: 'text', value: text || '' }]
  }

  // Build lookup maps
  const repoByFullName = {}
  const repoByName = {}
  repos.forEach(r => {
    repoByFullName[r.full_name.toLowerCase()] = r
    repoByName[r.name.toLowerCase()] = r
  })

  const segments = []
  let lastIndex = 0

  // First pass: find repo@sha patterns
  const matches = []
  let match

  REPO_SHA_PATTERN.lastIndex = 0
  while ((match = REPO_SHA_PATTERN.exec(text)) !== null) {
    const repoRef = match[1]
    const sha = match[2]

    // Try to resolve repo
    const repo = repoByFullName[repoRef.toLowerCase()] || repoByName[repoRef.toLowerCase()]
    if (repo) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        repoName: repo.full_name,
        repoId: repo.id,
        sha,
      })
    }
  }

  // Second pass: bare SHA (only if single repo linked and no overlap with above)
  if (repos.length === 1) {
    const singleRepo = repos[0]
    BARE_SHA_PATTERN.lastIndex = 0
    while ((match = BARE_SHA_PATTERN.exec(text)) !== null) {
      const sha = match[1]
      const start = match.index
      const end = start + match[0].length

      // Skip if overlapping with an existing match
      const overlaps = matches.some(m => start < m.end && end > m.start)
      if (!overlaps) {
        // Also check it's not part of a repo@sha we already matched
        const charBefore = start > 0 ? text[start - 1] : ''
        if (charBefore !== '@') {
          matches.push({
            start,
            end,
            repoName: singleRepo.full_name,
            repoId: singleRepo.id,
            sha,
          })
        }
      }
    }
  }

  // Sort by start position
  matches.sort((a, b) => a.start - b.start)

  // Build segments
  for (const m of matches) {
    if (m.start > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, m.start) })
    }
    segments.push({
      type: 'commit',
      repoName: m.repoName,
      repoId: m.repoId,
      sha: m.sha,
    })
    lastIndex = m.end
  }

  // Trailing text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  // If no matches at all, return single text segment
  if (segments.length === 0) {
    return [{ type: 'text', value: text }]
  }

  return segments
}
