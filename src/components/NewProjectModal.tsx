import { useState } from 'react'
import type { CreateProjectPayload } from '../types'

const COLORS = ['#58a6ff','#3fb950','#d29922','#f85149','#a371f7','#db6d28','#ff7b72']

interface Props {
  onSave: (payload: CreateProjectPayload) => Promise<void>
  onCancel: () => void
}

export function NewProjectModal({ onSave, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goals, setGoals] = useState<string[]>([''])
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  const addGoal = () => setGoals(g => [...g, ''])
  const updateGoal = (i: number, v: string) => setGoals(g => g.map((x, j) => j===i ? v : x))
  const removeGoal = (i: number) => setGoals(g => g.filter((_, j) => j !== i))

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        goals: goals.filter(g => g.trim()),
        color
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal-box">
        <div className="modal-title">New Project</div>
        <div className="modal-sub">Create a workspace with its own chat and checklist</div>

        <div className="field-group">
          <label className="field-label">Title *</label>
          <input className="field-input" value={title}
            onChange={e => setTitle(e.target.value)} placeholder="Project name" autoFocus />
        </div>

        <div className="field-group">
          <label className="field-label">Description</label>
          <textarea className="field-textarea" value={description}
            onChange={e => setDescription(e.target.value)} placeholder="What is this project?" />
        </div>

        <div className="field-group">
          <label className="field-label">Goals / Checklist</label>
          <div className="goals-list">
            {goals.map((g, i) => (
              <div className="goal-row" key={i}>
                <input className="goal-input" value={g}
                  onChange={e => updateGoal(i, e.target.value)}
                  placeholder={`Goal ${i+1}`}
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
              <div key={c} className={`color-swatch${color===c?' selected':''}`}
                style={{background:c}} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || !title.trim()}>
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewProjectModal
