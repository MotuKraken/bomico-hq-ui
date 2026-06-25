import { useState, useRef } from 'react'
import type { Project, ChecklistItem } from '../types'
import { updateProject } from '../api'

interface Props {
  project: Project
  onProjectUpdated: (p: Project) => void
  onDelete: (id: string) => void
}

function genId() { return Math.random().toString(36).slice(2, 10) }

export function ProjectPanel({ project, onProjectUpdated, onDelete }: Props) {
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newTaskText, setNewTaskText] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const newTaskRef = useRef<HTMLInputElement>(null)

  const checklist = project.checklist ?? []
  const done = checklist.filter(c => c.done).length
  const pct = checklist.length > 0 ? Math.round((done / checklist.length) * 100) : 0

  async function save(newChecklist: ChecklistItem[]) {
    setSaving(true)
    try {
      const updated = await updateProject(project.id, { checklist: newChecklist })
      onProjectUpdated(updated)
    } finally { setSaving(false) }
  }

  async function toggleItem(id: string) {
    await save(checklist.map(c => c.id === id ? { ...c, done: !c.done } : c))
  }

  async function addTask() {
    const text = newTaskText.trim()
    if (!text) return
    setNewTaskText('')
    await save([...checklist, { id: genId(), text, done: false }])
    setTimeout(() => newTaskRef.current?.focus(), 100)
  }

  async function deleteTask(id: string) {
    await save(checklist.filter(c => c.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  async function deleteSelected() {
    await save(checklist.filter(c => !selected.has(c.id)))
    setSelected(new Set())
  }

  async function finishEdit(id: string) {
    const text = editText.trim()
    setEditingId(null)
    if (!text) return
    await save(checklist.map(c => c.id === id ? { ...c, text } : c))
  }

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id)
    setEditText(item.text)
    setContextMenu(null)
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function handleContextMenu(e: React.MouseEvent, item: ChecklistItem) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id })
  }

  function closeCtx() { setContextMenu(null) }

  const pbarColor = pct === 100 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : pct >= 30 ? 'var(--yellow)' : 'var(--red)'
  const created = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('de-CH')
    : '–'

  return (
    <aside className="project-panel" onClick={closeCtx}>

      {/* STATUS */}
      <div className="pp-section">
        <div className="pp-heading"><h3>Status</h3></div>
        <div className="pp-status-card">
          <div className="pp-title">
            <div className="pp-dot" style={{ background: project.color ?? 'var(--accent)' }} />
            {project.title}
          </div>
          {project.description && <p className="pp-desc">{project.description}</p>}
          <div className="pp-progress-row">
            <div className="pp-bar-w">
              <div className="pp-bar-f" style={{ width: `${pct}%`, background: pbarColor }} />
            </div>
            <span className="pp-pct" style={{ color: pbarColor }}>{pct}%</span>
          </div>
          <div className="pp-badges">
            <span className="pp-badge blue">Aktiv</span>
            <span className="pp-badge grey">{created}</span>
            {pct === 100 && <span className="pp-badge green">✓ Done</span>}
          </div>
        </div>
      </div>

      {/* TASKS */}
      <div className="pp-section">
        <div className="pp-heading">
          <h3>Aufgaben ({done}/{checklist.length})</h3>
          {selected.size > 0 && (
            <button className="pp-bulk-del" onClick={deleteSelected}>
              🗑 {selected.size} löschen
            </button>
          )}
        </div>

        <div className="pp-checklist">
          {checklist.map((item, i) => (
            <div key={item.id}
              className={`pp-check-item${selected.has(item.id) ? ' selected' : ''}`}
              onContextMenu={e => handleContextMenu(e, item)}
              draggable={true}
              onDragStart={() => setDragIdx(i)}
              onDragOver={e => { e.preventDefault() }}
              onDrop={async () => {
                if (dragIdx === null || dragIdx === i) return
                const reordered = [...checklist]
                const [moved] = reordered.splice(dragIdx, 1)
                reordered.splice(i, 0, moved)
                await save(reordered)
                setDragIdx(null)
              }}>

              {/* Drag handle */}
              <span className="pp-drag-handle">⠿</span>

              {/* Select checkbox (appears on hover or when any selected) */}
              <div
                className={`pp-select-box${selected.size > 0 ? ' visible' : ''}`}
                onClick={e => { e.stopPropagation(); toggleSelect(item.id) }}>
                {selected.has(item.id) ? '✓' : ''}
              </div>

              {/* Done toggle */}
              <div
                className={`pp-checkbox${item.done ? ' done' : ''}`}
                onClick={() => !saving && toggleItem(item.id)}>
                {item.done && '✓'}
              </div>

              {/* Text — click to edit */}
              {editingId === item.id ? (
                <input
                  className="pp-edit-input"
                  autoFocus
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onBlur={() => finishEdit(item.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') finishEdit(item.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span
                  className={`pp-check-text${item.done ? ' done' : ''}`}
                  onDoubleClick={() => startEdit(item)}>
                  {item.text}
                </span>
              )}

              {/* Delete button */}
              <button
                className="pp-del-btn"
                onClick={e => { e.stopPropagation(); deleteTask(item.id) }}
                title="Löschen">×</button>
            </div>
          ))}
        </div>

        {/* Add new task */}
        <div className="pp-add-row">
          <input
            ref={newTaskRef}
            className="pp-add-input"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            placeholder="Neue Aufgabe…"
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <button className="pp-add-btn" onClick={addTask} title="Aufgabe hinzufügen">＋</button>
        </div>
      </div>

      {/* NEXT STEPS */}
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
          {[
            { label: 'OpenClaw Gateway', meta: ':18789 aktiv', color: 'green' },
            { label: 'GitHub', meta: 'MotuKraken', color: 'green' },
            { label: 'Vault', meta: 'Vault-Konsolidiert', color: 'green' },
            { label: 'Vault Sync', meta: '22:05 Uhr', color: 'yellow' },
          ].map(c => (
            <div key={c.label} className="pp-conn">
              <div className={`pp-conn-dot ${c.color}`} />
              <span className="pp-conn-name">{c.label}</span>
              <span className="pp-conn-meta">{c.meta}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="pp-section pp-footer">
        <button className="pp-delete-btn"
          onClick={() => confirm(`"${project.title}" löschen?`) && onDelete(project.id)}>
          🗑 Projekt löschen
        </button>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div className="ctx-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}>
          <div className="ctx-item" onClick={() => {
            const item = checklist.find(c => c.id === contextMenu.itemId)
            if (item) startEdit(item)
          }}>✏️ Bearbeiten</div>
          <div className="ctx-item danger" onClick={() => {
            deleteTask(contextMenu.itemId)
            closeCtx()
          }}>🗑 Löschen</div>
          <div className="ctx-item" onClick={() => {
            toggleSelect(contextMenu.itemId)
            closeCtx()
          }}>☑️ Auswählen</div>
        </div>
      )}
    </aside>
  )
}

export default ProjectPanel
