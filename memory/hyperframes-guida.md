# HyperFrames — Guida Completa

> **Repository:** https://github.com/heygen-com/hyperframes  
> **Licenza:** Apache 2.0 (uso commerciale libero, nessun costo per render)  
> **Stelle GitHub:** 8.6k ⭐ | **Forks:** 686

---

## Cos'è HyperFrames

HyperFrames è un framework open-source per **renderizzare video direttamente da HTML+CSS+GSAP**.  
Il claim ufficiale: _"Write HTML. Render video. Built for agents."_

Non è un editor video visuale come Premiere. È uno strumento da sviluppatore (o agente AI) che converte una pagina HTML animata in un file MP4 deterministico, senza build step, senza React, senza server esterno.

### Differenza chiave con Remotion

| | HyperFrames | Remotion |
|---|---|---|
| **Authoring** | HTML + CSS + GSAP | React/TSX |
| **Build step** | Nessuno | Bundler obbligatorio |
| **Licenza** | Apache 2.0 (gratuito) | A pagamento sopra soglia |
| **AI-native** | Sì, progettato per agenti | No |

---

## Architettura — 7 Pacchetti

| Pacchetto | Ruolo |
|---|---|
| `hyperframes` | CLI principale (init, preview, render) |
| `@hyperframes/core` | Parser HTML/GSAP, tipi, validatore |
| `@hyperframes/engine` | Capture headless via Puppeteer + FFmpeg |
| `@hyperframes/producer` | Pipeline completa: capture → encode → audio mux |
| `@hyperframes/studio` | Editor visuale browser (React + CodeMirror + Zustand) |
| `@hyperframes/player` | Web component `<hyperframes-player>` embeddabile |
| `@hyperframes/shader-transitions` | 50+ transizioni WebGL |

---

## Come funziona

### 1. La composizione è HTML puro

```html
<div id="stage"
     data-composition-id="mio-video"
     data-start="0"
     data-width="1920"
     data-height="1080">

  <!-- Clip video di sfondo -->
  <video id="clip-1"
         data-start="0" data-duration="5"
         data-track-index="0"
         src="intro.mp4" />

  <!-- Immagine sovrapposta -->
  <img id="overlay"
       class="clip"
       data-start="2" data-duration="3"
       src="logo.png" />

  <!-- Audio di sottofondo -->
  <audio id="bg-music"
         data-start="0" data-duration="9"
         src="music.wav" />
</div>
```

Gli attributi `data-start` e `data-duration` in secondi definiscono il timing.  
Le animazioni si scrivono con GSAP (GreenSock) standard.

### 2. La pipeline di rendering

```
HTML + GSAP
    │
    ▼
Puppeteer (Chrome headless)
    │   ← BeginFrame API: ogni frame è deterministico
    ▼
Frame PNG per frame
    │
    ▼
FFmpeg encode → H.264 MP4
    │
    ▼
Audio mux → out.mp4
```

### 3. Lo Studio (editor visuale)

Avviando `npx hyperframes preview` si apre nel browser `http://localhost:3002` con:
- **Code Panel** — editor HTML/CSS/JS con CodeMirror e syntax highlighting
- **Preview Panel** — anteprima real-time con scrubbing della timeline
- **Property Panel** — modifica attributi, timing, animazioni senza toccare il codice
- **File Tree** — navigazione tra file sorgente e asset
- **Timeline** — tracce, clip, keyframe visuali

---

## Installazione

### Prerequisiti

```bash
# 1. Node.js versione 22 o superiore (obbligatorio)
node --version   # deve essere >= 22

# 2. FFmpeg (per encoding)
# macOS:
brew install ffmpeg

# Ubuntu/Debian:
sudo apt install ffmpeg

# Windows: scaricare da https://ffmpeg.org/download.html
# oppure usare WSL
```

### Installazione rapida (senza clonare il repo)

```bash
# Crea un nuovo progetto
npx hyperframes init nome-progetto

# Entra nella cartella
cd nome-progetto

# Lancia lo Studio nel browser
npx hyperframes preview

# Quando sei pronto, renderizza in MP4
npx hyperframes render
```

