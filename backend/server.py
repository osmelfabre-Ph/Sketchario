from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os, logging, uuid, json, secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional
import bcrypt
import jwt as pyjwt

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Helpers ──────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie(key="access_token", value=access, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

def user_response(user: dict) -> dict:
    u = {k: v for k, v in user.items() if k != "password_hash"}
    if "_id" in u and not isinstance(u["_id"], str):
        u["_id"] = str(u["_id"])
    u["id"] = u.pop("_id", u.get("id"))
    return u

# ── Models ───────────────────────────────────────────
class RegisterInput(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class ProjectCreate(BaseModel):
    name: str
    sector: str
    description: Optional[str] = ""
    objective_awareness: int = 60
    objective_education: int = 30
    objective_monetizing: int = 10
    formats: List[str] = ["reel", "carousel"]
    duration_weeks: int = 1
    geo: Optional[str] = ""
    brief_notes: Optional[str] = ""
    campaign_start: Optional[str] = None
    campaign_end: Optional[str] = None

class GeneratePersonasInput(BaseModel):
    project_id: str

class SavePersonasInput(BaseModel):
    project_id: str
    personas: list

class GenerateHooksInput(BaseModel):
    project_id: str

class SaveHooksInput(BaseModel):
    project_id: str
    hooks: list

class GenerateContentInput(BaseModel):
    project_id: str
    hook_ids: Optional[List[str]] = None

class ContentUpdate(BaseModel):
    script: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    slides: Optional[list] = None

class TovProfileInput(BaseModel):
    project_id: str
    preset: Optional[str] = None
    formality: int = 5
    energy: int = 5
    empathy: int = 5
    humor: int = 3
    storytelling: int = 5
    custom_instructions: Optional[str] = ""
    brand_keywords: Optional[str] = ""
    forbidden_words: Optional[str] = ""
    signature_phrases: Optional[str] = ""
    caption_length: str = "medium"

class BrandKitInput(BaseModel):
    project_id: str
    brand_name: Optional[str] = ""
    brand_brief: Optional[str] = ""

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class PostCreate(BaseModel):
    project_id: str
    hook_text: str
    format: str = "reel"
    use_ai: bool = False

# ── AUTH ROUTES ──────────────────────────────────────
@api.post("/auth/register")
async def register(inp: RegisterInput, response: Response):
    email = inp.email.strip().lower()
    if len(inp.password) < 8:
        raise HTTPException(400, "La password deve avere almeno 8 caratteri")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Email gi\u00e0 registrata")
    doc = {
        "email": email,
        "name": inp.name.strip(),
        "password_hash": hash_password(inp.password),
        "role": "user",
        "plan": "free",
        "sector": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    access = create_access_token(doc["_id"], email)
    refresh = create_refresh_token(doc["_id"])
    set_auth_cookies(response, access, refresh)
    return {"user": user_response(doc), "access_token": access}

@api.post("/auth/login")
async def login(inp: LoginInput, response: Response, request: Request):
    email = inp.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc) < datetime.fromisoformat(locked_until):
            raise HTTPException(429, "Troppi tentativi. Riprova tra 15 minuti.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user.get("password_hash", "")):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(401, "Credenziali non valide")
    await db.login_attempts.delete_one({"identifier": identifier})
    user["_id"] = str(user["_id"])
    access = create_access_token(user["_id"], email)
    refresh = create_refresh_token(user["_id"])
    set_auth_cookies(response, access, refresh)
    return {"user": user_response(user), "access_token": access}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {"user": user_response(user)}

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(401, "No refresh token")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(401, "User not found")
        user_id = str(user["_id"])
        access = create_access_token(user_id, user["email"])
        set_auth_cookies(response, access, token)
        return {"user": user_response({**user, "_id": user_id}), "access_token": access}
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")

# ── PROFILE ROUTES ───────────────────────────────────
@api.get("/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    return user_response(user)

@api.put("/profile")
async def update_profile(inp: ProfileUpdate, request: Request):
    user = await get_current_user(request)
    updates = {}
    if inp.name is not None:
        updates["name"] = inp.name
    if inp.sector is not None:
        updates["sector"] = inp.sector
    if updates:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": updates})
    updated = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated["_id"] = str(updated["_id"])
    return user_response(updated)

@api.post("/profile/change-password")
async def change_password(inp: PasswordChange, request: Request):
    user = await db.users.find_one({"_id": ObjectId((await get_current_user(request))["_id"])})
    if not verify_password(inp.current_password, user.get("password_hash", "")):
        raise HTTPException(400, "Password attuale non corretta")
    if len(inp.new_password) < 8:
        raise HTTPException(400, "La nuova password deve avere almeno 8 caratteri")
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_password(inp.new_password)}})
    return {"ok": True}

@api.delete("/profile/delete-account")
async def delete_account(request: Request):
    user = await get_current_user(request)
    uid = ObjectId(user["_id"])
    projects = await db.projects.find({"user_id": user["_id"]}, {"_id": 1}).to_list(1000)
    pids = [str(p["_id"]) for p in projects]
    for pid in pids:
        await db.personas.delete_many({"project_id": pid})
        await db.hooks.delete_many({"project_id": pid})
        await db.contents.delete_many({"project_id": pid})
        await db.tov_profiles.delete_many({"project_id": pid})
        await db.brand_kits.delete_many({"project_id": pid})
    await db.projects.delete_many({"user_id": user["_id"]})
    await db.users.delete_one({"_id": uid})
    return {"ok": True}

# ── PROJECTS ROUTES ──────────────────────────────────
@api.get("/projects")
async def list_projects(request: Request):
    user = await get_current_user(request)
    projects = await db.projects.find({"user_id": user["_id"]}, {"_id": 1, "name": 1, "sector": 1, "status": 1, "created_at": 1, "content_count": 1, "archived": 1}).to_list(100)
    for p in projects:
        p["id"] = str(p.pop("_id"))
    return projects

@api.post("/projects")
async def create_project(inp: ProjectCreate, request: Request):
    user = await get_current_user(request)
    doc = {
        "user_id": user["_id"],
        "name": inp.name,
        "sector": inp.sector,
        "description": inp.description,
        "objectives": {"awareness": inp.objective_awareness, "education": inp.objective_education, "monetizing": inp.objective_monetizing},
        "formats": inp.formats,
        "duration_weeks": inp.duration_weeks,
        "geo": inp.geo,
        "brief_notes": inp.brief_notes,
        "campaign_start": inp.campaign_start,
        "campaign_end": inp.campaign_end,
        "status": "draft",
        "archived": False,
        "content_count": 0,
        "wizard_step": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.projects.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@api.get("/projects/{project_id}")
async def get_project(project_id: str, request: Request):
    user = await get_current_user(request)
    p = await db.projects.find_one({"_id": ObjectId(project_id), "user_id": user["_id"]})
    if not p:
        raise HTTPException(404, "Progetto non trovato")
    p["id"] = str(p.pop("_id"))
    return p

@api.put("/projects/{project_id}")
async def update_project(project_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    body.pop("_id", None)
    body.pop("id", None)
    body.pop("user_id", None)
    await db.projects.update_one({"_id": ObjectId(project_id), "user_id": user["_id"]}, {"$set": body})
    return {"ok": True}

@api.delete("/projects/{project_id}")
async def delete_project(project_id: str, request: Request):
    user = await get_current_user(request)
    await db.personas.delete_many({"project_id": project_id})
    await db.hooks.delete_many({"project_id": project_id})
    await db.contents.delete_many({"project_id": project_id})
    await db.tov_profiles.delete_many({"project_id": project_id})
    await db.brand_kits.delete_many({"project_id": project_id})
    await db.projects.delete_one({"_id": ObjectId(project_id), "user_id": user["_id"]})
    return {"ok": True}

@api.post("/projects/{project_id}/archive")
async def archive_project(project_id: str, request: Request):
    user = await get_current_user(request)
    await db.projects.update_one({"_id": ObjectId(project_id), "user_id": user["_id"]}, {"$set": {"archived": True}})
    return {"ok": True}

@api.post("/projects/{project_id}/unarchive")
async def unarchive_project(project_id: str, request: Request):
    user = await get_current_user(request)
    await db.projects.update_one({"_id": ObjectId(project_id), "user_id": user["_id"]}, {"$set": {"archived": False}})
    return {"ok": True}

# ── AI GENERATION ────────────────────────────────────
async def call_ai(system_prompt: str, user_prompt: str) -> str:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=f"sk-{uuid.uuid4().hex[:12]}",
        system_message=system_prompt
    ).with_model("gemini", "gemini-3-flash-preview")
    response = await chat.send_message(UserMessage(text=user_prompt))
    return response

def extract_json(text: str):
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:] if lines[0].startswith("```") else lines
        end = next((i for i, l in enumerate(lines) if l.strip() == "```"), len(lines))
        text = "\n".join(lines[:end])
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("[")
        end = text.rfind("]")
        if start >= 0 and end > start:
            return json.loads(text[start:end+1])
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start:end+1])
        raise

