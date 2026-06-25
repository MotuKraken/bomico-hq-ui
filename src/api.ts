// BOMICO HQ — unified API client

import type {
  Project, CreateProjectPayload, UpdateProjectPayload,
  ChatMessage, Usage as UsageType, ApprovalsResponse
} from './types'

// Re-export so components can import types from api.ts
export type { Project, ApprovalsResponse } from './types'
export type { ChecklistItem as CheckItem } from './types'
export type UsageData = UsageType   // TopBar uses UsageData

// ─── Token ─────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'bomico_token'
let _token = localStorage.getItem(TOKEN_KEY) || ''

export function setToken(t: string) { _token = t; localStorage.setItem(TOKEN_KEY, t) }
export function getToken() { return _token }
export function clearToken() { _token = ''; localStorage.removeItem(TOKEN_KEY) }

// ─── Base fetch ────────────────────────────────────────────────────────────
const BASE = '/api'

async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ..._token ? { Authorization: `Bearer ${_token}` } : {}
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  })
  if (r.status === 401) { clearToken(); window.location.reload(); throw new Error('Unauthorized') }
  if (!r.ok) throw new Error(`API ${r.status}: ${r.statusText}`)
  return r.json()
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const Auth = {
  login: (password: string) => apiFetch<{ token: string }>('POST', '/auth/login', { password })
}

// ─── Projects ─────────────────────────────────────────────────────────────
export const Projects = {
  list:   ()                                      => apiFetch<Project[]>('GET', '/projects'),
  create: (p: CreateProjectPayload)               => apiFetch<Project>('POST', '/projects', p),
  update: (id: string, p: UpdateProjectPayload)   => apiFetch<Project>('PUT', `/projects/${id}`, p),
  delete: (id: string)                            => apiFetch<{ ok: boolean }>('DELETE', `/projects/${id}`)
}

// Function-style aliases (App.tsx)
export const fetchProjects  = () => Projects.list()
export const createProject  = (p: CreateProjectPayload) => Projects.create(p)
export const deleteProject  = (id: string) => Projects.delete(id)
export const updateProject  = (id: string, p: UpdateProjectPayload) => Projects.update(id, p)

// ─── Chat ──────────────────────────────────────────────────────────────────
interface SendChatArgs { message: string; projectId?: string }
interface SendChatResponse { ok: boolean; sessionLabel: string; result: unknown }

export async function sendChat(args: SendChatArgs): Promise<string> {
  const r = await apiFetch<SendChatResponse>('POST', '/chat/send', args)
  try {
    // Try to extract text from OpenClaw tools/invoke result structure
    const res = r.result as Record<string, unknown>
    const inner = res?.result as Record<string, unknown>
    const content = inner?.content as Array<{type: string; text: string}> | undefined
    if (Array.isArray(content)) {
      const tp = content.find(c => c.type === 'text')
      if (tp?.text) return tp.text
    }
    if (typeof inner?.text === 'string') return inner.text as string
  } catch { /* fall through */ }
  return r.ok ? '✓' : 'Error'
}

export const Chat = {
  send: sendChat,
  history: (sessionLabel: string, limit = 50) =>
    apiFetch<{ ok: boolean; messages: ChatMessage[] }>(
      'GET', `/chat/history?sessionLabel=${encodeURIComponent(sessionLabel)}&limit=${limit}`
    )
}

// ─── Usage namespace (TopBar uses: Usage.get()) ────────────────────────────
export const Usage = {
  get: () => apiFetch<UsageType>('GET', '/usage')
}
export const fetchUsage = () => Usage.get()

// ─── Approvals ─────────────────────────────────────────────────────────────
export const Approvals = {
  get: () => apiFetch<ApprovalsResponse>('GET', '/approvals')
}
export const fetchApprovals = () => Approvals.get()
