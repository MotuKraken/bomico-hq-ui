import type { Project } from '../types'

interface Props { project: Project }

const KNOWN_ARTIFACTS = [
  { icon: '📄', name: 'dashboard-projektplan.md', meta: 'Vault/04_Projekte', url: null },
  { icon: '🐍', name: 'server.py', meta: 'bomiko-hq-ui/server', url: null },
  { icon: '📦', name: 'bomico-hq-ui', meta: 'github.com/MotuKraken', url: 'https://github.com/MotuKraken/bomico-hq-ui' },
  { icon: '📋', name: 'Vault-Konsolidiert', meta: 'github.com/MotuKraken', url: 'https://github.com/MotuKraken/vault-konsolidiert' },
]

export default function ArtifactsTab({ project }: Props) {
  return (
    <div className="tab-content">
      <div className="overview-header">
        <div className="ov-title">
          <span style={{fontSize:18}}>📎</span>
          <h1>Artefakte — {project.title}</h1>
        </div>
      </div>
      <div style={{padding:'0 24px'}}>
        <p style={{color:'var(--muted)',fontSize:12,marginBottom:16}}>
          Dateien, Repos und Links die zu diesem Projekt gehören.
        </p>
        <div className="artifacts-list">
          {KNOWN_ARTIFACTS.map((a, i) => (
            <div key={i} className="artifact-row">
              <div className="artifact-icon">{a.icon}</div>
              <div className="artifact-info">
                <div className="artifact-name">
                  {a.url
                    ? <a href={a.url} target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>{a.name}</a>
                    : a.name}
                </div>
                <div className="artifact-meta">{a.meta}</div>
              </div>
              {a.url && (
                <a href={a.url} target="_blank" rel="noreferrer"
                  style={{color:'var(--muted)',fontSize:14,textDecoration:'none'}}>↗</a>
              )}
            </div>
          ))}
        </div>
        <p style={{color:'var(--dim)',fontSize:11,marginTop:24}}>
          Tipp: Im Chat "speichere Artefakt [Name]" sagen um neue Artefakte hinzuzufügen.
        </p>
      </div>
    </div>
  )
}
