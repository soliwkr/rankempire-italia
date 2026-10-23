from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parent
site=root/'site'
css=(site/'assets/site.css').read_text()
js=(site/'assets/site.js').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for name,w,h in [('desktop',1440,980),('mobile',390,844)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  page.route('**/*',lambda route:route.abort())
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  for url in ['','ristrutturare-casa','ristrutturazione-bagno','vasca-in-doccia','costi-ristrutturazione','preventivi','metodo','privacy']:
   html=(site/url/'index.html').read_text()
   html=html.replace('<link rel="stylesheet" href="/assets/site.css">','<style>'+css+'</style>').replace('<script src="/assets/site.js" defer></script>','<script>'+js+'</script>')
   page.set_content(html,wait_until='domcontentloaded',timeout=15000)
   if url=='': page.screenshot(path=str(root/f'{name}.png'))
   if url=='costi-ristrutturazione':
    page.fill('#cost-demolitions','1000')
    page.fill('#cost-systems','2000')
    page.fill('#cost-contingency','10')
    print('calculator',name,page.locator('#cost-result').inner_text())
    assert '3300' in page.locator('#cost-result').inner_text().replace('.','').replace('\u00a0','')
   assert page.locator('h1').count()==1,(name,url)
   body=page.evaluate('document.documentElement.scrollWidth')
   if body>w+1: errors.append(f'overflow at {url}: {body} > {w}')
  if name=='mobile':
   html=(site/'index.html').read_text().replace('<link rel="stylesheet" href="/assets/site.css">','<style>'+css+'</style>').replace('<script src="/assets/site.js" defer></script>','<script>'+js+'</script>')
   page.set_content(html,wait_until='domcontentloaded')
   page.click('.menu-toggle')
   assert page.locator('#site-nav').evaluate('(x)=>getComputedStyle(x).display')!='none'
   page.screenshot(path=str(root/'mobile-menu.png'))
  print(name,'errors',errors)
  page.close()
 browser.close()
