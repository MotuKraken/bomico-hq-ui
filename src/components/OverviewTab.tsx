import { useState } from 'react'
import type { Project } from '../types'
import { updateProject } from '../api'

interface Props {
  project: Project
  onProjectUpdated: (p: Project) => void
}

export default function OverviewTab({ project, onProjectUpdated }: Props) {
  const [editDesc, setEditDesc] = useState(false)
  const [desc, setDesc] = useState(project.description ?? '')
  const [saving, setSaving] = useState(false)
  const checklist = project.checklist ?? []
  const done = checklist.filter(c => c.done).length
  const pct = checklist.length > 0 ? Math.round(done / checklist.length * 100) : 0

  async function saveDesc() {
    setSaving(true)
    try {
      const updated = await updateProject(project.id, { description: desc })
      onProjectUpdated(updated)
      setEditDesc(false)
    } finally { setSaving(false) }
  }

  return (
    <div className="tab-content">
      <div className="overview-header">
        <div className="ov-title">
          <div style={{ width:12, height:12, borderRadius:'50%', background: project.color ?? 'var(--accent)', flexShrink:0 }} />
          <h1>{project.title}</h1>
        </div>
        <div className="ov-meta">
          Erstellt: {project.createdAt ? new Date(project.createdAt).toLocaleDateString('de-CH') : '–'}
        </div>
      </div>

      <div className="ov-grid">
        {/* Description */}
        <div className="ov-card">
          <div className="ov-card-head">
            <h3>Beschreibung</h3>
            {!editDesc && <button className="ov-edit-btn" onClick={() => setEditDesc(true)}>✏️ Bearbeiten</button>}
          </div>
          {editDesc ? (
            <div>
              <textarea className="ov-textarea" value={desc}
                onChange={e => setDesc(e.target.value)} rows={4} autoFocus />
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button className="btn btn-primary" onClick={saveDesc} disabled={saving}>Speichern</button>
                <button className="btn btn-ghost" onClick={() => { setEditDesc(false); setDesc(project.description ?? '') }}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <p className="ov-desc">{project.description || <em style={{color:'var(--dim)'}}>Keine Beschreibung</em>}</p>
          )}
        </div>

        {/* Progress */}
        <div className="ov-card">
          <div className="ov-card-head"><h3>Fortschritt</h3></div>
          <div className="ov-progress-big">
            <div className="ov-pct-num" style={{ color: pct === 100 ? 'var(--green)' : 'var(--text)' }}>{pct}%</div>
            <div className="ov-bar-big">
              <div style={{ height:'100%', borderRadius:4,
                background: pct===100?'var(--green)':pct>=60?'var(--accent)':'var(--yellow)',
                width:`${pct}%`, transition:'width .4s' }} />
            </div>
            <div className="ov-pct-label">{done} von {checklist.length} Aufgaben erledigt</div>
          </div>
        </div>

        {/* Tasks summary */}
        <div className="ov-card ov-wide">
          <div className="ov-card-head"><h3>Alle Aufgaben</h3></div>
          {checklist.length === 0 ? (
            <p style={{color:'var(--dim)',fontSize:12}}>Noch keine Aufgaben. Im Chat definieren.</p>
          ) : (
            <div className="ov-task-list">
              {checklist.map(item => (
                <div key={item.id} className={`ov-task-row${item.done?' done':''}`}>
                  <span className="ov-task-icon">{item.done ? '✅' : '⬜'}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
