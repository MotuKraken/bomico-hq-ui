import { useState, useRef, useEffect } from 'react'
import type { Project, ChatMessage } from '../types'
import { sendChat } from '../api'

interface Props {
  project: Project | null
  messages: ChatMessage[]
  onNewMessage: (msg: ChatMessage) => void
  sessionLabel: string | null
}

function fmt(ts?: string) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

export default function ChatPane({ project, messages, onNewMessage, sessionLabel }: Props) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  function autoResize() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setError(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    }
    onNewMessage(userMsg)
    setSending(true)

    try {
      const reply = await sendChat({ message: text, projectId: project?.id })
      onNewMessage({
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Senden')
    } finally {
      setSending(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const ctxLabel = sessionLabel ?? (project ? `id:hq-project-${project.id}` : 'id:hq-main-chat')
  const today = new Date().toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="chat-pane">
      {/* Session info bar */}
      <div className="chat-session-bar">
        <span>Session:</span>
        <span className="session-tag">{ctxLabel}</span>
        {project && <span className="ctx-badge">project context active</span>}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-icon">◈</div>
            <h3>{project ? project.title : 'BOMIKO HQ'}</h3>
            <p>
              {project
                ? `Projekt-Chat. Ich kenne Ziele und Kontext von "${project.title}". Frag mich alles.`
                : 'Hauptchat. Ich habe Zugriff auf alle Projekte, den Vault und alle Tools.'}
            </p>
          </div>
        ) : (
          <>
            <div className="chat-date-div">{today}</div>
            {project && (
              <div className="chat-sys">
                🚀 Projekt-Session: <strong>{project.title}</strong> — voller Vault-Zugriff aktiv
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                <div className="msg-av">
                  {msg.role === 'user' ? 'P' : 'B'}
                </div>
                <div className="msg-body">
                  <div className="msg-meta">
                    <span className="msg-name">{msg.role === 'user' ? 'Peter' : 'BOMIKO'}</span>
                    {' · '}{fmt(msg.timestamp)}
                  </div>
                  <div className="msg-text">{msg.content}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="msg assistant">
                <div className="msg-av">B</div>
                <div className="msg-body">
                  <div className="msg-meta"><span className="msg-name">BOMIKO</span></div>
                  <div className="chat-thinking">
                    <div className="thinking-dot" />
                    <div className="thinking-dot" />
                    <div className="thinking-dot" />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div style={{ color: 'var(--red)', fontSize: 12, padding: '4px 0' }}>⚠ {error}</div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-row">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={e => { setInput(e.target.value); autoResize() }}
            onKeyDown={handleKey}
            placeholder={project
              ? `Schreibe an ${project.title}…`
              : 'Schreibe eine Nachricht… (Enter = senden)'}
            rows={1}
            disabled={sending}
          />
          <button className="send-btn" onClick={handleSend} disabled={!input.trim() || sending}>
            ↑
          </button>
        </div>
        <div className="chat-hint">Enter = senden · Shift+Enter = neue Zeile · Zugriff auf Vault &amp; Memory</div>
      </div>
    </div>
  )
}
