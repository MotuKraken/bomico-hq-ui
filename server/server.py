"""BOMIKO HQ — Backend Server v2 (port 8898 → hq.bomiko.de)"""
import asyncio, json, os, secrets, subprocess, time
from pathlib import Path
from typing import Optional, List

import httpx
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from jose import jwt, JWTError
from pydantic import BaseModel

# ── Config ────────────────────────────────────────────────────────────────────
VAULT         = Path.home() / "Documents/Vault-Konsolidiert"
PROJECTS_FILE = VAULT / "04_Projekte/dashboard-projects.json"
PASSWORD_FILE = Path.home() / ".openclaw/secrets/dashboard-password"
USERNAME_FILE = Path.home() / ".openclaw/secrets/dashboard-username"
STATIC_DIR    = Path(__file__).parent / "dist"
OC_PATH       = "/Users/petermettler/.openclaw/tools/node-v22.22.0/bin/openclaw"
OC_ENV        = {**os.environ, "PATH": "/Users/petermettler/.openclaw/tools/node-v22.22.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"}

_jwt_secret = secrets.token_hex(32)

app = FastAPI(title="BOMIKO HQ", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# ── Auth ──────────────────────────────────────────────────────────────────────
def _creds():
    pw = PASSWORD_FILE.read_text().strip() if PASSWORD_FILE.exists() else "bomiko2026"
    un = USERNAME_FILE.read_text().strip() if USERNAME_FILE.exists() else "motukraken"
    return un, pw

class LoginBody(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
async def login(body: LoginBody):
    expected_user, expected_pw = _creds()
    if body.username != expected_user or body.password != expected_pw:
        # Uniform delay to prevent timing attacks
        await asyncio.sleep(0.5)
        raise HTTPException(status_code=401, detail="Falsche Anmeldedaten")
    token = jwt.encode(
        {"sub": body.username, "exp": int(time.time()) + 86400 * 30},
        _jwt_secret, algorithm="HS256"
    )
    return {"token": token}

def verify_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401)
    try:
        data = jwt.decode(auth[7:], _jwt_secret, algorithms=["HS256"])
        return data["sub"]
    except JWTError:
        raise HTTPException(status_code=401)

# ── OpenClaw agent CLI ────────────────────────────────────────────────────────
async def run_agent(message: str, session_key: str) -> str:
    """Run an openclaw agent turn via CLI, returns response text."""
    proc = await asyncio.create_subprocess_exec(
        OC_PATH, "agent",
        "--agent", "main",
        "--session-key", session_key,
        "--message", message,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=OC_ENV
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=180)
    except asyncio.TimeoutError:
        proc.kill()
        raise HTTPException(status_code=504, detail="Agent timeout")

    if proc.returncode != 0:
        err = stderr.decode()[:300]
        raise HTTPException(status_code=500, detail=f"Agent error: {err}")

    return stdout.decode().strip()

# ── Projects ──────────────────────────────────────────────────────────────────
def _load_projects() -> list:
    if PROJECTS_FILE.exists():
        try:
            return json.loads(PROJECTS_FILE.read_text())
        except Exception:
            return []
    return []

def _save_projects(projects: list):
    PROJECTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROJECTS_FILE.write_text(json.dumps(projects, indent=2, ensure_ascii=False))

class ProjectBody(BaseModel):
    title: str
    description: str = ""
    goals: List[str] = []
    color: str = "#58a6ff"

@app.get("/api/projects")
async def list_projects(user=Depends(verify_token)):
    return _load_projects()

@app.post("/api/projects")
async def create_project(body: ProjectBody, user=Depends(verify_token)):
    projects = _load_projects()
    pid = secrets.token_hex(4)
    session_key = f"agent:main:explicit:hq-project-{pid}"

    # Auto-generate checklist from goals, or blank
    checklist = [
        {"id": secrets.token_hex(4), "text": g, "done": False}
        for g in body.goals if g.strip()
    ]

    project = {
        "id": pid,
        "title": body.title,
        "description": body.description,
        "goals": body.goals,
        "color": body.color,
        "sessionKey": session_key,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "checklist": checklist
    }
    projects.append(project)
    _save_projects(projects)
    return project

@app.post("/api/projects/{pid}/init")
async def init_project(pid: str, user=Depends(verify_token)):
    """Auto-initialize project: generate smart checklist + first chat message via AI."""
    projects = _load_projects()
    project = next((p for p in projects if p["id"] == pid), None)
    if not project:
        raise HTTPException(status_code=404)

    session_key = project["sessionKey"]
    title = project["title"]
    desc = project.get("description", "")
    existing_goals = project.get("goals", [])

    prompt = f"""Du bist der BOMIKO Assistent für das Projekt: "{title}"
{f'Beschreibung: {desc}' if desc else ''}
{f'Erste Ideen: {", ".join(existing_goals)}' if existing_goals else ''}

Erstelle für dieses Projekt:
1. Eine kurze, präzise Beschreibung (1-2 Sätze) — falls noch nicht vorhanden
2. Eine Checkliste mit 3-6 konkreten, umsetzbaren Aufgaben
3. Einen Willkommens-Text (2-3 Sätze) der den Projektstatus zusammenfasst

Antworte NUR als JSON (kein Markdown, kein Erklärungstext):
{{
  "description": "...",
  "checklist": ["Aufgabe 1", "Aufgabe 2", "..."],
  "welcome": "..."
}}"""

    try:
        response = await run_agent(prompt, f"agent:main:explicit:hq-init-{pid}")
        # Extract JSON from response
        import re
        match = re.search(r'\{[\s\S]*\}', response)
        if match:
            data = json.loads(match.group())
            # Update project
            if data.get("description") and not project.get("description"):
                project["description"] = data["description"]
            if data.get("checklist"):
                project["checklist"] = [
                    {"id": secrets.token_hex(4), "text": item, "done": False}
                    for item in data["checklist"]
                ]
            _save_projects(projects)
            return {
                "ok": True,
                "project": project,
                "welcome": data.get("welcome", f"Projekt {title} ist bereit. Wie kann ich helfen?")
            }
    except Exception as e:
        pass

    return {
        "ok": True,
        "project": project,
        "welcome": f"Projekt **{title}** ist gestartet. Beschreibe mir was du erreichen willst."
    }

@app.put("/api/projects/{pid}")
async def update_project(pid: str, body: dict, user=Depends(verify_token)):
    projects = _load_projects()
    for p in projects:
        if p["id"] == pid:
            for k, v in body.items():
                if k not in ("id", "sessionKey", "createdAt"):
                    p[k] = v
            _save_projects(projects)
            return p
    raise HTTPException(status_code=404)

@app.delete("/api/projects/{pid}")
async def delete_project(pid: str, user=Depends(verify_token)):
    projects = [p for p in _load_projects() if p["id"] != pid]
    _save_projects(projects)
    return {"ok": True}

# ── Chat ──────────────────────────────────────────────────────────────────────
class ChatSendBody(BaseModel):
    message: str
    projectId: Optional[str] = None
    sessionKey: Optional[str] = None

@app.post("/api/chat/send")
async def send_chat(body: ChatSendBody, user=Depends(verify_token)):
    if body.projectId:
        projects = _load_projects()
        project = next((p for p in projects if p["id"] == body.projectId), None)
        if not project:
            raise HTTPException(status_code=404)
        session_key = project.get("sessionKey") or f"agent:main:explicit:hq-project-{body.projectId}"
    elif body.sessionKey:
        session_key = body.sessionKey
    else:
        session_key = "agent:main:explicit:hq-main-chat"

    reply = await run_agent(body.message, session_key)
    return {"ok": True, "reply": reply, "sessionKey": session_key}

# ── Usage ─────────────────────────────────────────────────────────────────────
_usage_cache: dict = {"ts": 0, "data": {}}

OC_BASE    = "http://127.0.0.1:18789"
OC_TOKEN   = "7d3e73…f2b2"
OC_HEADERS = {"Authorization": f"Bearer {OC_TOKEN}", "Content-Type": "application/json"}

@app.get("/api/usage")
async def get_usage(user=Depends(verify_token)):
    global _usage_cache
    now = time.time()
    if now - _usage_cache["ts"] < 60:
        return _usage_cache["data"]
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{OC_BASE}/tools/invoke",
                json={"tool": "sessions_list", "args": {"limit": 200, "activeMinutes": 10080}},
                headers=OC_HEADERS, timeout=10
            )
            data = r.json()
            text = data.get("result", {}).get("content", [{}])[0].get("text", "{}")
            sessions = json.loads(text).get("sessions", [])
            total_cost = sum(s.get("estimatedCostUsd", 0) for s in sessions)
            total_tokens = sum(s.get("totalTokens", 0) for s in sessions)
            active = len([s for s in sessions if s.get("status") == "running"])
    except Exception:
        total_cost = total_tokens = active = 0

    budget = 100.0
    usage = {
        "ok": True,
        "estimatedCostUsd": round(total_cost, 4),
        "totalTokens": total_tokens,
        "activeSessions": active,
        "budgetMonthlyUsd": budget,
        "budgetUsedPct": min(100, round(total_cost / budget * 100, 1)),
        "updatedAt": int(now)
    }
    _usage_cache = {"ts": now, "data": usage}
    return usage

