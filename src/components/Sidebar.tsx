import type { Project } from '../api'
import { clearToken } from '../api'

interface Props {
  projects: Project[]
  activeView: string        // 'home' | project.id
  onSelectHome: () => void
  onSelectProject: (p: Project) => void
  onNewProject: () => void
}

export function Sidebar({ projects, activeView, onSelectHome, onSelectProject, onNewProject }: Props) {
  return (
    <nav className="hq-sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">⬡</span>
        BOMICO HQ
        <span className="logo-badge">LIVE</span>
      </div>

      <div className="sidebar-section">
        <div className={`sidebar-item${activeView === 'home' ? ' active' : ''}`} onClick={onSelectHome}>
          <span className="item-icon">◈</span>
          Main Chat
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-section-label">Projects</div>
        {projects.map(p => (
          <div key={p.id}
            className={`sidebar-item${activeView === p.id ? ' active' : ''}`}
            onClick={() => onSelectProject(p)}>
            <div className="sidebar-project-dot" style={{ background: p.color ?? '#58a6ff' }} />
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
              {p.title}
            </span>
            {(p.checklist?.length ?? 0) > 0 && (
              <span style={{ fontSize:10, color:'var(--text-dim)' }}>
                {p.checklist?.filter(c => c.done).length ?? 0}/{p.checklist?.length ?? 0}
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
        <div className="sidebar-item" style={{ fontSize:11, color:'var(--text-dim)' }}>
          <span className="item-icon">◎</span>
          Agents (16)
        </div>
        <div className="sidebar-item">
          <span className="item-icon">🥋</span>
          Bomiko Pipeline
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-item"
          style={{ cursor:'pointer' }}
          onClick={() => { clearToken(); window.location.reload() }}>
          <span className="item-icon">⤴</span>
          <span style={{ fontSize:11, color:'var(--text-dim)' }}>Sign out</span>
        </div>
      </div>
    </nav>
  )
}

export default Sidebar
