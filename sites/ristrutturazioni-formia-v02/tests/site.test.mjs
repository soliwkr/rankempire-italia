import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../site');
const read=(p)=>readFileSync(join(root,p),'utf8');
function allFiles(dir=root){
  return readdirSync(dir).flatMap(item=>{
    const fp=join(dir,item);
    return statSync(fp).isDirectory()?allFiles(fp):[relative(root,fp).split('\\').join('/')];
  });
}
const files=new Set(allFiles());
const pages=[...files].filter(p=>p.endsWith('.html')&&p!=='404.html').sort();
const localSources=(html)=>[...html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]).filter(s=>s.startsWith('/')&&!s.startsWith('//'));
function pathFor(href){
  const p=href.split(/[?#]/)[0];
  if(p==='/')return 'index.html';
  const pathname=decodeURIComponent(p.slice(1));
  return pathname.endsWith('/')?pathname+'index.html':pathname;
}
test('ten real editorial pages, plus custom 404',()=>{
  assert.equal(pages.length,10,JSON.stringify(pages));
  assert.ok(files.has('404.html'));
  for(const page of pages){
    const h=read(page);
    assert.match(h,/<title[\s>]/i,page+' title');
    assert.match(h,/<meta\s+name=["']robots["'][^>]*noindex/i,page+' preview noindex');
  }
});
test('all local links and assets exist',()=>{
  const errors=[];
  for(const page of [...pages,'404.html']){
    for(const href of localSources(read(page))){
      const p=pathFor(href);
      const found=files.has(p)||(files.has(p+'/index.html'));
      if(!found)errors.push(page+' -> '+href);
    }
  }
  assert.deepEqual(errors,[]);
});
test('preview remains non-indexable until separately approved',()=>{
  const robots=read('robots.txt');
  assert.match(robots,/User-agent:\s*\*/i);
  assert.match(robots,/Disallow:\s*\//i);
  const headers=read('_headers');
  assert.match(headers,/X-Robots-Tag:/i);
});
test('static entry assets and simulator script are present',()=>{
  for(const p of ['index.html','assets/site.css','assets/site.js','sitemap.xml']){
    assert.ok(existsSync(join(root,p)),'missing '+p);
  }
  const script=read('assets/site.js');
  assert.ok(script.length>100,'site interaction source unexpectedly empty');
});
