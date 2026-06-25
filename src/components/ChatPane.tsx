import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import type { Project, ChatMessage } from '../types';
import { sendChat } from '../api';

interface ChatPaneProps {
  project: Project | null;   // null = home chat
  messages: ChatMessage[];
  onNewMessage: (msg: ChatMessage) => void;
  sessionLabel: string | null;
}

function formatTime(ts?: string): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatPane({
  project,
  messages,
  onNewMessage,
  sessionLabel,
}: ChatPaneProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Auto-resize textarea
  function handleInput() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setError('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    onNewMessage(userMsg);
    setSending(true);

    try {
      const replyText = await sendChat({ message: text, projectId: project?.id });
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString(),
      };
      onNewMessage(assistantMsg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Send failed';
      setError(message);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const placeholder = project
    ? `Ask anything about ${project.title}…`
    : 'Ask BOMIKO anything…';

  return (
    <div className="chat-pane">
      {/* Project context header */}
      {project && (
        <div className="chat-project-header">
          <div
            className="chat-project-dot"
            style={{ background: project.color || 'var(--accent)' }}
          />
          <span className="chat-project-name">{project.title}</span>
          <span className="chat-project-hint">project context active</span>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !sending && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              {project ? '📋' : '🤖'}
            </div>
            <div className="chat-empty-hint">
              {project
                ? `Chat with BOMIKO in the context of "${project.title}". Ask about goals, progress, next steps.`
                : 'Ask BOMIKO anything. Full agent capabilities are available here.'}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            <div className="chat-msg-label">
              {msg.role === 'user' ? 'You' : 'BOMIKO'}
            </div>
            <div className="chat-msg-bubble">{msg.content}</div>
            {msg.timestamp && (
              <div className="chat-msg-meta">{formatTime(msg.timestamp)}</div>
            )}
          </div>
        ))}

        {sending && (
          <div className="chat-typing">
            <div className="chat-typing-dots">
              <span /><span /><span />
            </div>
            BOMIKO is thinking…
          </div>
        )}

        {error && (
          <div className="error-banner" style={{ margin: '0' }}>
            ⚠ {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        {sessionLabel && (
          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>
            Session: {sessionLabel}
          </div>
        )}
        <div className="chat-input-row">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={sending}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 5 }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
