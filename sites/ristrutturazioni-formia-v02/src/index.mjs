/** Ristrutturazioni Formia — static assets Worker, preview-only until owner approves go-live. */
const ALLOWED = new Set(['GET', 'HEAD']);
function headersFor(headers) {
  headers.set('X-Robots-Tag','noindex, nofollow');
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  headers.set('X-RF-Release','worker-preview-v03');
  return headers;
}
export default {
  async fetch(request, env) {
    if (!ALLOWED.has(request.method)) {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: headersFor(new Headers({Allow:'GET, HEAD','Cache-Control':'no-store'}))
      });
    }
    const url = new URL(request.url);
    if (url.pathname === '/_health') {
      return new Response(JSON.stringify({ok:true,release:'worker-preview-v03',public:false}),{
        status:200,headers:headersFor(new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}))
      });
    }
    // Worker-first guarantees crawler-blocking response headers for *every* asset.
    // The ASSETS binding handles static HTML redirects and custom 404 pages.
    const asset = await env.ASSETS.fetch(request);
    const headers = headersFor(new Headers(asset.headers));
    const contentType=(headers.get('Content-Type')||'').toLowerCase();
    if(contentType.includes('text/html')||url.pathname==='/robots.txt'){
      headers.set('Cache-Control','no-store');
    }
    return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
  }
};
