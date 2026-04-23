import React, { useState, useMemo } from 'react';
import {
  X, MagnifyingGlass, ArrowLeft, CaretRight,
  House, Sparkle, Article, PencilSimple, PaperPlaneTilt,
  ShareNetwork, Users, Question, CheckCircle, Warning, Lightbulb,
  CalendarBlank, Images, FileText, MagicWand, Queue, CreditCard,
  ChartBar, BookOpen, Clock, Palette, InstagramLogo, FacebookLogo,
  LinkedinLogo, TiktokLogo, PinterestLogo
} from '@phosphor-icons/react';

// ─── CATEGORIE ───────────────────────────────────────────────
const CATEGORIES = [
  { id: 'start',        Icon: House,          color: '#6366f1', title: 'Primi Passi',         desc: 'Panoramica e setup iniziale' },
  { id: 'wizard',       Icon: Sparkle,        color: '#a855f7', title: 'Creare un Progetto',  desc: 'Il Wizard guidato passo per passo' },
  { id: 'content',      Icon: Article,        color: '#3b82f6', title: 'Gestione Contenuti',  desc: 'Lista, calendario e stati' },
  { id: 'editor',       Icon: PencilSimple,   color: '#ec4899', title: 'Editor dei Post',     desc: 'Scrivere, media e ottimizzazione' },
  { id: 'publish',      Icon: PaperPlaneTilt, color: '#22c55e', title: 'Pubblicazione',       desc: 'Social, scheduling e coda' },
  { id: 'integrations', Icon: ShareNetwork,   color: '#f97316', title: 'Integrazioni',        desc: 'Drive, Canva, Feed RSS' },
  { id: 'account',      Icon: Users,          color: '#06b6d4', title: 'Account e Team',      desc: 'Profilo, piani e collaboratori' },
];

