import type { TechniqueVideo } from '../types'
import './VideoDetail.css'

interface VideoDetailProps {
  video: TechniqueVideo
}

export function VideoDetail({ video }: VideoDetailProps) {
  return (
    <section className="video-detail">
      <div className="video-card">
        <video controls poster={video.heroImage} src={video.videoUrl} />
        <div className="video-meta">
          <div>
            <h1>
              {video.title} <span>{video.subtitle}</span>
            </h1>
            <p className="file-info">
              <strong>File:</strong> {video.filename}
            </p>
            <p className="file-info">
              <strong>Internal path:</strong> {video.internalPath}
            </p>
            <p className="file-info">
              <strong>Source:</strong> {video.sourceUrl}
            </p>
          </div>
          <div className="timings">
            <div>
              <span>Technique start</span>
              <strong>{video.techniqueStart}</strong>
            </div>
            <div>
              <span>Technique finish</span>
              <strong>{video.techniqueEnd}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
