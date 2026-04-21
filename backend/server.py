from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os, logging, uuid, json, secrets, base64, shutil, hashlib
from urllib.parse import quote
from starlette.responses import HTMLResponse
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import bcrypt
import jwt as pyjwt
import feedparser
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
app.mount("/api/media/file", StaticFiles(directory="/app/uploads"), name="uploads")
api = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

# ── SMTP EMAIL ───────────────────────────────────────
async def send_email_smtp(to: str, subject: str, html_body: str):
    smtp_host = os.environ.get("SMTP_HOST", "smtps.aruba.it")
    smtp_port = int(os.environ.get("SMTP_PORT", "465"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASSWORD", "")
    smtp_from = os.environ.get("SMTP_FROM", smtp_user)
    if not smtp_user or not smtp_pass:
        logger.warning("SMTP not configured, email not sent")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Sketchario <{smtp_from}>"
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, to, msg.as_string())
        logger.info(f"Email sent to {to}")
        return True
    except Exception as e:
        logger.error(f"SMTP email error: {e}")
        return False

# ── GLOBAL PROMPTING ─────────────────────────────────
GLOBAL_CONTENT_PROMPT = """REGOLE ASSOLUTE PER LA GENERAZIONE DI CONTENUTI SOCIAL (da rispettare sempre, senza eccezioni):

## HOOK (max 5 parole)
- MAI iniziare con "Ciao", "Ciao a tutti", saluti o presentazioni generiche
- MAI iniziare con il nome del brand o del prodotto
- Usare SOLO: domande provocatorie, affermazioni negative/controintuitive, numeri specifici, gap di curiosità, sfide dirette
- Esempi VIETATI: "Ciao a tutti! Oggi vi presento..." / "Siamo qui per..."
- Esempi CORRETTI: "Stai perdendo soldi ogni giorno." / "Perché nessuno te lo dice?" / "3 errori che tutti fanno."

## SCRIPT (corpo del contenuto)
- STRUTTURA NARRATIVA OBBLIGATORIA: Tensione/Problema → Risonanza emotiva ("lo conosco, lo capisco") → Soluzione/Valore concreto → Urgenza/CTA
- ZERO emoji nello script. Le emoji vanno SOLO nella caption.
- NON parlare del prodotto/servizio direttamente nelle prime 2/3 dello script: parla del PROBLEMA o DESIDERIO del lettore
- NON usare linguaggio promozionale generico: no "offerte imperdibili", "non perdere questa occasione", "visitate il nostro sito"
- Usa linguaggio specifico, personale, concreto. "La tua auto ti aspetta" → "Ogni giorno che aspetti è un giorno in meno da vivere il viaggio che meriti"
- Ritmo: frasi corte. Max 15 parole per frase. Alterni con frasi più lunghe per creare respiro.

## CAPTION
- OBBLIGATORIAMENTE diversa dallo script per angolazione e tono (non è un riassunto!)
- Prima riga: hook autonomo che funziona senza contesto
- Corpo: valore aggiuntivo, storytelling complementare, o prospettiva diversa
- Chiusura: CTA specifico e personale (non generico "clicca qui")
- Emoji: massimo 3-4, strategicamente posizionate, mai a caso
- Paragrafi brevi con spazi per leggibilità mobile

## QUALITÀ MINIMA RICHIESTA
- Ogni pezzo deve creare TENSIONE PSICOLOGICA (FOMO, curiosità, empatia, sfida)
- Specifico batte generico SEMPRE. Numeri concreti, esempi reali, situazioni riconoscibili
- Vietato: tono da spot pubblicitario anni '90, frasi motivazionali vuote, ottimismo generico
- Il lettore deve riconoscersi nella situazione descritta entro le prime 2 frasi"""

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Helpers ──────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
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
    await check_plan_limit(user, "project")
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

@api.get("/projects/{project_id}/wizard-state")
async def get_wizard_state(project_id: str, request: Request):
    user = await get_current_user(request)
    p = await db.projects.find_one({"_id": ObjectId(project_id), "user_id": user["_id"]})
    if not p:
        raise HTTPException(404, "Progetto non trovato")
    p["id"] = str(p.pop("_id"))
    wizard_step = p.get("wizard_step", 0)
    result = {"project": p, "personas": [], "tov": None, "hooks": []}
    if wizard_step >= 1:
        result["personas"] = await db.personas.find({"project_id": project_id}, {"_id": 0}).to_list(20)
    if wizard_step >= 2:
        result["tov"] = await db.tov_profiles.find_one({"project_id": project_id}, {"_id": 0})
    if wizard_step >= 3:
        result["hooks"] = await db.hooks.find({"project_id": project_id}, {"_id": 0}).to_list(200)
    return result

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

# ── PROJECT COVER ─────────────────────────────────────
@api.post("/projects/{project_id}/cover")
async def upload_project_cover(project_id: str, request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        raise HTTPException(400, "Formato non supportato. Usa jpg, png, webp o gif.")
    fname = f"cover_{project_id}_{uuid.uuid4().hex[:8]}.{ext}"
    fpath = UPLOAD_DIR / fname
    with open(fpath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    cover_url = f"/api/media/file/{fname}"
    old = await db.projects.find_one({"_id": ObjectId(project_id), "user_id": user["_id"]})
    if old and old.get("cover_url"):
        old_fname = old["cover_url"].split("/")[-1]
        old_fpath = UPLOAD_DIR / old_fname
        if old_fpath.exists():
            old_fpath.unlink()
    await db.projects.update_one({"_id": ObjectId(project_id), "user_id": user["_id"]}, {"$set": {"cover_url": cover_url}})
    return {"cover_url": cover_url}

@api.delete("/projects/{project_id}/cover")
async def remove_project_cover(project_id: str, request: Request):
    user = await get_current_user(request)
    p = await db.projects.find_one({"_id": ObjectId(project_id), "user_id": user["_id"]})
    if p and p.get("cover_url"):
        fname = p["cover_url"].split("/")[-1]
        fpath = UPLOAD_DIR / fname
        if fpath.exists():
            fpath.unlink()
    await db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": {"cover_url": ""}})
    return {"ok": True}

# ── AI GENERATION ────────────────────────────────────
async def call_ai(system_prompt: str, user_prompt: str) -> str:
    import asyncio
    # Primary: OpenAI GPT-4o-mini
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
            ),
            timeout=240
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning(f"OpenAI failed, falling back to Gemini: {e}")
    # Fallback: Gemini
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    response = await asyncio.wait_for(
        client.aio.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=user_prompt,
            config=types.GenerateContentConfig(system_instruction=system_prompt)
        ),
        timeout=240
    )
    return response.text

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

def coerce_str(val) -> str:
    """Ensure a field that should be a plain string actually is one.
    If the AI returns an object/dict (e.g. visual_direction as structured JSON),
    flatten it to a readable string so the UI never shows [object Object]."""
    if isinstance(val, str):
        return val
    if isinstance(val, dict):
        return " — ".join(f"{v}" for v in val.values() if v)
    if isinstance(val, list):
        return " ".join(str(i) for i in val)
    return str(val) if val is not None else ""

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
- role: professione o tipo di persona (es. "Insegnante", "Libero professionista", "Imprenditore")
- age: età in anni (numero intero)
- pain_points: lista di 2-3 pain point
- desires: lista di 2-3 desideri
- objections: lista di 1-2 obiezioni
- channels: canali social preferiti

Rispondi con un array JSON di 6 oggetti."""
    try:
        result = await call_ai(system, prompt)
        personas = extract_json(result)
        # Auto-save as draft immediately after generation
        await db.personas.delete_many({"project_id": inp.project_id})
        for p in personas:
            p["project_id"] = inp.project_id
            p["id"] = str(uuid.uuid4())
            await db.personas.insert_one(p)
            p.pop("_id", None)
        await db.projects.update_one({"_id": ObjectId(inp.project_id)}, {"$set": {"wizard_step": 1}})
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
    system = f"{GLOBAL_CONTENT_PROMPT}\n\nSei un content strategist esperto. Genera hook per contenuti social in formato JSON. Rispondi SOLO con un array JSON valido."
    prompt = f"""Genera {num_hooks} hook per un progetto nel settore: {project['sector']}.
Descrizione: {project.get('description','')}
Area: {project.get('geo','Italia')}
Obiettivi: Awareness {project['objectives']['awareness']}%, Educazione {project['objectives']['education']}%, Monetizing {project['objectives']['monetizing']}%
Formati disponibili: {', '.join(project.get('formats',['reel','carousel']))}
Personas: {json.dumps([p.get('name','') + ' - ' + p.get('role','') for p in personas])}
{tov_desc}

Per ogni hook restituisci:
- hook_text: testo dell'hook (frase ad effetto)
- format: uno tra {', '.join([f'"{f}"' for f in project.get('formats', ['reel', 'carousel'])])}
- pillar: "awareness", "education" o "monetizing"
- persona_target: nome della persona target
- day_offset: giorno dalla partenza (0, 1, 2, ...)

Distribuisci i formati in modo equilibrato tra quelli disponibili. Se "prompted_reel" è disponibile usalo per circa il 20% degli hook. Rispondi con un array JSON di {num_hooks} oggetti."""
    try:
        result = await call_ai(system, prompt)
        hooks = extract_json(result)
        # Auto-save as draft immediately after generation
        await db.hooks.delete_many({"project_id": inp.project_id})
        for h in hooks:
            h["project_id"] = inp.project_id
            h["id"] = str(uuid.uuid4())
            await db.hooks.insert_one(h)
            h.pop("_id", None)
        await db.projects.update_one({"_id": ObjectId(inp.project_id)}, {"$set": {"wizard_step": 3}})
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
        system = f"{GLOBAL_CONTENT_PROMPT}\n\nSei un copywriter professionista per social media. Genera contenuti completi in italiano. Rispondi SOLO con JSON valido."
        fmt = hook.get('format', 'reel')
        if fmt == 'prompted_reel':
            prompt = f"""Sei un esperto di video marketing con avatar AI. Crea materiale completo per un Prompted Reel da usare con strumenti come HeyGen o D-ID.

Hook: {hook.get('hook_text','')}
Settore: {project['sector']}
{tov_desc}

Restituisci un oggetto JSON con:
- opening_hook: testo parlato dei primi 3-5 secondi (cattura immediatamente, max 2 frasi)
- script: script completo per l'avatar (scritto come se stesse parlando, con indicazioni di ritmo tra parentesi quadre: [pausa], [enfasi], [veloce], [lento])
- visual_direction: descrizione visiva CONCRETA della scena da realizzare. Specifica: CHI è il soggetto (es. "uomo 35enne in camicia blu"), COSA fa esattamente (postura, gesti precisi), DOVE si trova (ambientazione specifica con dettagli: sfondo, luce, elementi presenti), CHE ESPRESSIONE ha (emozione precisa), e INQUADRATURA consigliata (Wide shot / Full body / Medium shot / Close-up / Macro). Deve essere abbastanza dettagliata da generare un'immagine senza ambiguità.
- caption: caption ottimizzata per la pubblicazione social (lunghezza {caption_len})
- hashtags: stringa di hashtag separati da spazi
- slides: array vuoto"""
        else:
            prompt = f"""Genera un contenuto social completo per questo hook:
Hook: {hook.get('hook_text','')}
Formato: {fmt}
Settore: {project['sector']}
{tov_desc}
Lunghezza caption: {caption_len}

Restituisci un oggetto JSON con:
- script: lo script completo del contenuto (per reel: script parlato; per carousel: testo di ogni slide separato da ---)
- caption: la caption per il post
- hashtags: stringa di hashtag separati da spazi
- slides: se carousel, array di stringhe (testo per ogni slide); se reel, array vuoto
- opening_hook: stringa vuota
- visual_direction: stringa vuota"""
        try:
            result = await call_ai(system, prompt)
            content_data = extract_json(result)
            content_doc = {
                "id": str(uuid.uuid4()),
                "project_id": inp.project_id,
                "hook_id": hook.get("id", ""),
                "hook_text": hook.get("hook_text", ""),
                "format": fmt,
                "pillar": hook.get("pillar", ""),
                "persona_target": hook.get("persona_target", ""),
                "day_offset": hook.get("day_offset", 0),
                "script": content_data.get("script", ""),
                "opening_hook": content_data.get("opening_hook", ""),
                "visual_direction": coerce_str(content_data.get("visual_direction", "")),
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
    await check_plan_limit(user, "content", inp.project_id)
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
        "opening_hook": "",
        "visual_direction": "",
        "caption": "",
        "hashtags": "",
        "slides": [],
        "media": [],
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    if inp.use_ai:
        tov = await db.tov_profiles.find_one({"project_id": inp.project_id}, {"_id": 0})
        tov_desc = f"Tono: formalita {tov.get('formality',5)}/10, energia {tov.get('energy',5)}/10." if tov else ""
        system = f"{GLOBAL_CONTENT_PROMPT}\n\nSei un copywriter professionista. Genera contenuto social in italiano. Rispondi SOLO con JSON."
        if inp.format == 'prompted_reel':
            prompt = f"Crea un Prompted Reel per avatar AI: {inp.hook_text}. Settore: {project['sector']}. {tov_desc}. JSON con: opening_hook, script (con note di ritmo [pausa][enfasi]), visual_direction (descrizione visiva CONCRETA: chi è il soggetto con dettagli fisici/abbigliamento precisi, cosa fa esattamente, dove si trova con ambientazione specifica e illuminazione, che espressione ha, e inquadratura consigliata tra Wide shot/Full body/Medium shot/Close-up/Macro — leggibile come brief fotografico), caption, hashtags, slides (array vuoto)."
        else:
            prompt = f"Genera script, caption e hashtag per: {inp.hook_text}. Formato: {inp.format}. Settore: {project['sector']}. {tov_desc}. JSON con: script, caption, hashtags, slides (array), opening_hook (''), visual_direction ('')."
        try:
            result = await call_ai(system, prompt)
            data = extract_json(result)
            content_doc.update({k: data.get(k, content_doc[k]) for k in ["script", "caption", "hashtags", "slides", "opening_hook"]})
            if "visual_direction" in data:
                content_doc["visual_direction"] = coerce_str(data["visual_direction"])
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

# ── CONTENT REGENERATION / CONVERSION ─────────────────
class ContentRegenerateInput(BaseModel):
    content_id: str
    project_id: str

class ContentConvertInput(BaseModel):
    content_id: str
    project_id: str
    target_format: str

@api.post("/contents/regenerate")
async def regenerate_content(inp: ContentRegenerateInput, request: Request):
    user = await get_current_user(request)
    content = await db.contents.find_one({"id": inp.content_id, "project_id": inp.project_id})
    if not content:
        raise HTTPException(404, "Contenuto non trovato")
    project = await db.projects.find_one({"_id": ObjectId(inp.project_id)})
    tov = await db.tov_profiles.find_one({"project_id": inp.project_id}, {"_id": 0})
    tov_desc = ""
    if tov:
        tov_desc = f"Tono: formalita {tov.get('formality',5)}/10, energia {tov.get('energy',5)}/10, empatia {tov.get('empathy',5)}/10, humor {tov.get('humor',3)}/10. {tov.get('custom_instructions','')}"
    system = f"{GLOBAL_CONTENT_PROMPT}\n\nSei un copywriter professionista per social media. Rigenera questo contenuto migliorandolo. Rispondi SOLO con JSON valido. Scrivi in italiano."
    fmt = content.get('format', 'reel')
    if fmt == 'prompted_reel':
        prompt = f"""Rigenera questo Prompted Reel migliorandolo:
Hook: {content.get('hook_text','')}
Settore: {project.get('sector','')}
{tov_desc}
Restituisci JSON con: hook_text, opening_hook, script (con note ritmo [pausa][enfasi]), visual_direction (descrizione visiva CONCRETA: CHI il soggetto con dettagli fisici/abbigliamento, COSA fa con postura/gesti esatti, DOVE ambientazione specifica con luce e sfondo, CHE espressione, INQUADRATURA consigliata tra Wide shot/Full body/Medium shot/Close-up/Macro — leggibile come brief fotografico), caption, hashtags, slides (array vuoto)"""
    else:
        prompt = f"""Rigenera questo contenuto social migliorando hook, script, caption e hashtag:
Hook originale: {content.get('hook_text','')}
Formato: {fmt}
Settore: {project.get('sector','')}
{tov_desc}
Restituisci JSON con: hook_text, script, caption, hashtags, slides (array di stringhe per carousel, vuoto per reel), opening_hook (''), visual_direction ('')"""
    try:
        result = await call_ai(system, prompt)
        data = extract_json(result)
        updates = {}
        for k in ["hook_text", "script", "caption", "hashtags", "slides", "opening_hook"]:
            if k in data:
                updates[k] = data[k]
        if "visual_direction" in data:
            updates["visual_direction"] = coerce_str(data["visual_direction"])
        if updates:
            await db.contents.update_one({"id": inp.content_id}, {"$set": updates})
        updated = await db.contents.find_one({"id": inp.content_id}, {"_id": 0})
        return updated
    except Exception as e:
        raise HTTPException(500, f"Errore rigenerazione: {str(e)}")

@api.post("/contents/convert")
async def convert_content(inp: ContentConvertInput, request: Request):
    user = await get_current_user(request)
    content = await db.contents.find_one({"id": inp.content_id, "project_id": inp.project_id})
    if not content:
        raise HTTPException(404, "Contenuto non trovato")
    if inp.target_format not in ("reel", "carousel", "prompted_reel"):
        raise HTTPException(400, "target_format non valido")
    project = await db.projects.find_one({"_id": ObjectId(inp.project_id)})
    tov = await db.tov_profiles.find_one({"project_id": inp.project_id}, {"_id": 0})
    tov_desc = ""
    if tov:
        tov_desc = f"Tono: formalita {tov.get('formality',5)}/10, energia {tov.get('energy',5)}/10. {tov.get('custom_instructions','')}"
    if inp.target_format == "prompted_reel":
        system = f"{GLOBAL_CONTENT_PROMPT}\n\nSei un esperto di video marketing con avatar AI. Converti questo contenuto in un Prompted Reel. Rispondi SOLO con JSON valido. Scrivi in italiano."
        prompt = f"""Converti questo contenuto in un Prompted Reel per avatar AI.
Hook: {content.get('hook_text','')}
Script originale: {content.get('script', '') or ' '.join(content.get('slides', []))}
Settore: {project.get('sector','')}
{tov_desc}

Restituisci JSON con: hook_text, opening_hook (primi 3-5 secondi), script (per avatar con [pausa][enfasi]), visual_direction (descrizione visiva CONCRETA della scena: CHI è il soggetto con dettagli fisici e abbigliamento precisi, COSA fa esattamente con postura e gesti specifici, DOVE si trova con ambientazione dettagliata e illuminazione, CHE ESPRESSIONE ha — deve funzionare come brief fotografico), caption, hashtags, slides (array vuoto)"""
    elif inp.target_format == "carousel":
        system = f"""{GLOBAL_CONTENT_PROMPT}\n\nSei un copywriter. Converti questo Reel in un Carousel con slide numerate. Rispondi SOLO con JSON valido. Scrivi in italiano."""
        prompt = f"""Converti questo Reel in un Carousel strutturato.
Hook: {content.get('hook_text','')}
Script Reel: {content.get('script','')}
Settore: {project.get('sector','')}
{tov_desc}

Crea un carousel con:
- SLIDE 1: hook bold
- SLIDE 2: problema reale
- SLIDES 3-6: passi pratici/insights
- SLIDE FINALE: CTA diretto

Restituisci JSON con: hook_text, script (testo completo separato da ---), caption, hashtags, slides (array di stringhe, una per slide, numerate)"""
    else:
        system = f"""{GLOBAL_CONTENT_PROMPT}\n\nSei un copywriter. Converti questo Carousel in un Reel script. Rispondi SOLO con JSON valido. Scrivi in italiano."""
        prompt = f"""Converti questo Carousel in un Reel script parlato.
Hook: {content.get('hook_text','')}
Slides: {json.dumps(content.get('slides',[]))}
Settore: {project.get('sector','')}
{tov_desc}

Crea un Reel con: HOOK (max 5 parole) → SETUP → VALUE → CTA
Restituisci JSON con: hook_text, script (script parlato completo), caption, hashtags, slides (array vuoto)"""
    try:
        result = await call_ai(system, prompt)
        data = extract_json(result)
        updates = {"format": inp.target_format}
        for k in ["hook_text", "script", "caption", "hashtags", "slides", "opening_hook"]:
            if k in data:
                updates[k] = data[k]
        if "visual_direction" in data:
            updates["visual_direction"] = coerce_str(data["visual_direction"])
        await db.contents.update_one({"id": inp.content_id}, {"$set": updates})
        updated = await db.contents.find_one({"id": inp.content_id}, {"_id": 0})
        return updated
    except Exception as e:
        raise HTTPException(500, f"Errore conversione: {str(e)}")

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

# ── SOCIAL PLATFORMS CONFIG ────────────────────────────
SOCIAL_PLATFORMS = {
    "facebook": {
        "name": "Facebook",
        "auth_url": "https://www.facebook.com/v19.0/dialog/oauth",
        "client_id_env": "FACEBOOK_APP_ID",
        "client_secret_env": "FACEBOOK_APP_SECRET",
        "token_url": "https://graph.facebook.com/v19.0/oauth/access_token",
        "scope": "pages_show_list,pages_read_engagement,pages_manage_posts",
    },
    "instagram": {
        "name": "Instagram",
        "auth_url": "https://www.facebook.com/v19.0/dialog/oauth",
        "client_id_env": "INSTAGRAM_CLIENT_ID",
        "client_secret_env": "INSTAGRAM_CLIENT_SECRET",
        "token_url": "https://graph.facebook.com/v19.0/oauth/access_token",
        "scope": "instagram_basic,instagram_content_publish,pages_show_list",
    },
    "linkedin": {
        "name": "LinkedIn",
        "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
        "client_id_env": "LINKEDIN_CLIENT_ID",
        "client_secret_env": "LINKEDIN_CLIENT_SECRET",
        "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
        "scope": "openid profile email w_member_social",
    },
    "tiktok": {
        "name": "TikTok",
        "auth_url": "https://www.tiktok.com/v2/auth/authorize/",
        "client_id_env": "TIKTOK_CLIENT_KEY",
        "client_id_param": "client_key",
        "client_secret_env": "TIKTOK_CLIENT_SECRET",
        "token_url": "https://open.tiktok.com/v2/oauth/token/",
        "scope": "user.info.basic,video.publish",
    },
    "pinterest": {
        "name": "Pinterest",
        "auth_url": "https://www.pinterest.com/oauth/",
        "client_id_env": "PINTEREST_CLIENT_ID",
        "client_secret_env": "PINTEREST_CLIENT_SECRET",
        "token_url": "https://api.pinterest.com/v5/oauth/token",
        "scope": "boards:read,pins:read,pins:write,user_accounts:read",
    },
    "google_slides": {
        "name": "Google Slides",
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "client_id_env": "GOOGLE_CLIENT_ID",
        "client_secret_env": "GOOGLE_CLIENT_SECRET",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive.file openid email",
        "extra_params": "access_type=offline&prompt=consent",
    },
}

def _app_url() -> str:
    return os.environ.get("APP_URL", os.environ.get("FRONTEND_URL", "http://localhost:3000"))

def _oauth_callback_url() -> str:
    return f"{_app_url()}/api/social/oauth/callback"

async def _exchange_token_instagram(code: str, redirect_uri: str) -> dict:
    client_id = os.environ.get("INSTAGRAM_CLIENT_ID", "")
    client_secret = os.environ.get("INSTAGRAM_CLIENT_SECRET", "")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get("https://graph.facebook.com/v19.0/oauth/access_token", params={
            "client_id": client_id, "client_secret": client_secret,
            "code": code, "redirect_uri": redirect_uri,
        })
        r.raise_for_status()
        token = r.json()["access_token"]
        # Get Instagram Business Account
        pages_r = await c.get("https://graph.facebook.com/v19.0/me/accounts", params={"access_token": token})
        pages_r.raise_for_status()
        pages = pages_r.json().get("data", [])
        ig_id, ig_name = "", "Instagram"
        for page in pages:
            ig_r = await c.get(f"https://graph.facebook.com/v19.0/{page['id']}", params={
                "fields": "instagram_business_account", "access_token": page["access_token"]
            })
            ig_data = ig_r.json().get("instagram_business_account", {})
            if ig_data:
                ig_id = ig_data["id"]
                info_r = await c.get(f"https://graph.facebook.com/v19.0/{ig_id}", params={
                    "fields": "username", "access_token": token
                })
                ig_name = info_r.json().get("username", "Instagram")
                break
        return {"access_token": token, "profile_id": ig_id, "profile_name": ig_name}

async def _exchange_token_facebook(code: str, redirect_uri: str) -> dict:
    client_id = os.environ.get("FACEBOOK_APP_ID", "")
    client_secret = os.environ.get("FACEBOOK_APP_SECRET", "")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get("https://graph.facebook.com/v19.0/oauth/access_token", params={
            "client_id": client_id, "client_secret": client_secret,
            "code": code, "redirect_uri": redirect_uri,
        })
        r.raise_for_status()
        data = r.json()
        token = data["access_token"]
        # Get profile name
        pr = await c.get("https://graph.facebook.com/v19.0/me", params={"fields": "id,name", "access_token": token})
        pr.raise_for_status()
        profile = pr.json()
        return {"access_token": token, "profile_id": profile.get("id", ""), "profile_name": profile.get("name", "Facebook")}

async def _exchange_token_linkedin(code: str, redirect_uri: str) -> dict:
    client_id = os.environ.get("LINKEDIN_CLIENT_ID", "")
    client_secret = os.environ.get("LINKEDIN_CLIENT_SECRET", "")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post("https://www.linkedin.com/oauth/v2/accessToken", data={
            "grant_type": "authorization_code", "code": code,
            "redirect_uri": redirect_uri, "client_id": client_id, "client_secret": client_secret,
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        r.raise_for_status()
        token = r.json()["access_token"]
        pr = await c.get("https://api.linkedin.com/v2/userinfo", headers={"Authorization": f"Bearer {token}"})
        pr.raise_for_status()
        profile = pr.json()
        return {"access_token": token, "profile_id": profile.get("sub", ""), "profile_name": profile.get("name", "LinkedIn")}

async def _exchange_token_tiktok(code: str, redirect_uri: str) -> dict:
    client_key = os.environ.get("TIKTOK_CLIENT_KEY", "")
    client_secret = os.environ.get("TIKTOK_CLIENT_SECRET", "")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post("https://open.tiktok.com/v2/oauth/token/", data={
            "client_key": client_key, "client_secret": client_secret,
            "code": code, "grant_type": "authorization_code", "redirect_uri": redirect_uri,
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        r.raise_for_status()
        d = r.json().get("data", r.json())
        return {"access_token": d.get("access_token", ""), "profile_id": d.get("open_id", ""), "profile_name": d.get("display_name", "TikTok")}

async def _exchange_token_pinterest(code: str, redirect_uri: str) -> dict:
    client_id = os.environ.get("PINTEREST_CLIENT_ID", "")
    client_secret = os.environ.get("PINTEREST_CLIENT_SECRET", "")
    import base64 as _b64
    creds = _b64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post("https://api.pinterest.com/v5/oauth/token",
            data={"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri},
            headers={"Authorization": f"Basic {creds}", "Content-Type": "application/x-www-form-urlencoded"})
        r.raise_for_status()
        token = r.json()["access_token"]
        pr = await c.get("https://api.pinterest.com/v5/user_account", headers={"Authorization": f"Bearer {token}"})
        pr.raise_for_status()
        profile = pr.json()
        return {"access_token": token, "profile_id": profile.get("username", ""), "profile_name": profile.get("username", "Pinterest")}

async def _exchange_token_google_slides(code: str, redirect_uri: str) -> dict:
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post("https://oauth2.googleapis.com/token", data={
            "client_id": client_id, "client_secret": client_secret,
            "code": code, "redirect_uri": redirect_uri, "grant_type": "authorization_code",
        })
        r.raise_for_status()
        token_data = r.json()
        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token", "")
        ui_r = await c.get("https://www.googleapis.com/oauth2/v2/userinfo",
                           headers={"Authorization": f"Bearer {access_token}"})
        ui_r.raise_for_status()
        ui = ui_r.json()
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "profile_id": ui.get("id", ""),
            "profile_name": ui.get("email", ui.get("name", "Google")),
        }

async def _publish_facebook(token: str, text: str, image_url: Optional[str] = None) -> str:
    async with httpx.AsyncClient(timeout=30) as c:
        pages_r = await c.get("https://graph.facebook.com/v19.0/me/accounts", params={"access_token": token})
        pages_r.raise_for_status()
        pages = pages_r.json().get("data", [])
        if not pages:
            raise ValueError("Nessuna pagina Facebook trovata per questo account")
        page = pages[0]
        page_token = page["access_token"]
        page_id = page["id"]
        if image_url:
            r = await c.post(f"https://graph.facebook.com/v19.0/{page_id}/photos",
                params={"access_token": page_token}, data={"url": image_url, "caption": text})
        else:
            r = await c.post(f"https://graph.facebook.com/v19.0/{page_id}/feed",
                params={"access_token": page_token}, data={"message": text})
        r.raise_for_status()
        return r.json().get("id", "")

async def _publish_linkedin(token: str, text: str, profile_id: str) -> str:
    urn = f"urn:li:person:{profile_id}"
    payload = {
        "author": urn, "lifecycleState": "PUBLISHED",
        "specificContent": {"com.linkedin.ugc.ShareContent": {
            "shareCommentary": {"text": text}, "shareMediaCategory": "NONE"
        }},
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
    }
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post("https://api.linkedin.com/v2/ugcPosts",
            json=payload, headers={"Authorization": f"Bearer {token}", "X-Restli-Protocol-Version": "2.0.0"})
        r.raise_for_status()
        return r.headers.get("x-restli-id", "")

async def _publish_pinterest(token: str, text: str, title: str, image_url: Optional[str] = None) -> str:
    async with httpx.AsyncClient(timeout=30) as c:
        boards_r = await c.get("https://api.pinterest.com/v5/boards", headers={"Authorization": f"Bearer {token}"})
        boards_r.raise_for_status()
        boards = boards_r.json().get("items", [])
        if not boards:
            raise ValueError("Nessuna board Pinterest trovata")
        board_id = boards[0]["id"]
        pin = {"board_id": board_id, "title": title[:100], "description": text[:500]}
        if image_url:
            pin["media_source"] = {"source_type": "image_url", "url": image_url}
        else:
            pin["media_source"] = {"source_type": "image_url", "url": "https://via.placeholder.com/800x800?text=Sketchario"}
        r = await c.post("https://api.pinterest.com/v5/pins", json=pin, headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        return r.json().get("id", "")

async def _publish_instagram(token: str, ig_id: str, text: str, image_url: Optional[str] = None) -> str:
    if not ig_id:
        raise ValueError("Account Instagram Business non trovato. Collega prima una Pagina Facebook con Instagram Business.")
    async with httpx.AsyncClient(timeout=30) as c:
        if image_url:
            container_r = await c.post(f"https://graph.facebook.com/v19.0/{ig_id}/media",
                params={"image_url": image_url, "caption": text, "access_token": token})
            container_r.raise_for_status()
            container_id = container_r.json()["id"]
        else:
            raise ValueError("Instagram richiede un'immagine per pubblicare. Carica prima un'immagine sul contenuto.")
        pub_r = await c.post(f"https://graph.facebook.com/v19.0/{ig_id}/media_publish",
            params={"creation_id": container_id, "access_token": token})
        pub_r.raise_for_status()
        return pub_r.json().get("id", "")

async def _do_publish(platform: str, token: str, profile_id: str, content: dict) -> str:
    text = content.get("caption") or content.get("hook_text") or content.get("title") or ""
    title = content.get("title") or content.get("hook_text") or "Post"
    media = content.get("media", [])
    image_url = media[0].get("url") if media else None
    if platform == "facebook":
        return await _publish_facebook(token, text, image_url)
    elif platform == "instagram":
        return await _publish_instagram(token, profile_id, text, image_url)
    elif platform == "linkedin":
        return await _publish_linkedin(token, text, profile_id)
    elif platform == "pinterest":
        return await _publish_pinterest(token, text, title, image_url)
    elif platform == "tiktok":
        raise ValueError("TikTok richiede upload video. Usa l'app TikTok direttamente.")
    else:
        raise ValueError(f"Piattaforma {platform} non supportata per la pubblicazione")

class SocialProfileSave(BaseModel):
    platform: str
    profile_name: str
    profile_id: Optional[str] = ""
    access_token: Optional[str] = ""
    connection_mode: str = "oauth"

class ProjectSocialLink(BaseModel):
    project_id: str
    social_profile_ids: List[str]

@api.get("/social/platforms")
async def list_platforms(request: Request):
    await get_current_user(request)
    platforms = []
    for key, cfg in SOCIAL_PLATFORMS.items():
        client_id = os.environ.get(cfg["client_id_env"], "")
        platforms.append({
            "id": key,
            "name": cfg["name"],
            "configured": bool(client_id),
        })
    return platforms

@api.get("/social/oauth/start/{platform}")
async def social_oauth_start(platform: str, request: Request):
    user = await get_current_user(request)
    cfg = SOCIAL_PLATFORMS.get(platform)
    if not cfg:
        raise HTTPException(400, "Piattaforma non supportata")
    client_id = os.environ.get(cfg["client_id_env"], "")
    if not client_id:
        raise HTTPException(400, f"Credenziali {platform} non configurate")
    state_id = str(uuid.uuid4())
    await db.social_oauth_states.insert_one({
        "state": state_id, "user_id": user["_id"], "platform": platform,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    })
    callback = _oauth_callback_url()
    client_id_param = cfg.get("client_id_param", "client_id")
    scope_encoded = quote(cfg['scope'], safe=',')
    auth_url = (f"{cfg['auth_url']}?{client_id_param}={client_id}"
                f"&redirect_uri={quote(callback, safe='')}"
                f"&scope={scope_encoded}&response_type=code&state={state_id}")
    if cfg.get("extra_params"):
        auth_url += f"&{cfg['extra_params']}"
    return {"auth_url": auth_url}

@api.get("/social/oauth/callback")
async def social_oauth_callback(request: Request):
    params = dict(request.query_params)
    code = params.get("code", "")
    state_id = params.get("state", "")
    error = params.get("error", "")
    app_url = _app_url()
    if error or not code or not state_id:
        return HTMLResponse(f"<script>window.opener&&window.opener.postMessage({{type:'oauth_error',error:'{error or 'cancelled'}'}}, '*');window.close();</script>")
    state_doc = await db.social_oauth_states.find_one_and_delete({"state": state_id})
    if not state_doc:
        return HTMLResponse("<script>window.opener&&window.opener.postMessage({type:'oauth_error',error:'state_invalid'}, '*');window.close();</script>")
    platform = state_doc["platform"]
    user_id = state_doc["user_id"]
    callback = _oauth_callback_url()
    try:
        exchangers = {
            "facebook": _exchange_token_facebook,
            "instagram": _exchange_token_instagram,
            "linkedin": _exchange_token_linkedin,
            "tiktok": _exchange_token_tiktok,
            "pinterest": _exchange_token_pinterest,
            "google_slides": _exchange_token_google_slides,
        }
        exchanger = exchangers.get(platform)
        if not exchanger:
            raise ValueError(f"Piattaforma {platform} non supportata")
        result = await exchanger(code, callback)
        doc = {
            "id": str(uuid.uuid4()), "user_id": user_id, "platform": platform,
            "profile_name": result["profile_name"], "profile_id": result["profile_id"],
            "access_token": result["access_token"], "connection_mode": "oauth", "connected": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        if result.get("refresh_token"):
            doc["refresh_token"] = result["refresh_token"]
        await db.social_accounts.delete_many({"user_id": user_id, "platform": platform, "profile_id": result["profile_id"]})
        await db.social_accounts.insert_one(doc)
        pname = result["profile_name"]
        return HTMLResponse(f"<script>window.opener&&window.opener.postMessage({{type:'oauth_success',platform:'{platform}',name:'{pname}'}}, '*');window.close();</script>")
    except Exception as e:
        logger.error(f"OAuth callback error {platform}: {e}")
        msg = str(e).replace("'", "").replace('"', '').replace('\n', ' ').replace('\r', '')
        return HTMLResponse(f"<script>window.opener&&window.opener.postMessage({{type:'oauth_error',error:'{msg}'}}, '*');window.close();</script>")

@api.get("/social/profiles")
async def list_social_profiles(request: Request):
    user = await get_current_user(request)
    profiles = await db.social_accounts.find({"user_id": user["_id"]}, {"_id": 0}).to_list(50)
    return profiles

@api.post("/social/profiles")
async def save_social_profile(inp: SocialProfileSave, request: Request):
    user = await get_current_user(request)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "platform": inp.platform,
        "profile_name": inp.profile_name,
        "profile_id": inp.profile_id,
        "access_token": inp.access_token,
        "connection_mode": inp.connection_mode,
        "connected": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.social_accounts.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/social/profiles/{profile_id}")
async def delete_social_profile(profile_id: str, request: Request):
    user = await get_current_user(request)
    await db.social_accounts.delete_one({"id": profile_id, "user_id": user["_id"]})
    await db.project_social_accounts.delete_many({"social_profile_id": profile_id})
    return {"ok": True}

@api.get("/social/project/{project_id}")
async def get_project_social_profiles(project_id: str, request: Request):
    user = await get_current_user(request)
    links = await db.project_social_accounts.find({"project_id": project_id}, {"_id": 0}).to_list(20)
    profile_ids = [l["social_profile_id"] for l in links]
    profiles = await db.social_accounts.find({"id": {"$in": profile_ids}, "user_id": user["_id"]}, {"_id": 0}).to_list(20)
    return profiles

@api.post("/social/project/link")
async def link_social_to_project(inp: ProjectSocialLink, request: Request):
    user = await get_current_user(request)
    await db.project_social_accounts.delete_many({"project_id": inp.project_id})
    for sid in inp.social_profile_ids:
        await db.project_social_accounts.insert_one({
            "project_id": inp.project_id,
            "social_profile_id": sid,
            "user_id": user["_id"],
            "linked_at": datetime.now(timezone.utc).isoformat()
        })
    return {"ok": True, "count": len(inp.social_profile_ids)}

# ── FEED / RSS ────────────────────────────────────────
class FeedAddInput(BaseModel):
    project_id: str
    feed_url: str
    feed_name: Optional[str] = ""

class FeedGenerateInput(BaseModel):
    project_id: str
    feed_item_title: str
    feed_item_summary: Optional[str] = ""

@api.post("/feeds/add")
async def add_feed(inp: FeedAddInput, request: Request):
    user = await get_current_user(request)
    doc = {
        "id": str(uuid.uuid4()),
        "project_id": inp.project_id,
        "user_id": user["_id"],
        "feed_url": inp.feed_url,
        "feed_name": inp.feed_name or inp.feed_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.feeds.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/feeds/{project_id}")
async def list_feeds(project_id: str, request: Request):
    await get_current_user(request)
    feeds = await db.feeds.find({"project_id": project_id}, {"_id": 0}).to_list(20)
    return feeds

@api.delete("/feeds/{feed_id}")
async def delete_feed(feed_id: str, request: Request):
    await get_current_user(request)
    await db.feeds.delete_one({"id": feed_id})
    await db.feed_cache.delete_many({"feed_id": feed_id})
    return {"ok": True}

@api.get("/feeds/{project_id}/items")
async def get_feed_items(project_id: str, request: Request):
    await get_current_user(request)
    feeds = await db.feeds.find({"project_id": project_id}, {"_id": 0}).to_list(20)
    all_items = []
    for feed in feeds:
        cached = await db.feed_cache.find({"feed_id": feed["id"]}, {"_id": 0}).to_list(50)
        if cached:
            all_items.extend(cached)
        else:
            try:
                async with httpx.AsyncClient(timeout=10) as client_http:
                    resp = await client_http.get(feed["feed_url"])
                    parsed = feedparser.parse(resp.text)
                    for entry in parsed.entries[:10]:
                        item = {
                            "id": str(uuid.uuid4()),
                            "feed_id": feed["id"],
                            "feed_name": feed.get("feed_name", ""),
                            "title": getattr(entry, "title", ""),
                            "summary": getattr(entry, "summary", "")[:500] if hasattr(entry, "summary") else "",
                            "link": getattr(entry, "link", ""),
                            "published": getattr(entry, "published", ""),
                            "image": "",
                            "cached_at": datetime.now(timezone.utc).isoformat()
                        }
                        media = getattr(entry, "media_content", None) or getattr(entry, "media_thumbnail", None)
                        if media and len(media) > 0:
                            item["image"] = media[0].get("url", "")
                        if not item["image"]:
                            enclosures = getattr(entry, "enclosures", [])
                            for enc in enclosures:
                                if enc.get("type", "").startswith("image"):
                                    item["image"] = enc.get("href", "")
                                    break
                        await db.feed_cache.insert_one({**item})
                        all_items.append(item)
            except Exception as e:
                logger.error(f"Feed fetch error {feed['feed_url']}: {e}")
    return all_items

@api.post("/feeds/refresh/{project_id}")
async def refresh_feeds(project_id: str, request: Request):
    await get_current_user(request)
    feeds = await db.feeds.find({"project_id": project_id}, {"_id": 0}).to_list(20)
    for feed in feeds:
        await db.feed_cache.delete_many({"feed_id": feed["id"]})
    items = await get_feed_items(project_id, request)
    return {"ok": True, "count": len(items)}

@api.post("/feeds/generate-content")
async def generate_content_from_feed(inp: FeedGenerateInput, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(inp.project_id), "user_id": user["_id"]})
    if not project:
        raise HTTPException(404, "Progetto non trovato")
    tov = await db.tov_profiles.find_one({"project_id": inp.project_id}, {"_id": 0})
    tov_desc = ""
    if tov:
        tov_desc = f"Tono: formalita {tov.get('formality',5)}/10, energia {tov.get('energy',5)}/10."
    system = f"{GLOBAL_CONTENT_PROMPT}\n\nSei un copywriter professionista. Genera contenuto social ispirato da un articolo/feed esterno. Rispondi SOLO con JSON."
    prompt = f"""Genera un contenuto social ispirato a questo articolo:
Titolo: {inp.feed_item_title}
Sommario: {inp.feed_item_summary}
Settore progetto: {project['sector']}
{tov_desc}

Restituisci JSON con: hook_text (frase ad effetto ispirata all'articolo), script, caption, hashtags, format ("reel" o "carousel")"""
    try:
        result = await call_ai(system, prompt)
        data = extract_json(result)
        content_doc = {
            "id": str(uuid.uuid4()),
            "project_id": inp.project_id,
            "hook_id": "",
            "hook_text": data.get("hook_text", inp.feed_item_title),
            "format": data.get("format", "reel"),
            "pillar": "awareness",
            "persona_target": "",
            "day_offset": 0,
            "script": data.get("script", ""),
            "caption": data.get("caption", ""),
            "hashtags": data.get("hashtags", ""),
            "slides": data.get("slides", []),
            "media": [],
            "status": "draft",
            "source": "feed",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.contents.insert_one({k: v for k, v in content_doc.items() if k != "_id"})
        await db.projects.update_one({"_id": ObjectId(inp.project_id)}, {"$inc": {"content_count": 1}})
        return content_doc
    except Exception as e:
        raise HTTPException(500, f"Errore generazione: {str(e)}")


@api.post("/feeds/ai-suggestions/{project_id}")
async def get_ai_feed_suggestions(project_id: str, request: Request):
    """Generate 5 AI-powered content suggestions based on the project theme/sector."""
    user = await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(project_id), "user_id": user["_id"]})
    if not project:
        raise HTTPException(404, "Progetto non trovato")

    # Check cache first (valid for 10 minutes)
    cache_key = f"ai_feed_{project_id}"
    cached = await db.ai_feed_cache.find_one({"cache_key": cache_key}, {"_id": 0})
    if cached:
        cached_time = datetime.fromisoformat(cached["cached_at"])
        if (datetime.now(timezone.utc) - cached_time).total_seconds() < 600:
            return cached["suggestions"]

    sector = project.get("sector", "marketing digitale")
    description = project.get("description", "")
    system = "Sei un esperto di content strategy per social media. Genera idee di contenuto innovative e attuali. Rispondi SOLO con JSON array."
    prompt = f"""Genera 5 idee di contenuto social media per il settore: {sector}
{f'Descrizione progetto: {description}' if description else ''}

Ogni idea deve essere:
- Attuale e rilevante per il mercato italiano nel 2026
- Originale e coinvolgente
- Adatta a formati Reel o Carousel

Restituisci un JSON array di 5 oggetti con:
- "title": titolo breve e accattivante (max 60 caratteri)
- "summary": breve descrizione dell'idea (max 120 caratteri)
- "format": "reel" o "carousel"
- "pillar": "awareness" o "education" o "monetizing"
- "trend_tag": un tag di tendenza correlato"""

    try:
        result = await call_ai(system, prompt)
        suggestions = extract_json(result)
        if not isinstance(suggestions, list):
            suggestions = [suggestions]
        suggestions = suggestions[:5]
        for i, s in enumerate(suggestions):
            s["id"] = f"ai_{project_id}_{i}"
            s["source"] = "ai"

        # Cache the result
        await db.ai_feed_cache.update_one(
            {"cache_key": cache_key},
            {"$set": {"cache_key": cache_key, "suggestions": suggestions, "cached_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        return suggestions
    except Exception as e:
        logger.error(f"AI feed suggestions error: {e}")
        return []

@api.post("/feeds/ai-suggestions/{project_id}/refresh")
async def refresh_ai_feed_suggestions(project_id: str, request: Request):
    """Force refresh AI feed suggestions by clearing cache."""
    user = await get_current_user(request)
    cache_key = f"ai_feed_{project_id}"
    await db.ai_feed_cache.delete_one({"cache_key": cache_key})
    return await get_ai_feed_suggestions(project_id, request)


# ── PUBLISH QUEUE ─────────────────────────────────────
class PublishSchedule(BaseModel):
    content_id: str
    project_id: str
    social_profile_ids: List[str]
    scheduled_at: str
    first_comment: Optional[str] = ""

class PublishUpdate(BaseModel):
    status: Optional[str] = None
    error_message: Optional[str] = None

@api.post("/publish/schedule")
async def schedule_publish(inp: PublishSchedule, request: Request):
    user = await get_current_user(request)
    await check_plan_limit(user, "publish")
    content = await db.contents.find_one({"id": inp.content_id, "project_id": inp.project_id})
    if not content:
        raise HTTPException(404, "Contenuto non trovato")
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        scheduled_dt = datetime.fromisoformat(inp.scheduled_at.replace("Z", "+00:00"))
    except Exception:
        scheduled_dt = datetime.now(timezone.utc)
    publish_now = scheduled_dt <= datetime.now(timezone.utc)
    items = []
    for sp_id in inp.social_profile_ids:
        profile = await db.social_accounts.find_one({"id": sp_id, "user_id": user["_id"]}, {"_id": 0})
        if not profile:
            continue
        item_id = str(uuid.uuid4())
        doc = {
            "id": item_id, "content_id": inp.content_id, "project_id": inp.project_id,
            "social_profile_id": sp_id, "platform": profile.get("platform", ""),
            "profile_name": profile.get("profile_name", ""), "user_id": user["_id"],
            "status": "queued", "scheduled_at": inp.scheduled_at, "first_comment": inp.first_comment,
            "error_message": "", "published_at": "", "created_at": now_iso,
        }
        if publish_now:
            try:
                post_id = await _do_publish(profile["platform"], profile.get("access_token", ""), profile.get("profile_id", ""), content)
                doc["status"] = "published"
                doc["published_at"] = now_iso
                doc["post_id"] = post_id
            except Exception as e:
                doc["status"] = "failed"
                doc["error_message"] = str(e)
        await db.publish_queue.insert_one(doc)
        doc.pop("_id", None)
        items.append(doc)
    new_status = "published" if publish_now and all(i["status"] == "published" for i in items) else "scheduled"
    await db.contents.update_one({"id": inp.content_id}, {"$set": {"status": new_status}})
    failed = [i for i in items if i.get("status") == "failed"]
    if failed:
        raise HTTPException(500, f"Errore pubblicazione: {failed[0]['error_message']}")
    return {"ok": True, "items": items}

@api.get("/publish/queue/{project_id}")
async def get_publish_queue(project_id: str, request: Request):
    user = await get_current_user(request)
    items = await db.publish_queue.find({"project_id": project_id, "user_id": user["_id"]}, {"_id": 0}).sort("scheduled_at", 1).to_list(200)
    return items

@api.get("/publish/queue-all")
async def get_all_publish_queue(request: Request):
    user = await get_current_user(request)
    items = await db.publish_queue.find({"user_id": user["_id"]}, {"_id": 0}).sort("scheduled_at", 1).to_list(500)
    return items

@api.put("/publish/queue/{item_id}")
async def update_publish_item(item_id: str, inp: PublishUpdate, request: Request):
    await get_current_user(request)
    updates = {k: v for k, v in inp.model_dump().items() if v is not None}
    if "status" in updates and updates["status"] == "published":
        updates["published_at"] = datetime.now(timezone.utc).isoformat()
    if updates:
        await db.publish_queue.update_one({"id": item_id}, {"$set": updates})
    return {"ok": True}

@api.delete("/publish/queue/{item_id}")
async def cancel_publish(item_id: str, request: Request):
    user = await get_current_user(request)
    item = await db.publish_queue.find_one({"id": item_id, "user_id": user["_id"]})
    if item:
        await db.publish_queue.delete_one({"id": item_id})
        remaining = await db.publish_queue.count_documents({"content_id": item["content_id"], "status": {"$in": ["queued", "processing"]}})
        if remaining == 0:
            await db.contents.update_one({"id": item["content_id"]}, {"$set": {"status": "draft"}})
    return {"ok": True}

@api.post("/publish/mark-published/{content_id}")
async def mark_published(content_id: str, request: Request):
    await get_current_user(request)
    await db.contents.update_one({"id": content_id}, {"$set": {"status": "published"}})
    return {"ok": True}

# ── MEDIA UPLOAD ──────────────────────────────────────
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@api.post("/media/upload/{content_id}")
async def upload_media(content_id: str, request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    allowed = {"jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov"}
    if ext not in allowed:
        raise HTTPException(400, f"Formato non supportato. Usa: {', '.join(allowed)}")
    fname = f"{uuid.uuid4().hex}.{ext}"
    fpath = UPLOAD_DIR / fname
    with open(fpath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    media_url = f"/api/media/file/{fname}"
    media_doc = {"id": str(uuid.uuid4()), "filename": fname, "original_name": file.filename, "url": media_url, "type": "image" if ext in {"jpg","jpeg","png","webp","gif"} else "video", "size": fpath.stat().st_size, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.contents.update_one({"id": content_id}, {"$push": {"media": media_doc}})
    return media_doc

@api.delete("/media/{content_id}/{media_id}")
async def delete_media(content_id: str, media_id: str, request: Request):
    await get_current_user(request)
    content = await db.contents.find_one({"id": content_id})
    if content:
        media_list = content.get("media", [])
        for m in media_list:
            if m.get("id") == media_id:
                fpath = UPLOAD_DIR / m.get("filename", "")
                if fpath.exists():
                    fpath.unlink()
                break
        await db.contents.update_one({"id": content_id}, {"$pull": {"media": {"id": media_id}}})
    return {"ok": True}

@api.get("/media/library/{project_id}")
async def media_library(project_id: str, request: Request):
    await get_current_user(request)
    contents = await db.contents.find({"project_id": project_id, "media": {"$exists": True, "$ne": []}}, {"_id": 0, "id": 1, "hook_text": 1, "media": 1}).to_list(200)
    all_media = []
    for c in contents:
        for m in c.get("media", []):
            m["content_id"] = c["id"]
            m["hook_text"] = c.get("hook_text", "")
            all_media.append(m)
    return all_media

# ── IMAGE GENERATION (FLUX / Gemini Imagen) ───────────
class OptimizePromptInput(BaseModel):
    visual_direction: str
    script: str = ""
    project_id: str

@api.post("/media/optimize-prompt")
async def optimize_image_prompt(inp: OptimizePromptInput, request: Request):
    await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(inp.project_id)})
    sector = project.get('sector', '') if project else ''
    system = "You are an expert image generation prompt engineer. Convert scene direction notes into a precise, vivid scene description for FLUX/Stable Diffusion. Be concrete and specific. Reply ONLY with the scene description (no style/technical qualifiers — just the scene), no explanations."
    prompt = f"""Scene direction: {inp.visual_direction}
Content script (for context): {inp.script[:400] if inp.script else 'not available'}
Sector: {sector}

Write a precise scene description specifying: the exact subject (who they are, approximate age, exact clothing/appearance), their precise action/posture/gesture, the exact setting (where, lighting, background elements, time of day), their facial expression/emotion, and the recommended camera composition (Wide shot / Full body / Medium shot / Close-up / Macro). Make it vivid and unambiguous. Include the composition type naturally in the description."""
    try:
        result = await call_ai(system, prompt)
        return {"prompt": result.strip()}
    except Exception as e:
        raise HTTPException(500, f"Errore ottimizzazione: {str(e)}")

class DalleGenerateInput(BaseModel):
    content_id: str
    prompt: str
    project_id: str
    model: str = "flux"

@api.post("/media/generate-dalle")
async def generate_dalle(inp: DalleGenerateInput, request: Request):
    await get_current_user(request)
    try:
        if inp.model == "gemini":
            gemini_key = os.environ.get("GEMINI_API_KEY", "")
            if not gemini_key:
                raise HTTPException(400, "GEMINI_API_KEY non configurata")
            from google import genai as ggenai
            from google.genai import types as gtypes
            gclient = ggenai.Client(api_key=gemini_key)
            resp = gclient.models.generate_images(
                model="imagen-3.0-generate-002",
                prompt=inp.prompt,
                config=gtypes.GenerateImagesConfig(number_of_images=1, aspect_ratio="4:3")
            )
            image_bytes = resp.generated_images[0].image.image_bytes
            fname = f"gemini_{uuid.uuid4().hex}.png"
            source_label = "Nano Banana"
        else:
            fal_key = os.environ.get("FAL_API_KEY", "")
            if not fal_key:
                raise HTTPException(400, "FAL_API_KEY non configurata")
            async with httpx.AsyncClient(timeout=120) as hc:
                r = await hc.post(
                    "https://fal.run/fal-ai/flux/dev",
                    headers={"Authorization": f"Key {fal_key}", "Content-Type": "application/json"},
                    json={"prompt": inp.prompt, "image_size": "landscape_4_3", "num_images": 1, "output_format": "jpeg"}
                )
                r.raise_for_status()
                image_url = r.json()["images"][0]["url"]
            async with httpx.AsyncClient(timeout=60) as hc:
                img_r = await hc.get(image_url)
                img_r.raise_for_status()
                image_bytes = img_r.content
            fname = f"flux_{uuid.uuid4().hex}.jpg"
            source_label = "FLUX"
        fpath = UPLOAD_DIR / fname
        with open(fpath, "wb") as f:
            f.write(image_bytes)
        media_url = f"/api/media/file/{fname}"
        media_doc = {"id": str(uuid.uuid4()), "filename": fname, "original_name": f"{source_label}: {inp.prompt[:50]}", "url": media_url, "type": "image", "source": inp.model, "size": len(image_bytes), "created_at": datetime.now(timezone.utc).isoformat()}
        await db.contents.update_one({"id": inp.content_id}, {"$push": {"media": media_doc}})
        return media_doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image generation error ({inp.model}): {e}")
        raise HTTPException(500, f"Errore generazione immagine: {str(e)}")

# ── ADMIN CONSOLE ─────────────────────────────────────
class PowerUserInput(BaseModel):
    email: str
    plan: str = "strategist"
    days: int = 30
    notes: Optional[str] = ""

class ReleaseNoteInput(BaseModel):
    title: str
    body: str
    version: Optional[str] = ""

@api.get("/admin/power-users")
async def list_power_users(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(403, "Accesso negato")
    pus = await db.power_users.find({}, {"_id": 0}).to_list(100)
    return pus

@api.post("/admin/power-users")
async def upsert_power_user(inp: PowerUserInput, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(403, "Accesso negato")
    email = inp.email.strip().lower()
    expires = (datetime.now(timezone.utc) + timedelta(days=inp.days)).isoformat()
    doc = {"email": email, "plan": inp.plan, "expires_at": expires, "notes": inp.notes, "active": True, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.power_users.update_one({"email": email}, {"$set": doc}, upsert=True)
    target = await db.users.find_one({"email": email})
    if target:
        await db.users.update_one({"email": email}, {"$set": {"plan": inp.plan}})
    return {"ok": True}

@api.post("/admin/power-users/{email}/toggle")
async def toggle_power_user(email: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(403, "Accesso negato")
    pu = await db.power_users.find_one({"email": email})
    if pu:
        await db.power_users.update_one({"email": email}, {"$set": {"active": not pu.get("active", True)}})
    return {"ok": True}

@api.delete("/admin/power-users/{email}")
async def delete_power_user(email: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(403, "Accesso negato")
    await db.power_users.delete_one({"email": email})
    return {"ok": True}

# Release Notes
@api.get("/release-notes")
async def get_release_notes(request: Request):
    await get_current_user(request)
    notes = await db.release_notes.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notes

@api.post("/admin/release-notes")
async def create_release_note(inp: ReleaseNoteInput, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(403, "Accesso negato")
    doc = {"id": str(uuid.uuid4()), "title": inp.title, "body": inp.body, "version": inp.version, "author": user.get("name", "Admin"), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.release_notes.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/admin/release-notes/{note_id}")
async def delete_release_note(note_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(403, "Accesso negato")
    await db.release_notes.delete_one({"id": note_id})
    return {"ok": True}

# ── STRIPE BILLING ────────────────────────────────────
PLANS = {
    "creator": {"name": "Creator", "amount": 19.00, "currency": "eur"},
    "strategist": {"name": "Strategist", "amount": 49.00, "currency": "eur"},
}

class CheckoutInput(BaseModel):
    plan_id: str
    origin_url: str

@api.post("/billing/checkout")
async def create_checkout(inp: CheckoutInput, request: Request):
    user = await get_current_user(request)
    if inp.plan_id not in PLANS:
        raise HTTPException(400, "Piano non valido")
    plan = PLANS[inp.plan_id]
    try:
        import stripe as stripe_sdk
        stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY", "")
        success_url = f"{inp.origin_url}?billing=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{inp.origin_url}?billing=cancelled"
        session = stripe_sdk.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price_data": {"currency": plan["currency"], "product_data": {"name": plan.get("name", inp.plan_id)}, "unit_amount": plan["amount"]}, "quantity": 1}],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user["_id"], "email": user.get("email", ""), "plan_id": inp.plan_id}
        )
        await db.payment_transactions.insert_one({
            "session_id": session.id, "user_id": user["_id"], "email": user.get("email", ""),
            "plan_id": inp.plan_id, "amount": plan["amount"], "currency": plan["currency"],
            "payment_status": "pending", "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"url": session.url, "session_id": session.id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(500, f"Errore checkout: {str(e)}")

@api.get("/billing/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    user = await get_current_user(request)
    try:
        import stripe as stripe_sdk
        stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY", "")
        session = stripe_sdk.checkout.Session.retrieve(session_id)
        tx = await db.payment_transactions.find_one({"session_id": session_id})
        if tx and tx.get("payment_status") != "paid" and session.payment_status == "paid":
            plan_id = tx.get("plan_id", "")
            await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
            await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"plan": plan_id}})
        elif tx and session.payment_status != "paid":
            await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": session.payment_status}})
        return {"status": session.status, "payment_status": session.payment_status, "amount_total": session.amount_total, "currency": session.currency}
    except Exception as e:
        logger.error(f"Stripe status error: {e}")
        raise HTTPException(500, f"Errore stato pagamento: {str(e)}")

@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        import stripe as stripe_sdk
        stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY", "")
        webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
        event = stripe_sdk.Webhook.construct_event(body, sig, webhook_secret)
        if event.type == "checkout.session.completed":
            session_obj = event.data.object
            if session_obj.payment_status == "paid":
                tx = await db.payment_transactions.find_one({"session_id": session_obj.id})
                if tx and tx.get("payment_status") != "paid":
                    await db.payment_transactions.update_one({"session_id": session_obj.id}, {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
                    await db.users.update_one({"email": tx.get("email")}, {"$set": {"plan": tx.get("plan_id")}})
        return {"ok": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"ok": False}

@api.get("/billing/plans")
async def get_plans(request: Request):
    return [{"id": k, "name": v["name"], "amount": v["amount"], "currency": v["currency"]} for k, v in PLANS.items()]

# ── PLAN GATING ───────────────────────────────────────
ADMIN_EMAILS = {"osmel@osmelfabre.it", "osmel.fabre@gmail.com"}

PLAN_LIMITS = {
    "free":       {"max_projects": 1, "max_contents_per_project": 7,   "can_publish": False, "can_export_csv": False, "max_socials": 1,    "can_analytics": False, "max_duration_weeks": 1},
    "trial":      {"max_projects": 1, "max_contents_per_project": 7,   "can_publish": True,  "can_export_csv": False, "max_socials": 1,    "can_analytics": False, "max_duration_weeks": 1},
    "pro":        {"max_projects": 1, "max_contents_per_project": 7,   "can_publish": False, "can_export_csv": False, "max_socials": 1,    "can_analytics": False, "max_duration_weeks": 1},
    "creator":    {"max_projects": 3, "max_contents_per_project": 50,  "can_publish": True,  "can_export_csv": True,  "max_socials": 999,  "can_analytics": False, "max_duration_weeks": 4},
    "strategist": {"max_projects": 999, "max_contents_per_project": 999, "can_publish": True,  "can_export_csv": True,  "max_socials": 999,  "can_analytics": True,  "max_duration_weeks": 52},
    "custom":     {"max_projects": 999, "max_contents_per_project": 999, "can_publish": True, "can_export_csv": True, "max_socials": 999,  "can_analytics": True,  "max_duration_weeks": 52},
    "admin":      {"max_projects": 999, "max_contents_per_project": 999, "can_publish": True, "can_export_csv": True, "max_socials": 999,  "can_analytics": True,  "max_duration_weeks": 52},
}

async def check_plan_limit(user: dict, resource: str, project_id: str = None):
    # Admin bypass
    if user.get("role") == "admin" or user.get("email", "") in ADMIN_EMAILS:
        return PLAN_LIMITS["admin"]
    plan = user.get("plan", "free")
    pu = await db.power_users.find_one({"email": user.get("email", ""), "active": True})
    if pu:
        exp = pu.get("expires_at", "")
        if exp and datetime.now(timezone.utc) < datetime.fromisoformat(exp):
            plan = pu.get("plan", plan)
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    if resource == "project":
        count = await db.projects.count_documents({"user_id": user.get("_id", user.get("id")), "archived": False})
        if count >= limits["max_projects"]:
            raise HTTPException(403, f"Limite raggiunto: massimo {limits['max_projects']} progetti per il piano {plan.title()}. Effettua l'upgrade.")
    elif resource == "content" and project_id:
        count = await db.contents.count_documents({"project_id": project_id})
        if count >= limits["max_contents_per_project"]:
            raise HTTPException(403, f"Limite raggiunto: massimo {limits['max_contents_per_project']} contenuti per il piano {plan.title()}. Effettua l'upgrade.")
    elif resource == "publish":
        if not limits["can_publish"]:
            raise HTTPException(403, "La pubblicazione richiede il piano Creator o superiore.")
    elif resource == "export_csv":
        if not limits["can_export_csv"]:
            raise HTTPException(403, "L'export CSV richiede il piano Creator o superiore.")
    return limits

@api.get("/plan/limits")
async def get_plan_limits(request: Request):
    user = await get_current_user(request)
    if user.get("role") == "admin" or user.get("email", "") in ADMIN_EMAILS:
        plan = "admin"
        limits = PLAN_LIMITS["admin"]
    else:
        plan = user.get("plan", "free")
        pu = await db.power_users.find_one({"email": user.get("email", ""), "active": True})
        if pu:
            exp = pu.get("expires_at", "")
            if exp and datetime.now(timezone.utc) < datetime.fromisoformat(exp):
                plan = pu.get("plan", plan)
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    project_count = await db.projects.count_documents({"user_id": user["_id"], "archived": False})
    return {**limits, "plan": plan, "projects_used": project_count}

# ── CANVA INTEGRATION ─────────────────────────────────
CANVA_CLIENT_ID = os.environ.get("CANVA_CLIENT_ID", "")
CANVA_CLIENT_SECRET = os.environ.get("CANVA_CLIENT_SECRET", "")

def _canva_callback_url() -> str:
    return f"{_app_url()}/api/canva/oauth/callback"

@api.get("/canva/auth-url")
async def canva_auth_url(request: Request):
    await get_current_user(request)
    if not CANVA_CLIENT_ID:
        raise HTTPException(400, "Canva non configurato")
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b'=').decode()
    state = str(uuid.uuid4())
    await db.canva_oauth_states.insert_one({"state": state, "code_verifier": code_verifier, "created_at": datetime.now(timezone.utc).isoformat()})
    callback = _canva_callback_url()
    scope = quote("design:content:read design:content:write asset:read asset:write profile:read", safe='')
    url = (f"https://www.canva.com/api/oauth/authorize"
           f"?client_id={CANVA_CLIENT_ID}"
           f"&redirect_uri={quote(callback, safe='')}"
           f"&response_type=code"
           f"&scope={scope}"
           f"&code_challenge={code_challenge}"
           f"&code_challenge_method=s256"
           f"&state={state}")
    return {"auth_url": url, "configured": True}

@api.get("/canva/oauth/callback")
async def canva_oauth_callback(request: Request):
    code = request.query_params.get("code")
    error = request.query_params.get("error")
    state = request.query_params.get("state", "")
    if error or not code:
        return HTMLResponse(f"<script>window.opener&&window.opener.postMessage({{type:'canva_error',error:'{error or 'cancelled'}'}}, '*');window.close();</script>")
    state_doc = await db.canva_oauth_states.find_one_and_delete({"state": state})
    if not state_doc:
        return HTMLResponse("<script>window.opener&&window.opener.postMessage({type:'canva_error',error:'state_invalid'}, '*');window.close();</script>")
    try:
        callback = _canva_callback_url()
        async with httpx.AsyncClient(timeout=30) as hc:
            r = await hc.post("https://api.canva.com/rest/v1/oauth/token", data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": callback,
                "client_id": CANVA_CLIENT_ID,
                "client_secret": CANVA_CLIENT_SECRET,
                "code_verifier": state_doc["code_verifier"],
            })
            token_data = r.json()
        access_token = token_data.get("access_token", "")
        if not access_token:
            raise Exception(token_data.get("error_description", "Token non ricevuto"))
        return HTMLResponse(f"<script>window.opener&&window.opener.postMessage({{type:'canva_success',token:'{access_token}'}}, '*');window.close();</script>")
    except Exception as e:
        msg = str(e).replace("'", "").replace('"', '').replace('\n', ' ').replace('\r', '')
        return HTMLResponse(f"<script>window.opener&&window.opener.postMessage({{type:'canva_error',error:'{msg}'}}, '*');window.close();</script>")

@api.post("/canva/import")
async def canva_import(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    content_id = body.get("content_id", "")
    image_url = body.get("image_url", "")
    if not content_id or not image_url:
        raise HTTPException(400, "content_id e image_url richiesti")
    try:
        async with httpx.AsyncClient(timeout=30) as hc:
            resp = await hc.get(image_url)
            if resp.status_code != 200:
                raise HTTPException(400, "Impossibile scaricare l'immagine da Canva")
            fname = f"canva_{uuid.uuid4().hex}.png"
            fpath = UPLOAD_DIR / fname
            with open(fpath, "wb") as f:
                f.write(resp.content)
            media_url = f"/api/media/file/{fname}"
            media_doc = {"id": str(uuid.uuid4()), "filename": fname, "original_name": "Canva Export", "url": media_url, "type": "image", "source": "canva", "size": len(resp.content), "created_at": datetime.now(timezone.utc).isoformat()}
            await db.contents.update_one({"id": content_id}, {"$push": {"media": media_doc}})
            return media_doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Errore import Canva: {str(e)}")

# ── TOV LIBRARY ───────────────────────────────────────
class TovLibraryItem(BaseModel):
    name: str
    preset: Optional[str] = ""
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

@api.get("/tov-library")
async def list_tov_library(request: Request):
    user = await get_current_user(request)
    items = await db.tov_library.find({"user_id": user["_id"]}, {"_id": 0}).to_list(50)
    return items

@api.post("/tov-library")
async def save_tov_library_item(inp: TovLibraryItem, request: Request):
    user = await get_current_user(request)
    doc = inp.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["_id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.tov_library.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/tov-library/{item_id}")
async def update_tov_library_item(item_id: str, inp: TovLibraryItem, request: Request):
    user = await get_current_user(request)
    updates = inp.model_dump()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.tov_library.update_one({"id": item_id, "user_id": user["_id"]}, {"$set": updates})
    return {"ok": True}

@api.delete("/tov-library/{item_id}")
async def delete_tov_library_item(item_id: str, request: Request):
    user = await get_current_user(request)
    await db.tov_library.delete_one({"id": item_id, "user_id": user["_id"]})
    return {"ok": True}

@api.post("/tov-library/{item_id}/apply/{project_id}")
async def apply_tov_library_item(item_id: str, project_id: str, request: Request):
    user = await get_current_user(request)
    item = await db.tov_library.find_one({"id": item_id, "user_id": user["_id"]}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Template ToV non trovato")
    tov_data = {k: v for k, v in item.items() if k not in ("id", "user_id", "created_at", "updated_at", "name")}
    tov_data["project_id"] = project_id
    tov_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.tov_profiles.update_one({"project_id": project_id}, {"$set": tov_data}, upsert=True)
    return {"ok": True}

# ── FORGOT / RESET PASSWORD ───────────────────────────
class ForgotPasswordInput(BaseModel):
    email: str

class ResetPasswordInput(BaseModel):
    token: str
    new_password: str

@api.post("/auth/forgot-password")
async def forgot_password(inp: ForgotPasswordInput):
    email = inp.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"ok": True, "message": "Se l'email esiste, riceverai un link di reset."}
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token, "email": email, "used": False,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    frontend_url = os.environ.get("FRONTEND_URL", "")
    reset_link = f"{frontend_url}?reset_token={token}"
    logger.info(f"Password reset link for {email}: {reset_link}")
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#0f1629;color:#fff;border-radius:12px;">
        <h2 style="color:#a5b4fc;">Sketchario - Reset Password</h2>
        <p>Hai richiesto il reset della password per il tuo account Sketchario.</p>
        <p>Clicca il pulsante qui sotto per impostare una nuova password:</p>
        <a href="{reset_link}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin:20px 0;">Reimposta Password</a>
        <p style="font-size:12px;color:#8b95a5;margin-top:20px;">Il link scade tra 1 ora. Se non hai richiesto il reset, ignora questa email.</p>
        <hr style="border:1px solid #1a2540;margin:20px 0;">
        <p style="font-size:11px;color:#5c6370;">Sketchario - Content Strategy Engine</p>
    </div>"""
    email_sent = await send_email_smtp(email, "Sketchario - Reset Password", html)
    return {"ok": True, "message": "Se l'email esiste, riceverai un link di reset.", "email_sent": email_sent}

@api.post("/auth/reset-password")
async def reset_password(inp: ResetPasswordInput):
    if len(inp.new_password) < 8:
        raise HTTPException(400, "La password deve avere almeno 8 caratteri")
    token_doc = await db.password_reset_tokens.find_one({"token": inp.token, "used": False})
    if not token_doc:
        raise HTTPException(400, "Token non valido o scaduto")
    if datetime.now(timezone.utc) > datetime.fromisoformat(token_doc["expires_at"]):
        raise HTTPException(400, "Token scaduto")
    await db.users.update_one({"email": token_doc["email"]}, {"$set": {"password_hash": hash_password(inp.new_password)}})
    await db.password_reset_tokens.update_one({"token": inp.token}, {"$set": {"used": True}})
    return {"ok": True, "message": "Password aggiornata con successo"}

# ── GOOGLE DRIVE IMPORT ───────────────────────────────
class DriveImportInput(BaseModel):
    content_id: str
    file_url: str

@api.post("/media/import-drive")
async def import_from_drive(inp: DriveImportInput, request: Request):
    user = await get_current_user(request)
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as hc:
            resp = await hc.get(inp.file_url)
            if resp.status_code != 200:
                raise HTTPException(400, "Impossibile scaricare il file da Google Drive")
            ct = resp.headers.get("content-type", "")
            ext = "jpg"
            if "png" in ct: ext = "png"
            elif "webp" in ct: ext = "webp"
            elif "gif" in ct: ext = "gif"
            elif "mp4" in ct: ext = "mp4"
            elif "video" in ct: ext = "mp4"
            fname = f"drive_{uuid.uuid4().hex}.{ext}"
            fpath = UPLOAD_DIR / fname
            with open(fpath, "wb") as f:
                f.write(resp.content)
            media_url = f"/api/media/file/{fname}"
            ftype = "video" if ext in ("mp4", "webm", "mov") else "image"
            media_doc = {"id": str(uuid.uuid4()), "filename": fname, "original_name": f"Google Drive Import", "url": media_url, "type": ftype, "source": "google_drive", "size": len(resp.content), "created_at": datetime.now(timezone.utc).isoformat()}
            await db.contents.update_one({"id": inp.content_id}, {"$push": {"media": media_doc}})
            return media_doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Errore import Drive: {str(e)}")

# ── NOTIFICATIONS (Release Note Reads) ────────────────
@api.get("/notifications/unread-count")
async def unread_count(request: Request):
    user = await get_current_user(request)
    total = await db.release_notes.count_documents({})
    reads = await db.release_note_reads.find({"user_id": user["_id"]}, {"note_id": 1}).to_list(500)
    read_ids = {r["note_id"] for r in reads}
    all_notes = await db.release_notes.find({}, {"_id": 0, "id": 1}).to_list(500)
    unread = sum(1 for n in all_notes if n["id"] not in read_ids)
    return {"unread": unread, "total": total}

@api.post("/notifications/mark-read")
async def mark_notes_read(request: Request):
    user = await get_current_user(request)
    notes = await db.release_notes.find({}, {"_id": 0, "id": 1}).to_list(500)
    for n in notes:
        await db.release_note_reads.update_one(
            {"user_id": user["_id"], "note_id": n["id"]},
            {"$set": {"user_id": user["_id"], "note_id": n["id"], "read_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
    return {"ok": True}

@api.get("/notifications/release-notes")
async def get_release_notes_with_read(request: Request):
    user = await get_current_user(request)
    notes = await db.release_notes.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    reads = await db.release_note_reads.find({"user_id": user["_id"]}, {"note_id": 1}).to_list(500)
    read_ids = {r["note_id"] for r in reads}
    for n in notes:
        n["read"] = n["id"] in read_ids
    return notes

# ── ANALYTICS ─────────────────────────────────────────
@api.get("/analytics/{project_id}")
async def get_analytics(project_id: str, request: Request):
    user = await get_current_user(request)
    contents = await db.contents.find({"project_id": project_id}, {"_id": 0}).to_list(500)
    total = len(contents)
    by_format = {}
    by_pillar = {}
    by_status = {}
    for c in contents:
        fmt = c.get("format", "unknown")
        by_format[fmt] = by_format.get(fmt, 0) + 1
        pillar = c.get("pillar", "unknown") or "unknown"
        by_pillar[pillar] = by_pillar.get(pillar, 0) + 1
        status = c.get("status", "draft")
        by_status[status] = by_status.get(status, 0) + 1
    queue_items = await db.publish_queue.find({"project_id": project_id}, {"_id": 0}).to_list(500)
    queue_by_status = {}
    for q in queue_items:
        qs = q.get("status", "unknown")
        queue_by_status[qs] = queue_by_status.get(qs, 0) + 1
    queue_by_platform = {}
    for q in queue_items:
        plt = q.get("platform", "unknown")
        queue_by_platform[plt] = queue_by_platform.get(plt, 0) + 1
    media_count = sum(len(c.get("media", [])) for c in contents)
    project = await db.projects.find_one({"_id": ObjectId(project_id)}, {"_id": 0})
    target = (project.get("duration_weeks", 1) or 1) * 7
    completion = min(round((total / target) * 100, 1), 100) if target > 0 else 0
    return {
        "total_contents": total, "target_contents": target, "completion_pct": completion,
        "by_format": by_format, "by_pillar": by_pillar, "by_status": by_status,
        "media_count": media_count, "queue_total": len(queue_items),
        "queue_by_status": queue_by_status, "queue_by_platform": queue_by_platform
    }

@api.get("/analytics/global/summary")
async def global_analytics(request: Request):
    user = await get_current_user(request)
    projects = await db.projects.count_documents({"user_id": user["_id"]})
    contents = await db.contents.count_documents({})
    published = await db.publish_queue.count_documents({"user_id": user["_id"], "status": "published"})
    queued = await db.publish_queue.count_documents({"user_id": user["_id"], "status": "queued"})
    return {"projects": projects, "total_contents": contents, "published": published, "queued": queued}

# ── ONBOARDING ────────────────────────────────────────
@api.get("/onboarding/status")
async def onboarding_status(request: Request):
    user = await get_current_user(request)
    ob = await db.onboarding.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not ob:
        return {"completed": False, "current_step": 0, "steps_done": []}
    return ob

@api.post("/onboarding/complete-step")
async def complete_onboarding_step(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    step = body.get("step", 0)
    ob = await db.onboarding.find_one({"user_id": user["_id"]})
    steps_done = ob.get("steps_done", []) if ob else []
    if step not in steps_done:
        steps_done.append(step)
    completed = len(steps_done) >= 5
    await db.onboarding.update_one(
        {"user_id": user["_id"]},
        {"$set": {"user_id": user["_id"], "current_step": step + 1, "steps_done": steps_done, "completed": completed, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"current_step": step + 1, "steps_done": steps_done, "completed": completed}

@api.post("/onboarding/skip")
async def skip_onboarding(request: Request):
    user = await get_current_user(request)
    await db.onboarding.update_one(
        {"user_id": user["_id"]},
        {"$set": {"user_id": user["_id"], "completed": True, "skipped": True, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"ok": True}

# ── TEAM COLLABORATION ────────────────────────────────
class TeamInviteInput(BaseModel):
    project_id: str
    email: str
    role: str = "editor"

@api.get("/team/my-invites")
async def my_invites(request: Request):
    user = await get_current_user(request)
    invites = await db.team_members.find({"email": user.get("email", "").lower(), "status": "pending"}, {"_id": 0}).to_list(20)
    for inv in invites:
        try:
            project = await db.projects.find_one({"_id": ObjectId(inv["project_id"])}, {"_id": 0, "name": 1, "sector": 1})
            inv["project_name"] = project.get("name", "") if project else ""
        except Exception:
            inv["project_name"] = ""
    return invites

@api.get("/team/{project_id}")
async def list_team(project_id: str, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(404, "Progetto non trovato")
    if project["user_id"] != user["_id"]:
        collab = await db.team_members.find_one({"project_id": project_id, "email": user.get("email")})
        if not collab:
            raise HTTPException(403, "Accesso negato")
    members = await db.team_members.find({"project_id": project_id}, {"_id": 0}).to_list(50)
    owner = await db.users.find_one({"_id": ObjectId(project["user_id"])}, {"_id": 0, "password_hash": 0})
    if owner:
        owner["_id"] = str(owner.get("_id", ""))
    return {"owner": user_response(owner) if owner else None, "members": members}

@api.post("/team/invite")
async def invite_team_member(inp: TeamInviteInput, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(inp.project_id), "user_id": user["_id"]})
    if not project:
        raise HTTPException(403, "Solo il proprietario puo invitare")
    if inp.role not in ("editor", "viewer"):
        raise HTTPException(400, "Ruolo non valido. Usa 'editor' o 'viewer'")
    existing = await db.team_members.find_one({"project_id": inp.project_id, "email": inp.email.lower()})
    if existing:
        await db.team_members.update_one({"project_id": inp.project_id, "email": inp.email.lower()}, {"$set": {"role": inp.role}})
        return {"ok": True, "updated": True}
    doc = {
        "id": str(uuid.uuid4()), "project_id": inp.project_id, "email": inp.email.strip().lower(),
        "role": inp.role, "status": "pending", "invited_by": user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.team_members.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.post("/team/accept/{invite_id}")
async def accept_invite(invite_id: str, request: Request):
    user = await get_current_user(request)
    invite = await db.team_members.find_one({"id": invite_id, "email": user.get("email", "").lower()})
    if not invite:
        raise HTTPException(404, "Invito non trovato")
    await db.team_members.update_one({"id": invite_id}, {"$set": {"status": "accepted", "user_id": user["_id"]}})
    return {"ok": True}

@api.delete("/team/{project_id}/{member_email}")
async def remove_team_member(project_id: str, member_email: str, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"_id": ObjectId(project_id), "user_id": user["_id"]})
    if not project:
        raise HTTPException(403, "Solo il proprietario puo rimuovere")
    await db.team_members.delete_one({"project_id": project_id, "email": member_email.lower()})
    return {"ok": True}

# ── DROPBOX / ONEDRIVE IMPORT ─────────────────────────
class CloudImportInput(BaseModel):
    content_id: str
    file_url: str
    source: str = "dropbox"

@api.post("/media/import-cloud")
async def import_from_cloud(inp: CloudImportInput, request: Request):
    user = await get_current_user(request)
    if inp.source not in ("dropbox", "onedrive"):
        raise HTTPException(400, "Source non supportato. Usa 'dropbox' o 'onedrive'")
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as hc:
            resp = await hc.get(inp.file_url)
            if resp.status_code != 200:
                raise HTTPException(400, f"Impossibile scaricare da {inp.source}")
            ct = resp.headers.get("content-type", "")
            ext = "jpg"
            if "png" in ct: ext = "png"
            elif "webp" in ct: ext = "webp"
            elif "gif" in ct: ext = "gif"
            elif "mp4" in ct or "video" in ct: ext = "mp4"
            fname = f"{inp.source}_{uuid.uuid4().hex}.{ext}"
            fpath = UPLOAD_DIR / fname
            with open(fpath, "wb") as f:
                f.write(resp.content)
            media_url = f"/api/media/file/{fname}"
            ftype = "video" if ext in ("mp4", "webm", "mov") else "image"
            media_doc = {"id": str(uuid.uuid4()), "filename": fname, "original_name": f"{inp.source.title()} Import", "url": media_url, "type": ftype, "source": inp.source, "size": len(resp.content), "created_at": datetime.now(timezone.utc).isoformat()}
            await db.contents.update_one({"id": inp.content_id}, {"$push": {"media": media_doc}})
            return media_doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Errore import {inp.source}: {str(e)}")

# ── GOOGLE SLIDES INTEGRATION ────────────────────────

async def _get_google_access_token(user_id) -> str:
    account = await db.social_accounts.find_one({"user_id": user_id, "platform": "google_slides"})
    if not account:
        raise HTTPException(400, "Google non connesso. Collega il tuo account Google nella sezione Social.")
    access_token = account["access_token"]
    # Try a lightweight token check; refresh if needed
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get("https://www.googleapis.com/oauth2/v3/tokeninfo",
                        params={"access_token": access_token})
        if r.status_code != 200:
            refresh_token = account.get("refresh_token", "")
            if not refresh_token:
                raise HTTPException(401, "Token Google scaduto. Ricollega il tuo account Google.")
            client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
            client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
            rr = await c.post("https://oauth2.googleapis.com/token", data={
                "client_id": client_id, "client_secret": client_secret,
                "refresh_token": refresh_token, "grant_type": "refresh_token",
            })
            rr.raise_for_status()
            access_token = rr.json()["access_token"]
            await db.social_accounts.update_one(
                {"user_id": user_id, "platform": "google_slides"},
                {"$set": {"access_token": access_token}}
            )
    return access_token

async def _build_google_slides(access_token: str, content: dict) -> str:
    W = 9144000   # square side in EMU (10" × 10" = 1:1 carousel format)
    H = 9144000
    M = 600000    # margin in EMU
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    title = content.get("hook_text", "Carousel")[:60]

    raw_slides = content.get("slides") or []
    if not raw_slides:
        raw_slides = [s.strip() for s in content.get("script", "").split("---") if s.strip()]
    if not raw_slides:
        raw_slides = [content.get("script", "")]

    # Build logical slides: cover + numbered + cta
    logical = [{"kind": "cover", "text": title}]
    for i, s in enumerate(raw_slides):
        logical.append({"kind": "body", "num": str(i + 1).zfill(2), "text": str(s)})
    logical.append({"kind": "cta", "text": "Seguimi per altri contenuti!", "sub": content.get("hashtags", "")[:120]})

    async with httpx.AsyncClient(timeout=45) as c:
        r = await c.post("https://slides.googleapis.com/v1/presentations",
                         headers=headers, json={
                             "title": title,
                             "pageSize": {
                                 "width":  {"magnitude": W, "unit": "EMU"},
                                 "height": {"magnitude": H, "unit": "EMU"},
                             }
                         })
        r.raise_for_status()
        pres = r.json()
        pres_id = pres["presentationId"]
        default_sid = pres["slides"][0]["objectId"]

        requests = []
        BG_DARK   = {"red": 0.11, "green": 0.107, "blue": 0.18}
        BG_COVER  = {"red": 0.07, "green": 0.065, "blue": 0.13}
        C_WHITE   = {"red": 1.0,  "green": 1.0,   "blue": 1.0}
        C_PURPLE  = {"red": 0.66, "green": 0.41,  "blue": 1.0}
        C_LPURPLE = {"red": 0.88, "green": 0.66,  "blue": 1.0}
        C_MUTED   = {"red": 0.6,  "green": 0.6,   "blue": 0.8}
        C_BODY    = {"red": 0.9,  "green": 0.9,   "blue": 0.95}

        def _emu(v): return {"magnitude": v, "unit": "EMU"}
        def _pt(v):  return {"magnitude": v, "unit": "PT"}
        def _rgb(c): return {"opaqueColor": {"rgbColor": c}}

        def add_shape(sid, oid, x, y, w, h):
            return {"createShape": {"objectId": oid, "shapeType": "TEXT_BOX",
                "elementProperties": {"pageObjectId": sid,
                    "size": {"width": _emu(w), "height": _emu(h)},
                    "transform": {"scaleX": 1, "scaleY": 1, "translateX": x, "translateY": y, "unit": "EMU"}}}}

        def style_text(oid, size, color, bold=False, center=False, font="Roboto"):
            reqs = [{"updateTextStyle": {"objectId": oid,
                "style": {"fontSize": _pt(size), "foregroundColor": _rgb(color),
                          "bold": bold, "fontFamily": font},
                "fields": "fontSize,foregroundColor,bold,fontFamily"}}]
            if center:
                reqs.append({"updateParagraphStyle": {"objectId": oid,
                    "style": {"alignment": "CENTER"}, "fields": "alignment"}})
            return reqs

        for i, sl in enumerate(logical):
            sid = f"slide_{i}_{uuid.uuid4().hex[:6]}"
            requests.append({"createSlide": {"objectId": sid, "insertionIndex": i,
                "slideLayoutReference": {"predefinedLayout": "BLANK"}}})
            bg = BG_COVER if sl["kind"] == "cover" else BG_DARK
            requests.append({"updatePageProperties": {"objectId": sid,
                "pageProperties": {"pageBackgroundFill": {"solidFill": {"color": {"rgbColor": bg}}}},
                "fields": "pageBackgroundFill"}})

            if sl["kind"] == "cover":
                oid = f"o_{i}_t_{uuid.uuid4().hex[:6]}"
                requests.append(add_shape(sid, oid, M, int(H*0.25), W-2*M, int(H*0.55)))
                requests.append({"insertText": {"objectId": oid, "text": sl["text"]}})
                requests += style_text(oid, 42, C_WHITE, bold=True, center=True, font="Montserrat")

            elif sl["kind"] == "body":
                nid = f"o_{i}_n_{uuid.uuid4().hex[:6]}"
                requests.append(add_shape(sid, nid, M, int(H*0.07), int(W*0.18), int(H*0.22)))
                requests.append({"insertText": {"objectId": nid, "text": sl["num"]}})
                requests += style_text(nid, 52, C_PURPLE, bold=True, font="Montserrat")

                bid = f"o_{i}_b_{uuid.uuid4().hex[:6]}"
                requests.append(add_shape(sid, bid, M, int(H*0.32), W-2*M, int(H*0.6)))
                requests.append({"insertText": {"objectId": bid, "text": sl["text"]}})
                requests += style_text(bid, 22, C_BODY)

            elif sl["kind"] == "cta":
                tid = f"o_{i}_t_{uuid.uuid4().hex[:6]}"
                requests.append(add_shape(sid, tid, M, int(H*0.2), W-2*M, int(H*0.35)))
                requests.append({"insertText": {"objectId": tid, "text": sl["text"]}})
                requests += style_text(tid, 34, C_LPURPLE, bold=True, center=True, font="Montserrat")
                if sl.get("sub"):
                    sid2 = f"o_{i}_s_{uuid.uuid4().hex[:6]}"
                    requests.append(add_shape(sid, sid2, M, int(H*0.62), W-2*M, int(H*0.22)))
                    requests.append({"insertText": {"objectId": sid2, "text": sl["sub"]}})
                    requests += style_text(sid2, 13, C_MUTED, center=True)

        requests.append({"deleteObject": {"objectId": default_sid}})

        r2 = await c.post(
            f"https://slides.googleapis.com/v1/presentations/{pres_id}:batchUpdate",
            headers=headers, json={"requests": requests})
        if r2.status_code != 200:
            raise HTTPException(500, f"Google Slides API error: {r2.text[:300]}")

        return f"https://docs.google.com/presentation/d/{pres_id}/edit"

class GoogleSlidesCreateInput(BaseModel):
    content_id: str
    project_id: str

@api.post("/slides/create-google")
async def create_google_slides(inp: GoogleSlidesCreateInput, request: Request):
    user = await get_current_user(request)
    content = await db.contents.find_one({"id": inp.content_id, "project_id": inp.project_id})
    if not content:
        raise HTTPException(404, "Contenuto non trovato")
    access_token = await _get_google_access_token(user["_id"])
    try:
        url = await _build_google_slides(access_token, content)
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Errore Google Slides: {str(e)}")

# ── EXPORT ───────────────────────────────────────────
@api.get("/export/{project_id}/csv")
async def export_csv(project_id: str, request: Request):
    user = await get_current_user(request)
    await check_plan_limit(user, "export_csv")
    contents = await db.contents.find({"project_id": project_id}, {"_id": 0}).to_list(500)
    import io, csv
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Hook", "Format", "Pillar", "Persona", "Day", "Script", "Caption", "Hashtags", "Status"])
    for c in contents:
        writer.writerow([c.get("hook_text",""), c.get("format",""), c.get("pillar",""), c.get("persona_target",""), c.get("day_offset",""), c.get("script",""), c.get("caption",""), c.get("hashtags",""), c.get("status","")])
    csv_content = output.getvalue()
    return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=sketchario_export_{project_id}.csv"})
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

_cors_origins = [o.strip() for o in os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
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
    await db.social_accounts.create_index("user_id")
    await db.project_social_accounts.create_index("project_id")
    await db.feeds.create_index("project_id")
    await db.feed_cache.create_index("feed_id")
    await db.publish_queue.create_index([("project_id", 1), ("scheduled_at", 1)])
    await db.power_users.create_index("email", unique=True)
    await db.release_notes.create_index("created_at")
    await db.payment_transactions.create_index("session_id")
    await db.tov_library.create_index("user_id")
    await db.password_reset_tokens.create_index("token")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.release_note_reads.create_index([("user_id", 1), ("note_id", 1)])
    await db.onboarding.create_index("user_id", unique=True)
    await db.team_members.create_index([("project_id", 1), ("email", 1)])
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
