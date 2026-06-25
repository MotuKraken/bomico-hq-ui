import { useState, useEffect, useCallback } from 'react'
import './App.css'
import type { Project, ChatMessage, Usage, Approval, CreateProjectPayload } from './types'
import {
  fetchProjects, createProject, deleteProject, fetchUsage, fetchApprovals,
  initProject, getChatHistory, saveChatToVault
} from './api'
import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ChatPane from './components/ChatPane'
import ProjectPanel from './components/ProjectPanel'
import OverviewTab from './components/OverviewTab'
import ArtifactsTab from './components/ArtifactsTab'
import NewProjectModal from './components/NewProjectModal'
import SearchOverlay from './components/SearchOverlay'
import TimelineView from './components/TimelineView'
import CronView from './components/CronView'

type ChatStore = Record<string, ChatMessage[]>
type Tab = 'chat' | 'overview' | 'artifacts'
type SpecialView = 'timeline' | 'cron' | null

export default function App() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('bomiko_token')
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [specialView, setSpecialView] = useState<SpecialView>(null)
  const [tab, setTab] = useState<Tab>('chat')
  const [showNewProject, setShowNewProject] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // Chat store: persisted to localStorage
  const [chatStore, setChatStore] = useState<ChatStore>(() => {
    try {
      const saved = localStorage.getItem('bomiko_chats')
      return saved ? JSON.parse(saved) : { home: [] }
    } catch { return { home: [] } }
  })

  // Persist chat store to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('bomiko_chats', JSON.stringify(chatStore))
    } catch { /* quota exceeded, ignore */ }
  }, [chatStore])

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
    setSpecialView(null)
    setTab('chat')
  }

  function selectTimeline() {
    setActiveProjectId(null)
    setSpecialView('timeline')
  }

  function selectCron() {
    setActiveProjectId(null)
    setSpecialView('cron')
  }

  async function selectProject(p: Project) {
    setActiveProjectId(p.id)
    setSpecialView(null)
    setTab('chat')
    // Load history from server if chat store for this project is empty
    if (!chatStore[p.id] || chatStore[p.id].length === 0) {
      try {
        const result = await getChatHistory(p.id)
        if (result.ok && result.messages.length > 0) {
          setChatStore(prev => ({ ...prev, [p.id]: result.messages }))
        }
      } catch { /* ignore */ }
    }
  }

  // ── Chat ──────────────────────────────────────────────────────────────
  const chatKey = activeProjectId ?? 'home'

  function handleNewMessage(msg: ChatMessage) {
    setChatStore(prev => {
      const prevMsgs = prev[chatKey] ?? []
      const newMsgs = [...prevMsgs, msg]
      const updated = { ...prev, [chatKey]: newMsgs }
      // Feature 1: Auto-save every 10 messages
      if (activeProjectId && newMsgs.length % 10 === 0) {
        saveChatToVault(activeProjectId, newMsgs).catch(() => {/* ignore */})
      }
      return updated
    })
  }

  // ── Projects CRUD ─────────────────────────────────────────────────────
  async function handleCreateProject(payload: CreateProjectPayload) {
    const p = await createProject(payload)
    setProjects(prev => [...prev, p])
    setShowNewProject(false)
    setActiveProjectId(p.id)
    setSpecialView(null)
    setTab('chat')
    // Auto-initialize
    try {
      const init = await initProject(p.id)
      if (init.ok) {
        setProjects(prev => prev.map(x => x.id === p.id ? init.project : x))
        setChatStore(prev => ({
          ...prev,
          [p.id]: [{
            role: 'assistant' as const,
            content: init.welcome,
            timestamp: new Date().toISOString()
          }]
        }))
      }
    } catch { /* silent */ }
  }

  function handleProjectUpdated(updated: Project) {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  async function handleDeleteProject(id: string) {
    await deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
    if (activeProjectId === id) setActiveProjectId(null)
  }

  // ── Vault sync ────────────────────────────────────────────────────────
  async function handleSaveChat() {
    if (!activeProjectId) return
    const msgs = chatStore[activeProjectId] ?? []
    if (msgs.length === 0) return
    try {
      await saveChatToVault(activeProjectId, msgs)
    } catch { /* ignore */ }
  }

  // ── Search navigation ─────────────────────────────────────────────────
  function handleSearchNavigate(projectId: string) {
    const project = projects.find(p => p.id === projectId)
    if (project) selectProject(project)
    setShowSearch(false)
  }

  if (!token) return <LoginPage onLogin={handleLogin} />

  const activeProject = activeProjectId
    ? projects.find(p => p.id === activeProjectId) ?? null
    : null

  const showPanel = activeProject !== null && tab === 'chat' && specialView === null
  const title = specialView === 'timeline' ? 'Timeline'
    : specialView === 'cron' ? 'Cron Jobs'
    : activeProject ? activeProject.title : 'BOMIKO HQ'

  return (
    <div className="app-shell">
      <Sidebar
        projects={projects}
        activeView={specialView ?? activeProjectId ?? 'home'}
        onSelectHome={selectHome}
        onSelectProject={selectProject}
        onNewProject={() => setShowNewProject(true)}
        onSelectTimeline={selectTimeline}
        onSelectCron={selectCron}
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
        onSaveChat={handleSaveChat}
        onSearch={() => setShowSearch(true)}
      />

      <main className={`main-area${showPanel ? ' with-panel' : ''}`}>
        {/* SPECIAL VIEWS */}
        {specialView === 'timeline' && <TimelineView />}
        {specialView === 'cron' && <CronView />}

        {/* NORMAL VIEWS (only when no special view) */}
        {!specialView && (
          <>
            {/* CHAT TAB */}
            {tab === 'chat' && (
              <ChatPane
                project={activeProject}
                messages={chatStore[chatKey] ?? []}
                onNewMessage={handleNewMessage}
                sessionLabel={activeProject ? `agent:main:id:hq-project-${activeProject.id}` : 'agent:main:explicit:hq-main-chat'}
              />
            )}
            {/* OVERVIEW TAB */}
            {tab === 'overview' && activeProject && (
              <OverviewTab
                project={activeProject}
                onProjectUpdated={handleProjectUpdated}
              />
            )}
            {/* ARTIFACTS TAB */}
            {tab === 'artifacts' && activeProject && (
              <ArtifactsTab project={activeProject} />
            )}
            {/* HOME OVERVIEW */}
            {tab === 'overview' && !activeProject && (
              <div style={{ padding: 32, color: 'var(--muted)' }}>
                <h2 style={{ marginBottom: 12 }}>Übersicht</h2>
                <p>{projects.length} Projekte · {approvals.length} offene Approvals</p>
              </div>
            )}
          </>
        )}

        {/* PROJECT PANEL (right side, chat tab only) */}
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

      {showSearch && (
        <SearchOverlay
          onClose={() => setShowSearch(false)}
          onNavigate={handleSearchNavigate}
        />
      )}
    </div>
  )
}
