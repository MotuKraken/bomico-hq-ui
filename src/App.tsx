import { useState, useEffect, useCallback } from 'react';
import './App.css';

import type { Project, ChatMessage, Usage, Approval, CreateProjectPayload } from './types';
import {
  fetchProjects,
  createProject,
  deleteProject,
  fetchUsage,
  fetchApprovals,

} from './api';

import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ChatPane from './components/ChatPane';
import ProjectDetail from './components/ProjectDetail';
import NewProjectModal from './components/NewProjectModal';

// Chat history keyed by context: 'home' or project id
type ChatStore = Record<string, ChatMessage[]>;

// View state
type ActiveView =
  | { kind: 'home' }
  | { kind: 'project-detail'; projectId: string }
  | { kind: 'project-chat'; projectId: string };

function getTitle(view: ActiveView, projects: Project[]): string {
  if (view.kind === 'home') return 'BOMIKO HQ';
  const p = projects.find(x => x.id === view.projectId);
  if (!p) return 'BOMIKO HQ';
  return view.kind === 'project-chat' ? `Chat · ${p.title}` : p.title;
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bomiko_token'));

  const [projects, setProjects] = useState<Project[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [view, setView] = useState<ActiveView>({ kind: 'home' });
  const [showNewProject, setShowNewProject] = useState(false);

  // Per-context chat messages
  const [chatStore, setChatStore] = useState<ChatStore>({ home: [] });

  // ── Data loading ─────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoadingData(true);
    try {
      const [projs, usg, appr] = await Promise.all([
        fetchProjects().catch(() => [] as Project[]),
        fetchUsage().catch(() => null),
        fetchApprovals().catch(() => ({ pending: [] as Approval[] })),
      ]);
      setProjects(projs);
      setUsage(usg);
      setApprovals(appr.pending);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadAll();
  }, [token, loadAll]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  function handleLogin() {
    setToken(localStorage.getItem('bomiko_token'));
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function selectHome() {
    setView({ kind: 'home' });
  }

  function selectProject(project: Project) {
    setView({ kind: 'project-detail', projectId: project.id });
    setChatStore(prev => ({
      ...prev,
      [project.id]: prev[project.id] ?? [],
    }));
  }

  function openProjectChat(projectId: string) {
    setView({ kind: 'project-chat', projectId });
    setChatStore(prev => ({
      ...prev,
      [projectId]: prev[projectId] ?? [],
    }));
  }

  // ── Chat helpers ──────────────────────────────────────────────────────────
  function getChatKey(): string {
    if (view.kind === 'home') return 'home';
    return view.projectId;
  }

  function getCurrentMessages(): ChatMessage[] {
    return chatStore[getChatKey()] ?? [];
  }

  function handleNewMessage(msg: ChatMessage) {
    const key = getChatKey();
    setChatStore(prev => ({
      ...prev,
      [key]: [...(prev[key] ?? []), msg],
    }));
  }

  // ── Projects CRUD ─────────────────────────────────────────────────────────
  async function handleCreateProject(payload: CreateProjectPayload) {
    const newProject = await createProject(payload);
    setProjects(prev => [...prev, newProject]);
    setShowNewProject(false);
    selectProject(newProject);
  }

  function handleProjectUpdated(updated: Project) {
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  }

  async function handleDeleteProject(id: string) {
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if ((view.kind === 'project-detail' || view.kind === 'project-chat') && view.projectId === id) {
      setView({ kind: 'home' });
    }
  }

  // ── Render: not logged in ─────────────────────────────────────────────────
  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ── Determine current project ─────────────────────────────────────────────
  const currentProject =
    view.kind !== 'home'
      ? projects.find(p => p.id === view.projectId) ?? null
      : null;

  const sidebarActiveId = view.kind === 'home' ? 'home' : view.projectId;
  const showChat = view.kind === 'home' || view.kind === 'project-chat';
  const showDetail = view.kind === 'project-detail' && currentProject !== null;

  // For project chat, the ChatPane project prop should be the current project
  const chatProject = view.kind === 'project-chat' ? currentProject : null;

  return (
    <div className="app-shell">
      <Sidebar
        projects={projects}
        activeView={sidebarActiveId}
        onSelectHome={selectHome}
        onSelectProject={selectProject}
        onNewProject={() => setShowNewProject(true)}
      />

      <TopBar
        title={getTitle(view, projects)}
        usage={usage}
        approvals={approvals}
        loading={loadingData}
        onRefresh={loadAll}
      />

      <main className="main-area">
        {showChat && (
          <ChatPane
            project={chatProject}
            messages={getCurrentMessages()}
            onNewMessage={handleNewMessage}
            sessionLabel={null}
          />
        )}

        {showDetail && currentProject && (
          <ProjectDetail
            project={currentProject}
            onOpenChat={() => openProjectChat(currentProject.id)}
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
  );
}
