import type { Usage, Approval, Project } from '../types'

type Tab = 'chat' | 'overview' | 'artifacts'

interface Props {
  title: string
  project: Project | null
  tab: Tab
  onTabChange: (t: Tab) => void
  usage: Usage | null
  approvals: Approval[]
  loading: boolean
  onRefresh: () => Promise<void>
}

export function TopBar({ title, project, tab, onTabChange, usage, approvals, loading, onRefresh }: Props) {
  const pct = usage?.budgetUsedPct ?? 0
  const barColor = pct < 60 ? 'var(--green)' : pct < 85 ? 'var(--yellow)' : 'var(--red)'

  return (
    <header className="hq-topbar">
      <div className="topbar-left">
        {project && <div className="proj-dot" style={{ background: project.color ?? 'var(--accent)' }} />}
        <span className="topbar-title">{title}</span>
        {project && (
          <>
            <span className="topbar-sep">›</span>
            <button className={`topbar-tab${tab === 'chat' ? ' active' : ''}`} onClick={() => onTabChange('chat')}>
              💬 Chat
            </button>
            <button className={`topbar-tab${tab === 'overview' ? ' active' : ''}`} onClick={() => onTabChange('overview')}>
              📋 Übersicht
            </button>
            <button className={`topbar-tab${tab === 'artifacts' ? ' active' : ''}`} onClick={() => onTabChange('artifacts')}>
              📎 Artefakte
            </button>
          </>
        )}
      </div>

      <div className="topbar-right">
        {approvals.length > 0 && (
          <span className="topbar-badge-red">{approvals.length} pending</span>
        )}
        {usage && (
          <div className="usage-pill">
            <div className="usage-bar-w">
              <div className="usage-bar-f" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span className="usage-cost">${usage.estimatedCostUsd.toFixed(2)}</span>
            <span className="usage-dim">/ ${usage.budgetMonthlyUsd}</span>
            <span className="usage-dim">{usage.activeSessions} sessions</span>
          </div>
        )}
        <div className="status-dot" title="Online" />
        <button className="topbar-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '⟳' : '↺'}
        </button>
      </div>
    </header>
  )
}

export default TopBar
