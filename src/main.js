import { $ } from './ui/dom.js';
import { LOGO_SRC } from './data/gallery.js';
import { initLightboxSwipe } from './ui/lightbox.js';
import { loadRemoteData } from './data/remote.js';
import { initContactWidget } from './contact-widget.js';
import { startRouter } from './router.js';
import { store } from './state/store.js';
import { trackLogin } from './lib/visit-tracking.js';
import { initSiteSearch } from './search.js';

$('#brandLogo').src = LOGO_SRC;
initLightboxSwipe();
initContactWidget();
initSiteSearch();

// Каталог/цены/фото тянем из Supabase ДО первого рендера — иначе первый
// кадр показал бы заводские данные, а через мгновение дёрнулся бы на
// актуальные. Если бэкенд не настроен или недоступен — loadRemoteData() тихо
// оставляет заводские данные из src/data/*.js, сайт работает как раньше.
loadRemoteData().finally(startRouter);

// Если вход уже был сохранён с прошлого раза — продолжаем считать время на сайте.
if (store.user) trackLogin(store.user.phone);

// PWA: регистрируем service worker, чтобы сайт открывался офлайн/при плохой
// связи (кэшируется только "скелет" — css/html, не данные из Supabase).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
