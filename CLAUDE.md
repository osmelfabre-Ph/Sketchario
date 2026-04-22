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

---

## Sistema i18n (IT/EN/ES/FR) — COMPLETATO PARZIALMENTE

### Stato attuale
Il sistema i18n è operativo. Packages installati: `i18next`, `react-i18next`, `i18next-browser-languagedetector`.

**File locale già creati** (tutti in `frontend/src/i18n/locales/`):
- `it.json` — Italiano (source of truth)
- `en.json` — English
- `es.json` — Español
- `fr.json` — Français

**Configurazione** già fatta:
- `frontend/src/i18n/index.js` — init i18next con language detector (localStorage key: `sketchario_lang`, fallback: `it`)
- `frontend/src/index.js` — importa `@/i18n` prima di App

**Componenti già aggiornati** con `useTranslation`:
- `Sidebar.js` — completo, include language switcher (icona Translate, dropdown con 🇮🇹🇬🇧🇪🇸🇫🇷)
- `App.js` — loading string
- `AuthScreen.js` — completo
- `Dashboard.js` — completo
- `Profile.js` — completo
- `Wizard.js` — parziale (solo import + hook + pulsante principale)

### Task da completare: aggiornare ContentDetail.js e ProjectView.js

Questi due file hanno ancora tutte le stringhe hardcoded in italiano. Vanno aggiornati con `useTranslation`.

#### ContentDetail.js (`frontend/src/components/ContentDetail.js`)

Aggiungere in cima:
```js
import { useTranslation } from 'react-i18next';
```

Nel body del componente `ContentDetail` aggiungere:
```js
const { t } = useTranslation();
```

**Stringhe da sostituire** (mappatura chiave → stringa attuale):

Toast messages:
- `'Creazione design Canva...'` → `t('canva.creating')`
- `'Design aperto in Canva — premi "Torna a Sketchario" per importare'` → `t('canva.opened')`
- `'Esportazione in corso...'` → `t('canva.exporting')`
- `'Download immagini...'` → `t('canva.downloading')`
- `'Nessuna immagine esportata da Canva'` → `t('canva.noImages')`
- ``'${imp.count} immagin${...} da Canva!'`` → `t('canva.importSuccess_other', { count: imp.count })`
- `'Sessione Canva scaduta — clicca di nuovo...'` → `t('canva.expired')`
- `` `Errore importazione Canva${status}: ${detail}` `` → `t('canva.errorImporting', { status, message: detail })`
- `'Errore Canva: ' + ...` → `t('canva.errorCreating', { message: ... })`
- `'Apertura Google Drive...'` → `t('drive.opening')`
- `'Le autorizzazioni Google Drive sono scadute...'` → `t('drive.scopeExpired')`
- `'Collega il tuo account Google...'` → `t('drive.notConnected')`
- `` `Download di "${doc.name}" in corso...` `` → `t('drive.downloading', { name: doc.name })`
- `` `"${doc.name}" importato da Drive` `` → `t('drive.importSuccess', { name: doc.name })`
- `'Autorizzazioni insufficienti...'` → `t('drive.errorPermissions')`
- `'Errore Google Drive: ' + ...` → `t('drive.error', { message: ... })`
- `'Upload in corso...'` → `t('editor.uploading')`
- `'Pubblicazione in corso...'` → `t('editor.publishing')`
- `'Contenuto pubblicato con successo!'` → `t('editor.publishSuccess')`
- `` `Programmato per il ${scheduleDate} alle ${scheduleTime}` `` → `t('editor.scheduleSuccess', { date: scheduleDate, time: scheduleTime })`
- `'Annullamento programmazione...'` → `t('editor.cancellingSchedule')`
- `'Programmazione annullata'` → `t('editor.cancelScheduleSuccess')`
- `'Errore caricamento libreria'` → `t('library.errorLoading')`
- `'Media aggiunto al contenuto'` → `t('library.addToContent')`
- `'Errore aggiunta media'` → `t('library.errorAdding')`

UI labels in SocialColumn:
- `'Pubblica su'` → `t('project.social.publishOn')`
- `'Nessun social connesso. Vai su Social per collegare i tuoi account.'` → `t('project.social.noSocialConnected')`

UI labels in EditorColumn:
- `'⚡ OPENING HOOK (primi 3-5 secondi)'` → `` `⚡ ${t('editor.openingHook').toUpperCase()}` ``
- `'Script Avatar'` → `t('editor.avatarScript')`
- `'Regia Visiva'` → `t('editor.visualDirection')`
- `'Caption'` → `t('editor.caption')`
- `'Hashtag'` → `t('editor.hashtags')`
- `'Media'` → `t('editor.media')`
- `'Allega un media'` → `t('editor.uploadMedia')`
- `'Max 400 MB'` → `t('editor.uploadMax')`
- `'Upload in corso...'` → `t('editor.uploading')`
- `'Copia Script Avatar'` → `t('editor.copyAvatarScript')`
- `'Copia'` → `t('common.copy')`
- `'Rigenera'` → `t('editor.regenerate')`
- title `'FLUX AI'` → `t('editor.generateImage')`
- title `'Apri in Canva'` → `t('editor.openCanva')`
- title `'Importa da Google Drive'` → `t('editor.importDrive')`
- title `'Libreria media del progetto'` → `t('editor.mediaLibrary')`
- `'Rendering...'` → `t('editor.renderingVideo')`
- `'Genera Video'` → `t('editor.generateVideo')`

