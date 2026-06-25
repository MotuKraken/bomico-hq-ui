import { useState, useEffect, useCallback } from 'react'
import './App.css'
import type { Project, ChatMessage, Usage, Approval, CreateProjectPayload } from './types'
import { fetchProjects, createProject, deleteProject, fetchUsage, fetchApprovals } from './api'
import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ChatPane from './components/ChatPane'
import ProjectPanel from './components/ProjectPanel'
import NewProjectModal from './components/NewProjectModal'

type ChatStore = Record<string, ChatMessage[]>
type Tab = 'chat' | 'overview' | 'artifacts'

export default function App() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('bomiko_token')
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('chat')
  const [showNewProject, setShowNewProject] = useState(false)
  const [chatStore, setChatStore] = useState<ChatStore>({ home: [] })

  // ── Data loading ────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoadingData(true)
    try {
      const [projs, usg, appr] = await Promise.all([
        fetchProjects().catch(() => [] as Project[]),
        fetchUsage().catch(() => null),
        fetchApprovals().catch(() => ({ pending: [] as Approval[] })),
      ])
      setProjects(projs)
      setUsage(usg)
      setApprovals(appr.pending)
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { if (token) loadAll() }, [token, loadAll])

  function handleLogin() {
    setToken(localStorage.getItem('bomiko_token'))
  }

  // ── Navigation ────────────────────────────────────────────────────────
  function selectHome() {
    setActiveProjectId(null)
    setTab('chat')
  }

  function selectProject(p: Project) {
    setActiveProjectId(p.id)
    setTab('chat')
    setChatStore(prev => ({ ...prev, [p.id]: prev[p.id] ?? [] }))
  }

  // ── Chat ──────────────────────────────────────────────────────────────
  const chatKey = activeProjectId ?? 'home'

  function handleNewMessage(msg: ChatMessage) {
    setChatStore(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] ?? []), msg] }))
  }

  // ── Projects CRUD ─────────────────────────────────────────────────────
  async function handleCreateProject(payload: CreateProjectPayload) {
    const p = await createProject(payload)
    setProjects(prev => [...prev, p])
    setShowNewProject(false)
    selectProject(p)
  }

  function handleProjectUpdated(updated: Project) {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  async function handleDeleteProject(id: string) {
    await deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
    if (activeProjectId === id) setActiveProjectId(null)
  }

  if (!token) return <LoginPage onLogin={handleLogin} />

  const activeProject = activeProjectId
    ? projects.find(p => p.id === activeProjectId) ?? null
    : null

  const showPanel = activeProject !== null
  const title = activeProject ? activeProject.title : 'BOMIKO HQ'

  return (
    <div className="app-shell">
      <Sidebar
        projects={projects}
        activeView={activeProjectId ?? 'home'}
        onSelectHome={selectHome}
        onSelectProject={selectProject}
        onNewProject={() => setShowNewProject(true)}
      />

      <TopBar
        title={title}
        project={activeProject}
        tab={tab}
        onTabChange={setTab}
        usage={usage}
        approvals={approvals}
        loading={loadingData}
        onRefresh={loadAll}
      />

      <main className={`main-area${showPanel ? ' with-panel' : ''}`}>
        <ChatPane
          project={activeProject}
          messages={chatStore[chatKey] ?? []}
          onNewMessage={handleNewMessage}
          sessionLabel={activeProject ? `id:hq-project-${activeProject.id}` : 'id:hq-main-chat'}
        />

        {showPanel && activeProject && (
          <ProjectPanel
            project={activeProject}
            onProjectUpdated={handleProjectUpdated}
            onDelete={handleDeleteProject}
          />
        )}
      </main>

      {showNewProject && (
        <NewProjectModal
          onSave={handleCreateProject}
          onCancel={() => setShowNewProject(false)}
        />
      )}
    </div>
  )
}
