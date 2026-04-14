import './TopBar.css'

interface TopBarProps {
  breadcrumbs: string[]
  onSearch: (value: string) => void
}

export function TopBar({ breadcrumbs, onSearch }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo">Bomiko</span>
        <div className="breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb}>
              {crumb}
              {index < breadcrumbs.length - 1 && <span className="chevron">›</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="topbar-actions">
        <input
          type="search"
          placeholder="Search techniques, tags, files..."
          onChange={(event) => onSearch(event.target.value)}
        />
        <div className="status-dot" title="Realtime sync enabled" />
      </div>
    </header>
  )
}
