import { useEffect, useState } from 'react'
import { Usage } from '../api'
import type { UsageData } from '../api'

interface Props { title: string; subtitle?: string }

export function TopBar({ title, subtitle }: Props) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const d = await Usage.get()
        setUsage(d)
        setOnline(true)
      } catch {
        setOnline(false)
      }
    }
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [])

  const pct = usage?.budgetUsedPct ?? 0
  const barClass = pct < 60 ? 'low' : pct < 85 ? 'mid' : 'high'

  return (
    <div className="hq-topbar">
      <div className={`topbar-dot${online ? '' : ' offline'}`} title={online ? 'Online' : 'Offline'} />
      <div className="topbar-title">
        {title}
        {subtitle && <span className="topbar-sub">{subtitle}</span>}
      </div>

      {usage && (
        <div className="usage-widget">
          <span className="usage-label">Budget:</span>
          <div className="usage-bar-wrap">
            <div className={`usage-bar ${barClass}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="usage-cost">${usage.estimatedCostUsd.toFixed(2)}</span>
          <span className="usage-label" style={{ color: 'var(--text-dim)' }}>
            / ${usage.budgetMonthlyUsd}
          </span>
          <span className="usage-label" style={{ marginLeft: 4 }}>
            {usage.activeSessions} sessions
          </span>
        </div>
      )}
    </div>
  )
}
