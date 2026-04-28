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

## Aggiornamenti recenti (2026-04-26 / 2026-04-28)

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
- La logica di `Svuota queue` e stata corretta:
  - ora rimuove solo item terminali (`published` / `failed`)
  - non deve piu cancellare i job `queued` / `processing`
  - non deve piu riportare in `draft` i contenuti ancora programmati
  - il calendario deve continuare a mostrare i programmati attivi
- Dopo publish/schedule la UI ora sincronizza meglio lo stato del contenuto con la queue/backend
- Gli hashtag vengono inclusi davvero nel testo pubblicato sui social, non solo salvati nell'editor
- Aggiunto pulsante manuale `Pubblicato` nella card/editor contenuto:
  - annulla eventuali item ancora in queue per quella card
  - forza lo stato del contenuto a `published`
  - serve come fallback se il post è online ma la UI non si è ancora allineata
- Migliorato il comportamento di riapertura di un contenuto gia pubblicato:
  - i social gia pubblicati restano visibili e grigi
  - non devono essere ripubblicabili per evitare doppioni
  - gli altri social restano attivabili per repost o nuova schedulazione
- Recupero automatico dei job rimasti bloccati in `processing` da oltre 10 minuti
- Se un job fallisce e non restano altri item attivi:
  - `published` se almeno un social ha pubblicato
  - `draft` se nessun social ha pubblicato davvero

### Instagram publishing
- Fix token di pubblicazione: il backend risolve il corretto page token associato all'account Instagram Business
- Aggiunto retry robusto per `media_publish` quando Meta risponde `Media ID is not available`
- La publish immediata non blocca più l'editor: passa dalla queue in background
- Aggiunto filtraggio media compatibili per Instagram
- Aggiunta normalizzazione immagine IG-safe prima della publish:
  - riapertura file con Pillow
  - correzione orientamento EXIF
  - conversione in JPEG standard
  - padding bianco per rientrare nel rapporto supportato da Instagram
  - resize prudente del lato massimo
- I media social ora vengono costruiti con `_backend_url()` invece di `APP_URL`
- Per il create container Instagram viene passato esplicitamente `media_type=IMAGE` sui post immagine
- Stato attuale: **Instagram e ancora in diagnosi** sul caso `IG container error: Only photo or video can be accepted as media type`
- Log utili osservati:
  - i file `igsafe_*.jpg` rispondono `200`
  - `content-type: image/jpeg`
  - il problema sembra piu legato a come Meta interpreta il container che non al semplice nome file `.jpg`

### Pinterest publishing
- Migliorata la diagnostica degli errori di pubblicazione Pinterest
- Stato attuale: OAuth e lettura board/account funzionano, ma la scrittura pin è bloccata
- Dallo stato della Pinterest Developer App risulta:
  - `Trial access active`
  - richiesta `Standard` in attesa
- Ipotesi principale: l'app non ha ancora una vera autorizzazione `pins:write` operativa

### Navigazione / refresh pagina
- La view corrente viene persistita per utente in `localStorage`
- Se l'utente fa refresh mentre si trova in `project`, `calendar`, `personas`, `social`, `analytics` o `feeds`, l'app prova a riaprire quella stessa view con lo stesso progetto selezionato
- Fallback sicuro: se il progetto non è più disponibile, l'app torna alla dashboard

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
- `306e086` Fix publish status sync and include hashtags
- `3eff591` Add manual published action for content cards
- `2624829` Persist current view across page refresh

---

## Sistema i18n (IT/EN/ES/FR) — ESTESO

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
- `Wizard.js` — parziale ma gia molto piu coperto
- `ContentDetail.js` — copertura i18n estesa
- `ProjectView.js` — copertura i18n estesa
- componenti estratti della project view (`ContentCardsView`, `ContentListView`, `ContentCalendarView`, `FeedStrips`, `RightPanelContent`) — copertura i18n estesa

### Nota pratica
- Se aggiungi nuove stringhe in editor/project view, aggiorna sempre:
  - `frontend/src/i18n/locales/it.json`
  - `frontend/src/i18n/locales/en.json`
  - `frontend/src/i18n/locales/es.json`
  - `frontend/src/i18n/locales/fr.json`
- Controlli minimi consigliati:
  1. `python3 -m json.tool` sui file locale
  2. `git diff --check`
  3. `npx yarn build` in `frontend/`

### Workflow consigliato
1. Aggiornare le chiavi locale in tutte e quattro le lingue
2. Verificare `python3 -m json.tool` sui JSON toccati
3. Verificare `git diff --check`
4. Eseguire `npx yarn build` da `frontend/` quando il runtime e disponibile
5. Committare su `main`
6. Verificare che Railway frontend e backend stiano leggendo davvero `main`