// ─── ARTICOLI ────────────────────────────────────────────────
export const ARTICLES = [

  // ══════════════ PRIMI PASSI ══════════════
  {
    id: 'what-is-sketchario', categoryId: 'start',
    title: "Cos'è Sketchario?",
    desc: 'Panoramica della piattaforma e del flusso di lavoro principale.',
    content: [
      { type: 'para', text: 'Sketchario è una piattaforma di content strategy alimentata dall\'AI. Ti permette di pianificare, generare e pubblicare contenuti social in modo guidato, dalla definizione del target fino alla pubblicazione automatica su più piattaforme.' },
      { type: 'h3', text: 'Il flusso di lavoro in 4 step' },
      { type: 'steps', items: [
        { title: 'Crea un Progetto', desc: 'Il Wizard guidato ti aiuta a definire brief, target, tone of voice e genera automaticamente i contenuti.' },
        { title: 'Gestisci i Contenuti', desc: 'Visualizza, modifica e organizza i post nella vista lista o nel calendario editoriale.' },
        { title: 'Modifica nell\'Editor', desc: 'Ogni post ha un editor completo con caption rich-text, media, script e anteprima social.' },
        { title: 'Pubblica', desc: 'Collega i tuoi account social e programma o pubblica immediatamente i contenuti.' },
      ]},
      { type: 'h3', text: 'Cosa puoi fare con Sketchario' },
      { type: 'grid', cols: 2, items: [
        { title: '🤖 AI Content Generation', desc: 'Genera personas, hook, script, caption e hashtag in automatico con l\'AI.' },
        { title: '📅 Calendario Editoriale', desc: 'Visualizza e gestisci tutti i post del progetto su un calendario mensile interattivo.' },
        { title: '📱 Multi-platform Publishing', desc: 'Pubblica su Instagram, Facebook, LinkedIn, TikTok e Pinterest da un\'unica interfaccia.' },
        { title: '👥 Team Collaboration', desc: 'Invita collaboratori con ruolo Editor o Viewer per lavorare insieme sui progetti.' },
      ]},
      { type: 'tip', text: 'Per iniziare subito: clicca su "Nuovo Progetto" nella sidebar e segui il Wizard.' },
    ],
  },

  {
    id: 'interface-overview', categoryId: 'start',
    title: "L'interfaccia di Sketchario",
    desc: 'Sidebar, Dashboard, Project View e i pannelli principali.',
    content: [
      { type: 'h3', text: 'La Sidebar' },
      { type: 'para', text: 'La barra di navigazione laterale è sempre visibile. Su desktop può essere collassata a icone cliccando la freccia in alto a destra. Contiene: Dashboard, Nuovo Progetto, Calendario, Personas, Social, Analytics, Notifiche, Guida, Lingua, Profilo, Logout.' },
      { type: 'h3', text: 'Dashboard' },
      { type: 'para', text: 'La home principale mostra le card di tutti i tuoi progetti con: stato (Attivo / Draft / Completato), numero di contenuti generati, immagine di copertina personalizzabile e azioni rapide (Apri, Riprendi Wizard, Archivia, Elimina).' },
      { type: 'h3', text: 'Project View' },
      { type: 'para', text: 'Cliccando su un progetto si apre la Project View con 4 tab: Lista contenuti, Calendario, Personas e Social. A destra c\'è il pannello Queue & Analytics, che mostra la coda di pubblicazione e i KPI del progetto.' },
      { type: 'h3', text: 'Editor del Post' },
      { type: 'para', text: 'Cliccando su qualsiasi contenuto si apre l\'editor a schermo intero con tre colonne: Editor (sinistra), Anteprima social (centro), Pannello pubblicazione (destra).' },
      { type: 'note', text: 'Su mobile la navigazione si sposta in una barra fissa in basso con le voci principali.' },
    ],
  },

  {
    id: 'login-register', categoryId: 'start',
    title: 'Registrazione e Login',
    desc: 'Come creare un account e accedere a Sketchario.',
    content: [
      { type: 'h3', text: 'Creare un account' },
      { type: 'steps', items: [
        { title: 'Vai alla pagina di accesso', desc: 'Apri Sketchario nel browser. Se non sei autenticato, vedrai la schermata di login.' },
        { title: 'Clicca su "Registrati"', desc: 'Seleziona il tab Registrati in alto.' },
        { title: 'Compila i campi', desc: 'Inserisci nome, email e una password di almeno 8 caratteri.' },
        { title: 'Accedi', desc: 'Dopo la registrazione, il sistema ti autentica automaticamente.' },
      ]},
      { type: 'h3', text: 'Password dimenticata' },
      { type: 'para', text: 'Nella schermata di login, clicca su "Password dimenticata?". Inserisci la tua email e riceverai un link per reimpostarla. Il link contiene un token valido per un uso singolo.' },
      { type: 'warn', text: 'Usa una password sicura di almeno 8 caratteri. Non condividere mai le tue credenziali.' },
    ],
  },

  // ══════════════ WIZARD ══════════════
  {
    id: 'wizard-overview', categoryId: 'wizard',
    title: 'Creare un nuovo progetto',
    desc: 'Il Wizard guida in 5 step dalla strategia alla generazione dei contenuti.',
    content: [
      { type: 'para', text: 'Ogni progetto in Sketchario nasce attraverso il Wizard, un processo guidato in 5 step. Puoi salvare e riprendere il Wizard in qualsiasi momento: il progetto viene salvato come "Draft" fino al completamento.' },
      { type: 'h3', text: 'I 5 step del Wizard' },
      { type: 'steps', items: [
        { title: 'Brief', desc: 'Definisci nome, settore, obiettivi di marketing, formati, durata e area geografica della campagna.' },
        { title: 'Personas', desc: 'L\'AI genera le buyer personas del tuo target. Puoi modificarle e personalizzarle.' },
        { title: 'Tone of Voice', desc: 'Scegli lo stile comunicativo: preset + slider per personalizzarlo e lunghezza caption.' },
        { title: 'Hook Library', desc: 'L\'AI genera una libreria di hook e angolazioni per i tuoi contenuti. Approva quelli che vuoi usare.' },
        { title: 'Generazione', desc: 'Il sistema genera automaticamente tutti i contenuti (script, caption, hashtag, regia visiva).' },
      ]},
      { type: 'tip', text: 'Puoi riprendere un Wizard interrotto dalla Dashboard: cerca il progetto con il badge "Draft" e clicca "Riprendi Wizard".' },
    ],
  },

  {
    id: 'wizard-brief', categoryId: 'wizard',
    title: 'Step 1 — Brief del Progetto',
    desc: 'Come compilare il brief per ottenere contenuti AI ottimali.',
    content: [
      { type: 'h3', text: 'Campi del Brief' },
      { type: 'bullets', items: [
        'Nome Progetto — il titolo della campagna (es. "Lancio Corso Online Maggio").',
        'Settore — il settore di riferimento (es. Fotografia, Coaching, E-commerce). Influenza le notizie nei Feed.',
        'Descrizione — descrivi il prodotto/servizio che vuoi comunicare. Più dettagli fornisci, migliori saranno i contenuti generati.',
        'Obiettivi Marketing — triplice slider tra Awareness (visibilità), Education (informare) e Monetizing (vendere). La somma deve essere 100%.',
        'Formati — scegli uno o entrambi tra Reel e Carousel.',
        'Durata campagna — numero di settimane. Determina quanti contenuti vengono generati.',
        'Geo Target — la località/mercato di riferimento (es. Italia, Milano, UK).',
        'Note Brief — qualsiasi informazione aggiuntiva utile all\'AI.',
      ]},
      { type: 'h3', text: 'Istruzioni personalizzate AI (file upload)' },
      { type: 'para', text: 'Puoi caricare un file di testo (.txt, .md, .html, .docx, .pdf) con istruzioni personalizzate da dare all\'AI prima di tutta la generazione. Queste istruzioni vengono applicate a personas, tone of voice, hook e contenuti. Utile per fornire linee guida del brand, tono specifico, parole da evitare, esempi di post precedenti.' },
      { type: 'note', text: 'Il file viene processato sul server e il testo estratto (max 12.000 caratteri) viene usato come contesto AI per l\'intero progetto.' },
    ],
  },

  {
    id: 'wizard-personas', categoryId: 'wizard',
    title: 'Step 2 — Personas AI',
    desc: 'Come generare e modificare le buyer personas del tuo target.',
    content: [
      { type: 'para', text: 'Le Personas sono rappresentazioni semi-fittizie del tuo cliente ideale. Sketchario le genera automaticamente basandosi sul brief e le usa per calibrare tutto il tono e il contenuto dei post.' },
      { type: 'h3', text: 'Cosa include ogni Persona' },
      { type: 'bullets', items: [
        'Nome e ruolo professionale',
        'Fascia d\'età e contesto di vita',
        'Obiettivi principali (goals)',
        'Problemi e frustrazioni (pain points)',
        'Come il prodotto/servizio può aiutarla',
      ]},
      { type: 'h3', text: 'Modificare le Personas' },
      { type: 'para', text: 'Puoi modificare manualmente il testo di ogni persona direttamente nel Wizard. Dopo la generazione del progetto, le Personas rimangono visibili nel tab "Personas" della Project View.' },
      { type: 'tip', text: 'Personas ben definite migliorano sensibilmente la qualità dei contenuti generati dall\'AI. Prenditi il tempo di rivedere e correggere quelle generate.' },
    ],
  },

  {
    id: 'wizard-tov', categoryId: 'wizard',
    title: 'Step 3 — Tone of Voice',
    desc: 'Definire lo stile comunicativo del brand e salvare template riutilizzabili.',
    content: [
      { type: 'h3', text: 'Preset disponibili' },
      { type: 'grid', cols: 2, items: [
        { title: 'Professionale', desc: 'Tono formale, autorevole, adatto a B2B e consulenze.' },
        { title: 'Amichevole', desc: 'Caldo, vicino, informale. Ideale per brand lifestyle.' },
        { title: 'Ispirazionale', desc: 'Motivante e visionario. Adatto a coaching e personal brand.' },
        { title: 'Provocatorio', desc: 'Diretto, controcorrente. Per brand che vogliono distinguersi.' },
        { title: 'Educativo', desc: 'Informativo e strutturato. Perfetto per corsi e contenuti how-to.' },
      ]},
      { type: 'h3', text: 'Slider personalizzati' },
      { type: 'para', text: 'Puoi affinare il preset con 5 slider su scala 0-10: Formalità, Energia, Empatia, Umorismo, Storytelling. I preset caricano valori predefiniti ma puoi modificarli liberamente.' },
      { type: 'h3', text: 'Lunghezza Caption' },
      { type: 'para', text: 'Scegli tra Short (caption brevi, punchline dirette), Medium (equilibrio tra concisione e dettaglio) e Long (caption narrative e dettagliate).' },
      { type: 'h3', text: 'Template ToV' },
      { type: 'para', text: 'Puoi salvare la configurazione corrente come template con un nome personalizzato. I template sono disponibili nel tab Personas della Project View e possono essere applicati a qualsiasi progetto.' },
    ],
  },

  {
    id: 'wizard-hooks', categoryId: 'wizard',
    title: 'Step 4-5 — Hook Library e Generazione',
    desc: 'Generare la libreria di hook e avviare la creazione dei contenuti.',
    content: [
      { type: 'h3', text: "Cos'è un Hook?" },
      { type: 'para', text: 'Un hook è l\'angolazione creativa di un post — la prima cosa che cattura l\'attenzione nei primi secondi. L\'AI genera una lista di hook basati su brief, personas e tono. Ogni hook diventerà la base di uno o più contenuti.' },
      { type: 'h3', text: 'Approvare gli Hook' },
      { type: 'para', text: 'Nella libreria puoi rivedere ogni hook proposto, modificarne il testo e approvare solo quelli che vuoi trasformare in contenuti. Gli hook non approvati vengono ignorati nella generazione.' },
      { type: 'h3', text: 'Generazione Contenuti' },
      { type: 'para', text: 'L\'ultimo step genera automaticamente tutti i contenuti approvati. Per ogni hook vengono creati: Opening Hook, Script Avatar (per il Reel), Regia Visiva, Caption, Hashtag. Una barra di progresso mostra l\'avanzamento.' },
      { type: 'tip', text: 'La generazione può richiedere 1-3 minuti a seconda del numero di contenuti. Non chiudere la pagina durante il processo.' },
    ],
  },

  // ══════════════ GESTIONE CONTENUTI ══════════════
  {
    id: 'content-list', categoryId: 'content',
    title: 'Vista Lista e Vista Cards',
    desc: 'Come visualizzare, filtrare e organizzare i contenuti del progetto.',
    content: [
      { type: 'para', text: 'Nella Project View puoi alternare tra due modalità di visualizzazione usando i pulsanti in alto a destra: Cards (griglia) e Lista compatta.' },
      { type: 'h3', text: 'Vista Cards (griglia)' },
      { type: 'para', text: 'Ogni card mostra: anteprima del media, formato del contenuto (badge colorato), stato, testo dell\'hook e data di pubblicazione. I post pubblicati hanno un bordo verde.' },
      { type: 'h3', text: 'Vista Lista compatta' },
      { type: 'para', text: 'I contenuti sono raggruppati per stato: Pubblicati (verde), Programmati (arancione), Bozze (grigio/viola). Ogni riga mostra hook, formato e data.' },
      { type: 'h3', text: 'Badge formato' },
      { type: 'grid', cols: 3, items: [
        { title: '🎬 Reel', desc: 'Contenuto video verticale. Badge rosa.' },
        { title: '🖼️ Carousel', desc: 'Post multi-immagine. Badge blu.' },
        { title: '🤖 Prompted Reel', desc: 'Reel generato con prompt AI specifico. Badge viola.' },
      ]},
      { type: 'h3', text: 'Azioni sui contenuti' },
      { type: 'bullets', items: [
        'Clicca su un contenuto per aprire l\'editor completo.',
        'Hover su una card per mostrare il pulsante Elimina (rosso).',
        'Il flag arancione segna il contenuto come urgente.',
        'Il numero "G1", "G2"... indica il giorno offset della campagna.',
      ]},
    ],
  },

  {
    id: 'content-calendar', categoryId: 'content',
    title: 'Calendario Editoriale',
    desc: 'Navigare e usare il calendario mensile dei contenuti programmati.',
    content: [
      { type: 'para', text: 'Il tab Calendario mostra una griglia mensile con i contenuti programmati posizionati sui giorni corrispondenti. Usa le frecce ← → per navigare tra i mesi.' },
      { type: 'h3', text: 'Content Chip nel calendario' },
      { type: 'para', text: 'Ogni contenuto schedulato appare come un "chip" colorato nel giorno di pubblicazione. Il colore indica il formato: rosa per i Reel, blu per i Carousel. I contenuti già pubblicati appaiono in verde con un\'icona di spunta.' },
      { type: 'h3', text: 'Giorno corrente' },
      { type: 'para', text: 'Il giorno odierno è evidenziato con un bordo colorato nel calendario per facilitare l\'orientamento.' },
      { type: 'tip', text: 'Per programmare un contenuto su una data specifica, aprilo dall\'editor e usa il selettore data nel pannello di destra.' },
      { type: 'note', text: 'Il calendario mostra i mesi in ordine corretto con allineamento reale dei giorni della settimana (Lunedì = prima colonna).' },
    ],
  },

  {
    id: 'content-statuses', categoryId: 'content',
    title: 'Stati dei Contenuti',
    desc: 'Bozza, Programmato, Pubblicato, Fallito — cosa significano e come cambiano.',
    content: [
      { type: 'h3', text: 'I 4 stati possibili' },
      { type: 'grid', cols: 2, items: [
        { title: '✏️ Bozza (Draft)', desc: 'Contenuto generato ma non ancora programmato né pubblicato. Puoi modificarlo liberamente.' },
        { title: '🕐 Programmato', desc: 'Il contenuto ha una data/ora di pubblicazione futura. La coda lo pubblicherà automaticamente.' },
        { title: '✅ Pubblicato', desc: 'Il contenuto è stato inviato con successo a tutti i social selezionati. Il bordo diventa verde.' },
        { title: '❌ Fallito', desc: 'La pubblicazione ha incontrato un errore. Il motivo è visibile nel pannello Queue & Analytics.' },
      ]},
      { type: 'h3', text: 'Transizioni di stato' },
      { type: 'steps', items: [
        { title: 'Bozza → Programmato', desc: 'Seleziona data/ora nell\'editor e clicca "Programma". L\'editor si chiude automaticamente.' },
        { title: 'Programmato → Pubblicato', desc: 'Il sistema controlla la coda ogni 60 secondi. Quando arriva l\'orario, pubblica automaticamente.' },
        { title: 'Programmato → Bozza', desc: 'Clicca "Annulla prog." nell\'editor per riportarlo in bozza.' },
        { title: 'Fallito → Ripubblica', desc: 'Riapri l\'editor, verifica i social selezionati e ripubblica manualmente.' },
      ]},
    ],
  },

  // ══════════════ EDITOR ══════════════
  {
    id: 'editor-overview', categoryId: 'editor',
    title: "L'Editor dei Post",
    desc: 'I tre pannelli dell\'editor e come navigarli.',
    content: [
      { type: 'para', text: 'L\'editor si apre cliccando su qualsiasi contenuto nella Project View. Occupa l\'intera schermata con tre colonne principali.' },
      { type: 'h3', text: 'Le tre colonne' },
      { type: 'grid', cols: 3, items: [
        { title: '✏️ Editor (sinistra)', desc: 'Tutti i campi modificabili: hook, formato, caption, media, script, regia, hashtag.' },
        { title: '👁 Anteprima (centro)', desc: 'Mockup visivo del post come apparirebbe su Instagram/TikTok. Si aggiorna in tempo reale.' },
        { title: '📤 Pubblicazione (destra)', desc: 'Selezione social, calendario di scheduling, pulsanti di azione.' },
      ]},
      { type: 'h3', text: 'Barra di stato (in basso)' },
      { type: 'para', text: 'In fondo all\'editor trovi: lo stato del contenuto a sinistra (Bozza / Programmato data+ora / Pubblicato), il pulsante Salva, e a destra i pulsanti di azione principali (Pubblica, Programma, Annulla prog.).' },
      { type: 'h3', text: 'Chiudere l\'editor' },
      { type: 'para', text: 'Clicca la X in alto a destra o usa il pulsante "← Torna al Progetto" per tornare alla Project View. Le modifiche vengono salvate automaticamente ogni volta che cambi campo.' },
      { type: 'tip', text: 'Dopo aver programmato un post, l\'editor si chiude automaticamente e torna alla Project View.' },
    ],
  },

  {
    id: 'editor-caption', categoryId: 'editor',
    title: 'Caption con Editor Rich Text',
    desc: 'Usare grassetto, corsivo, sottolineato ed elenchi nella caption.',
    content: [
      { type: 'para', text: 'La sezione Caption nell\'editor supporta la formattazione rich text grazie all\'editor TipTap integrato.' },
      { type: 'h3', text: 'Toolbar di formattazione' },
      { type: 'grid', cols: 2, items: [
        { title: 'B — Grassetto', desc: 'Seleziona il testo e clicca B per renderlo in grassetto.' },
        { title: 'I — Corsivo', desc: 'Clicca I per il corsivo. Utile per enfatizzare parole chiave.' },
        { title: 'U — Sottolineato', desc: 'Clicca U per aggiungere la sottolineatura.' },
        { title: '• Elenco', desc: 'Clicca l\'icona elenco per creare una lista puntata.' },
      ]},
      { type: 'h3', text: 'Come viene usata la caption' },
      { type: 'para', text: 'La caption formattata viene inviata ai social come testo normale: i tag HTML vengono rimossi automaticamente e i ritorni a capo preservati. Elenchi puntati diventano il carattere "•". Le piattaforme social non supportano HTML nativo nelle caption.' },
      { type: 'warn', text: 'Alcune piattaforme (es. LinkedIn) supportano il grassetto nei post tramite caratteri Unicode, non HTML. La formattazione nell\'editor è visiva e serve come guida durante la scrittura.' },
    ],
  },

  {
    id: 'editor-media', categoryId: 'editor',
    title: 'Media, Immagini e Generazione AI',
    desc: 'Caricare file, generare immagini AI, importare da Drive o Canva.',
    content: [
      { type: 'h3', text: 'Upload diretto' },
      { type: 'para', text: 'Nella sezione Media dell\'editor, clicca l\'area di upload o trascina un file per caricare immagini o video. Il limite è 400 MB. I formati supportati includono jpg, png, mp4, mov.' },
      { type: 'h3', text: 'Generazione immagine con FLUX AI' },
      { type: 'para', text: 'Clicca l\'icona FLUX AI (bacchetta magica) per aprire il generatore di immagini. Inserisci un prompt in italiano o inglese e clicca Genera. L\'immagine viene aggiunta al media del post.' },
      { type: 'h3', text: 'Importa da Google Drive' },
      { type: 'para', text: 'Clicca l\'icona Google Drive per aprire il file picker. Seleziona un file dal tuo Drive e verrà scaricato e aggiunto al post. Richiede che Google Drive sia collegato nel tab Social.' },
      { type: 'h3', text: 'Importa da Canva' },
      { type: 'para', text: 'Clicca l\'icona Canva per aprire il design nel browser. Lavora su Canva e poi torna a Sketchario: il pulsante "Torna a Sketchario" importerà automaticamente le immagini esportate.' },
      { type: 'h3', text: 'Libreria Media del Progetto' },
      { type: 'para', text: 'L\'icona Libreria (foto-stack) apre tutti i media caricati in qualsiasi post del progetto. Puoi selezionare un media già esistente e aggiungerlo al post corrente.' },
      { type: 'note', text: 'Per i Carousel multi-immagine, carica più file. Tutti verranno pubblicati come singole slide su Instagram, Facebook e LinkedIn.' },
    ],
  },

  {
    id: 'editor-script', categoryId: 'editor',
    title: 'Script e Regia Visiva',
    desc: 'Opening Hook, Script Avatar e Regia Visiva per i Reel.',
    content: [
      { type: 'h3', text: 'Opening Hook (primi 3-5 secondi)' },
      { type: 'para', text: 'È la prima frase o azione che appare nel Reel. Determinante per catturare l\'attenzione prima che lo spettatore scrolli. Puoi modificarla o rigenerarla con l\'AI.' },
      { type: 'h3', text: 'Script Avatar' },
      { type: 'para', text: 'Lo script completo da leggere di fronte alla camera o da far leggere a un avatar AI. Include il testo parola per parola, suddiviso in sezioni. Clicca "Copia Script Avatar" per copiarlo negli appunti.' },
      { type: 'h3', text: 'Regia Visiva' },
      { type: 'para', text: 'Indicazioni sulla produzione video: inquadrature, transizioni, effetti, testo a schermo, musica consigliata. Utile come guida durante le riprese o per briefare un editor video.' },
      { type: 'tip', text: 'Puoi rigenerare singolarmente ogni sezione (Hook, Script, Regia) con l\'icona "Rigenera" senza perdere le altre.' },
    ],
  },

  // ══════════════ PUBBLICAZIONE ══════════════
  {
    id: 'publish-connect', categoryId: 'publish',
    title: 'Connettere i Social Media',
    desc: 'Come collegare Instagram, Facebook, LinkedIn, TikTok, Pinterest e Google Drive.',
    content: [
      { type: 'para', text: 'Per pubblicare, devi prima collegare i tuoi account social nel tab Social della Project View. Ogni piattaforma usa il proprio flusso OAuth.' },
      { type: 'h3', text: 'Piattaforme supportate' },
      { type: 'grid', cols: 2, items: [
        { title: 'Instagram', desc: 'OAuth tramite Facebook Login. Richiede un account Instagram Business o Creator collegato a una Pagina Facebook.' },
        { title: 'Facebook', desc: 'OAuth tramite Facebook Login. Pubblica su Pagine di cui sei amministratore.' },
        { title: 'LinkedIn', desc: 'OAuth tramite LinkedIn. Pubblica sul profilo personale o su Company Page.' },
        { title: 'TikTok', desc: 'OAuth tramite TikTok for Developers. Pubblica video direttamente.' },
        { title: 'Pinterest', desc: 'OAuth tramite Pinterest API. Pubblica Pin su board selezionate.' },
        { title: 'Google Drive', desc: 'OAuth tramite Google. Consente di importare media dal tuo Drive nell\'editor.' },
      ]},
      { type: 'h3', text: 'Come connettersi' },
      { type: 'steps', items: [
        { title: 'Apri il tab Social', desc: 'Nella Project View, clicca il tab "Social".' },
        { title: 'Clicca "Connetti"', desc: 'Premi il pulsante accanto alla piattaforma desiderata.' },
        { title: 'Autorizza Sketchario', desc: 'Si apre un popup OAuth. Accedi con il tuo account e concedi le autorizzazioni.' },
        { title: 'Verifica la connessione', desc: 'L\'icona diventa verde con il badge "Connesso".' },
      ]},
      { type: 'warn', text: 'I token di Instagram e Facebook durano 60 giorni. Se la pubblicazione fallisce con errore di autenticazione, disconnetti e riconnetti l\'account per rinnovare il token.' },
    ],
  },

  {
    id: 'publish-schedule', categoryId: 'publish',
    title: 'Programmare un Post',
    desc: 'Come impostare data, ora e social per la pubblicazione automatica.',
    content: [
      { type: 'steps', items: [
        { title: 'Apri l\'editor del contenuto', desc: 'Clicca sul post dalla Project View.' },
        { title: 'Seleziona i social', desc: 'Nel pannello destro, spunta le piattaforme su cui vuoi pubblicare. Puoi selezionarne più di una.' },
        { title: 'Clicca "Programma"', desc: 'Il popup di schedulazione si apre con il mini-calendario.' },
        { title: 'Scegli giorno e ora', desc: 'Clicca il giorno nel calendario, poi inserisci l\'orario nel campo ore:minuti.' },
        { title: 'Conferma', desc: 'Clicca "Conferma". L\'editor si chiude e il post passa allo stato Programmato.' },
      ]},
      { type: 'h3', text: 'Orario e fuso orario' },
      { type: 'para', text: 'L\'ora che inserisci è sempre interpretata come ora locale del tuo browser. Il sistema la converte automaticamente in UTC per la coda. Quello che vedi nella barra di stato è l\'ora locale.' },
      { type: 'h3', text: 'Modificare o annullare la programmazione' },
      { type: 'para', text: 'Riapri l\'editor: nella barra in basso trovi i pulsanti "Modifica" (per cambiare data/ora) e "Annulla prog." (per riportare il post in bozza).' },
      { type: 'tip', text: 'Se non hai ancora selezionato nessun social, il pulsante Programma rimane disabilitato. Seleziona almeno una piattaforma prima.' },
    ],
  },

  {
    id: 'publish-queue', categoryId: 'publish',
    title: 'Coda di Pubblicazione',
    desc: 'Come funziona la pubblicazione automatica e come monitorare lo stato.',
    content: [
      { type: 'para', text: 'La coda di pubblicazione è gestita dal backend di Sketchario. Ogni 60 secondi il sistema controlla se ci sono post schedulati in scadenza e li invia alle rispettive piattaforme social.' },
      { type: 'h3', text: 'Il pannello Queue & Analytics' },
      { type: 'para', text: 'Nel pannello a destra della Project View, la sezione Queue mostra gli ultimi elementi della coda con il loro stato:' },
      { type: 'grid', cols: 2, items: [
        { title: '🔵 In coda', desc: 'Il post è schedulato e in attesa della pubblicazione.' },
        { title: '✅ Pubblicato', desc: 'Il post è stato inviato con successo. Icona verde.' },
        { title: '❌ Fallito', desc: 'Errore durante la pubblicazione. Il messaggio di errore è visibile sotto.' },
        { title: '🔴 Annullato', desc: 'La programmazione è stata annullata manualmente.' },
      ]},
      { type: 'h3', text: 'Cosa fare in caso di errore' },
      { type: 'bullets', items: [
        'Leggi il messaggio di errore nel pannello Queue.',
        'Se l\'errore è "token scaduto" o "autenticazione fallita": vai nel tab Social, disconnetti e riconnetti l\'account.',
        'Se l\'errore è "account non trovato" o "permessi insufficienti": verifica che il tuo account Instagram/Facebook sia di tipo Business.',
        'Riapri l\'editor del post e ripubblica manualmente con "Pubblica".',
      ]},
      { type: 'note', text: 'I contenuti pubblicati cambiano colore in verde nel calendario, nelle card e nella lista per rendere immediatamente visibile lo stato.' },
    ],
  },

  // ══════════════ INTEGRAZIONI ══════════════
  {
    id: 'integration-drive', categoryId: 'integrations',
    title: 'Google Drive',
    desc: 'Importare immagini e documenti direttamente dal proprio Google Drive.',
    content: [
      { type: 'h3', text: 'Connettere Google Drive' },
      { type: 'para', text: 'Nel tab Social della Project View, trovi Google Drive nella sezione Integrazioni. Clicca "Connetti Google Drive" e autorizza Sketchario con permesso di sola lettura (drive.readonly).' },
      { type: 'h3', text: 'Importare un file nell\'editor' },
      { type: 'steps', items: [
        { title: 'Apri l\'editor del post', desc: 'Clicca sul contenuto.' },
        { title: 'Clicca l\'icona Google Drive', desc: 'Nella sezione Media, clicca l\'icona del Drive (freccia giù su sfondo colorato).' },
        { title: 'Seleziona il file', desc: 'Si apre il Google Picker. Naviga nelle cartelle e seleziona l\'immagine o il documento.' },
        { title: 'Il file viene importato', desc: 'Il media viene scaricato e aggiunto al post.' },
      ]},
      { type: 'warn', text: 'Se compare l\'avviso "autorizzazioni scadute", disconnetti e riconnetti Google Drive dal tab Social.' },
    ],
  },

  {
    id: 'integration-canva', categoryId: 'integrations',
    title: 'Canva',
    desc: 'Creare un design in Canva e importarlo direttamente nel post.',
    content: [
      { type: 'para', text: 'L\'integrazione Canva permette di aprire l\'editor Canva direttamente da Sketchario, lavorare sul design e reimportare le immagini esportate nel post.' },
      { type: 'h3', text: 'Flusso di utilizzo' },
      { type: 'steps', items: [
        { title: 'Clicca "Apri in Canva"', desc: 'Nell\'editor del post, sezione Media, clicca l\'icona Canva.' },
        { title: 'Sketchario crea un design', desc: 'Viene creato automaticamente un design Canva con il formato corretto.' },
        { title: 'Modifica il design', desc: 'Si apre Canva nel browser. Lavora liberamente sul tuo design.' },
        { title: 'Torna a Sketchario', desc: 'Clicca il pulsante "Torna a Sketchario" presente nel design Canva.' },
        { title: 'Importazione automatica', desc: 'Le immagini esportate vengono importate nel post come media.' },
      ]},
      { type: 'warn', text: 'La sessione Canva ha una scadenza. Se appare l\'errore "Sessione Canva scaduta", clicca di nuovo sull\'icona Canva per avviare una nuova sessione.' },
    ],
  },

  {
    id: 'integration-feeds', categoryId: 'integrations',
    title: 'Feed RSS e Suggerimenti AI',
    desc: 'Usare le notizie del settore e le idee AI per ispirare i contenuti.',
    content: [
      { type: 'para', text: 'La Project View include due strip orizzontali in fondo alla pagina: una con notizie RSS del settore, una con idee generate dall\'AI.' },
      { type: 'h3', text: 'Feed Notizie (RSS)' },
      { type: 'para', text: 'Mostra articoli di notizie pertinenti al settore del progetto (Google News, Reddit, ecc.). Clicca su un articolo per aprire la modale con il dettaglio. Da lì puoi creare un post ispirato all\'articolo o salvarlo (pin).' },
      { type: 'h3', text: 'Suggerimenti AI' },
      { type: 'para', text: 'L\'AI genera periodicamente idee di contenuto specifiche per il tuo settore e tone of voice. Cliccando su un\'idea puoi creare direttamente un nuovo post con quell\'angolazione.' },
      { type: 'h3', text: 'Pin e Refresh' },
      { type: 'bullets', items: [
        '"Pin" (puntina) salva l\'articolo per tornare a vederlo dopo.',
        '"Refresh" ricarica i feed RSS con contenuti più recenti.',
        '"Rigenera" chiede all\'AI nuove idee per il progetto.',
      ]},
    ],
  },

  // ══════════════ ACCOUNT E TEAM ══════════════
  {
    id: 'account-profile', categoryId: 'account',
    title: 'Profilo e Impostazioni Account',
    desc: 'Modificare nome, settore e password. Eliminare l\'account.',
    content: [
      { type: 'para', text: 'Clicca sul tuo nome in fondo alla sidebar (o sulla voce "Profilo" nel menu mobile) per accedere alle impostazioni del tuo account.' },
      { type: 'h3', text: 'Dati profilo' },
      { type: 'bullets', items: [
        'Nome — modificabile in qualsiasi momento.',
        'Email — visibile ma non modificabile (usata per il login).',
        'Settore — il tuo ambito professionale (es. Fotografo, Coach). Usato per personalizzare i Feed RSS.',
      ]},
      { type: 'h3', text: 'Cambio password' },
      { type: 'para', text: 'Inserisci la password attuale e poi la nuova password (minimo 8 caratteri). Clicca Salva. Un messaggio verde conferma il cambiamento.' },
      { type: 'h3', text: 'Eliminare l\'account' },
      { type: 'para', text: 'Nella sezione "Zona Pericolosa" trovi il pulsante Elimina Account. Verrai disconnesso e tutti i tuoi dati verranno cancellati definitivamente. L\'operazione richiede una doppia conferma.' },
      { type: 'warn', text: 'L\'eliminazione dell\'account è irreversibile. Tutti i progetti, contenuti e media verranno cancellati permanentemente.' },
    ],
  },

  {
    id: 'account-plans', categoryId: 'account',
    title: 'Piani e Upgrade',
    desc: 'Differenze tra Free, Creator e Strategist. Come effettuare l\'upgrade.',
    content: [
      { type: 'h3', text: 'Confronto Piani' },
      { type: 'grid', cols: 3, items: [
        { title: '🆓 Free', desc: '1 progetto, 7 contenuti/progetto, AI base, Export JSON.' },
        { title: '✨ Creator', desc: '5 progetti, 30 contenuti/progetto, AI illimitata, Feed RSS, Export CSV+JSON, Social profiles.' },
        { title: '🚀 Strategist', desc: 'Progetti e contenuti illimitati, AI illimitata, Feed, Publishing Queue, Team, Admin Console, Supporto prioritario.' },
      ]},
      { type: 'h3', text: 'Come fare l\'upgrade' },
      { type: 'steps', items: [
        { title: 'Vai alla sezione Billing', desc: 'Clicca su "Upgrade" nella sidebar o nelle impostazioni profilo.' },
        { title: 'Scegli il piano', desc: 'Confronta i piani e clicca il bottone del piano desiderato.' },
        { title: 'Checkout Stripe', desc: 'Verrai reindirizzato alla pagina di pagamento sicura Stripe.' },
        { title: 'Confermato', desc: 'Dopo il pagamento, il piano si aggiorna automaticamente.' },
      ]},
      { type: 'note', text: 'Il piano corrente è evidenziato con il badge "Piano Attuale". Il piano Strategist è contrassegnato come "Popolare".' },
    ],
  },

  {
    id: 'account-team', categoryId: 'account',
    title: 'Team e Collaboratori',
    desc: 'Invitare membri, assegnare ruoli e gestire le collaborazioni.',
    content: [
      { type: 'para', text: 'Puoi invitare altri utenti a collaborare su un progetto. Il pannello Team è accessibile dal tab Social della Project View, in fondo alla pagina.' },
      { type: 'h3', text: 'Ruoli disponibili' },
      { type: 'grid', cols: 2, items: [
        { title: '👑 Owner', desc: 'Chi ha creato il progetto. Può invitare, rimuovere e gestire tutti i contenuti.' },
        { title: '✏️ Editor', desc: 'Può creare, modificare e pubblicare contenuti. Non può eliminare il progetto.' },
        { title: '👁 Viewer', desc: 'Può visualizzare i contenuti ma non modificarli né pubblicarli.' },
      ]},
      { type: 'h3', text: 'Come invitare un collaboratore' },
      { type: 'steps', items: [
        { title: 'Apri il pannello Team', desc: 'Tab Social → scorri in fondo alla pagina.' },
        { title: 'Inserisci l\'email', desc: 'Nel form di invito, inserisci l\'email del collaboratore.' },
        { title: 'Scegli il ruolo', desc: 'Seleziona Editor o Viewer dal menu a tendina.' },
        { title: 'Clicca Invita', desc: 'L\'utente riceverà una notifica in-app. Apparirà come "In attesa" finché non accetta.' },
      ]},
      { type: 'tip', text: 'Il collaboratore deve essere già registrato su Sketchario per ricevere l\'invito. Troverà gli inviti in sospeso nella sezione Team del proprio account.' },
    ],
  },
];

