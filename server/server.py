"""
BOMICO HQ — Backend Server
Port 8898 → hq.bomiko.de via Cloudflare Tunnel
"""
import asyncio, json, os, secrets, subprocess, time
from pathlib import Path
from typing import Optional, List

import httpx
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from jose import jwt, JWTError
from pydantic import BaseModel

# ─── Config ─────────────────────────────────────────────────────────────────
OC_BASE      = "http://127.0.0.1:18789"
OC_TOKEN     = os.environ.get("OPENCLAW_GATEWAY_TOKEN", "")  # set in ~/.openclaw/service-env/
OC_HEADERS   = {"Authorization": f"Bearer {OC_TOKEN}", "Content-Type": "application/json"}

VAULT         = Path.home() / "Documents/Vault-Konsolidiert"
PROJECTS_FILE = VAULT / "04_Projekte/dashboard-projects.json"
PASSWORD_FILE = Path.home() / ".openclaw/secrets/dashboard-password"
STATIC_DIR    = Path(__file__).parent / "dist"

_jwt_secret = secrets.token_hex(32)

app = FastAPI(title="BOMICO HQ", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# ─── Auth ─────────────────────────────────────────────────────────────────────
def _get_password() -> str:
    if PASSWORD_FILE.exists():
        return PASSWORD_FILE.read_text().strip()
    default = "bomiko2026"
    PASSWORD_FILE.write_text(default)
    return default

class LoginBody(BaseModel):
    password: str

@app.post("/api/auth/login")
async def login(body: LoginBody):
    if body.password != _get_password():
        raise HTTPException(status_code=401, detail="Wrong password")
    token = jwt.encode(
        {"sub": "peter", "exp": int(time.time()) + 86400 * 30},
        _jwt_secret, algorithm="HS256"
    )
    return {"token": token}

def verify_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        jwt.decode(auth[7:], _jwt_secret, algorithms=["HS256"])
        return "peter"
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── OpenClaw proxy ───────────────────────────────────────────────────────────
async def oc_invoke(tool: str, args: dict, timeout: float = 120.0) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(f"{OC_BASE}/tools/invoke",
            json={"tool": tool, "args": args}, headers=OC_HEADERS, timeout=timeout)
        return r.json()

def _parse_oc_text(result: dict) -> str:
    try:
        content = result.get("result", {}).get("content", [])
        for c in content:
            if c.get("type") == "text":
                return c["text"]
    except Exception:
        pass
    return json.dumps(result)

# ─── Projects ─────────────────────────────────────────────────────────────────
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
    task_name = f"hq-project-{pid}"
    project = {
        "id": pid, "title": body.title, "description": body.description,
        "goals": body.goals, "color": body.color, "taskName": task_name,
        "sessionKey": None, "created": time.time(),
        "checklist": [{"id": secrets.token_hex(4), "text": g, "done": False} for g in body.goals]
    }
    projects.append(project)
    _save_projects(projects)
    return project

@app.put("/api/projects/{pid}")
async def update_project(pid: str, body: dict, user=Depends(verify_token)):
    projects = _load_projects()
    for p in projects:
        if p["id"] == pid:
            for k, v in body.items():
                if k not in ("id", "taskName", "created"):
                    p[k] = v
            _save_projects(projects)
            return p
    raise HTTPException(status_code=404)

@app.delete("/api/projects/{pid}")
async def delete_project(pid: str, user=Depends(verify_token)):
    projects = [p for p in _load_projects() if p["id"] != pid]
    _save_projects(projects)
    return {"ok": True}

# ─── Chat ──────────────────────────────────────────────────────────────────────
class ChatSendBody(BaseModel):
    message: str
    projectId: Optional[str] = None

async def _ensure_session(project: dict) -> str:
    if project.get("sessionKey"):
        return project["sessionKey"]
    task_name = project["taskName"]
    goals_text = "\n".join(f"- {g}" for g in project.get("goals", []))
    task_prompt = (
        f"Du bist der dedizierte Assistent für das Projekt: **{project['title']}**\n"
        f"Beschreibung: {project.get('description','')}\n"
    )
    if goals_text:
        task_prompt += f"Ziele:\n{goals_text}\n"
    task_prompt += "\nDu hast Zugriff auf den kompletten Vault und alle Tools. Warte auf Nachrichten."
    await oc_invoke("sessions_spawn", {
        "task": task_prompt, "taskName": task_name,
        "label": f"Project: {project['title']}", "runtime": "subagent"
    }, timeout=30.0)
    session_label = f"id:{task_name}"
    projects = _load_projects()
    for p in projects:
        if p["id"] == project["id"]:
            p["sessionKey"] = session_label
            break
    _save_projects(projects)
    return session_label

@app.post("/api/chat/send")
async def send_chat(body: ChatSendBody, user=Depends(verify_token)):
    if body.projectId:
        projects = _load_projects()
        project = next((p for p in projects if p["id"] == body.projectId), None)
        if not project:
            raise HTTPException(status_code=404)
        session_label = await _ensure_session(project)
    else:
        session_label = "id:hq-main-chat"
    result = await oc_invoke("sessions_send", {
        "label": session_label, "message": body.message, "timeoutSeconds": 120
    }, timeout=130.0)
    return {"ok": result.get("ok", False), "sessionLabel": session_label, "result": result}

@app.get("/api/chat/history")
async def get_history(sessionLabel: str, limit: int = 50, user=Depends(verify_token)):
    result = await oc_invoke("sessions_history", {"label": sessionLabel, "limit": limit}, timeout=15.0)
    try:
        data = json.loads(_parse_oc_text(result))
        return {"ok": True, "messages": data.get("messages", []), "raw": data}
    except Exception:
        return {"ok": False, "messages": [], "raw": result}

# ─── Usage ────────────────────────────────────────────────────────────────────
_usage_cache: dict = {"ts": 0, "data": {}}

@app.get("/api/usage")
async def get_usage(user=Depends(verify_token)):
    global _usage_cache
    now = time.time()
    if now - _usage_cache["ts"] < 30:
        return _usage_cache["data"]
    sessions_result = await oc_invoke("sessions_list", {"limit": 200, "activeMinutes": 10080}, timeout=10)
    try:
        data = json.loads(_parse_oc_text(sessions_result))
        sessions = data.get("sessions", [])
        total_cost = sum(s.get("estimatedCostUsd", 0) for s in sessions)
        total_tokens = sum(s.get("totalTokens", 0) for s in sessions)
        active_sessions = len([s for s in sessions if s.get("status") == "running"])
    except Exception:
        total_cost = total_tokens = active_sessions = 0
    budget = 100.0
    usage = {
        "ok": True,
        "estimatedCostUsd": round(total_cost, 4),
        "totalTokens": total_tokens,
        "activeSessions": active_sessions,
        "budgetMonthlyUsd": budget,
        "budgetUsedPct": min(100, round((total_cost / budget) * 100, 1)),
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
    return {"ok": True, "ts": int(time.time()), "version": "1.0.0"}

# ─── Static ───────────────────────────────────────────────────────────────────
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"status": "backend ok", "note": "run npm run build in bomico-hq-ui first"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8898, reload=False, log_level="info")
