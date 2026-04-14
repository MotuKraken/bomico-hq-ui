import type { VideoSegment } from '../types'
import './SegmentList.css'

interface SegmentListProps {
  segments: VideoSegment[]
}

export function SegmentList({ segments }: SegmentListProps) {
  return (
    <div className="segments">
      <header>
        <h3>Video Segments</h3>
        <span>Click to jump</span>
      </header>
      <ul>
        {segments.map((segment) => (
          <li key={segment.id}>
            <div>
              <strong>{segment.label}</strong>
              <span>
                {segment.start} – {segment.end}
              </span>
            </div>
            <button>Jump</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