// ─── BLOCCHI RENDER ──────────────────────────────────────────
function Block({ b }) {
  if (b.type === 'para')
    return <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '0.75rem', fontSize: '0.9rem' }}>{b.text}</p>;
  if (b.type === 'h3')
    return <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', marginTop: '1.25rem' }}>{b.text}</h3>;
  if (b.type === 'bullets')
    return (
      <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>
        {b.items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    );
  if (b.type === 'steps')
    return (
      <ol style={{ paddingLeft: 0, marginBottom: '0.75rem', listStyle: 'none' }}>
        {b.items.map((it, i) => (
          <li key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ background: 'linear-gradient(135deg,var(--gradient-start),var(--gradient-end))', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>{i + 1}</span>
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.125rem' }}>{it.title}</p>
              {it.desc && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{it.desc}</p>}
            </div>
          </li>
        ))}
      </ol>
    );
  if (b.type === 'tip')
    return (
      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <CheckCircle size={16} color="#4ade80" weight="fill" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ color: '#4ade80', fontSize: '0.85rem', lineHeight: 1.6 }}>{b.text}</p>
      </div>
    );
  if (b.type === 'warn')
    return (
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <Warning size={16} color="#f59e0b" weight="fill" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ color: '#f59e0b', fontSize: '0.85rem', lineHeight: 1.6 }}>{b.text}</p>
      </div>
    );
  if (b.type === 'note')
    return (
      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <Lightbulb size={16} color="#a5b4fc" weight="fill" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ color: '#a5b4fc', fontSize: '0.85rem', lineHeight: 1.6 }}>{b.text}</p>
      </div>
    );
  if (b.type === 'grid')
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${b.cols || 2}, 1fr)`, gap: '0.75rem', marginBottom: '0.75rem' }}>
        {b.items.map((it, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '0.875rem' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{it.title}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>{it.desc}</p>
          </div>
        ))}
      </div>
    );
  return null;
}

// ─── COMPONENTE PRINCIPALE ───────────────────────────────────
export default function HelpCenter({ onClose }) {
  const [catId, setCatId]       = useState(null);
  const [articleId, setArticleId] = useState(null);
  const [search, setSearch]     = useState('');

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ARTICLES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q) ||
      a.content.some(b =>
        b.text?.toLowerCase().includes(q) ||
        b.items?.some(i => (typeof i === 'string' ? i : (i.title || '') + ' ' + (i.desc || '')).toLowerCase().includes(q))
      )
    );
  }, [search]);

  const currentCat     = CATEGORIES.find(c => c.id === catId);
  const currentArticle = ARTICLES.find(a => a.id === articleId);
  const catArticles    = ARTICLES.filter(a => a.categoryId === catId);

  const goHome = () => { setCatId(null); setArticleId(null); setSearch(''); };

  // ── LAYOUT ──
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        <img src="/assets/favicon.jpg" alt="Sketchario" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Guida di Sketchario</span>
        <div style={{ flex: 1, position: 'relative', maxWidth: 480 }}>
          <MagnifyingGlass size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCatId(null); setArticleId(null); }}
            placeholder="Cerca nella guida..."
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.625rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}>
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Sidebar categorie */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflowY: 'auto', padding: '1.25rem 0.75rem' }}>
          <button onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '1rem', padding: '0.25rem 0.5rem' }}>
            <House size={14} /> Home
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCatId(cat.id); setArticleId(null); setSearch(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%', textAlign: 'left',
                padding: '0.625rem 0.75rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer',
                marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s',
                background: catId === cat.id ? `${cat.color}18` : 'transparent',
                color: catId === cat.id ? cat.color : 'var(--text-secondary)',
              }}
            >
              <cat.Icon size={16} color={cat.color} weight={catId === cat.id ? 'fill' : 'regular'} />
              {cat.title}
            </button>
          ))}
        </div>

        {/* Contenuto principale */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

          {/* RICERCA */}
          {search.trim() && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {searchResults.length} risultati per "<strong style={{ color: 'var(--text-secondary)' }}>{search}</strong>"
              </p>
              {searchResults.length === 0
                ? <p style={{ color: 'var(--text-muted)' }}>Nessun risultato trovato.</p>
                : searchResults.map(a => <ArticleCard key={a.id} article={a} categories={CATEGORIES} onClick={() => { setCatId(a.categoryId); setArticleId(a.id); setSearch(''); }} />)
              }
            </div>
          )}

          {/* HOME */}
          {!search.trim() && !catId && (
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Come possiamo aiutarti?</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Esplora la guida completa di Sketchario per imparare a usare tutte le funzionalità.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCatId(cat.id)}
                    style={{ background: 'var(--bg-card)', border: `1px solid ${cat.color}30`, borderRadius: '1rem', padding: '1.25rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = cat.color + '70'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = cat.color + '30'}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '0.625rem', background: cat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <cat.Icon size={20} color={cat.color} weight="duotone" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{cat.title}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.desc}</p>
                    <p style={{ fontSize: '0.75rem', color: cat.color, marginTop: '0.5rem' }}>{ARTICLES.filter(a => a.categoryId === cat.id).length} articoli</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LISTA ARTICOLI categoria */}
          {!search.trim() && catId && !articleId && currentCat && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: currentCat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <currentCat.Icon size={20} color={currentCat.color} weight="duotone" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{currentCat.title}</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{currentCat.desc}</p>
                </div>
              </div>
              {catArticles.length === 0
                ? <p style={{ color: 'var(--text-muted)' }}>Articoli in arrivo presto.</p>
                : catArticles.map(a => <ArticleCard key={a.id} article={a} categories={CATEGORIES} onClick={() => setArticleId(a.id)} />)
              }
            </div>
          )}

          {/* ARTICOLO */}
          {!search.trim() && articleId && currentArticle && (
            <div style={{ maxWidth: 720 }}>
              <button
                onClick={() => setArticleId(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '1.5rem' }}
              >
                <ArrowLeft size={14} /> Torna a {currentCat?.title}
              </button>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{currentArticle.title}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>{currentArticle.desc}</p>
              <hr style={{ borderColor: 'var(--border-color)', marginBottom: '1.75rem' }} />
              {currentArticle.content.map((b, i) => <Block key={i} b={b} />)}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article, categories, onClick }) {
  const cat = categories.find(c => c.id === article.categoryId);
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '0.5rem', cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      {cat && (
        <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: cat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <cat.Icon size={18} color={cat.color} weight="duotone" />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{article.title}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{article.desc}</p>
      </div>
      <CaretRight size={16} color="var(--text-muted)" />
    </button>
  );
}