# ── PERSONAS ─────────────────────────────────────────
@api.post("/personas/generate")
async def generate_personas(inp: GeneratePersonasInput, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(inp.project_id), "user_id": user["_id"]})
    if not project:
        raise HTTPException(404, "Progetto non trovato")
    system = "Sei un esperto di marketing strategico. Genera buyer personas dettagliate in formato JSON. Rispondi SOLO con un array JSON valido, senza markdown."
    prompt = f"""Genera 6 buyer personas MECE per un progetto nel settore: {project['sector']}.
Descrizione: {project.get('description', '')}
Area: {project.get('geo', 'Italia')}

Per ogni persona restituisci un oggetto JSON con:
- name: nome e eta (es. "Marco, 35")
- role: professione/ruolo
- age_range: fascia eta
- pain_points: lista di 2-3 pain point
- desires: lista di 2-3 desideri
- objections: lista di 1-2 obiezioni
- channels: canali social preferiti

Rispondi con un array JSON di 6 oggetti."""
    try:
        result = await call_ai(system, prompt)
        personas = extract_json(result)
        return {"personas": personas}
    except Exception as e:
        logger.error(f"AI persona generation error: {e}")
        raise HTTPException(500, f"Errore generazione personas: {str(e)}")

@api.post("/personas/save")
async def save_personas(inp: SavePersonasInput, request: Request):
    user = await get_current_user(request)
    await db.personas.delete_many({"project_id": inp.project_id})
    for p in inp.personas:
        p["project_id"] = inp.project_id
        p["id"] = str(uuid.uuid4())
        await db.personas.insert_one(p)
    await db.projects.update_one({"_id": ObjectId(inp.project_id)}, {"$set": {"wizard_step": 1}})
    return {"ok": True, "count": len(inp.personas)}

