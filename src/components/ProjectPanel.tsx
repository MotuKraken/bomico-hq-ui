import { useState } from 'react'
import type { Project, ChecklistItem } from '../types'
import { updateProject } from '../api'

interface Props {
  project: Project
  onProjectUpdated: (p: Project) => void
  onDelete: (id: string) => void
}

function ProgressBar({ value }: { value: number }) {
  const color = value === 100 ? 'var(--green)' : value >= 60 ? 'var(--accent)' : value >= 30 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div className="pp-progress-row">
      <div className="pp-bar-w">
        <div className="pp-bar-f" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="pp-pct" style={{ color }}>{value}%</span>
    </div>
  )
}

export function ProjectPanel({ project, onProjectUpdated, onDelete }: Props) {
  const [saving, setSaving] = useState(false)

  const checklist = project.checklist ?? []
  const done = checklist.filter(c => c.done).length
  const pct = checklist.length > 0 ? Math.round((done / checklist.length) * 100) : 0

  async function toggleItem(item: ChecklistItem) {
    setSaving(true)
    try {
      const updated = await updateProject(project.id, {
        checklist: checklist.map(c =>
          c.id === item.id ? { ...c, done: !c.done } : c
        )
      })
      onProjectUpdated(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const created = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('de-CH')
    : new Date(Date.now()).toLocaleDateString('de-CH')

  return (
    <aside className="project-panel">

      {/* STATUS */}
      <div className="pp-section">
        <div className="pp-heading"><h3>Status</h3></div>
        <div className="pp-status-card">
          <div className="pp-title">
            <div className="pp-dot" style={{ background: project.color ?? 'var(--accent)' }} />
            {project.title}
          </div>
          {project.description && (
            <p className="pp-desc">{project.description}</p>
          )}
          <ProgressBar value={pct} />
          <div className="pp-badges">
            <span className="pp-badge blue">Aktiv</span>
            <span className="pp-badge grey">{created}</span>
            {pct === 100 && <span className="pp-badge green">✓ Abgeschlossen</span>}
          </div>
        </div>
      </div>

      {/* CHECKLIST */}
      <div className="pp-section">
        <div className="pp-heading">
          <h3>Aufgaben ({done}/{checklist.length})</h3>
        </div>
        {checklist.length === 0 ? (
          <p className="pp-empty">Keine Aufgaben. Im Chat definieren.</p>
        ) : (
          <div className="pp-checklist">
            {checklist.map(item => (
              <div key={item.id}
                className={`pp-check-item${saving ? ' disabled' : ''}`}
                onClick={() => !saving && toggleItem(item)}>
                <div className={`pp-checkbox${item.done ? ' done' : ''}`}>
                  {item.done && '✓'}
                </div>
                <span className={`pp-check-text${item.done ? ' done' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEXT STEPS — auto-generated from incomplete items */}
      {checklist.filter(c => !c.done).length > 0 && (
        <div className="pp-section">
          <div className="pp-heading"><h3>Nächste Schritte</h3></div>
          <div className="pp-steps">
            {checklist.filter(c => !c.done).slice(0, 3).map((item, i) => (
              <div key={item.id} className="pp-step">
                <div className="pp-step-num">{i + 1}</div>
                <div className="pp-step-text">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONNECTIONS */}
      <div className="pp-section">
        <div className="pp-heading"><h3>Verbindungen</h3></div>
        <div className="pp-connections">
          <div className="pp-conn">
            <div className="pp-conn-dot green" />
            <span className="pp-conn-name">OpenClaw Gateway</span>
            <span className="pp-conn-meta">:18789 aktiv</span>
          </div>
          <div className="pp-conn">
            <div className="pp-conn-dot green" />
            <span className="pp-conn-name">GitHub</span>
            <span className="pp-conn-meta">MotuKraken</span>
          </div>
          <div className="pp-conn">
            <div className="pp-conn-dot green" />
            <span className="pp-conn-name">Vault</span>
            <span className="pp-conn-meta">Single Source</span>
          </div>
          <div className="pp-conn">
            <div className="pp-conn-dot yellow" />
            <span className="pp-conn-name">Vault Sync</span>
            <span className="pp-conn-meta">22:05 Uhr</span>
          </div>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="pp-section pp-footer">
        <button className="pp-delete-btn" onClick={() => {
          if (confirm(`Projekt "${project.title}" löschen?`)) onDelete(project.id)
        }}>
          🗑 Projekt löschen
        </button>
      </div>

    </aside>
  )
}

export default ProjectPanel
