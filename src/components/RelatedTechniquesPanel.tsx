import type { TechniqueVideo } from '../types'
import './RelatedTechniquesPanel.css'

interface RelatedTechniquesPanelProps {
  video: TechniqueVideo
}

export function RelatedTechniquesPanel({ video }: RelatedTechniquesPanelProps) {
  return (
    <aside className="related-sidebar">
      <h3>Related Techniques</h3>
      <div className="related-cards">
        {video.related.map((item) => (
          <article key={item.id} className={`related-card ${item.relation}`}>
            <img src={item.thumbnail} alt="" />
            <div>
              <p className="relation">{relationLabel[item.relation]}</p>
              <h4>{item.title}</h4>
              <button>Open</button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}

const relationLabel = {
  counter: 'Counter',
  defense: 'Defense',
  followUp: 'Follow-up',
  variation: 'Variation',
}
