// BOMICO HQ — API Client

const BASE = '/api'

let _token = localStorage.getItem('hq_token') || ''

export function setToken(t: string) {
  _token = t
  localStorage.setItem('hq_token', t)
}
export function getToken() { return _token }
export function clearToken() { _token = ''; localStorage.removeItem('hq_token') }

function headers() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_token}` }
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: headers(),
    body: body ? JSON.stringify(body) : undefined
  })
  if (r.status === 401) { clearToken(); window.location.reload(); throw new Error('Unauthorized') }
  if (!r.ok) throw new Error(`API error ${r.status}`)
  return r.json()
}

export const Auth = {
  login: (password: string) =>
    api<{ token: string }>('POST', '/auth/login', { password })
}

export const Projects = {
  list: () => api<Project[]>('GET', '/projects'),
  create: (p: { title: string; description: string; goals: string[]; color: string }) =>
    api<Project>('POST', '/projects', p),
  update: (id: string, p: Partial<Project>) =>
    api<Project>('PUT', `/projects/${id}`, p),
  delete: (id: string) => api<{ ok: boolean }>('DELETE', `/projects/${id}`)
}

export const Chat = {
  send: (message: string, projectId?: string) =>
    api<{ ok: boolean; sessionLabel: string; result: unknown }>(
      'POST', '/chat/send', { message, projectId }
    ),
  history: (sessionLabel: string, limit = 50) =>
    api<{ ok: boolean; messages: OcMessage[] }>(
      'GET', `/chat/history?sessionLabel=${encodeURIComponent(sessionLabel)}&limit=${limit}`
    )
}

export const Usage = {
  get: () => api<UsageData>('GET', '/usage')
}

export const Approvals = {
  get: () => api<{ ok: boolean; pending: unknown[] }>('GET', '/approvals')
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface Project {
  id: string
  title: string
  description: string
  goals: string[]
  color: string
  taskName: string
  sessionKey: string | null
  created: number
  checklist: CheckItem[]
}

export interface CheckItem {
  id: string
  text: string
  done: boolean
}

export interface OcMessage {
  role: 'user' | 'assistant' | 'tool'
  content: unknown
  ts?: number
}

export interface UsageData {
  ok: boolean
  estimatedCostUsd: number
  totalTokens: number
  activeSessions: number
  budgetMonthlyUsd: number
  budgetUsedPct: number
  updatedAt: number
}
