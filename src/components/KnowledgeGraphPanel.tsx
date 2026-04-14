import type { TechniqueVideo } from '../types'
import './KnowledgeGraphPanel.css'

interface KnowledgeGraphPanelProps {
  video: TechniqueVideo
}

const nodeColors = {
  position: '#6ba3ff',
  technique: '#49dea3',
  reaction: '#ffb347',
  followUp: '#c17bff',
}

export function KnowledgeGraphPanel({ video }: KnowledgeGraphPanelProps) {
  const width = 420
  const height = 220
  const radius = 18
  const nodes = video.knowledgeGraph.nodes.map((node, index) => ({
    ...node,
    x: 70 + index * 80,
    y: height / 2 + (index % 2 === 0 ? -30 : 30),
  }))

  return (
    <div className="graph-panel">
      <header>
        <div>
          <h3>Knowledge Graph Context</h3>
          <p>Where this technique lives inside the BOMIKO graph</p>
        </div>
        <button>Open full graph</button>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`}>
        {video.knowledgeGraph.edges.map((edge) => {
          const from = nodes.find((n) => n.id === edge.from)
          const to = nodes.find((n) => n.id === edge.to)
          if (!from || !to) return null
          return (
            <g key={`${edge.from}-${edge.to}`} className="graph-edge">
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              {edge.label && (
                <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6}>
                  {edge.label}
                </text>
              )}
            </g>
          )}
        )}
        {nodes.map((node) => (
          <g key={node.id} className="graph-node">
            <circle cx={node.x} cy={node.y} r={radius} fill={nodeColors[node.type]} />
            <text x={node.x} y={node.y + radius + 12}>
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
