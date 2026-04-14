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