### Installazione per sviluppo / contribuire

```bash
# Clona il repository
git clone https://github.com/heygen-com/hyperframes
cd hyperframes

# Installa dipendenze (usa Bun, non npm)
bun install

# Avvia l'editor in dev mode
bun run dev

# Build di tutti i pacchetti
bun run build

# Type check
bun run typecheck

# Lint e format
bun run lint && bun run format
```

> **Nota:** il repo usa **Bun** come package manager, non npm o yarn. Installa Bun con:
> ```bash
> curl -fsSL https://bun.sh/install | bash
> ```

### Variabili d'ambiente (opzionali)

```bash
# Solo se vuoi caption automatiche da immagini (costo ~$0.001/immagine)
GEMINI_API_KEY=la_tua_chiave
```

---

## Comandi CLI

```bash
npx hyperframes init nome-progetto        # Crea struttura progetto
npx hyperframes preview [--port 3002]     # Apre lo Studio nel browser
npx hyperframes render [composizione.html] # Genera out.mp4
npx hyperframes lint [--json]             # Valida le composizioni
npx hyperframes compositions              # Lista tutte le composizioni
npx hyperframes benchmark comp.html       # Misura performance rendering
npx hyperframes doctor                    # Controlla dipendenze installate
npx hyperframes transcribe audio.mp3      # Audio → sottotitoli (Whisper)
npx hyperframes tts --text "Ciao"         # Testo → voce MP3
```

---

## Uso con AI Agent (Claude Code / Cursor / Gemini)

HyperFrames è progettato nativamente per agenti AI tramite il sistema **Vercel Skills**:

```bash
# Installa lo skill nel tuo ambiente Claude Code
npx skills add heygen-com/hyperframes
```

Poi usa il comando `/hyperframes` direttamente in chat:

```
/hyperframes Crea un reel 9:16 da 15 secondi con:
- Sfondo gradiente viola-rosa
- Titolo "Il tuo brand" con effetto fade-in
- Sottotitolo che appare dopo 2 secondi
- Musica di sottofondo
```

L'agente genera l'HTML, lancia il preview, itera sulle modifiche e renderizza.

---

## Blocchi dal Catalogo (Registry)

```bash
# Installa transizioni e overlay dal catalogo ufficiale
npx hyperframes add flash-through-white     # Transizione bianca flash
npx hyperframes add instagram-follow        # Overlay "segui su Instagram"
npx hyperframes add data-chart             # Grafico animato da dati

# Catalogo completo: https://hyperframes.heygen.com/catalog
```

---

## Integrazione in Sketchario

### Come potremmo usarlo

1. **Generazione carousel/reel** — Al posto di Google Slides, per ogni contenuto di tipo `carousel` o `reel` possiamo:
   - Generare un HTML di composizione a partire da script + caption + media del contenuto
   - Passarlo a HyperFrames su un microservizio backend (Node.js)
   - Restituire un link MP4 scaricabile o un `<hyperframes-player>` embeddabile

2. **Costo zero per noi** — Tutto on-premise. L'unico costo è il server. Nessun abbonamento a Canva, PostNitro o altri.

3. **Flusso proposto**:
   ```
   ContentDetail → "Genera Video" button
       → POST /hyperframes/render {content_id}
       → backend crea HTML composizione da script/caption/media
       → backend esegue npx hyperframes render
       → ritorna URL del .mp4
       → frontend mostra anteprima + download
   ```

### Limitazioni da considerare

- Richiede un server Node.js ≥22 dedicato (non Python)
- Il rendering di un video da 30s può richiedere 10-60s (CPU-bound)
- Richiede FFmpeg installato sul server
- Rendering distribuito non ancora supportato (single-machine)

---

## Risorse

- **Repo:** https://github.com/heygen-com/hyperframes
- **Catalogo blocchi:** https://hyperframes.heygen.com/catalog
- **Documentazione:** https://hyperframes.heygen.com
- **Discord community:** link nel repo GitHub
