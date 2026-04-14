import './FilterPanel.css'

interface FilterPanelProps {
  filters: string[]
  selected: string[]
  onToggle: (filter: string) => void
}

export function FilterPanel({ filters, selected, onToggle }: FilterPanelProps) {
  return (
    <div className="filter-panel">
      <div className="filter-title">Active filters</div>
      <div className="filter-chips">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`chip ${selected.includes(filter) ? 'active' : ''}`}
            onClick={() => onToggle(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  )
}
