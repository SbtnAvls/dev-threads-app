import {
  Bell, MessageSquare, GitCommit, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, UserPlus, Pencil,
} from 'lucide-react'
import { timeAgo } from '../../utils/helpers'

const TYPE_ICON = {
  comment: { Icon: MessageSquare, color: 'text-text-secondary' },
  commit: { Icon: GitCommit, color: 'text-accent-blue' },
  approval: { Icon: CheckCircle2, color: 'text-status-approved' },
  rejection: { Icon: XCircle, color: 'text-status-rejected' },
  tech_debt: { Icon: AlertTriangle, color: 'text-status-tech-debt' },
  issue_status_changed: { Icon: RefreshCw, color: 'text-status-in-review' },
  issue_assigned: { Icon: UserPlus, color: 'text-accent-blue' },
  issue_updated: { Icon: Pencil, color: 'text-text-secondary' },
}

export function NotificationItem({ notification, onClick }) {
  const { type, message, is_read, created_at } = notification
  const { Icon, color } = TYPE_ICON[type] || { Icon: Bell, color: 'text-text-secondary' }

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elevated ${
        is_read ? '' : 'bg-accent-blue/5'
      }`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm line-clamp-2 ${
            is_read ? 'text-text-secondary' : 'text-text-primary'
          }`}
        >
          {message}
        </span>
        <span className="block text-xs text-text-muted mt-0.5">{timeAgo(created_at)}</span>
      </span>

      {!is_read && (
        <span className="mt-1.5 w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" aria-label="No leída" />
      )}
    </button>
  )
}