@api.get("/personas/{project_id}")
async def get_personas(project_id: str, request: Request):
    await get_current_user(request)
    personas = await db.personas.find({"project_id": project_id}, {"_id": 0}).to_list(20)
    return personas

# ── HOOKS ────────────────────────────────────────────
@api.post("/hooks/generate")
async def generate_hooks(inp: GenerateHooksInput, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(inp.project_id), "user_id": user["_id"]})
    if not project:
        raise HTTPException(404, "Progetto non trovato")
    personas = await db.personas.find({"project_id": inp.project_id}, {"_id": 0}).to_list(20)
    tov = await db.tov_profiles.find_one({"project_id": inp.project_id}, {"_id": 0})
    weeks = project.get("duration_weeks", 1)
    num_hooks = weeks * 7
    tov_desc = ""
    if tov:
        tov_desc = f"Tono: formalita {tov.get('formality',5)}/10, energia {tov.get('energy',5)}/10, empatia {tov.get('empathy',5)}/10, humor {tov.get('humor',3)}/10. {tov.get('custom_instructions','')}"
    system = "Sei un content strategist esperto. Genera hook per contenuti social in formato JSON. Rispondi SOLO con un array JSON valido."
    prompt = f"""Genera {num_hooks} hook per un progetto nel settore: {project['sector']}.
Descrizione: {project.get('description','')}
Area: {project.get('geo','Italia')}
Obiettivi: Awareness {project['objectives']['awareness']}%, Educazione {project['objectives']['education']}%, Monetizing {project['objectives']['monetizing']}%
Formati disponibili: {', '.join(project.get('formats',['reel','carousel']))}
Personas: {json.dumps([p.get('name','') + ' - ' + p.get('role','') for p in personas])}
{tov_desc}

Per ogni hook restituisci:
- hook_text: testo dell'hook (frase ad effetto)
- format: "reel" o "carousel"
- pillar: "awareness", "education" o "monetizing"
- persona_target: nome della persona target
- day_offset: giorno dalla partenza (0, 1, 2, ...)

Distribuisci i formati e i pillar secondo gli obiettivi. Rispondi con un array JSON di {num_hooks} oggetti."""
    try:
        result = await call_ai(system, prompt)
        hooks = extract_json(result)
        return {"hooks": hooks}
    except Exception as e:
        logger.error(f"AI hook generation error: {e}")
        raise HTTPException(500, f"Errore generazione hook: {str(e)}")

@api.post("/hooks/save")
async def save_hooks(inp: SaveHooksInput, request: Request):
    await get_current_user(request)
    await db.hooks.delete_many({"project_id": inp.project_id})
    for h in inp.hooks:
        h["project_id"] = inp.project_id
        h["id"] = str(uuid.uuid4())
        await db.hooks.insert_one(h)
    await db.projects.update_one({"_id": ObjectId(inp.project_id)}, {"$set": {"wizard_step": 3}})
    return {"ok": True, "count": len(inp.hooks)}