@app.get("/api/approvals")
async def get_approvals(user=Depends(verify_token)):
    try:
        f = Path.home() / ".openclaw/exec-approvals.json"
        if f.exists():
            data = json.loads(f.read_text())
            return {"ok": True, "pending": data if isinstance(data, list) else []}
    except Exception:
        pass
    return {"ok": True, "pending": []}

@app.get("/api/health")
async def health():
    return {"ok": True, "ts": int(time.time()), "version": "2.0.0"}




# ── Chat history from transcript ──────────────────────────────────────────────
@app.get("/api/projects/{pid}/chat-history")
async def get_project_chat_history(pid: str, user=Depends(verify_token)):
    """Load chat history from OpenClaw session transcript file."""
    import re
    projects = _load_projects()
    project = next((p for p in projects if p["id"] == pid), None)
    if not project:
        raise HTTPException(status_code=404)

    # Try multiple possible session key formats
    sk = project.get("sessionKey", "")
    possible_keys = [
        f"agent:main:id:hq-project-{pid}",
        f"agent:main:explicit:hq-project-{pid}",
        sk,
        f"agent:main:{sk}" if sk and not sk.startswith("agent:") else sk,
    ]
    possible_keys = list(dict.fromkeys(k for k in possible_keys if k))

    sessions_file = Path.home() / ".openclaw/agents/main/sessions/sessions.json"
    if not sessions_file.exists():
        return {"ok": True, "messages": []}

    sessions_data = json.loads(sessions_file.read_text())
    session_id = None
    for key in possible_keys:
        if key in sessions_data:
            session_id = sessions_data[key].get("sessionId")
            break

    if not session_id:
        return {"ok": True, "messages": []}

    transcript = Path.home() / f".openclaw/agents/main/sessions/{session_id}.jsonl"
    if not transcript.exists():
        return {"ok": True, "messages": []}

    messages = []
    for line in transcript.read_text().splitlines():
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
            if entry.get("type") != "message":
                continue
            msg = entry.get("message", {})
            role = msg.get("role", "")
            if role not in ("user", "assistant"):
                continue
            content = msg.get("content", "")
            if isinstance(content, list):
                text = "".join(
                    c.get("text", "") for c in content
                    if isinstance(c, dict) and c.get("type") == "text"
                )
            else:
                text = str(content)
            if text.strip():
                messages.append({
                    "role": role,
                    "content": text,
                    "timestamp": entry.get("timestamp", "")
                })
        except Exception:
            continue

    return {"ok": True, "messages": messages, "sessionId": session_id}


