// Service Worker for Proof by Elimination
// Cache-first strategy for offline play

var CACHE_NAME = 'proof-by-elimination-v1';
var ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/js/levels.js',
  '/js/engine.js',
  '/js/renderer.js',
  '/icons/icon.svg',
  '/icons/icon-192.svg',
  '/manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) {
        // Return cache, but also update in background
        var fetchPromise = fetch(e.request).then(function(response) {
          if (response && response.status === 200 && response.type === 'basic') {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(e.request, clone);
            });
          }
          return response;
        }).catch(function() {});
        return cached;
      }
      return fetch(e.request);
    })
  );
});
