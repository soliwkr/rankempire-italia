// Rank Empire / SOLIWKR SEO operator. Cloudflare Workers, no Node runtime.
// Google Search Console: read-only scope, OAuth2 service-account JWT.
// This worker is deliberately nonfunctional until BOTH secrets are configured.
const GSC_SCOPE='https://www.googleapis.com/auth/webmasters.readonly';
let cached=null;
function reply(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'X-Robots-Tag':'noindex, nofollow',
    'Referrer-Policy':'no-referrer'
  }});
}
function same(a,b){
  if(typeof a!=='string'||typeof b!=='string')return false;
  let d=a.length^b.length;const n=Math.max(a.length,b.length);
  for(let i=0;i<n;i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);
  return d===0;
}
function encodeB64url(value){
  const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
  let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64decode(s){
  const bytes=atob(s.replace(/-/g,'+').replace(/_/g,'/'));
  return Uint8Array.from(bytes,c=>c.charCodeAt(0));
}
async function getAccessToken(env){
  if(cached&&cached.expires>Date.now()+60000)return cached.token;
  let sa;try{sa=JSON.parse(env.GSC_SERVICE_ACCOUNT||'');}catch{throw new Error('invalid_service_account_configuration')}
  if(sa.type!=='service_account'||typeof sa.client_email!=='string'||typeof sa.private_key!=='string'||!sa.private_key.includes('BEGIN PRIVATE KEY'))throw new Error('invalid_service_account_configuration');
  if(env.RANKEMPIRE_PROJECT_ID&&sa.project_id!==env.RANKEMPIRE_PROJECT_ID)throw new Error('wrong_google_cloud_project');
  const aud='https://oauth2.googleapis.com/token',iat=Math.floor(Date.now()/1000);
  const jwtHeader=encodeB64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const claims=encodeB64url(JSON.stringify({iss:sa.client_email,scope:GSC_SCOPE,aud,iat,exp:iat+1800}));
  const signingInput=jwtHeader+'.'+claims;
  const keyData=sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
  const privateKey=await crypto.subtle.importKey('pkcs8',base64decode(keyData),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',privateKey,new TextEncoder().encode(signingInput));
  const token=signingInput+'.'+encodeB64url(new Uint8Array(sig));
  const body=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:token});
  const result=await fetch(aud,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
  if(!result.ok)throw new Error('google_token_exchange_failed');
  const json=await result.json();
  if(typeof json.access_token!=='string')throw new Error('google_token_exchange_failed');
  cached={token:json.access_token,expires:Date.now()+Math.min(Number(json.expires_in)||1800,3300)*1000};
  return cached.token;
}
async function googleFetch(env,path,method='GET',data){
  const token=await getAccessToken(env);
  const response=await fetch('https://www.googleapis.com/webmasters/v3/'+path,{
    method,
    headers:{'Authorization':'Bearer '+token,'Accept':'application/json',...(data?{'Content-Type':'application/json'}:{})},
    ...(data?{body:JSON.stringify(data)}:{})
  });
  if(!response.ok)throw Object.assign(new Error('google_search_console_request_failed'),{status:response.status});
  return response.json();
}
function validSite(site){
  if(typeof site!=='string'||site.length>300)return false;
  if(/^sc-domain:[a-z0-9.-]+\.[a-z]{2,}$/i.test(site))return true;
  try{const u=new URL(site);return u.protocol==='https:'&&!!u.hostname&&!u.username&&!u.password&&!u.search&&!u.hash}catch{return false}
}
function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const n=Date.parse(value+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value;
}
async function analytics(req,env){
  if(!(req.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return reply({error:'expected_json'},415);
  if(Number(req.headers.get('Content-Length')||0)>4096)return reply({error:'payload_too_large'},413);
  const raw=await req.text();if(raw.length>4096)return reply({error:'payload_too_large'},413);
  let b;try{b=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400)}
  if(!b||typeof b!=='object'||Array.isArray(b)||!validSite(b.siteUrl)||!validDate(b.startDate)||!validDate(b.endDate))return reply({error:'invalid_request'},400);
  const start=Date.parse(b.startDate+'T00:00:00Z'),end=Date.parse(b.endDate+'T00:00:00Z');
  if(start>end||end-start>95*86400000)return reply({error:'invalid_date_range'},400);
  const allowed=['query','page','date','country','device','searchAppearance'];
  const dims=b.dimensions===undefined?['query']:b.dimensions;
  if(!Array.isArray(dims)||dims.length>3||new Set(dims).size!==dims.length||dims.some(d=>!allowed.includes(d)))return reply({error:'invalid_dimensions'},400);
  const rowLimit=b.rowLimit===undefined?100:Math.min(1000,Math.max(1,Number(b.rowLimit)||0));
  if(!Number.isSafeInteger(rowLimit)||rowLimit<1)return reply({error:'invalid_row_limit'},400);
  const payload={startDate:b.startDate,endDate:b.endDate,dimensions:dims,rowLimit,dataState:'final',type:'web'};
  const x=await googleFetch(env,'sites/'+encodeURIComponent(b.siteUrl)+'/searchAnalytics/query','POST',payload);
  return reply({property:b.siteUrl,dimensions:dims,startDate:b.startDate,endDate:b.endDate,rows:x.rows||[],aggregationType:x.responseAggregationType||null});
}

// Serper: strictly bounded, manually triggered SERP read. Never search without an operator request.
async function serperSearch(req,env){
  // Explicit, opt-in activation guard: secret presence alone must never incur Serper credits.
  if(env.SERPER_ENABLED!=='true')return reply({error:'serper_disabled'},503);
  if(typeof env.SERPER_API_KEY!=='string'||!env.SERPER_API_KEY.trim())return reply({error:'serper_not_configured'},503);
  if(!(req.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return reply({error:'expected_json'},415);
  if(Number(req.headers.get('Content-Length')||0)>512)return reply({error:'payload_too_large'},413);
  const raw=await req.text();if(raw.length>512)return reply({error:'payload_too_large'},413);
  let body;try{body=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['q'].includes(k)))return reply({error:'invalid_request'},400);
  if(typeof body.q!=='string'||body.q.length<3||body.q.length>140||body.q.trim()!==body.q||Array.from(body.q).some(c=>c.charCodeAt(0)<32||'<>@'.includes(c)))return reply({error:'invalid_keyword'},400);
  // Fixed locale and one page/10 results, so a caller cannot request large batches or other regions.
  let upstream;
  try{
    upstream=await fetch('https://google.serper.dev/search',{
      method:'POST',
      headers:{'X-API-KEY':env.SERPER_API_KEY,'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({q:body.q,gl:'it',hl:'it',num:10}),
      signal:AbortSignal.timeout(10000)
    });
  }catch{return reply({error:'serper_unavailable'},502)}
  if(!upstream.ok)return reply({error:'serper_unavailable',upstreamStatus:upstream.status},upstream.status===429?429:502);
  let data;try{data=await upstream.json()}catch{return reply({error:'serper_response_invalid'},502)}
  if(!data||!Array.isArray(data.organic))return reply({error:'serper_response_invalid'},502);
  const organic=data.organic.slice(0,10).filter(r=>r&&typeof r.link==='string'&&(r.link.startsWith('https://')||r.link.startsWith('http://'))).map(r=>({
    position:Number.isSafeInteger(r.position)?r.position:null,
    title:typeof r.title==='string'?r.title.slice(0,220):'',
    url:r.link.slice(0,1600),
    snippet:typeof r.snippet==='string'?r.snippet.slice(0,350):''
  }));
  return reply({query:body.q,gl:'it',hl:'it',source:'serper',metric:'SERP snapshot, NOT search volume',organic});
}

export default {
  async fetch(req,env){
    const url=new URL(req.url);
    if(url.pathname==='/health'&&req.method==='GET')return reply({ok:true,component:'rankempire-gsc-operator',mode:'read-only',googleAuth:'not_tested'});
    // Fail closed. No account access without two separately configured secrets.
    if(typeof env.SEO_OPERATOR_API_SECRET!=='string'||env.SEO_OPERATOR_API_SECRET.length<32||!env.GSC_SERVICE_ACCOUNT)return reply({error:'operator_not_configured'},503);
    const header=req.headers.get('Authorization')||'';
    if(!header.startsWith('Bearer ')||!same(header.slice(7),env.SEO_OPERATOR_API_SECRET))return reply({error:'unauthorized'},401);
    try{
      if(url.pathname==='/v1/serp'&&req.method==='POST')return serperSearch(req,env);
      if(url.pathname==='/v1/properties'&&req.method==='GET'){
        const x=await googleFetch(env,'sites');
        return reply({properties:(x.siteEntry||[]).map(p=>({siteUrl:p.siteUrl,permissionLevel:p.permissionLevel}))});
      }
      if(url.pathname==='/v1/search-analytics'&&req.method==='POST')return analytics(req,env);
      if(url.pathname==='/v1/ready'&&req.method==='GET'){
        const x=await googleFetch(env,'sites');
        return reply({ready:true,propertiesVisible:Array.isArray(x.siteEntry)?x.siteEntry.length:0,mode:'read-only'});
      }
      return reply({error:'not_found'},404);
    }catch(e){
      return reply({error:e?.message==='wrong_google_cloud_project'?'google_project_mismatch':'google_integration_unavailable',googleStatus:e?.status||undefined},e?.status===403?403:502);
    }
  }
};
