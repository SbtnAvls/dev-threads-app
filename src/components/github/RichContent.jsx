import { parseCommitMentions } from '../../utils/commitParser'
import { CommitMention } from './CommitMention'

/**
 * Renders text content with commit mentions parsed and replaced
 * by interactive CommitMention badges.
 *
 * Usage:
 *   <RichContent text="Fixed bug in owner/repo@abc1234" repos={issue.github_repos} />
 */
export function RichContent({ text, repos = [] }) {
  if (!text) return null

  const segments = parseCommitMentions(text, repos)

  // If no commit mentions found, render plain text
  if (segments.length === 1 && segments[0].type === 'text') {
    return <>{text}</>
  }

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          return <span key={i}>{segment.value}</span>
        }

        if (segment.type === 'commit') {
          return (
            <CommitMention
              key={`${segment.repoId}-${segment.sha}-${i}`}
              repoId={segment.repoId}
              repoName={segment.repoName}
              sha={segment.sha}
            />
          )
        }

        return null
      })}
    </>
  )
}
