import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';

const env={
  GSC_SERVICE_ACCOUNT:'test-placeholder-not-used-on-serper-path',
  SEO_OPERATOR_API_SECRET:'1234567890abcdefghij1234567890AB',
  SERPER_API_KEY:'unit-test-placeholder',
  SERPER_ENABLED:'true'
};
const url='https://seo-operator.invalid/v1/serp';
function request(payload, authorization=true, type='application/json'){
  return new Request(url,{method:'POST',headers:{
    'Content-Type':type,
    ...(authorization?{'Authorization':'Bearer '+env.SEO_OPERATOR_API_SECRET}:{})
  },body:typeof payload==='string'?payload:JSON.stringify(payload)});
}
async function check(payload, expected, config=env) {
  const resp=await worker.fetch(request(payload),config);
  assert.equal(resp.status,expected);
  return resp.json();
}

test('health stays unauthenticated and makes no Google call',async()=>{
  const res=await worker.fetch(new Request('https://seo-operator.invalid/health'),{});
  assert.equal(res.status,200);
  const body=await res.json();assert.equal(body.googleAuth,'not_tested');
});

test('rejects calls without auth or without required existing worker config',async()=>{
  const noAuth=await worker.fetch(request({q:'rifare bagno formia'},false),env);
  assert.equal(noAuth.status,401);
  const notConfigured=await worker.fetch(request({q:'rifare bagno formia'}),{...env,GSC_SERVICE_ACCOUNT:''});
  assert.equal(notConfigured.status,503);
});

test('Serper is disabled by default even when secret binding exists',async()=>{
  const body=await check({q:'rifare bagno formia'},503,{...env,SERPER_ENABLED:undefined});
  assert.equal(body.error,'serper_disabled');
});

test('fails closed when Serper key is absent',async()=>{
  const body=await check({q:'rifare bagno formia'},503,{...env,SERPER_API_KEY:''});
  assert.equal(body.error,'serper_not_configured');
});

test('rejects invalid payload and prohibited fields without an outbound call',async()=>{
  assert.equal((await check('not-json',400)).error,'invalid_json');
  assert.equal((await check({q:'ok'},400)).error,'invalid_keyword');
  assert.equal((await check({q:'bagno formia',num:100},400)).error,'invalid_request');
  assert.equal((await check({q:'email user@example.com'},400)).error,'invalid_keyword');
  assert.equal((await check({q:'rifare\\nbagno'},400)).error,'invalid_keyword');
  const wrongType=await worker.fetch(request({q:'rifare bagno formia'},true,'text/plain'),env);
  assert.equal(wrongType.status,415);
});

test('manual query uses Italian locale, one page and normalizes limited organic results',async()=>{
  const orig=globalThis.fetch;
  let calls=0;
  globalThis.fetch=async (target,options)=>{
    calls++;
    assert.equal(target,'https://google.serper.dev/search');
    assert.equal(options.headers['X-API-KEY'],env.SERPER_API_KEY);
    assert.deepEqual(JSON.parse(options.body),{q:'costo rifacimento bagno piccolo',gl:'it',hl:'it',num:10});
    return new Response(JSON.stringify({organic:[
      {position:1,title:'Titolo',link:'https://example.com/bagno',snippet:'Breve descrizione'},
      {position:2,title:'Malformed',link:'javascript:bad()'},
      ...Array.from({length:12},(_,i)=>({position:i+3,title:'P'+i,link:'https://example.org/'+i,snippet:'snippet'}))
    ]}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  try{
    const body=await check({q:'costo rifacimento bagno piccolo'},200);
    assert.equal(calls,1);
    assert.equal(body.source,'serper');
    assert.equal(body.gl,'it');assert.equal(body.hl,'it');
    assert.equal(body.organic.length,9);
    assert.equal(body.organic[0].url,'https://example.com/bagno');
    assert.equal(body.organic.find(x=>x.url.startsWith('javascript:')),undefined);
    assert.match(body.metric,/NOT search volume/);
    assert.equal(JSON.stringify(body).includes(env.SERPER_API_KEY),false);
  } finally {globalThis.fetch=orig}
});

test('handles upstream rate limiting and invalid responses without leaking tokens',async()=>{
  const orig=globalThis.fetch;
  try{
    globalThis.fetch=async()=>new Response('limit',{status:429});
    const limit=await check({q:'rifare bagno formia'},429);
    assert.equal(limit.error,'serper_unavailable');
    globalThis.fetch=async()=>new Response('{}',{status:200});
    const invalid=await check({q:'rifare bagno formia'},502);
    assert.equal(invalid.error,'serper_response_invalid');
    globalThis.fetch=async()=>{throw new Error('secret private details')};
    const unavailable=await check({q:'rifare bagno formia'},502);
    assert.equal(unavailable.error,'serper_unavailable');
    assert.equal(JSON.stringify(unavailable).includes('secret'),false);
  }finally{globalThis.fetch=orig}
});
