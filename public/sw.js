// Простой service worker — кэширует "скелет" приложения, чтобы сайт
// открывался офлайн/при плохой связи. Данные (каталог, заказы, отзывы)
// всегда идут в сеть — здесь кэшируется только статика, а не Supabase/API.
const CACHE_NAME = 'empire-stone-v1';
const SHELL_URLS = ['/', '/index.html', '/style.css', '/site.css', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Никогда не кэшируем запросы к Supabase или Netlify-функциям — это
  // всегда свежие данные (цены, заказы, статусы, визиты и т.д.).
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/.netlify/functions/')) return;

  // Навигация по страницам — сеть first, с фолбэком на кэшированный index.html офлайн.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Статика (css/js/img/шрифты) — кэш first, с фоновым обновлением кэша из сети.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res && res.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone())).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
