const CACHE_NAME = 'harizma-pos-v3';
const SUPABASE_SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const APP_FILES = ['./pos.html', './manifest.webmanifest', './icons/icon.svg', './supabase-config.js', SUPABASE_SDK];

// Simpan kerangka aplikasi dan pustaka Supabase untuk kunjungan berikutnya.
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

// Hapus cache versi lama setelah versi baru berhasil dipasang.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('harizma-pos-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Gunakan cache saat luring dan jaringan saat tersedia.
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const sdkRequest = url.href === SUPABASE_SDK;
  if (request.method !== 'GET' || (url.origin !== self.location.origin && !sdkRequest)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put('./pos.html', copy));
      return response;
    }).catch(() => caches.match('./pos.html')));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
