import { useState } from 'react'
import { Projects } from '../api'
import type { Project } from '../api'

const COLORS = ['#58a6ff','#3fb950','#d29922','#f85149','#a371f7','#db6d28','#ff7b72','#39d353']

interface Props {
  onClose: () => void
  onCreated: (p: Project) => void
}

export function NewProjectModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goals, setGoals] = useState<string[]>([''])
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  function addGoal() { setGoals(g => [...g, '']) }
  function updateGoal(i: number, v: string) { setGoals(g => g.map((x, j) => j === i ? v : x)) }
  function removeGoal(i: number) { setGoals(g => g.filter((_, j) => j !== i)) }

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    try {
      const p = await Projects.create({
        title: title.trim(),
        description: description.trim(),
        goals: goals.filter(g => g.trim()),
        color
      })
      onCreated(p)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">New Project</div>
        <div className="modal-sub">Create a dedicated workspace with its own chat and checklist</div>

        <div className="field-group">
          <label className="field-label">Title *</label>
          <input className="field-input" value={title}
            onChange={e => setTitle(e.target.value)} placeholder="e.g. Bomiko Dashboard" autoFocus />
        </div>

        <div className="field-group">
          <label className="field-label">Description</label>
          <textarea className="field-textarea" value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this project about?" />
        </div>

        <div className="field-group">
          <label className="field-label">Goals / Checklist</label>
          <div className="goals-list">
            {goals.map((g, i) => (
              <div className="goal-row" key={i}>
                <input className="goal-input" value={g}
                  onChange={e => updateGoal(i, e.target.value)}
                  placeholder={`Goal ${i + 1}`}
                  onKeyDown={e => e.key === 'Enter' && addGoal()} />
                {goals.length > 1 &&
                  <button className="goal-del" onClick={() => removeGoal(i)}>×</button>}
              </div>
            ))}
          </div>
          <button className="add-goal-btn" onClick={addGoal}>+ Add goal</button>
        </div>

        <div className="field-group">
          <label className="field-label">Color</label>
          <div className="color-swatches">
            {COLORS.map(c => (
              <div key={c} className={`color-swatch${color === c ? ' selected' : ''}`}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !title.trim()}>
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
