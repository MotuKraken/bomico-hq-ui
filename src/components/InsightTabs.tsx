import { useState } from 'react'
import type { TechniqueVideo } from '../types'
import './InsightTabs.css'

interface InsightTabsProps {
  video: TechniqueVideo
}

const tabs = ['Pose Preview', 'Transcript Preview', 'Graph Overview'] as const

type TabKey = (typeof tabs)[number]

export function InsightTabs({ video }: InsightTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('Pose Preview')

  return (
    <div className="insight-tabs">
      <div className="tab-list">
        {tabs.map((tab) => (
          <button key={tab} className={tab === activeTab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab === 'Pose Preview' && (
          <div className="pose-preview">
            <video
              autoPlay
              loop
              muted
              src="https://cdn.coverr.co/videos/coverr-trainers-practicing-boxing-techniques-9820/1080p.mp4"
            />
            <div className="caption">
              Pose animation: {video.assets.stickFigurePath}
            </div>
          </div>
        )}
        {activeTab === 'Transcript Preview' && (
          <div className="transcript-preview">
            <p>
              “From a stable mount, isolate the far-side arm by threading your arm under the triceps. Pin their wrist to
              the mat, slide your knee behind the shoulder, and rotate your hips to align with the opponent’s spine...”
            </p>
            <p className="muted">Full transcript: {video.assets.transcriptPath}</p>
          </div>
        )}
        {activeTab === 'Graph Overview' && (
          <div className="graph-preview">
            <p>Graph reference: {video.assets.graphRef}</p>
            <p className="muted">Open the dedicated graph panel below for full node relations.</p>
          </div>
        )}
      </div>
    </div>
  )
}
