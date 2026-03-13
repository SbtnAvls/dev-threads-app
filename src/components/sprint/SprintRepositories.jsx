import { GitBranch, ExternalLink, Lock, Globe } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '../ui'

export function SprintRepositories({ repositories = [] }) {
  if (repositories.length === 0) return null

  return (
    <Card hover={false}>
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-4 h-4 text-text-muted" />
        <h3 className="text-sm font-medium text-text-primary">Repositorios</h3>
        <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded-full bg-bg-elevated">
          {repositories.length}
        </span>
      </div>

      <div className="space-y-2">
        {repositories.map((repo) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'flex items-center gap-2.5 p-2.5 rounded-lg',
              'bg-bg-elevated/50 hover:bg-bg-elevated transition-colors group'
            )}
          >
            {/* GitHub icon */}
            <div className="p-1.5 rounded-md bg-bg-primary shrink-0">
              <GitBranch className="w-3.5 h-3.5 text-text-muted" />
            </div>

            {/* Repo info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate group-hover:text-white transition-colors">
                {repo.name}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {repo.full_name}
              </p>
            </div>

            {/* Visibility + external link */}
            <div className="flex items-center gap-1.5 shrink-0">
              {repo.private ? (
                <Lock className="w-3 h-3 text-status-in-review" title="Privado" />
              ) : (
                <Globe className="w-3 h-3 text-text-muted" title="Publico" />
              )}
              <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </Card>
  )
}
