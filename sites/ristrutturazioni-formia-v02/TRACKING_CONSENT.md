# Ristrutturazioni Formia — consenso e misurazione v0.3

Fonte: `soliwkr/esim` (Senza Roaming), luglio 2026: `src/public-consent.ts`, `src/public-measurement.ts`, `docs/GTM-GA4-FOUNDATION.md`.

## Riutilizzato

- Consent Mode **Basic**: blocco completo di GTM/GA4 prima di un consenso valido per finalità **4 — Misurazione**.
- Script iubenda site-specific come CMP, bootstrap GTM inerte `type=text/plain` + `_iub_cs_activate` + `data-iub-purposes=4`.
- `dataLayer` con campi a vocabolario chiuso: `rf_ga4_measurement_id`, `route_class`, `content_slug`, `site_language`, `page_location` senza query/hash; evento `rf_page_view_ready` una volta per pagina.
- Nessun Google Ads, Floodlight o remarketing.
- Gestione/revoca dal footer, solo quando CMP reale è configurata e verificata.

## Non copiato da eSIM

Gli identificativi eSIM `GTM-W3LSK9RZ` e `G-GWJ9YPPVJW` appartengono a Senza Roaming: non sono adatti a Ristrutturazioni Formia. Il profilo iubenda deve includere il nuovo dominio ed una informativa relativa al portale edilizio; non riutilizzare ciecamente l'embed di Senza Roaming.

## Controlli prima del passaggio a produzione

1. Accertare una configurazione iubenda legittimata per `ristrutturazioniformia.it`, finalità 4, Google Consent Mode v2 e banner con Accetta/Rifiuta/Personalizza.
2. Configurare un ID `GTM-…` e uno stream GA4 `G-…` dedicati. Un service account autorizzato su GTM/GA4 **non** implica presenza di un container installato nel sito.
3. Nel container: trigger Custom Event `rf_page_view_ready` che alimenta un solo evento GA4 `page_view`, non utilizzare anche un tag automatico All Pages; richiedere consenso addizionale `analytics_storage`.
4. In browser pulito: zero richieste GTM/GA4 prima del consenso e dopo il rifiuto; una sola page_view dopo l'accettazione; persistenza/revoca; network e Tag Assistant.
5. Non passare nomi, numeri di telefono, email, dati del calcolatore, parametri UTM o query string nelle custom dimension.
6. Redigere e revisionare Privacy e Cookie definitive, con titolare e contatti confermati, before activation.
7. Affiliazione Edilnet e tracking di outbound validati separatamente, senza inviare PII in GA4.

## Ambienti

- **Preview**: nessun script Google, nessun embed CMP; `noindex` su HTML e risposta.
- **Production instrumentation (soltanto un futuro passaggio autorizzato)**: `RF_MODE=production`, `RF_CMP_EMBED_ID`, `RF_GTM_ID`, `RF_GA4_MEASUREMENT_ID`, `RF_PRODUCTION_CONTENT_APPROVED=yes`. L'attuale generatore mantiene volutamente `noindex` e avvisi di preview: **non è una release di produzione**.

Il parser valida sintassi degli ID e rifiuta esplicitamente gli ID eSIM. Non certifica le proprietà terze, il consenso legale o l'implementazione pubblicata del container.