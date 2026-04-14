import './App.css'

type ModuleCard = {
  title: string
  status: 'Ready for MVP' | 'Research / Integration' | 'Planned'
  description: string
  bullets: string[]
}

const moduleCards: ModuleCard[] = [
  {
    title: 'OpenClaw Control',
    status: 'Ready for MVP',
    description: 'Sessions, agents, cronjobs, approvals, logs, model/runtime status.',
    bullets: ['Chat + session launcher', 'Agent registry', 'Cron + approvals', 'Health + logs'],
  },
  {
    title: 'Training System',
    status: 'Ready for MVP',
    description: 'Combat System, intake, programs, modules, progress and member/admin views.',
    bullets: ['Combat knowledge explorer', 'Intake forms', 'Programs + lessons', 'Progress tracking'],
  },
  {
    title: 'Content Mission',
    status: 'Ready for MVP',
    description: 'Raw footage inventory, transcript viewer, script vault and production pipeline.',
    bullets: ['Source inventory', 'Video/transcript viewer', 'Script ideas vault', 'Pipeline status'],
  },
  {
    title: 'Unified Inbox',
    status: 'Research / Integration',
    description: 'Email, comments and DMs in one triage surface with context and draft replies.',
    bullets: ['Gmail first', 'Comment queue', 'Thread ownership', 'Context side panel'],
  },
  {
    title: 'Projects + Tasks',
    status: 'Ready for MVP',
    description: 'Forum-like project threads, task boards, dependencies and status traceability.',
    bullets: ['Kanban + timeline', 'Project discussions', 'Linked assets', 'Decision history'],
  },
  {
    title: 'Ops / Monitoring',
    status: 'Planned',
    description: 'Mission health, alerts, backups, queues, runtime diagnostics and audit trail.',
    bullets: ['System health', 'Alert center', 'Backup/recovery', 'Audit timeline'],
  },
]

const rolloutSteps = [
  {
    step: '1. Separate surface',
    detail: 'Keep control.bomico.de as the existing operational dashboard. Build the new HQ as a separate app so we can iterate fast without breaking current control flows.',
  },
  {
    step: '2. Preferred URL',
    detail: 'Use hq.bomico.de as the new Mission Control surface. Keep mission.bomico.de as an optional redirect or staging alias if you want a more descriptive public route.',
  },
  {
    step: '3. MVP slice',
    detail: 'Ship Home + OpenClaw + Content Mission + Projects first. These give immediate operational value and visible proof of progress.',
  },
  {
    step: '4. Data adapters',
    detail: 'Attach real runtime JSON/files/APIs one module at a time instead of pretending the whole backend is finished from day one.',
  },
  {
    step: '5. Git + deploy',
    detail: 'Push only the isolated HQ app files first, then bind a dedicated Cloudflare route to the built output or service.',
  },
]

function App() {
  return (
    <div className="hq-shell">
      <header className="hero">
        <div>
          <div className="eyebrow">BOMICO HQ / Mission Control</div>
          <h1>Second live surface proposal: build the new control layer on <span>hq.bomico.de</span></h1>
          <p className="hero-copy">
            A dedicated Mission Control Center for OpenClaw, the BOMICO training system, content production,
            communications and project operations — kept separate from the existing control dashboard so it can
            evolve safely and visibly.
          </p>
        </div>
        <div className="hero-panel card">
          <h3>Recommended domain layout</h3>
          <ul>
            <li><strong>control.bomico.de</strong> → existing operational dashboard</li>
            <li><strong>hq.bomico.de</strong> → new Mission Control Center</li>
            <li><strong>mission.bomico.de</strong> → optional alias / redirect / staging</li>
          </ul>
        </div>
      </header>

      <section className="status-strip">
        <div className="metric card">
          <span className="label">Current plan</span>
          <strong>Separate app rollout</strong>
        </div>
        <div className="metric card">
          <span className="label">Build approach</span>
          <strong>React + Vite</strong>
        </div>
        <div className="metric card">
          <span className="label">Deployment target</span>
          <strong>Cloudflare + GitHub</strong>
        </div>
        <div className="metric card">
          <span className="label">Design goal</span>
          <strong>Ultra-clean, modular, expandable</strong>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Core architecture</div>
            <h2>Mission modules</h2>
          </div>
          <p>Each module is intended to become a real navigable area, not just a decorative tile.</p>
        </div>
        <div className="module-grid">
          {moduleCards.map((module) => (
            <article className="card module-card" key={module.title}>
              <div className="module-head">
                <h3>{module.title}</h3>
                <span className={`badge ${module.status.toLowerCase().replace(/[^a-z]+/g, '-')}`}>{module.status}</span>
              </div>
              <p>{module.description}</p>
              <ul>
                {module.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="two-column">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <div className="eyebrow">Live rollout</div>
              <h2>How I would ship it</h2>
            </div>
          </div>
          <ol className="steps">
            {rolloutSteps.map((item) => (
              <li key={item.step}>
                <strong>{item.step}</strong>
                <p>{item.detail}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <div className="eyebrow">Truthful status</div>
              <h2>What is real right now</h2>
            </div>
          </div>
          <ul className="truth-list">
            <li>The existing workspace already contains dashboard code and reports.</li>
            <li>The GitHub remote is real and authenticated.</li>
            <li>cloudflared is installed locally.</li>
            <li>The existing React/Vite dashboard stack builds successfully.</li>
            <li>The repository is currently dirty, so isolated commits are safer than broad pushes.</li>
          </ul>
        </article>
      </section>
    </div>
  )
}

export default App
