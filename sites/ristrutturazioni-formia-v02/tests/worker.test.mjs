import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';
const env={ASSETS:{fetch:async(req)=>{
  const u=new URL(req.url);
  if(u.pathname==='/missing/')return new Response('missing',{status:404,headers:{'Content-Type':'text/html'}});
  if(u.pathname==='/robots.txt')return new Response('User-agent: *\\nDisallow: /',{headers:{'Content-Type':'text/plain'}});
  if(u.pathname==='/assets/site.css')return new Response('body{}',{headers:{'Content-Type':'text/css','Cache-Control':'max-age=3600'}});
  return new Response('Home',{headers:{'Content-Type':'text/html','Cache-Control':'max-age=3600'}});
}}};
test('home is noindex and uncached',async()=>{
 const r=await worker.fetch(new Request('https://preview.invalid/'),env);
 assert.equal(r.status,200);assert.equal(await r.text(),'Home');
 assert.equal(r.headers.get('X-Robots-Tag'),'noindex, nofollow');
 assert.equal(r.headers.get('Cache-Control'),'no-store');
 assert.equal(r.headers.get('X-RF-Release'),'worker-preview-v03');
});
test('404 status and noindex persist',async()=>{
 const r=await worker.fetch(new Request('https://preview.invalid/missing/'),env);
 assert.equal(r.status,404);assert.equal(r.headers.get('X-Robots-Tag'),'noindex, nofollow');
});
test('asset cache is retained with security headers',async()=>{
 const r=await worker.fetch(new Request('https://preview.invalid/assets/site.css'),env);
 assert.equal(r.headers.get('Cache-Control'),'max-age=3600');
 assert.equal(r.headers.get('X-Content-Type-Options'),'nosniff');
});
test('robots explicitly disallows indexing',async()=>{
 const r=await worker.fetch(new Request('https://preview.invalid/robots.txt'),env);
 assert.equal((await r.text()).includes('Disallow: /'),true);
 assert.equal(r.headers.get('Cache-Control'),'no-store');
});
test('POST is refused and health is public but noindex',async()=>{
 const r=await worker.fetch(new Request('https://preview.invalid/',{method:'POST'}),env);
 assert.equal(r.status,405);assert.equal(r.headers.get('Allow'),'GET, HEAD');
 const h=await worker.fetch(new Request('https://preview.invalid/_health'),{});
 assert.deepEqual(await h.json(),{ok:true,release:'worker-preview-v03',public:false});
 assert.equal(h.headers.get('X-Robots-Tag'),'noindex, nofollow');
});
test('HEAD method is supported',async()=>{
 const r=await worker.fetch(new Request('https://preview.invalid/',{method:'HEAD'}),env);
 assert.equal(r.status,200);
});
