import { useState, useEffect, useRef } from 'react'
import { searchGlobal } from '../api'
import type { SearchResult } from '../api'

interface Props {
  onClose: () => void
  onNavigate: (projectId: string) => void
}

const typeIcon: Record<string, string> = {
  project: '📁',
  task: '✅',
  chat: '💬',
}

export function SearchOverlay({ onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchGlobal(val.trim())
        setResults(res.results)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
  }

  function handleResultClick(r: SearchResult) {
    const pid = r.id ?? r.projectId
    if (pid) onNavigate(pid)
    else onClose()
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-box" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Suchen… Projekte, Aufgaben, Chats"
          value={query}
          onChange={e => handleInput(e.target.value)}
        />
        {query.trim() === '' && (
          <div className="search-empty">Suchbegriff eingeben…</div>
        )}
        {query.trim() !== '' && !loading && results.length === 0 && (
          <div className="search-empty">Keine Ergebnisse für „{query}"</div>
        )}
        {loading && (
          <div className="search-empty">Suche läuft…</div>
        )}
        {results.map((r, i) => (
          <div key={i} className="search-result" onClick={() => handleResultClick(r)}>
            <span className="search-type">{typeIcon[r.type] ?? '•'}</span>
            <div>
              <div className="search-title">{r.title}</div>
              {r.project && (
                <div className="search-snippet">in {r.project}</div>
              )}
              {r.snippet && (
                <div className="search-snippet">{r.snippet}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchOverlay
