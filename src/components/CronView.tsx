import { useState, useEffect } from 'react'
import { getCronJobs } from '../api'
import type { CronJob } from '../api'

export function CronView() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getCronJobs()
      .then(r => { setJobs(r.jobs ?? []); setRaw(r.raw ?? '') })
      .catch(() => setError('Fehler beim Laden der Cron Jobs'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="cron-view"><div style={{ color: 'var(--muted)' }}>Lade Cron Jobs…</div></div>
  if (error) return <div className="cron-view"><div style={{ color: 'var(--red)' }}>{error}</div></div>

  return (
    <div className="cron-view">
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
        ⏰ Cron Jobs
      </h2>

      {jobs.length > 0 ? (
        jobs.map((job, i) => {
          const status = (job.status as string) ?? 'ok'
          const isOk = status !== 'error'
          return (
            <div key={job.id ?? i} className="cron-job">
              <div className={`cron-status ${isOk ? 'ok' : 'error'}`} />
              <span className="cron-name">
                {(job.name as string) ?? (job.id as string) ?? `Job ${i + 1}`}
              </span>
              {job.schedule && (
                <span className="cron-schedule">{job.schedule as string}</span>
              )}
              {job.lastRun && (
                <span style={{ fontSize: 10, color: 'var(--dim)' }}>
                  Zuletzt: {new Date(job.lastRun as string).toLocaleString('de-CH')}
                </span>
              )}
            </div>
          )
        })
      ) : raw ? (
        <pre style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'pre-wrap',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 6, padding: 12, lineHeight: 1.6 }}>
          {raw}
        </pre>
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Keine Cron Jobs gefunden.</div>
      )}
    </div>
  )
}

export default CronView
