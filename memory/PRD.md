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
- Full mobile responsiveness
- Dual Feed Strips (RSS + AI-generated)

## What's Been Implemented

### Iteration 1-9 — Full MVP
- ✅ JWT Auth (register, login, logout, me, refresh, forgot password)
- ✅ Admin seeding, Brute force protection
- ✅ Dashboard with stats + projects grid
- ✅ Project CRUD + archive/unarchive + cover images
- ✅ Wizard (5 steps: Brief → Personas → ToV → Hooks → Contents)
- ✅ AI Generation (Personas, Hooks, Content via Gemini 3 Flash)
- ✅ Content Detail: 3-column overlay modal (Social/Editor/Preview)
- ✅ Content Regeneration/Conversion with Global Prompting
- ✅ Social Profiles: OAuth + Manual + Project linking
- ✅ Feed/RSS: Google News, auto-refresh
- ✅ Publishing Queue with scheduling
- ✅ Media: Upload, DALL-E, Canva, PostNitro Embed SDK, Drive, Dropbox, OneDrive
- ✅ Stripe Billing: Free/Creator/Strategist plans
- ✅ Admin Console + Release Notes
- ✅ Team Collaboration (invite/accept/remove)
- ✅ Onboarding Tour
- ✅ Notifications system
- ✅ Export CSV/JSON
- ✅ ToV Library (personal templates)
- ✅ Plan Gating
- ✅ Email SMTP via Aruba

### Iteration 10 — Mobile Responsiveness + Dual Feed Strips (Jan 14, 2026)
- ✅ **Full Mobile Responsiveness**:
  - Dashboard: Stats stack, single-column projects, responsive header
  - ProjectView: Compact header, scrollable tabs, single-column cards, hidden right panel with drawer toggle
  - ContentDetail: Fullscreen on mobile with tabbed interface (Editor/Social/Anteprima)
  - Sidebar: Context-aware bottom navigation bar (dashboard items vs project items)
  - Footer: Responsive with stacked links on mobile
- ✅ **Dual Feed Strips**:
  - Strip 1: Google News + Reddit RSS based on project sector (auto-added on project creation)
  - Strip 2: 5 AI-generated content ideas with format badges and trend tags
  - Both auto-refresh every 10 minutes
  - Refresh/Rigenera buttons for manual refresh
- ✅ **Backend**: POST /api/feeds/ai-suggestions/{project_id} with 10-minute cache
- ✅ **Backend**: POST /api/feeds/ai-suggestions/{project_id}/refresh to force regeneration
- ✅ Testing: Backend 100% (13/13), Frontend 95%

### Backend Endpoints (Key)
- Auth: /api/auth/{register,login,logout,me,refresh,forgot-password,reset-password}
- Profile: /api/profile, /api/profile/change-password, /api/profile/delete-account
- Projects: /api/projects CRUD + archive/unarchive + cover upload
- Personas: /api/personas/{generate,save,get}
- Hooks: /api/hooks/{generate,save,get,update}
- Content: /api/content/{generate,create-post}, /api/contents/{get,update,delete,regenerate,convert}
- ToV: /api/tov/{save,get}
- ToV Library: /api/tov-library CRUD + apply
- Feed: /api/feeds/{add,list,items,refresh,generate-content,ai-suggestions}
- Publish: /api/publish/{schedule,mark-published,queue}
- Media: /api/media/{upload,delete,generate-dalle,import-drive,import-cloud}
- Social: /api/social/{platforms,profiles,project/link}
- Billing: /api/billing/{plans,checkout,status}
- Admin: /api/admin/{power-users,release-notes}
- Analytics: /api/analytics/{project_id}
- Export: /api/export/{project_id}/{json,csv}

## Prioritized Backlog

### P0 — Next Priority
- Deploy to sketchario.app (unblocks Social OAuth callbacks)
- Integrate Legal Pages (user to provide ../legal/ documents)

### P1 — Phase 2
- Refactor server.py into modular routers (auth, projects, social, media, billing)
- PostNitro automated API generation (awaiting presetId from user)

### P2 — Phase 3
- Advanced analytics with engagement metrics
- Content A/B testing
- Multi-language support
