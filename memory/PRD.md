# Sketchario V4 — PRD

## Problem Statement
Rebuild Sketchario, a social content strategy platform, from PHP/vanilla JS to React + FastAPI + MongoDB with a modern dark UI inspired by the user's reference.

## Architecture
- **Frontend**: React 19 + Tailwind + Framer Motion + Phosphor Icons
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **AI Engine**: Gemini 3 Flash via Emergent LLM Key
- **Auth**: JWT (httpOnly cookies + Bearer fallback) with bcrypt

## User Personas
1. **Creator** - Freelance content creator needing content strategy
2. **Consultant** - Marketing consultant managing multiple client projects
3. **Small Team** - Team needing coordinated social publishing

## Core Requirements
- Auth (login/register/logout/profile)
- Dashboard with project stats
- Project Wizard (Brief → Personas → ToV → Hooks → Contents)
- AI-powered generation (personas, hooks, content)
- Project View with calendar + content list
- Content editing (script, caption, hashtags)
- Tone of Voice configuration
- Brand Kit management
- Profile management with delete account

## What's Been Implemented (Jan 14, 2026)

### Iteration 1 — MVP Core
- ✅ JWT Auth (register, login, logout, me, refresh)
- ✅ Admin seeding on startup
- ✅ Brute force protection
- ✅ Dashboard with stats + projects grid
- ✅ Project CRUD (create, list, get, delete, archive)
- ✅ Wizard (5 steps: Brief → Personas → ToV → Hooks → Contents)
- ✅ AI Personas generation (Gemini 3 Flash)
- ✅ AI Hooks generation with objective distribution
- ✅ AI Content generation (script + caption + hashtags)
- ✅ Tone of Voice editor (presets + sliders + custom instructions)
- ✅ Project View (calendar, content list, personas, ToV tabs)
- ✅ Content detail modal with editing
- ✅ Profile page (edit name, sector, change password, delete account)
- ✅ Dark theme design with gradient buttons and colored stat icons
- ✅ Official Sketchario logos integrated
- ✅ Brand Kit save/get endpoints
- ✅ Export JSON endpoint
- ✅ Testing: 92% backend, 90% frontend

### Backend Endpoints
- Auth: /api/auth/{register,login,logout,me,refresh}
- Profile: /api/profile, /api/profile/change-password, /api/profile/delete-account
- Projects: /api/projects CRUD + archive/unarchive
- Personas: /api/personas/{generate,save,get}
- Hooks: /api/hooks/{generate,save,get,update}
- Content: /api/content/{generate,create-post}, /api/contents/{get,update,delete}
- ToV: /api/tov/{save,get}
- Brand Kit: /api/brand-kit/{save,get}
- Export: /api/export/{project_id}/json

### Iteration 2 — Nuovo Post + Social (Jan 14, 2026)
- ✅ "Nuovo Post" button in Project View header
- ✅ New Post modal: hook input, Reel/Carousel format, Da zero/Con AI modes
- ✅ Manual post creation (Da zero) creates empty post
- ✅ AI post creation (Con AI) generates script+caption+hashtags via Gemini
- ✅ Content delete button in detail modal
- ✅ Social Profiles tab (5 platforms: Instagram, Facebook, LinkedIn, TikTok, Pinterest)
- ✅ OAuth connect URLs configured for all platforms (callbacks → sketchario.app)
- ✅ Manual profile add (name-based, no OAuth required)
- ✅ Project-social linking (toggle link/unlink per profile)
- ✅ All social API keys loaded from config.secrets.php
- ✅ Auth made more robust with interceptors + auto-refresh
- ✅ Backend: 100% tests passed (20/20)

### Iteration 3 — Feed/RSS + Publishing Queue (Jan 14, 2026)
- ✅ Feed/RSS: add RSS feeds, fetch and cache articles, display with titles/summaries
- ✅ AI content generation from feed items (Gemini 3 Flash)
- ✅ Feed refresh with cache invalidation
- ✅ Publishing Queue: schedule content to social profiles with date/time
- ✅ Queue view with status filters (queued/processing/published/failed)
- ✅ Cancel scheduled items from queue
- ✅ Schedule modal with social profile multi-select
- ✅ Content status badges (draft/scheduled/published) in list view
- ✅ Backend: 100% tests passed (12/12)

