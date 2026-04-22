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
- **Renderer (HyperFrames)**: root `renderer/`
- Comunicazione interna tra servizi: `http://nomeservizio.railway.internal:porta`
- `RENDERER_URL=https://sketchario-render-production.up.railway.app` nel backend
- NON usare comandi `docker-compose` — non girano su Railway
- Per deployare: fare merge del branch di sviluppo su `main`

## Branch di sviluppo
`main` (il precedente branch `claude/deploy-sketchario-server-DPV0g` è stato mergiato)

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

---

## Sistema i18n (IT/EN/ES/FR) — COMPLETATO

### Stato attuale
Il sistema i18n è completamente operativo su tutti i componenti principali.
Packages installati: `i18next`, `react-i18next`, `i18next-browser-languagedetector`.

**File locale** (tutti in `frontend/src/i18n/locales/`):
- `it.json` — Italiano (source of truth)
- `en.json` — English
- `es.json` — Español
- `fr.json` — Français

**Configurazione**:
- `frontend/src/i18n/index.js` — init i18next con language detector (localStorage key: `sketchario_lang`, fallback: `it`)
- `frontend/src/index.js` — importa `@/i18n` prima di App

**Componenti aggiornati** con `useTranslation`:
- `Sidebar.js` — completo, include language switcher (icona Translate, dropdown con 🇮🇹🇬🇧🇪🇸🇫🇷)
- `App.js` — completo
- `AuthScreen.js` — completo
- `Dashboard.js` — completo
- `Profile.js` — completo
- `Wizard.js` — completo
- `ContentDetail.js` — completo (toast + tutte le label UI)
- `ProjectView.js` — completo (incluso `RightPanelContent`)

**Note residue**:
- `Wizard.js`: alcune stringhe interne potrebbero essere ancora hardcoded, non prioritario
- `window.confirm()` in `ContentDetail.js`: lasciati in italiano, non prioritario