@app.post("/api/projects/{pid}/save-chat")
async def save_chat_to_vault(pid: str, body: dict, user=Depends(verify_token)):
    """Save chat history as markdown to Vault."""
    projects = _load_projects()
    project = next((p for p in projects if p["id"] == pid), None)
    if not project:
        raise HTTPException(status_code=404)

    messages = body.get("messages", [])
    if not messages:
        return {"ok": True, "saved": False}

    vault_dir = VAULT / "06_Kommunikation/chats"
    vault_dir.mkdir(parents=True, exist_ok=True)

    date = time.strftime("%Y-%m-%d")
    filename = f"{date}_{project['title'].replace(' ','-').lower()}-{pid}.md"
    out_path = vault_dir / filename

    md = f"# Chat: {project['title']}\n"
    md += f"**Projekt-ID:** {pid}\n"
    md += f"**Gespeichert:** {time.strftime('%Y-%m-%d %H:%M')}\n\n---\n\n"
    for m in messages:
        role_label = "Peter" if m.get("role") == "user" else "BOMIKO"
        ts = m.get("timestamp", "")[:16] if m.get("timestamp") else ""
        md += f"**{role_label}**{f' ({ts})' if ts else ''}:\n{m.get('content','')}\n\n"

    out_path.write_text(md, encoding="utf-8")

    # Git commit
    try:
        import subprocess as sp
        sp.run(["git", "add", str(out_path)], cwd=str(VAULT), timeout=10)
        sp.run(["git", "commit", "-m", f"Chat: {project['title']} {date}"],
               cwd=str(VAULT), timeout=10)
    except Exception:
        pass

    return {"ok": True, "saved": True, "path": str(out_path)}



