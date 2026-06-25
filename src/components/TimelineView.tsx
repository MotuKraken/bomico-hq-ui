import { useState, useEffect } from 'react'
import { getTimeline } from '../api'
import type { TimelineEvent } from '../api'

function formatDate(ts: string) {
  try {
    return new Date(ts).toLocaleDateString('de-CH', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  } catch { return ts?.slice(0, 10) ?? '' }
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function groupByDate(events: TimelineEvent[]) {
  const map: Record<string, TimelineEvent[]> = {}
  for (const e of events) {
    const day = e.ts?.slice(0, 10) ?? 'Unbekannt'
    if (!map[day]) map[day] = []
    map[day].push(e)
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
}

export function TimelineView() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTimeline()
      .then(r => setEvents(r.events))
      .catch(() => setError('Fehler beim Laden der Timeline'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="timeline-view"><div style={{ color: 'var(--muted)' }}>Lade Timeline…</div></div>
  if (error) return <div className="timeline-view"><div style={{ color: 'var(--red)' }}>{error}</div></div>
  if (events.length === 0) return <div className="timeline-view"><div style={{ color: 'var(--muted)' }}>Keine Events in den letzten 30 Tagen.</div></div>

  const grouped = groupByDate(events)

  return (
    <div className="timeline-view">
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
        📅 Timeline — letzte 30 Tage
      </h2>
      {grouped.map(([day, dayEvents]) => (
        <div key={day} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 8 }}>
            {formatDate(day)}
          </div>
          {dayEvents.map((e, i) => (
            <div key={i} className="timeline-event">
              <div className={`timeline-dot ${e.type}`} />
              <div className="timeline-info">
                <div className="timeline-title">{e.title}</div>
                <div className="timeline-ts">
                  {formatTime(e.ts)}
                  {e.hash ? ` · ${e.hash}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default TimelineView
