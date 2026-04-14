import './TagList.css'

interface TagListProps {
  tags: string[]
  onTagClick?: (tag: string) => void
}

export function TagList({ tags, onTagClick }: TagListProps) {
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <button key={tag} className="tag-pill" onClick={() => onTagClick?.(tag)}>
          {tag}
        </button>
      ))}
    </div>
  )
}
