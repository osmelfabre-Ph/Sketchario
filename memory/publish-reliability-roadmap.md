# Publish Reliability Mini-Roadmap

## Goal
Ridurre i fallimenti opachi nella pipeline di pubblicazione, con priorità a Instagram.

## Implemented now

### 1. Fix polling Meta Instagram
- Rimosso il campo non valido `error_message` dalle richieste di stato container.
- Il polling usa solo campi sicuri (`status_code`, `status`, `status_message`, `message`).

### 2. Retryable errors
- Introdotta `RetryablePublishError`.
- Gli errori transitori di Instagram non vanno più subito in `failed`.
- Il job torna in `queued` con retry automatico.

### 3. Automatic backoff
- Retry con backoff progressivo.
- Campi aggiunti ai job:
  - `retry_count`
  - `last_error_message`
  - `last_error_at`
  - `last_retry_at`
  - `publish_stage`

### 4. Queue visibility
- La coda mostra anche i job in retry automatico.
- L'utente vede che il job sta ritentando e perché.

## Next hardening steps

### A. Distinguere meglio gli errori Meta
- classificare `retryable` vs `final`
- intercettare 429 / 5xx / timeout rete in modo esplicito

### B. Persisted publish timeline
- loggare timeline per item:
  - `container_created`
  - `container_processing`
  - `ready_to_publish`
  - `publish_requested`
  - `published`
  - `failed`

### C. UI diagnostics
- messaggi utente più leggibili per:
  - token scaduto
  - media non supportato
  - media ancora in elaborazione
  - profilo scollegato

### D. Recovery worker
- cron di recovery per item bloccati troppo a lungo
- alert su retry_count alto
