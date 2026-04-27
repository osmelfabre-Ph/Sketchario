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
- Attualmente **frontend e backend deployano direttamente da `main`**
- In passato Railway puntava al branch `claude/deploy-sketchario-server-DPV0g`, ma ora il branch corretto da usare per il deploy è `main`

## Branch / Deploy
- Branch attivo: `main`
- Il branch storico `claude/deploy-sketchario-server-DPV0g` esisteva per il deploy, ma non è più il riferimento principale
- Se una modifica non compare online, controllare prima in Railway che **sia frontend sia backend** puntino davvero a `main`

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

## Aggiornamenti recenti (2026-04-26 / 2026-04-27)

### Editor, preview e contenuti
- Fix preview caption: i tag HTML (`<p>`, `<br>`, ecc.) non devono più comparire come testo visibile nelle preview
- Fix export CSV: la caption viene esportata come plain text pulito
- Migliorata la conversione tra plain text e rich text nell'editor caption per evitare muri di testo
- Rafforzata la struttura delle caption generate: blocchi leggibili, più respiro, meno testo addensato
- Carousel aggiornati: default a massimo 6 slide, formato `SLIDE N:`, testo molto più denso e strutturato
- Rimossa la richiesta rigida di “tono autorevole, chiaro, diretto” dal prompt carousel
- Migliorato l'uso del contesto progetto nelle generazioni AI (`description`, `brief_notes`, `custom_instructions`, ToV, personas, asset come libro/corso/newsletter)

### Dashboard
- Rinomina progetto direttamente dalla card dashboard
- La cover progetto ora persiste dopo refresh perché `GET /projects` restituisce anche `cover_url`
- Aggiunti in dashboard i conteggi per progetto:
  - totale contenuti
  - contenuti programmati
  - contenuti in bozza

### Project View / refactor
- `ProjectView.js` è stato alleggerito estraendo componenti in `frontend/src/components/project-view/`
- Componenti estratti:
  - `ContentCardsView.js`
  - `ContentListView.js`
  - `ContentCalendarView.js`
  - `FeedStrips.js`
  - `RightPanelContent.js`
  - `constants.js`

### Calendario
- Aggiunte viste `Mese`, `Settimana` e `Giorno`
- La vista mese mostra anche i giorni di raccordo del mese precedente/successivo come Google Calendar
- Gli eventi programmati vengono raggruppati per contenuto/data e mostrati nella vista calendario

### Tour / onboarding
- Fix product tour laterale:
  - avvio automatico quando la UI è pronta
  - stato persistente lato server (`product_tour_completed`)
  - non deve più riapparire dopo completamento o chiusura
  - beacon/beam in rosa chiaro invece del default scuro

### Feed RSS / Reddit / suggerimenti
- I feed default non vengono più creati dal frontend con query grezze
- Bootstrap feed spostato nel backend (`/feeds/bootstrap/{project_id}`)
- Aggiunto supporto più strutturato a:
  - Google News tematico
  - Reddit per categoria
  - preset editoriali RSS per settore
- I feed ora vengono:
  - deduplicati
  - filtrati per rilevanza rispetto al progetto
  - ordinati meglio
- La logica deve rimanere **universale**: fotografia, automotive, business, food, fashion, travel, ecc.

### Publishing queue / social publishing
- Aggiunto pulsante `Svuota queue` nel pannello destro del progetto
- La queue ora viene mostrata ordinata dalla più recente alla più vecchia
- Endpoint backend per svuotare tutta la queue di un progetto:
  - `DELETE /publish/queue/project/{project_id}`
- Quando si svuota la queue, i contenuti `scheduled` tornano in `draft` se non risultano pubblicati

### Instagram publishing
- Fix token di pubblicazione: il backend risolve il corretto page token associato all'account Instagram Business
- Aggiunto retry robusto per `media_publish` quando Meta risponde `Media ID is not available`
- La publish immediata non blocca più l'editor: passa dalla queue in background
- Stato attuale: **Instagram pubblica correttamente**

### Pinterest publishing
- Migliorata la diagnostica degli errori di pubblicazione Pinterest
- Stato attuale: OAuth e lettura board/account funzionano, ma la scrittura pin è bloccata
- Dallo stato della Pinterest Developer App risulta:
  - `Trial access active`
  - richiesta `Standard` in attesa
- Ipotesi principale: l'app non ha ancora una vera autorizzazione `pins:write` operativa

### Commit principali di questo ciclo
- `884b912` Fix rich text captions in previews and CSV export
- `aef716f` Improve generation depth and split project view
- `68927b0` Fix rich text captions in social previews
- `9e1d479` Add project renaming in dashboard
- `4305249` Default carousels to titled slide structure
- `7b1d1c6` Align carousel generation with 6-slide prompt
- `5ba967b` Remove fixed tone from carousel prompt
- `41eac04` Preserve caption structure in editor and exports
- `d1625ae` Add month week day calendar views
- `a31cd92` Return project cover URLs in dashboard list
- `5d5c7b9` Fix product tour auto-start and persistence
- `6737110` Improve dashboard project stats and feed relevance
- `bf18a3c` Generalize feed presets across sectors
- `3977f18` Fix Instagram publish token handling
- `b880948` Wait for Instagram media containers before publish
- `00afc27` Improve Pinterest publish error diagnostics
- `1dcc960` Retry Instagram media publish while container finalizes
- `dcce837` Move immediate publishing to background queue
- `39b1342` Add clear queue action in project panel

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
1. Verificare che `yarn build` giri senza errori dalla cartella `frontend/` quando disponibile
2. Committare su `main`
3. Verificare che Railway frontend e backend stiano leggendo davvero `main`
