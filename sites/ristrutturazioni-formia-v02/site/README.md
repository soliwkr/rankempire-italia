# Ristrutturazioni Formia — editorial rebuild v0.2 (isolated preview)

Una versione **multipagina, statica, senza framework e senza API**, con design editoriale ad alto contrasto, SEO on-page, schede tecniche, simulatore a input utente, trasparenza affiliata e nessuna raccolta contatti.

## Pagine
- `/` (home)
- `/ristrutturare-casa/`
- `/ristrutturazione-bagno/`
- `/vasca-in-doccia/`
- `/costi-ristrutturazione/`
- `/preventivi/`
- `/metodo/`
- `/privacy/` (solo anteprima, sostituire prima del lancio)

## Esecuzione locale
Dalla cartella `site/`:

```sh
python3 -m http.server 8000
```
Apri `http://localhost:8000`.

## Google Keyword Planner (repo originale)
- `soliwkr/rankempire-italia/strategia/keyword/sud-pontino/keyword-brief-sud-pontino.csv`: 424 keyword edilizie mappate.
- `.../volumi-ristrutturazioni.csv`: solo 5 keyword con numeri mensili riportati; le restanti 419 sono prive di volume, NON a volume zero.
- Focus della prima architettura: domanda su costi al mq, ristrutturazione casa, bagno, richiesta preventivi. Nessuna produzione massiva di pagine per comuni.

## Gate di produzione (DA NON SALTARE)
1. Identità editoriale e titolare verificati; pagina privacy definitiva con revisione legale.
2. Verifica delle guide tecniche con fonti aggiornate e di qualsiasi dato/prezzo prima di pubblicarlo.
3. Link affiliato Edilnet fornito dall'utente e controllato; sostituire il pulsante disabilitato di `/preventivi/`, disclosure visibile, tracking corretto e parametri consentiti.
4. Analisi URL pubblici precedenti, redirect 301 per contenuti sostituiti, Search Console, sitemap.
5. **Rimuovere la protezione preview noindex da HTML, `_headers`, `robots.txt` solo a gate superati.**
6. Prova degli analytics lato client privacy-safe e dei link esterni; verifica accessibilità, contenuti e render mobile.

## Sicurezza / dati
- Niente cookie impostati dal sito, niente API, niente dati personali gestiti dal sito in questa demo.
- La configurazione Google Cloud/Cloudflare è completamente separata dal sito.
- Impossibile ricevere lead finché il pulsante partner non è attivo.
- Nessun deployment live è autorizzato implicitamente da questo pacchetto.
