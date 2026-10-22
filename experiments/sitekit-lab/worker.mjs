const html = \`<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SOLIWKR SiteKit · Lab</title>
<style>
:root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#e8eefb;background:#080d19;font-synthesis:none}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse 70% 65% at 18% 0%,#172a52 0%,#080d19 65%)}
header,main,footer{max-width:1260px;margin:auto;padding-left:24px;padding-right:24px}
header{display:flex;align-items:center;justify-content:space-between;padding-top:28px;padding-bottom:28px;border-bottom:1px solid #25324a}
.brand{font-weight:800;font-size:16px;letter-spacing:.04em}.brand span{color:#80baff}.tag{font-size:11px;color:#d3e5ff;border:1px solid #35527f;border-radius:99px;padding:7px 12px}
.intro{padding:54px 0 28px;max-width:900px}.eyebrow{font-size:12px;font-weight:700;letter-spacing:.16em;color:#89bcff;text-transform:uppercase}
h1{font-size:clamp(34px,5.5vw,64px);line-height:1.07;letter-spacing:-.045em;margin:16px 0}h1 em{font-style:normal;color:#9bc9ff}p{color:#aebbd0;line-height:1.65}
.intro p{max-width:740px;font-size:17px}.layout{display:grid;grid-template-columns:minmax(290px,.78fr) minmax(420px,1.5fr);gap:24px;padding:20px 0 60px;align-items:start}
.panel{border:1px solid #25334b;border-radius:18px;background:#101a2bc9;box-shadow:0 18px 70px #0003}
.editor{padding:25px;position:sticky;top:16px}.panel h2{font-size:20px;margin:0 0 5px;letter-spacing:-.02em}
.small{font-size:13px;color:#91a2bb;margin:0 0 22px}label{font-size:12px;font-weight:700;color:#d6e1f4;display:block;margin:17px 0 7px}
input,select,textarea{appearance:none;width:100%;padding:12px 13px;background:#071020;border:1px solid #344560;border-radius:10px;color:#f4f7ff;font:inherit;font-size:14px;outline:none}
input:focus,select:focus,textarea:focus{border-color:#82b8fc;box-shadow:0 0 0 3px #468afa26}
textarea{resize:vertical;min-height:82px}button{cursor:pointer;font:inherit}.primary{width:100%;margin-top:24px;border:0;border-radius:10px;background:#a7ceff;padding:14px 15px;font-weight:800;color:#08111e}.primary:hover{background:#d1e5ff}
.notice{margin-top:16px;color:#94a8c0;font-size:11px;line-height:1.6}
.preview{overflow:hidden}.toolbar{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:17px 20px;border-bottom:1px solid #25334b;flex-wrap:wrap}
.toolbar strong{font-size:14px}.tools{display:flex;gap:6px}.tool{font-size:12px;color:#c3d5e9;background:#17253a;border:1px solid #304362;border-radius:8px;padding:7px 10px}.tool.active{color:#06172e;background:#b8d7ff}
.stage{padding:22px;background:repeating-linear-gradient(45deg,#0e1728 0px,#0e1728 13px,#111c2e 13px,#111c2e 26px);display:flex;justify-content:center;min-height:660px}
iframe{display:block;width:100%;height:740px;border:0;background:#fff;border-radius:8px;transition:width .25s ease;box-shadow:0 20px 45px #0006}
iframe.mobile{width:365px;max-width:100%;height:690px;border:7px solid #2d3c53;border-radius:25px}
.footer{font-size:12px;padding:24px;color:#849bb9;border-top:1px solid #27354a}
@media(max-width:900px){.layout{grid-template-columns:1fr}.editor{position:static}.stage{padding:12px;min-height:500px}iframe{height:650px}.intro{padding:34px 0 10px}}
</style></head><body>
<header><div class="brand">SOLIWKR <span>/ SITEKIT</span></div><div class="tag">LAB · ANTEPRIMA TECNICA</div></header>
<main><section class="intro"><div class="eyebrow">Un prodotto autonomo, non un'agenzia</div><h1>Da un brief a un <em>sito visibile.</em></h1><p>Inserisci alcune informazioni sulla tua attività e genera una prima anteprima personalizzata. Questo laboratorio valida il flusso: non raccoglie contatti e non effettua vendite.</p></section>
<section class="layout"><div class="panel editor"><h2>Il tuo brief</h2><p class="small">Solo informazioni fornite da te. Nessuna recensione o promessa inventata.</p>
<form id="brief">
<label for="name">Nome dell'attività</label><input id="name" name="name" required maxlength="70" value="Officina del Borgo" placeholder="Es. Officina del Borgo">
<label for="sector">Settore</label><select id="sector" name="sector"><option value="Artigianato e riparazioni">Artigianato e riparazioni</option><option value="Idraulica e impianti">Idraulica e impianti</option><option value="Bellezza e benessere">Bellezza e benessere</option><option value="Ristorazione">Ristorazione</option><option value="Edilizia">Edilizia</option><option value="Servizi professionali">Servizi professionali</option></select>
<label for="city">Città</label><input id="city" name="city" maxlength="60" required value="Fondi" placeholder="Es. Fondi">
<label for="services">Servizi (separati da virgola)</label><textarea id="services" name="services" maxlength="400" required>Riparazioni, Manutenzione, Assistenza su appuntamento</textarea>
<label for="style">Stile del sito</label><select id="style" name="style"><option value="blue">Moderno · blu</option><option value="green">Naturale · verde</option><option value="warm">Elegante · sabbia</option></select>
<button class="primary" type="submit">Genera l'anteprima →</button>
<p class="notice">Privacy: i dati di questo modulo restano nel browser. Nessun invio, salvataggio o email. Generazione con template parametrico; la scrittura AI sarà integrata in una fase successiva.</p></form></div>
<div class="panel preview"><div class="toolbar"><strong>Anteprima del sito</strong><div class="tools"><button id="desktop" class="tool active" type="button">Desktop</button><button id="mobile" class="tool" type="button">Mobile</button></div></div><div class="stage"><iframe title="Anteprima personalizzata del sito" id="output" sandbox=""></iframe></div></div></section></main>
<footer class="footer">© SOLIWKR · Esperimento isolato · Checkout non disponibile · Non indicizzato</footer>
<script>
const form=document.getElementById('brief'),frame=document.getElementById('output');
function safe(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function website(v){
 const themes={blue:['#17284b','#e7f0ff','#4385e9'],green:['#16382c','#e2f2e9','#287955'],warm:['#332c28','#fff0e1','#ab6946']};
 const t=themes[v.style]||themes.blue, name=safe(v.name),city=safe(v.city),sector=safe(v.sector);
 const items=v.services.split(',').map(x=>x.trim()).filter(Boolean).slice(0,6);const services=items.length?items:['Servizi personalizzati'];
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><style>'+
 'html{scroll-behavior:smooth}body{margin:0;color:#1e293b;background:#fff;font-family:Inter,Arial,sans-serif;line-height:1.6}*{box-sizing:border-box}.w{max-width:1080px;margin:auto;padding:0 26px}header{padding:24px 0;border-bottom:1px solid #e5eaf0}.nav{display:flex;align-items:center;justify-content:space-between;gap:10px}.brand{font-weight:900;font-size:20px;letter-spacing:-.04em}.link{font-size:13px;color:#526171}.hero{background:'+t[0]+';color:#fff;padding:105px 0 110px}.label{color:#a5d8ff;letter-spacing:.16em;text-transform:uppercase;font-size:12px;font-weight:700}h1{font-size:clamp(36px,5vw,67px);line-height:1.08;letter-spacing:-.045em;margin:20px 0}p{max-width:650px}.lead{color:'+t[1]+';font-size:19px}.cta{display:inline-block;margin-top:22px;padding:13px 20px;background:#fff;color:'+t[0]+';border-radius:8px;font-weight:800;text-decoration:none}.section{padding:78px 0}h2{font-size:32px;letter-spacing:-.03em;margin:0 0 16px}.muted{color:#68788d}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:30px}.card{padding:25px 21px;border:1px solid #dce3eb;border-radius:12px;background:#f9fbfd;font-weight:700}.no{color:'+t[2]+';font-size:12px;display:block;margin-bottom:12px}.contact{background:#f5f7fa;padding:55px 0 70px}.fake{font-size:13px;border:1px dashed #a5afbd;padding:12px 16px;display:inline-block;border-radius:7px;color:#718099}footer{padding:28px 0;color:#718099;font-size:12px}@media(max-width:650px){.hero{padding:70px 0}.cards{grid-template-columns:1fr}.section{padding:52px 0}h1{font-size:39px}}'+
 '</style></head><body><header><div class="w nav"><div class="brand">'+name+'</div><div class="link">'+city+'</div></div></header><section class="hero"><div class="w"><div class="label">'+sector+' · '+city+'</div><h1>'+name+'<br>al servizio di '+city+'.</h1><p class="lead">Scopri le attività e i servizi disponibili. Un punto di riferimento digitale semplice, chiaro e diretto.</p><a href="#servizi" class="cta">Scopri i servizi ↗</a></div></section><section class="section" id="servizi"><div class="w"><div class="label" style="color:'+t[2]+'">Cosa facciamo</div><h2>I nostri servizi</h2><p class="muted">Una panoramica di ciò che offre '+name+'.</p><div class="cards">'+services.map((s,i)=>'<div class="card"><span class="no">0'+(i+1)+'</span>'+safe(s)+'</div>').join('')+'</div></div></section><section class="contact"><div class="w"><h2>Parliamone</h2><p class="muted">Questa è una demo. Il titolare può aggiungere recapiti verificati, orari e informazioni utili prima della pubblicazione.</p><span class="fake">Contatti da configurare</span></div></section><footer><div class="w">'+name+' · '+city+' · Anteprima non pubblicata</div></footer></body></html>';
}
function render(){if(!form.reportValidity())return;const v=Object.fromEntries(new FormData(form).entries());frame.srcdoc=website(v);}
form.addEventListener('submit',e=>{e.preventDefault();render()});
function mode(m){frame.classList.toggle('mobile',m==='mobile');document.getElementById('mobile').classList.toggle('active',m==='mobile');document.getElementById('desktop').classList.toggle('active',m!=='mobile')}
document.getElementById('mobile').onclick=()=>mode('mobile');document.getElementById('desktop').onclick=()=>mode('desktop');render();
</script></body></html>\`;
export default {async fetch(req){ const url=new URL(req.url);if(req.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{Allow:'GET'}});if(url.pathname==='/health')return new Response('OK',{headers:{'Content-Type':'text/plain','Cache-Control':'no-store'}});if(url.pathname!=='/')return new Response('Not Found',{status:404});return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self' about:; base-uri 'none'; form-action 'self'; img-src data:;",'Cache-Control':'no-store'}})}};