# ── Global Search ─────────────────────────────────────────────────────────────
@app.get("/api/search")
async def global_search(q: str, user=Depends(verify_token)):
    """Search across projects, tasks, vault MD files."""
    q_lower = q.lower()
    results = []

    # Search projects + tasks
    for p in _load_projects():
        if q_lower in p.get("title","").lower() or q_lower in p.get("description","").lower():
            results.append({"type":"project","title":p["title"],"id":p["id"],"snippet":p.get("description","")[:100]})
        for task in p.get("checklist",[]):
            if q_lower in task.get("text","").lower():
                results.append({"type":"task","title":task["text"],"project":p["title"],"projectId":p["id"],"snippet":""})

    # Search vault MD files
    vault_dir = VAULT / "06_Kommunikation/chats"
    if vault_dir.exists():
        for f in vault_dir.glob("*.md"):
            content = f.read_text(errors="ignore")
            if q_lower in content.lower():
                idx = content.lower().find(q_lower)
                snippet = content[max(0,idx-50):idx+100].replace("\n"," ")
                results.append({"type":"chat","title":f.stem,"snippet":snippet})

    return {"ok": True, "results": results[:20], "query": q}


# ── Timeline ──────────────────────────────────────────────────────────────────
@app.get("/api/timeline")
async def get_timeline(user=Depends(verify_token)):
    events = []
    # Parse vault git log
    try:
        result = subprocess.run(
            ["git", "log", "--pretty=format:%H|%ai|%s", "--since=30 days ago"],
            capture_output=True, text=True, timeout=10,
            cwd="/Users/petermettler/Documents/Vault-Konsolidiert"
        )
        for line in result.stdout.splitlines()[:30]:
            parts = line.split("|", 2)
            if len(parts) == 3:
                events.append({"type":"commit","hash":parts[0][:8],"ts":parts[1],"title":parts[2]})
    except Exception:
        pass
    # Add project creation events
    for p in _load_projects():
        if p.get("createdAt"):
            events.append({"type":"project","ts":p["createdAt"],"title":f"Projekt erstellt: {p['title']}","id":p["id"]})
    events.sort(key=lambda x: x.get("ts",""), reverse=True)
    return {"ok": True, "events": events[:40]}


# ── Cron Jobs ─────────────────────────────────────────────────────────────────
@app.get("/api/cron")
async def get_cron_jobs(user=Depends(verify_token)):
    result = subprocess.run(
        ["openclaw", "cron", "list", "--json"],
        capture_output=True, text=True, timeout=10, env=OC_ENV
    )
    if result.returncode == 0:
        try:
            return {"ok": True, "jobs": json.loads(result.stdout)}
        except Exception:
            pass
    # Fallback: parse text output
    result2 = subprocess.run(
        ["openclaw", "cron", "list"],
        capture_output=True, text=True, timeout=10, env=OC_ENV
    )
    return {"ok": True, "raw": result2.stdout, "jobs": []}


# ── Static ────────────────────────────────────────────────────────────────────
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"status": "backend ok", "note": "run npm run build first"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8898, reload=False, log_level="info")
