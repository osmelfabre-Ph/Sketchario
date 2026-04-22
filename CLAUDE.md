# Sketchario — Contesto Progetto

## Stack
- **Frontend**: React (Create React App), Tailwind, Framer Motion, Phosphor Icons, Sonner toasts
- **Backend**: Python FastAPI + Motor (MongoDB async), httpx per chiamate esterne
- **Database**: MongoDB (Atlas o Railway plugin)
- **Auth**: JWT custom

## Deployment: Railway (tutto qui, niente Docker locale, niente Aruba)
- Ogni servizio = un Railway service dallo stesso GitHub repo
- **Frontend**: root `frontend/`
- **Backend**: root `backend/`
- **Renderer (HyperFrames)**: root `renderer/` — da aggiungere come nuovo service
- Comunicazione interna tra servizi: `http://nomeservizio.railway.internal:porta`
- `RENDERER_URL=https://sketchario-render-production.up.railway.app` nel backend
- NON usare comandi `docker-compose` — non girano su Railway

## Branch di sviluppo
`claude/deploy-sketchario-server-DPV0g`

## Integrazioni configurate
- **Canva Connect API**: OAuth PKCE, create design + export asincrono (3 step)
- **Google Drive**: OAuth `drive.readonly`, picker client-side, download client-side
- **HyperFrames**: renderer Node.js su Railway, endpoint `POST /media/render-video`
- **Social publishing**: Instagram, Facebook, LinkedIn, TikTok, Pinterest
- **AI**: immagini con FLUX/DALL-E, ottimizzazione prompt

## Convenzioni codice
- Italiano nell'UI, variabili/funzioni in inglese
- Toast con Sonner: `toast.loading()` → `toast.success/error({ id: tid })`
- API calls con `api` (axios instance da `useAuth()`)
- Icone: Phosphor Icons (`@phosphor-icons/react`)
- Stili: classi custom CSS (`btn-gradient`, `btn-ghost`, `card`, `input-dark`, `badge`)
