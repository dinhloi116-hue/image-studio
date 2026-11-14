/* DHL Image Studio batch editor PWA service worker.
 * Caches only the app shell. User photos are local File/Blob objects and
 * are never uploaded or stored in the service worker cache.
 */
'use strict';
const CACHE_NAME='dhl-image-studio-pwa-r20-19-batch-crop';
const SHELL=['./','./index.html','./app.js','./crop-core.js','./manifest.webmanifest',
  './icons/icon192.png','./icons/icon512.png','./icons/icon192-maskable.png','./icons/icon512-maskable.png'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(SHELL);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('dhl-image-studio-pwa-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  const url=new URL(req.url);
  const scope=new URL(self.registration.scope);
  if(!url.pathname.startsWith(scope.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{
      const response=await fetch(req);
      if(response.ok && response.type==='basic'){
        await cache.put(req,response.clone());
      }
      return response;
    }catch(error){
      const saved=await cache.match(req,{ignoreSearch:true});
      if(saved)return saved;
      if(req.mode==='navigate'){
        const fallback=await cache.match('./index.html');
        if(fallback)return fallback;
      }
      throw error;
    }
  })());
});