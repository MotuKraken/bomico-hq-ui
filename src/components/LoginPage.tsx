import { useState } from 'react'
import { Auth, setToken } from '../api'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr('')
    try {
      const { token } = await Auth.login(pw)
      setToken(token)
      onLogin()
    } catch {
      setErr('Wrong password')
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
          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Enter password"
            autoFocus
          />
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          {err && <div className="login-error">{err}</div>}
        </form>
      </div>
    </div>
  )
}