@api.get("/hooks/{project_id}")
async def get_hooks(project_id: str, request: Request):
    await get_current_user(request)
    hooks = await db.hooks.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    return hooks

@api.put("/hooks/{hook_id}")
async def update_hook(hook_id: str, request: Request):
    await get_current_user(request)
    body = await request.json()
    await db.hooks.update_one({"id": hook_id}, {"$set": body})
    return {"ok": True}

# ── CONTENT GENERATION ───────────────────────────────
@api.post("/content/generate")
async def generate_content(inp: GenerateContentInput, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(inp.project_id), "user_id": user["_id"]})
    if not project:
        raise HTTPException(404, "Progetto non trovato")
    query = {"project_id": inp.project_id}
    if inp.hook_ids:
        query["id"] = {"$in": inp.hook_ids}
    hooks = await db.hooks.find(query, {"_id": 0}).to_list(100)
    if not hooks:
        raise HTTPException(400, "Nessun hook trovato")
    tov = await db.tov_profiles.find_one({"project_id": inp.project_id}, {"_id": 0})
    caption_len = "120-180 parole"
    if tov:
        cl = tov.get("caption_length", "medium")
        caption_len = "max 60 parole" if cl == "short" else ("300-450 parole" if cl == "long" else "120-180 parole")
    tov_desc = ""
    if tov:
        tov_desc = f"Tono: formalita {tov.get('formality',5)}/10, energia {tov.get('energy',5)}/10, empatia {tov.get('empathy',5)}/10, humor {tov.get('humor',3)}/10. Istruzioni: {tov.get('custom_instructions','')}"
    generated = []
    for hook in hooks:
        system = "Sei un copywriter professionista per social media. Genera contenuti completi in italiano. Rispondi SOLO con JSON valido."
        prompt = f"""Genera un contenuto social completo per questo hook:
Hook: {hook.get('hook_text','')}
Formato: {hook.get('format','reel')}
Settore: {project['sector']}
{tov_desc}
Lunghezza caption: {caption_len}

Restituisci un oggetto JSON con:
- script: lo script completo del contenuto (per reel: script parlato; per carousel: testo di ogni slide separato da ---)
- caption: la caption per il post
- hashtags: stringa di hashtag separati da spazi
- slides: se carousel, array di stringhe (testo per ogni slide); se reel, array vuoto"""
        try:
            result = await call_ai(system, prompt)
            content_data = extract_json(result)
            content_doc = {
                "id": str(uuid.uuid4()),
                "project_id": inp.project_id,
                "hook_id": hook.get("id", ""),
                "hook_text": hook.get("hook_text", ""),
                "format": hook.get("format", "reel"),
                "pillar": hook.get("pillar", ""),
                "persona_target": hook.get("persona_target", ""),
                "day_offset": hook.get("day_offset", 0),
                "script": content_data.get("script", ""),
                "caption": content_data.get("caption", ""),
                "hashtags": content_data.get("hashtags", ""),
                "slides": content_data.get("slides", []),
                "media": [],
                "status": "draft",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.contents.insert_one({k: v for k, v in content_doc.items() if k != "_id"})
            generated.append(content_doc)
        except Exception as e:
            logger.error(f"Content generation error for hook {hook.get('hook_text','')}: {e}")
            generated.append({"hook_text": hook.get("hook_text", ""), "error": str(e)})
    count = len([g for g in generated if "error" not in g])
    await db.projects.update_one({"_id": ObjectId(inp.project_id)}, {"$set": {"content_count": count, "wizard_step": 4, "status": "active"}})
    return {"generated": generated, "count": count}

@api.post("/content/create-post")
async def create_post(inp: PostCreate, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(inp.project_id), "user_id": user["_id"]})
    if not project:
        raise HTTPException(404, "Progetto non trovato")
    content_doc = {
        "id": str(uuid.uuid4()),
        "project_id": inp.project_id,
        "hook_id": "",
        "hook_text": inp.hook_text,
        "format": inp.format,
        "pillar": "",
        "persona_target": "",
        "day_offset": 0,
        "script": "",
        "caption": "",
        "hashtags": "",
        "slides": [],
        "media": [],
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    if inp.use_ai:
        tov = await db.tov_profiles.find_one({"project_id": inp.project_id}, {"_id": 0})
        tov_desc = ""
        if tov:
            tov_desc = f"Tono: formalita {tov.get('formality',5)}/10, energia {tov.get('energy',5)}/10."
        system = "Sei un copywriter. Genera contenuto social in italiano. Rispondi SOLO con JSON."
        prompt = f"Genera script, caption e hashtag per: {inp.hook_text}. Formato: {inp.format}. Settore: {project['sector']}. {tov_desc}. JSON con: script, caption, hashtags, slides (array)."
        try:
            result = await call_ai(system, prompt)
            data = extract_json(result)
            content_doc.update({k: data.get(k, content_doc[k]) for k in ["script", "caption", "hashtags", "slides"]})
        except Exception as e:
            logger.error(f"AI post creation error: {e}")
    await db.contents.insert_one({k: v for k, v in content_doc.items() if k != "_id"})
    await db.projects.update_one({"_id": ObjectId(inp.project_id)}, {"$inc": {"content_count": 1}})
    return content_doc

# ── CONTENTS CRUD ────────────────────────────────────
@api.get("/contents/{project_id}")
async def get_contents(project_id: str, request: Request):
    await get_current_user(request)
    contents = await db.contents.find({"project_id": project_id}, {"_id": 0}).to_list(200)
    return contents

@api.put("/contents/{content_id}")
async def update_content(content_id: str, inp: ContentUpdate, request: Request):
    await get_current_user(request)
    updates = {k: v for k, v in inp.model_dump().items() if v is not None}
    if updates:
        await db.contents.update_one({"id": content_id}, {"$set": updates})
    return {"ok": True}

@api.delete("/contents/{content_id}")
async def delete_content(content_id: str, request: Request):
    await get_current_user(request)
    result = await db.contents.find_one({"id": content_id})
    if result:
        await db.contents.delete_one({"id": content_id})
        await db.projects.update_one({"_id": ObjectId(result["project_id"])}, {"$inc": {"content_count": -1}})
    return {"ok": True}

# ── TOV ROUTES ───────────────────────────────────────
@api.post("/tov/save")
async def save_tov(inp: TovProfileInput, request: Request):
    await get_current_user(request)
    doc = inp.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.tov_profiles.update_one({"project_id": inp.project_id}, {"$set": doc}, upsert=True)
    await db.projects.update_one({"_id": ObjectId(inp.project_id)}, {"$set": {"wizard_step": 2}})
    return {"ok": True}

@api.get("/tov/{project_id}")
async def get_tov(project_id: str, request: Request):
    await get_current_user(request)
    tov = await db.tov_profiles.find_one({"project_id": project_id}, {"_id": 0})
    return tov or {}

# ── BRAND KIT ROUTES ─────────────────────────────────
@api.post("/brand-kit/save")
async def save_brand_kit(inp: BrandKitInput, request: Request):
    await get_current_user(request)
    doc = inp.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.brand_kits.update_one({"project_id": inp.project_id}, {"$set": doc}, upsert=True)
    return {"ok": True}

@api.get("/brand-kit/{project_id}")
async def get_brand_kit(project_id: str, request: Request):
    await get_current_user(request)
    bk = await db.brand_kits.find_one({"project_id": project_id}, {"_id": 0})
    return bk or {}

# ── EXPORT ───────────────────────────────────────────
@api.get("/export/{project_id}/json")
async def export_json(project_id: str, request: Request):
    await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(project_id)}, {"_id": 0})
    contents = await db.contents.find({"project_id": project_id}, {"_id": 0}).to_list(200)
    personas = await db.personas.find({"project_id": project_id}, {"_id": 0}).to_list(20)
    hooks = await db.hooks.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    return {"project": project, "personas": personas, "hooks": hooks, "contents": contents}

# ── ROOT ─────────────────────────────────────────────
@api.get("/")
async def root():
    return {"message": "Sketchario API v2.0"}

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── STARTUP ──────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.projects.create_index("user_id")
    await db.personas.create_index("project_id")
    await db.hooks.create_index("project_id")
    await db.contents.create_index("project_id")
    await db.tov_profiles.create_index("project_id")
    await db.brand_kits.create_index("project_id")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@sketchario.app")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Sketchario2026!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email, "name": "Admin", "password_hash": hash_password(admin_password),
            "role": "admin", "plan": "custom", "sector": "", "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
    # Write test credentials
    creds_dir = Path("/app/memory")
    creds_dir.mkdir(exist_ok=True)
    (creds_dir / "test_credentials.md").write_text(
        f"# Sketchario Test Credentials\n\n"
        f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n"
        f"## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n"
    )

@app.on_event("shutdown")
async def shutdown():
    client.close()
