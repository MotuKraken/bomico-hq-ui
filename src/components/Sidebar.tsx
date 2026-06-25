import type { Project } from '../api'
import { clearToken } from '../api'

interface Nav {
  id: string
  label: string
  icon: string
  badge?: number
}

const NAV_MAIN: Nav[] = [
  { id: 'home', label: 'Overview', icon: '⊞' },
  { id: 'chat', label: 'Main Chat', icon: '◈' },
  { id: 'approvals', label: 'Approvals', icon: '⚡', badge: 0 },
]

const NAV_SYSTEM: Nav[] = [
  { id: 'agents', label: 'Agents', icon: '◎' },
  { id: 'bomiko', label: 'Bomiko Pipeline', icon: '🥋' },
]

interface Props {
  active: string
  projects: Project[]
  approvalCount: number
  onNav: (id: string) => void
  onNewProject: () => void
}

export function Sidebar({ active, projects, approvalCount, onNav, onNewProject }: Props) {
  return (
    <div className="hq-sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">⬡</span>
        BOMICO HQ
        <span className="logo-badge">LIVE</span>
      </div>

      <div className="sidebar-section">
        {NAV_MAIN.map(n => (
          <div key={n.id} className={`sidebar-item${active === n.id ? ' active' : ''}`}
            onClick={() => onNav(n.id)}>
            <span className="item-icon">{n.icon}</span>
            {n.label}
            {n.id === 'approvals' && approvalCount > 0 &&
              <span className="item-badge">{approvalCount}</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-section-label">Projects</div>
        {projects.map(p => (
          <div key={p.id}
            className={`sidebar-item${active === `project-${p.id}` ? ' active' : ''}`}
            onClick={() => onNav(`project-${p.id}`)}>
            <div className="sidebar-project-dot" style={{ background: p.color }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.title}
            </span>
            {p.checklist?.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)' }}>
                {p.checklist.filter(c => c.done).length}/{p.checklist.length}
              </span>
            )}
          </div>
        ))}
        <button className="sidebar-add-btn" onClick={onNewProject}>
          <span>＋</span> New Project
        </button>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-section-label">System</div>
        {NAV_SYSTEM.map(n => (
          <div key={n.id} className={`sidebar-item${active === n.id ? ' active' : ''}`}
            onClick={() => onNav(n.id)}>
            <span className="item-icon">{n.icon}</span>
            {n.label}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-item" onClick={() => { clearToken(); window.location.reload() }}
          style={{ cursor: 'pointer' }}>
          <span className="item-icon">⤴</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Sign out</span>
        </div>
      </div>
    </div>
  )
}
