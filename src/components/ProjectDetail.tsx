import { useState } from 'react';
import type { Project, ChecklistItem } from '../types';
import { updateProject } from '../api';

interface ProjectDetailProps {
  project: Project;
  onOpenChat: () => void;
  onProjectUpdated: (project: Project) => void;
  onDelete: (id: string) => void;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function ProjectDetail({
  project,
  onOpenChat,
  onProjectUpdated,
  onDelete,
}: ProjectDetailProps) {
  const [saving, setSaving] = useState(false);

  async function toggleChecklistItem(item: ChecklistItem) {
    const updated = (project.checklist ?? []).map(ci =>
      ci.id === item.id ? { ...ci, done: !ci.done } : ci
    );
    setSaving(true);
    try {
      const updatedProject = await updateProject(project.id, { checklist: updated });
      onProjectUpdated(updatedProject);
    } catch (err) {
      console.error('Failed to update checklist', err);
    } finally {
      setSaving(false);
    }
  }

  async function addChecklistItem() {
    const text = prompt('New checklist item:');
    if (!text?.trim()) return;
    const newItem: ChecklistItem = {
      id: generateId(),
      text: text.trim(),
      done: false,
    };
    const updated = [...(project.checklist ?? []), newItem];
    setSaving(true);
    try {
      const updatedProject = await updateProject(project.id, { checklist: updated });
      onProjectUpdated(updatedProject);
    } catch (err) {
      console.error('Failed to add checklist item', err);
    } finally {
      setSaving(false);
    }
  }

  async function removeChecklistItem(id: string) {
    const updated = (project.checklist ?? []).filter(ci => ci.id !== id);
    setSaving(true);
    try {
      const updatedProject = await updateProject(project.id, { checklist: updated });
      onProjectUpdated(updatedProject);
    } catch (err) {
      console.error('Failed to remove checklist item', err);
    } finally {
      setSaving(false);
    }
  }

  const checklist = project.checklist ?? [];
  const doneCount = checklist.filter(ci => ci.done).length;
  const progressPct = checklist.length > 0
    ? Math.round((doneCount / checklist.length) * 100)
    : 0;

  return (
    <div className="project-detail">
      {/* Header */}
      <div className="project-detail-header">
        <div
          className="project-detail-dot"
          style={{ background: project.color || 'var(--accent)' }}
        />
        <div className="project-detail-info">
          <div className="project-detail-title">{project.title}</div>
          {project.description && (
            <div className="project-detail-description">{project.description}</div>
          )}
        </div>
        <div className="project-detail-actions">
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm(`Delete "${project.title}"?`)) onDelete(project.id);
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Open chat button */}
      <button className="project-open-chat-btn" onClick={onOpenChat}>
        💬 Chat in project context
      </button>

      {/* Goals */}
      {project.goals && project.goals.length > 0 && (
        <div className="project-section">
          <div className="project-section-title">Goals</div>
          <div className="goals-list">
            {project.goals.map((g, i) => (
              <div key={i} className="goal-item">
                <div className="goal-bullet" />
                {g}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="project-section">
        <div className="project-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Checklist</span>
          {checklist.length > 0 && (
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>
              {doneCount}/{checklist.length} ({progressPct}%)
            </span>
          )}
        </div>

        {/* Progress bar */}
        {checklist.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <div className="topbar-usage-track">
              <div
                className="topbar-usage-fill green"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="checklist">
          {checklist.map(item => (
            <div
              key={item.id}
              className={`checklist-item ${item.done ? 'done' : ''}`}
              onClick={() => toggleChecklistItem(item)}
            >
              <div className="checklist-checkbox">
                {item.done && <span className="checklist-checkbox-check">✓</span>}
              </div>
              <span className="checklist-text">{item.text}</span>
              <button
                className="goal-chip-remove"
                onClick={e => { e.stopPropagation(); removeChecklistItem(item.id); }}
              >
                ✕
              </button>
            </div>
          ))}

          {checklist.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 12, fontStyle: 'italic', padding: '4px 0' }}>
              No checklist items yet
            </div>
          )}
        </div>

        <button
          className="btn"
          onClick={addChecklistItem}
          disabled={saving}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        >
          + Add item
        </button>
      </div>

      {/* Meta info */}
      {(project.createdAt || project.updatedAt) && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 'auto' }}>
          {project.createdAt && (
            <div>Created: {new Date(project.createdAt).toLocaleDateString()}</div>
          )}
          {project.updatedAt && (
            <div>Updated: {new Date(project.updatedAt).toLocaleDateString()}</div>
          )}
        </div>
      )}
    </div>
  );
}
