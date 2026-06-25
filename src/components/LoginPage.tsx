import { useState } from 'react'
import { Auth, setToken } from '../api'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr('')
    try {
      const { token } = await Auth.login(username, pw)
      setToken(token)
      onLogin()
    } catch {
      setErr('Falscher Benutzername oder Passwort')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">⬡ BOMIKO HQ</div>
        <div className="login-sub">Mission Control — Private Access</div>
        <form onSubmit={handleSubmit}>
          <label className="login-label">Benutzername</label>
          <input className="login-input" type="text" value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="motukraken" autoFocus autoComplete="username" />
          <label className="login-label">Passwort</label>
          <input className="login-input" type="password" value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="••••••••••••" autoComplete="current-password" />
          <button className="login-btn" type="submit" disabled={loading || !username || !pw}>
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
          {err && <div className="login-error">{err}</div>}
        </form>
      </div>
    </div>
  )
}
