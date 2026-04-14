import type { AssetLinks } from '../types'
import './AssetLinksPanel.css'

interface AssetLinksPanelProps {
  assets: AssetLinks
}

export function AssetLinksPanel({ assets }: AssetLinksPanelProps) {
  const entries = [
    { label: 'Transcript', path: assets.transcriptPath, url: assets.transcriptUrl },
    { label: 'Pose Extraction', path: assets.posePath },
    { label: 'Stick Figure Animation', path: assets.stickFigurePath },
    { label: 'Knowledge Graph Node', path: assets.graphRef },
  ]

  return (
    <div className="asset-panel">
      <h3>Linked Assets</h3>
      <ul>
        {entries.map((entry) => (
          <li key={entry.label}>
            <div>
              <strong>{entry.label}</strong>
              <span>{entry.path}</span>
            </div>
            <a href={entry.url ?? '#'} target="_blank" rel="noreferrer">
              Open
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
