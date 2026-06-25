import type { Usage, Approval } from '../types'

interface Props {
  title: string
  usage: Usage | null
  approvals: Approval[]
  loading: boolean
  onRefresh: () => Promise<void>
}

export function TopBar({ title, usage, approvals, loading, onRefresh }: Props) {
  const pct = usage?.budgetUsedPct ?? 0
  const barClass = pct < 60 ? 'low' : pct < 85 ? 'mid' : 'high'
  const pendingCount = approvals.length

  return (
    <header className="hq-topbar">
      <div className={`topbar-dot${usage ? '' : ' offline'}`} />
      <div className="topbar-title">
        {title}
      </div>

      {usage && (
        <div className="usage-widget">
          <span className="usage-label">Budget</span>
          <div className="usage-bar-wrap">
            <div className={`usage-bar ${barClass}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="usage-cost">${usage.estimatedCostUsd.toFixed(2)}</span>
          <span className="usage-label">/ ${usage.budgetMonthlyUsd}</span>
          <span className="usage-label" style={{ marginLeft:6 }}>
            {usage.activeSessions} sessions
          </span>
        </div>
      )}

      {pendingCount > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
          <span style={{ background:'var(--red)', color:'#fff', borderRadius:4, padding:'2px 7px', fontWeight:600 }}>
            {pendingCount} pending
          </span>
        </div>
      )}

      <button
        style={{
          background:'var(--card)', border:'1px solid var(--border)',
          borderRadius:'var(--radius)', color:'var(--text-muted)',
          padding:'4px 10px', cursor:'pointer', fontSize:11,
          opacity: loading ? 0.5 : 1
        }}
        onClick={onRefresh}
        disabled={loading}
      >
        {loading ? '⟳' : '↺'} Refresh
      </button>
    </header>
  )
}

export default TopBar