In PreviewColumn:
- `'Anteprima Post'` → `t('editor.preview')`
- `` `Seleziona i social${...}` `` → `t('editor.selectSocials')`

Bottom bar:
- `'Pubblicato'` → `t('editor.published')`
- `'Programmato'` → `t('editor.scheduled')`
- `'Bozza'` → `t('editor.draft')`
- `saving ? '...' : 'Salva'` → `saving ? '...' : t('common.save')`
- `'Invio...'` → `t('editor.publishing_')`
- `'Pubblica'` → `t('editor.publish')`
- `'Annulla prog.'` → `t('editor.cancelSchedule')`
- `'Modifica'` → `t('editor.modifySchedule')`
- `'Programma'` → `t('editor.scheduleBtn')`

Schedule popup:
- `'Modifica Programmazione'` → `t('editor.scheduleModifyTitle')`
- `'Programma Pubblicazione'` → `t('editor.scheduleTitle')`
- `` `Su ${selectedSocials.length} social selezionati` `` → `t('editor.scheduleOnSocials', { count: selectedSocials.length })`
- `'Annulla'` → `t('common.cancel')`
- `'Conferma'` (nel schedule) → `t('common.confirm')`
- `'Invio...'` → `t('editor.publishing_')`

Media library modal:
- `'Libreria Media'` → `t('library.title')`
- `'Nessun media caricato nel progetto'` → `t('library.empty')`

Input modal:
- `'Annulla'` → `t('common.cancel')`
- `'Genera'` → pulsante genera, lasciare così (è specifico dell'AI)

confirm dialogs:
- `'Rigenerare questo contenuto?'` → `t('editor.regenerateConfirm')`
- `` `Convertire in ${target}?` `` → `t('editor.convertConfirm', { format: target })`

**NOTA**: le stringhe italiane nei `window.confirm()` possono rimanere temporaneamente in italiano, non è prioritario.

---

#### ProjectView.js (`frontend/src/components/ProjectView.js`)

Aggiungere in cima:
```js
import { useTranslation } from 'react-i18next';
```

Nel body di `ProjectView` aggiungere:
```js
const { t } = useTranslation();
```

**Stringhe da sostituire**:

Loading:
- `'Caricamento progetto...'` → `t('common.loading')`

Header:
- `` `${contents.length} contenuti` `` → `` `${contents.length} ${t('dashboard.contents')}` ``

Tab buttons (array di oggetti):
```js
{ id: 'list', label: t('project.tabs.list') },
{ id: 'calendar', label: t('project.tabs.calendar') },
{ id: 'personas', label: t('project.tabs.personas') },
{ id: 'social', label: t('project.tabs.social') },
```
- Il tab `'Analytics'` hardcoded → `t('nav.analytics')`

Content list (cards + list view):
- `'Nessun contenuto generato.'` → `t('project.content.noContent')` (appare in due posti)
- `'Crea il primo post'` → lasciar stare (è CTA specifica)
- `'Senza titolo'` → lasciare in italiano
- Gruppi nella list view:
  - `'Pubblicati'` → `t('status.published')`  (ma attenzione: già plurale, usare come label di gruppo va bene)
  - `'Programmati'` → `t('status.scheduled')`
  - `'Bozze'` → `t('status.draft')`
- `'Pubblicato'` nel dateLabel → `t('status.published')`

Calendar:
- `const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']` — lasciare localizzati (i18n già fornisce le date tramite il sistema locale di JS)

Social tab:
- `'{connected.length} collegati'` → `` `${connected.length} ${t('project.social.connected')}` ``
- `'Attivo'` → `t('common.active')`
- `'OAuth'` → `t('common.oauth')`
- `'Manuale'` → `t('common.manuale')`
- `'Integrazioni'` → `t('project.social.integrations')`
- `'Connesso'` → `t('common.connected')`
- `'Non connesso'` → `t('common.notConnected')`
- `'Riconnetti'` → `t('common.reconnect')`
- `'Disconnetti'` → `t('common.disconnect')`
- `'Connetti Google Drive'` → `t('common.connect') + ' ' + platform.name`

Feeds tab e strip:
- `'Feed in caricamento...'` → `t('project.feeds.noFeeds')`
- `'Generazione idee AI...'` → `t('project.feeds.noFeeds')` (o lasciare)
- `'Refresh'` → `t('project.feeds.refresh')`
- `'Rigenera'` → `t('editor.regenerate')`

Right panel:
- `'Queue & Analytics'` → lasciare (è titolo tecnico)
- `'Coda vuota'` → `t('project.queue.empty')`

New Post modal:
- `'Nuovo Post'` → `t('project.content.generate')` (oppure aggiungere chiave `project.content.newPost`)
- `'Annulla'` → `t('common.cancel')`
- `'Crea'` → `t('common.save')` o aggiungere chiave dedicata

**Per il componente `RightPanelContent`** (in fondo al file, funzione separata):
- Aggiungere `const { t } = useTranslation();` all'interno della funzione
- `'Coda vuota'` → `t('project.queue.empty')`

---

### Dopo aver completato le modifiche
1. Verificare che `yarn build` giri senza errori dalla cartella `frontend/`
2. Committare sul branch `claude/deploy-sketchario-server-DPV0g`
3. Fare merge su `main` tramite PR GitHub (repo: `osmelfabre-ph/sketchario`) per triggherare il deploy su Railway
