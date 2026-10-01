// Service worker de Fields : l'outil reste utilisable sans connexion. Généré par ~/olympiades/rec/build_o4.py.
const CACHE='fields-5683520348';
const CORE=["/fields/", "/fields/manifest.webmanifest", "/fields/icons/icon-192.png", "/fields/icons/apple-touch-icon.png", "/fonts/fonts.css", "/favicon.svg", "/fields/fonts/BricolageGrotesque-normal-latin-1.woff2", "/fields/fonts/BricolageGrotesque-normal-latin-ext-0.woff2", "/fields/fonts/IBMPlexMono-normal-latin-3.woff2", "/fields/fonts/IBMPlexMono-normal-latin-5.woff2", "/fields/fonts/IBMPlexMono-normal-latin-7.woff2", "/fields/fonts/IBMPlexMono-normal-latin-ext-2.woff2", "/fields/fonts/IBMPlexMono-normal-latin-ext-4.woff2", "/fields/fonts/IBMPlexMono-normal-latin-ext-6.woff2", "/fields/fonts/SourceSerif4-italic-greek-8.woff2", "/fields/fonts/SourceSerif4-italic-latin-10.woff2", "/fields/fonts/SourceSerif4-italic-latin-ext-9.woff2", "/fields/fonts/SourceSerif4-normal-greek-11.woff2", "/fields/fonts/SourceSerif4-normal-latin-13.woff2", "/fields/fonts/SourceSerif4-normal-latin-ext-12.woff2", "/fields/fonts/fonts.css"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('fields-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(!(u.pathname.startsWith('/fields/')||u.pathname.startsWith('/fonts/')||u.pathname==='/favicon.svg'))return;
  if(e.request.mode==='navigate'){
    // la page : réseau d'abord pour recevoir les mises à jour, cache si hors connexion
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const k=r.clone();caches.open(CACHE).then(c=>c.put('/fields/',k));}return r;}).catch(()=>caches.match('/fields/')));
    return;
  }
  e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{if(r.ok){const k=r.clone();caches.open(CACHE).then(c=>c.put(e.request,k));}return r;})));
});
