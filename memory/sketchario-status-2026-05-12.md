# Sketchario Status — 2026-05-12

Documento operativo di stato per riprendere il progetto senza perdere contesto.

## Domini attivi

- `https://www.sketchario.app` → landing
- `https://app.sketchario.app` → app frontend
- `https://api.sketchario.app` → backend API

## Stack email attuale

- Mailbox operativa: `helpdesk@sketchario.app` su **Zoho**
- Invio email transazionali: **Resend API**
- Motivo: SMTP outbound da Railway andava in timeout sia con Aruba sia con Zoho

## Stato prodotto

### Già sistemato

- separazione landing / app / backend
- reset password funzionante
- login social rimosso dal flusso auth principale
- pagine legali universalizzate sulla landing
- CookieYes inserito nella landing
- footer legale dell'app puntato a `www.sketchario.app`
- fix duplicazione footer legale in landing
- feed `RSS` e `AI` allineati alla lingua attiva
- analytics nascosti/bloccati per piano Creator
- mobile content cards rese compatte
- wizard e help riallineati alla lingua
- hardening backend contro scanner e rate limit

### Publish / reliability

- fix polling container Instagram
- retry automatici per alcuni errori transitori Meta
- queue più robusta lato backend

Nota: il publish Instagram va comunque monitorato nei log reali dopo deploy perché Meta resta la parte più fragile del sistema.

## Nuove modifiche fatte in questo passaggio

### 1. Form contatti universale

È stata aggiunta una pagina pubblica:

- `frontend/public/contact.html`

Funziona sia:

- come pagina standalone
- sia in overlay dalla landing

### 2. Smistamento richieste contatti

Il form ora distingue:

- `informative` → `info@sketchario.app`
- `technical` → `helpdesk@sketchario.app`

Endpoint backend nuovo:

- `POST /api/public/contact`

Campi:

- `name`
- `email`
- `company`
- `contact_type`
- `message`
- `website` (honeypot anti-spam)

### 3. Invio email backend unificato

Nel backend ora c’è un dispatcher email:

- `send_email_resend(...)`
- `send_email_smtp(...)`
- `send_email(...)`

Il reset password non usa più direttamente SMTP: passa dal dispatcher.

### 4. CORS ampliato

Origini permesse lato backend aggiornate per includere:

- `https://www.sketchario.app`
- `https://app.sketchario.app`
- `https://sketchario.app`
- valori da env:
  - `FRONTEND_URL`
  - `APP_URL`
  - `MARKETING_URL`

## File toccati in questo passaggio

- `backend/server.py`
- `frontend/public/Sketchario_Landing.html`
- `frontend/public/contact.html`
- `frontend/public/legal/legal-theme.css`
- `frontend/public/legal/legal-frame.js`

## Env backend importanti

### Email transazionali

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
SMTP_FROM=helpdesk@sketchario.app
EMAIL_FROM_NAME=Sketchario
```

### Contatti

Facoltative, con default già sensati:

```env
CONTACT_INFO_EMAIL=info@sketchario.app
CONTACT_SUPPORT_EMAIL=helpdesk@sketchario.app
```

## Cosa serve deployare dopo questo commit

### Frontend

Serve per:

- overlay contatti in landing
- nuova pagina contatti
- fix link `Contatti`

### Backend

Serve per:

- endpoint `/api/public/contact`
- dispatcher Resend/SMTP
- forgot-password via dispatcher
- CORS aggiornato

## Dove controllare subito dopo il deploy

### Landing

- `www.sketchario.app`
- click su `Contatti`
- deve aprire un overlay con il form

### Invio informativo

Nel form scegli:

- `Informative / commercial`

Deve arrivare a:

- `info@sketchario.app`

### Invio tecnico

Nel form scegli:

- `Technical / support`

Deve arrivare a:

- `helpdesk@sketchario.app`

## Punti aperti

1. verificare in produzione il nuovo form contatti
2. continuare a osservare Instagram publish nei log reali
3. decidere quando iniziare la prima API pubblica/integration layer di Sketchario

## Nota tecnica

Nel worktree temporaneo usato per queste modifiche il build frontend automatico non è stato eseguito perché mancavano le dipendenze locali (`craco` non presente lì). Il backend invece è stato verificato con:

```bash
python3 -m py_compile backend/server.py
```
