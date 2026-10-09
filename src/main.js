import { $ } from './ui/dom.js';
import { LOGO_SRC } from './data/gallery.js';
import { initLightboxSwipe } from './ui/lightbox.js';
import { loadRemoteData } from './data/remote.js';
import { initContactWidget } from './contact-widget.js';
import { startRouter } from './router.js';

$('#brandLogo').src = LOGO_SRC;
initLightboxSwipe();
initContactWidget();

// Каталог/цены/фото тянем из Supabase ДО первого рендера — иначе первый
// кадр показал бы заводские данные, а через мгновение дёрнулся бы на
// актуальные. Если бэкенд не настроен или недоступен — loadRemoteData() тихо
// оставляет заводские данные из src/data/*.js, сайт работает как раньше.
loadRemoteData().finally(startRouter);