### Iteration 4 — Media, DALL-E, Admin, Stripe (Jan 14, 2026)
- ✅ Media upload: file upload to content (jpg, png, webp, gif, mp4, webm, mov)
- ✅ Media delete from content
- ✅ Media library: browse all media across project
- ✅ DALL-E image generation (GPT Image 1 via Emergent LLM key)
- ✅ Upload + DALL-E buttons in content detail modal
- ✅ Admin Console: Power Users CRUD (add, toggle, delete)
- ✅ Release Notes: create, list, delete (admin only)
- ✅ Stripe Billing: checkout sessions for Creator (19EUR) and Strategist (49EUR)
- ✅ Payment status polling + webhook handler
- ✅ Billing page with 3 plan cards and "Popolare" badge
- ✅ Sidebar updated with Piani + Admin (admin only)
- ✅ Backend: 100% (23/23), Frontend: 100%

### Iteration 5 — Canva, Export CSV, ToV Library, Gating (Jan 14, 2026)
- ✅ Canva integration: OAuth URL generation, import endpoint (funzionera su sketchario.app)
- ✅ Canva button nel content detail modal accanto a Upload e DALL-E
- ✅ Export CSV: download CSV di tutti i contenuti del progetto
- ✅ CSV button nell'header del Project View
- ✅ ToV Library: CRUD template personali (crea, lista, applica a progetto, elimina)
- ✅ ToV Library tab nel Project View con "Salva ToV attuale" e "Applica al progetto"
- ✅ Plan Gating: Free (1 progetto, 7 contenuti), Creator (5/30), Strategist (illimitati)
- ✅ Gating applicato a: creazione progetto, creazione contenuto, pubblicazione, export CSV
- ✅ Power Users override per bypass limiti temporanei
- ✅ GET /api/plan/limits endpoint per mostrare limiti + utilizzo
- ✅ Backend: 96.7% (30/31 - unico fail: test Canva import con URL fittizio)
- ✅ Token duration esteso a 24h per sessioni stabili

### Iteration 6 — Drive, Forgot PW, Notifications, Analytics, Responsive (Jan 14, 2026)
- ✅ Google Drive import endpoint (POST /api/media/import-drive)
- ✅ Forgot Password: token generation, reset link, password update
- ✅ "Password dimenticata?" link nell'auth screen
- ✅ Reset password modal con token da URL
- ✅ In-app Notifications: campanella con badge unread, mark-read
- ✅ Notifications view con release notes lette/non lette
- ✅ Content Analytics Dashboard: stats per formato/pillar/stato/queue
- ✅ Barra completamento campagna animata
- ✅ Analytics per piattaforma nella queue
- ✅ Full Responsive Design:
  - Mobile (< 768px): bottom navigation, stats impilati, form full-width
  - Tablet (< 1024px): sidebar collassata a icone, griglia 2 colonne
  - Desktop: layout completo con sidebar espansa
- ✅ Backend: 94.6% (35/37 - fail solo Drive/Canva con URL fittizi)
- ✅ Frontend: 100%

## Prioritized Backlog

### P0 — Next Priority
- Manual post creation (Da zero + Con AI) in Project View
- Content CSV export
- RSS/Feed integration for content inspiration

### P1 — Phase 2
- Media upload and gallery
- Social OAuth connections (Instagram, Facebook, LinkedIn, TikTok, Pinterest)
- Publishing queue and scheduling
- Stripe billing integration

### P2 — Phase 3
- Canva integration
- DALL-E image generation
- Google Drive import
- Admin console + Release notes
- ToV Library (personal templates)
- RSS/Feed auto-refresh

## Next Tasks
1. Add "Nuovo Post" button in Project View
2. Implement CSV export
3. Add social OAuth integration (requires user API keys)
4. Add Stripe billing
