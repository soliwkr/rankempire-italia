"""Ristrutturazioni Formia v0.3 — controlled editorial/legal/consent enhancement.

Run after build.py. Defaults to a *tracking-free, noindex preview*.
Optional production instrumentation requires explicitly validated site-specific CMP/GTM/GA4 IDs.
Nothing in this script deploys anything.
"""
from pathlib import Path
import os, re, json, html

ROOT = Path(__file__).resolve().parent
SITE = ROOT/'site'
DOMAIN = 'https://ristrutturazioniformia.it'
PREVIEW_MODE = os.getenv('RF_MODE', 'preview') != 'production'
CMP = os.getenv('RF_CMP_EMBED_ID', '').strip().lower()
GTM = os.getenv('RF_GTM_ID', '').strip().upper()
GA4 = os.getenv('RF_GA4_MEASUREMENT_ID', '').strip().upper()
# No GA4 with the eSIM/Senza Roaming IDs. Each site must use its own measurement configuration.
ESIM_GTM = 'GTM-W3LSK9RZ'
ESIM_GA4 = 'G-GWJ9YPPVJW'


def write(path, content):
    p = SITE/path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')


def safe_script_json(payload):
    return json.dumps(payload, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')


def tracking_snippet(path):
    """Ported from esim M6: CMP-only head embed; GTM activates only via iubenda purpose 4."""
    if PREVIEW_MODE:
        return ''
    if not re.fullmatch(r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}', CMP):
        raise ValueError('PRODUCTION_BLOCKED: RF_CMP_EMBED_ID must be valid for ristrutturazioniformia.it')
    if not re.fullmatch(r'GTM-[A-Z0-9]+', GTM) or GTM == ESIM_GTM:
        raise ValueError('PRODUCTION_BLOCKED: dedicated RF_GTM_ID missing/invalid or belongs to Senza Roaming')
    if not re.fullmatch(r'G-[A-Z0-9]+', GA4) or GA4 == ESIM_GA4:
        raise ValueError('PRODUCTION_BLOCKED: dedicated RF_GA4_MEASUREMENT_ID missing/invalid or belongs to Senza Roaming')
    if os.getenv('RF_PRODUCTION_CONTENT_APPROVED') != 'yes':
        raise ValueError('PRODUCTION_BLOCKED: legal/editorial/affiliate review not approved')
    # Site-wide consent mode default denied, including Google Consent Mode v2 advertising keys.
    # No Google requests until iubenda activates the inert script.
    purpose = 'privacy' if path == 'privacy' else 'method' if path in ('metodo','trasparenza') else 'home' if path == '' else 'guide'
    config = safe_script_json({'gtm_id': GTM, 'measurement_id': GA4, 'route_class': purpose,
                               'content_slug': path, 'page_location': DOMAIN + ('/'+path+'/' if path else '/')})
    bootstrap = """(function(w,d,c){
 if(w.__RF_MEASUREMENT_V1__)return;
 w.__RF_MEASUREMENT_V1__=true;
 w.dataLayer=w.dataLayer||[];
 w.dataLayer.push({event:'rf_consent_defaults',analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 w.dataLayer.push({rf_ga4_measurement_id:c.measurement_id,route_class:c.route_class,content_slug:c.content_slug,site_language:'it',page_location:c.page_location});
 w.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
 var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(c.gtm_id);d.head.appendChild(s);
 w.dataLayer.push({event:'rf_page_view_ready',event_schema_version:'1',route_class:c.route_class,content_slug:c.content_slug,site_language:'it',page_location:c.page_location});
})(window,document,CONFIG);""".replace('CONFIG', config)
    return ('<script src="https://embeds.iubenda.com/widgets/'+CMP+'.js"></script>\n'
            '<script type="text/plain" class="_iub_cs_activate" data-iub-purposes="4">'
            +bootstrap+'</script>\n')


def amend_file(path, replacements):
    p=SITE/path
    source=p.read_text(encoding='utf-8')
    for old,new in replacements:
        if old not in source:
            raise RuntimeError(f'Missing expected source fragment in {path}: {old[:100]}')
        source=source.replace(old,new)
    p.write_text(source, encoding='utf-8')

# Rewrite headline and context-rich local value proposition. All text remains factual and qualified.
amend_file(Path('index.html'), [
 ('<h1>Ristrutturare,<br><span>con criterio.</span></h1>',
  '<h1>Ristrutturare casa<br><span>a Formia.</span></h1>'),
 ('Casa, bagno, doccia. Prima di chiedere un preventivo, metti a fuoco le lavorazioni, i costi e le decisioni che contano davvero.',
  'Devi rifare casa o il bagno nel Golfo di Gaeta? Scopri cosa chiedere a un’impresa, quali voci incidono sul costo e come preparare una richiesta di preventivo davvero confrontabile.'),
 ('<span>FORMIA · GAETA · GOLFO</span>', '<span>FORMIA · GAETA · ITRI · MINTURNO</span>')
])

# Operator identity; clearly distinguish publisher from contractor and partner.
for htmlpath in sorted(SITE.rglob('index.html')):
    path='' if htmlpath.parent == SITE else htmlpath.parent.relative_to(SITE).as_posix()
    text=htmlpath.read_text(encoding='utf-8')
    text=text.replace('Demo non pubblicata', 'Anteprima non indicizzabile')
    text=text.replace('<a href="/privacy/">Privacy della preview</a>',
                      '<a href="/privacy/">Privacy</a><a href="/cookie/">Cookie e preferenze</a><a href="/trasparenza/">Affiliazioni</a>')
    text=text.replace('<span>© 2026 Ristrutturazioni Formia · Anteprima non indicizzabile</span>',
                      '<span>© 2026 Ristrutturazioni Formia · Editore: Internet Marketing Secrets · P.IVA IT02996460594 · Formia (LT) · Anteprima non indicizzabile</span>')
    # Enable these controls only with an actual site-specific CMP in a vetted production release.
    if PREVIEW_MODE:
        preferences = '<a href="/cookie/">Cookie e preferenze</a>'
    else:
        preferences = '<a href="/privacy/#preferenze-cookie" class="iubenda-cs-preferences-link">Gestisci preferenze cookie</a>'
    text=text.replace('<a href="#main">Torna su ↑</a>', preferences+'<a href="#main">Torna su ↑</a>')
    htmlpath.write_text(text, encoding='utf-8')

# Technical notes and legal disclosures – factual preview versions, not a certification of legal compliance.
privacy_path=SITE/'privacy'/'index.html'
privacy_html=privacy_path.read_text(encoding='utf-8')
privacy_html=privacy_html.replace('Questa pagina descrive il funzionamento della sola versione dimostrativa. Non è ancora l’informativa definitiva del sito pubblico.',
'''Il portale è curato da Internet Marketing Secrets. Questa informativa descrive la preview: il trattamento e la configurazione completa del sito pubblico sono ancora da verificare.''')
privacy_html=privacy_html.replace('Questa anteprima funziona tramite file HTML, CSS e JavaScript statici. Non contiene moduli di contatto o sistemi attivi di registrazione utenti.',
'''Titolare indicato per il progetto: Internet Marketing Secrets, P.IVA IT02996460594, Via Pescinola snc, 04023 Formia (LT). Dati identificativi ricavati dalle informative di thesprint.uk e da riconfermare prima del lancio. Questa preview non contiene moduli di raccolta contatti.''')
privacy_html=privacy_html.replace('<h2>Strumenti terzi</h2>',
'''<h2>Hosting e dati tecnici</h2><p>Il sito è distribuito tramite Cloudflare. Come per altri siti web, il fornitore può trattare dati tecnici per erogare il servizio e proteggerlo; modalità, basi giuridiche e conservazione andranno descritte nell’informativa definitiva.</p><h2 id="preferenze-cookie">Consenso e misurazione</h2><p>Nella preview Google Analytics, GTM e il banner iubenda non sono attivi. Il rilascio pubblico userà un’integrazione a consenso preventivo esplicito solo dopo aver configurato una policy iubenda specifica per il dominio e una proprietà Analytics dedicata. Le preferenze si potranno riaprire dal footer.</p><h2>Strumenti terzi</h2>''')
privacy_html=privacy_html.replace('Questa pagina non deve essere utilizzata come informativa di produzione prima del completamento delle verifiche.',
'''L’informativa pubblica dovrà includere contatti privacy dedicati, destinatari, diritti degli interessati, periodi di conservazione e dettagli dei partner effettivamente attivi. Questa bozza non costituisce una policy legale definitiva.''')
privacy_path.write_text(privacy_html, encoding='utf-8')

# New pages use the same head/foot as home, changing SEO metadata and main content without introducing a new framework.
HOME=(SITE/'index.html').read_text(encoding='utf-8')
def new_page(slug,title,description,eyebrow,heading,lede,sections):
    from re import DOTALL
    doc=HOME
    doc=re.sub(r'<title>.*?</title>', '<title>'+html.escape(title)+' | Ristrutturazioni Formia</title>', doc, count=1)
    doc=re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="'+html.escape(description,quote=True)+'">',doc,count=1)
    doc=re.sub(r'<link rel="canonical" href="[^"]*">','<link rel="canonical" href="'+DOMAIN+'/'+slug+'/">',doc,count=1)
    doc=re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="'+html.escape(title,quote=True)+'">',doc,count=1)
    doc=re.sub(r'<meta property="og:description" content="[^"]*">','<meta property="og:description" content="'+html.escape(description,quote=True)+'">',doc,count=1)
    doc=re.sub(r'<meta property="og:url" content="[^"]*">','<meta property="og:url" content="'+DOMAIN+'/'+slug+'/">',doc,count=1)
    # We do not clone JSON-LD from home: a page-specific JSON-LD object is emitted instead.
    doc=re.sub(r'<script type="application/ld\+json">.*?</script>',
        '<script type="application/ld+json">'+safe_script_json({'@context':'https://schema.org','@type':'WebPage','name':title,'url':DOMAIN+'/'+slug+'/', 'inLanguage':'it-IT'})+'</script>',doc,count=1,flags=DOTALL)
    main='<main id="main"><section class="page-hero wrap"><p class="eyebrow">'+eyebrow+'</p><h1>'+heading+'</h1><p class="page-lede">'+lede+'</p></section><div class="wrap article-layout"><article class="article-body">'+sections+'</article><aside class="toc"><span>INFORMAZIONI</span><div class="aside-card"><b>Editore</b><p>Internet Marketing Secrets. Portale editoriale, non impresa edile.</p><a href="/metodo/">Metodo e contatti →</a></div></aside></div></main>'
    doc=re.sub(r'<main id="main">.*?</main>', lambda m:main, doc,count=1,flags=DOTALL)
    doc=doc.replace('src="/assets/site.js" defer','src="/assets/site.js" defer')
    write(Path(slug)/'index.html',doc)

new_page('trasparenza','Trasparenza commerciale e affiliazioni','Come si finanzia Ristrutturazioni Formia e chi gestisce eventuali richieste di preventivo.','TRASPARENZA / COLLABORAZIONI','Chi pubblica. Chi costruisce. Chi riceve la richiesta.',
'Ristrutturazioni Formia è un portale informativo indipendente: non esegue lavori e non garantisce preventivi, cantieri o risultati.',
'''<h2>Chi pubblica i contenuti</h2><p>L’editore indicato è Internet Marketing Secrets, P.IVA IT02996460594, con sede a Formia. Il marchio editoriale Ristrutturazioni Formia non corrisponde a un’impresa edile.</p>
<h2>Come funzionano le commissioni</h2><p>Quando sarà attivato, il collegamento a Edilnet potrà remunerare il sito per richieste valide secondo il programma partner. La possibilità di ricevere una commissione non equivale a una raccomandazione professionale o a una garanzia sulla qualità di un’impresa.</p>
<h2>Chi gestirà i dati della richiesta</h2><p>Il percorso di preventivi sarà ospitato dal partner esterno, con informativa e condizioni proprie. In questa versione di anteprima non trasmettiamo richieste né dati personali a Edilnet.</p>
<h2>Come scriviamo</h2><p>Distinguiamo dati documentati, esempi di calcolo e valutazioni editoriali. Non pubblichiamo recensioni o opere realizzate attribuite a imprese senza verifica delle fonti.</p>
<p><a class="btn btn-primary" href="/preventivi/">Come confrontare preventivi →</a></p>''')

new_page('cookie','Cookie, preferenze e misurazione','Informazioni sul consenso e sul futuro tracciamento della versione pubblica.','COOKIE / VERSIONE PREVIEW','Cookie e misurazione: prima viene la scelta.',
'La preview non attiva GTM, GA4 o il banner iubenda. Prepariamo una versione pubblica con caricamento dei tag solo dopo consenso esplicito.',
'''<h2>Strumenti attivi nella preview</h2><p>Il simulatore esegue i calcoli nel browser. Non invia i valori inseriti a un backend. In questa preview non è presente un contenitore Google Tag Manager né uno script di Google Analytics.</p>
<h2>Come funzionerà la gestione del consenso</h2><p>Il sistema progettato riutilizza il modello già verificato nel progetto Senza Roaming: una CMP iubenda specifica per Ristrutturazioni Formia dovrà consentire rifiuto, accettazione e modifica delle preferenze. Il caricamento delle misurazioni avverrà soltanto dopo consenso alla finalità Misurazione. Non è previsto remarketing.</p>
<h2>Preferenze e revoca</h2><p>Nel sito pubblico, quando la CMP sarà verificata e attiva, un collegamento nel footer aprirà nuovamente le preferenze. Su questa preview non esiste una scelta da revocare perché le misurazioni sono disabilitate.</p>
<h2>Chi gestisce il portale</h2><p>Internet Marketing Secrets, P.IVA IT02996460594. Consulta anche l’<a href="/privacy/">informativa privacy della preview</a>. I documenti definitivi saranno revisionati prima della produzione.</p>''')

# Add editorial resources and internal links (no invented quotes/prices/guarantees).
home_path=SITE/'index.html'
home=home_path.read_text(encoding='utf-8')
faq='''<section class="section wrap editorial-faq"><p class="eyebrow">FAQ / FORMIA E GOLFO</p><h2>Prima di scegliere un’impresa.</h2>
<details><summary>Come faccio a confrontare due preventivi di ristrutturazione?</summary><p>Chiedi le stesse lavorazioni, quantità e materiali a entrambe le imprese. Controlla se smaltimento, impianti, protezioni e finiture sono inclusi. Una cifra più bassa non è necessariamente un’offerta equivalente.</p></details>
<details><summary>Il prezzo al metro quadro basta per fare un budget?</summary><p>No. È utile per un primo orientamento, ma i costi dipendono da condizioni dell’immobile, impianti, estensione degli interventi e materiali. Usa il nostro simulatore per riordinare importi che hai già raccolto, non per ottenere un preventivo automatico.</p></details>
<details><summary>Per un bagno a Formia serve una verifica tecnica?</summary><p>Dipende dai lavori previsti. Spostamento degli impianti, interventi sulle strutture e pratiche amministrative richiedono valutazioni diverse. Un tecnico abilitato può verificare il tuo caso.</p></details>
<details><summary>Il sito invia direttamente la richiesta a un’impresa?</summary><p>No. Ristrutturazioni Formia è un sito informativo. Il collegamento al futuro partner Edilnet è ancora disabilitato in anteprima; quando sarà attivo sarà indicato chiaramente.</p></details>
<p class="editorial-cta"><a href="/preventivi/" class="btn btn-primary">Preparare la richiesta di preventivo →</a></p></section>'''
home=home.replace('</main>',faq+'</main>',1)
home_path.write_text(home,encoding='utf-8')

# Head metadata on new pages; no real CMP in preview; production built only after explicit gates.
# Only now insert consent/measurement scripts for the correct page context.
# Preview mode always returns an empty script string.
for page_file in SITE.rglob('index.html'):
    slug = '' if page_file.parent == SITE else page_file.parent.relative_to(SITE).as_posix()
    doc = page_file.read_text(encoding='utf-8')
    page_file.write_text(doc.replace('</head>', tracking_snippet(slug)+'</head>', 1), encoding='utf-8')

write('assets/privacy-readiness.txt', 'Preview: no CMP and no Google traffic. Production requires dedicated iubenda embed, GTM, GA4, legal signoff.\n')
css=(SITE/'assets'/'site.css').read_text(encoding='utf-8')
css+='''\n/* v0.3 editorial FAQ and disclosure pages */
.editorial-faq{padding:60px 0 95px}.editorial-faq h2{max-width:750px}.editorial-faq details{border-bottom:1px solid var(--line);padding:19px 0}.editorial-faq details:first-of-type{border-top:1px solid var(--line)}.editorial-faq summary{cursor:pointer;font-weight:750;list-style-position:outside;margin-left:12px}.editorial-faq details p{max-width:780px;padding:8px 18px 0;color:var(--soft)}.editorial-cta{padding-top:24px}.footer-meta{flex-wrap:wrap}.footer-meta a{font-size:.7rem}.article-body a:not(.btn){color:var(--accent);text-underline-offset:4px}
'''
write('assets/site.css',css)
readme=SITE/'README.md'
readme.write_text(readme.read_text(encoding='utf-8') + '\n## v0.3 note\n- `/cookie/` and `/trasparenza/` added, operator Internet Marketing Secrets identified.\n- eSIM pattern preserved: consent-gated GTM/GA4, no analytics in preview.\n- To build for production, set RF_MODE=production, RF_CMP_EMBED_ID, RF_GTM_ID, RF_GA4_MEASUREMENT_ID, RF_PRODUCTION_CONTENT_APPROVED=yes **only after external verification**.\n- Do not reuse Senza Roaming GTM-W3LSK9RZ / G-GWJ9YPPVJW.\n',encoding='utf-8')
print('Enhanced site to v0.3; preview:',PREVIEW_MODE,'pages:',len(list(SITE.rglob('index.html'))))
