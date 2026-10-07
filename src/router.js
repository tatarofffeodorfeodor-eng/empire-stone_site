import { $, $$ } from './ui/dom.js';
import { bump, flyToCart } from './ui/animations.js';
import { openLightbox, controlLightbox } from './ui/lightbox.js';
import { store, cartItemCount, persist } from './state/store.js';
import { CATEGORIES } from './data/product-catalog.js';

import { catalogViewHtml, bindCatalogView, addProductToCart, catalogFilter } from './views/catalog-view.js';
import { worksViewHtml, bindWorksView } from './views/works-view.js';
import { aboutViewHtml } from './views/about-view.js';
import { calculatorViewHtml, bindCalculatorView } from './views/calculator-view.js';
import { cartViewHtml, bindCartView } from './views/cart-view.js';
import { cabinetViewHtml, bindCabinetView } from './views/cabinet-view.js';
import { loginViewHtml, bindLoginView } from './views/login-view.js';
import { footerHtml } from './views/footer-view.js';
import { routeAdmin } from './admin.js';

export const TABS = ['cat', 'works', 'about', 'calc', 'cart', 'cab'];
const TAB_LABELS = { cat: 'Каталог', works: 'Работы', about: 'О нас', calc: 'Расчёт', cart: 'Корзина', cab: 'Кабинет' };

function sendToTelegram(payload) {
  fetch('/.netlify/functions/send-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function goTo(tab) {
  if (tab === 'login') { location.hash = '#login'; renderLogin(); return; }
  if (tab === 'admin') { location.hash = '#admin'; routeAdmin(); return; }
  if (!TABS.includes(tab)) tab = 'cat';
  location.hash = '#' + tab;
  render();
}

function currentTab() {
  const hash = location.hash.replace('#', '');
  return TABS.includes(hash) ? hash : 'cat';
}

function routeHash() {
  if (location.hash === '#login') renderLogin();
  else if (location.hash === '#admin') routeAdmin();
  else render();
}

function renderLogin() {
  $('#app').innerHTML = loginViewHtml();
  bindLoginView({ goTo });
}

function viewHtmlFor(tab) {
  if (tab === 'cat') return catalogViewHtml();
  if (tab === 'works') return worksViewHtml();
  if (tab === 'about') return aboutViewHtml();
  if (tab === 'calc') return calculatorViewHtml();
  if (tab === 'cart') return cartViewHtml();
  return cabinetViewHtml();
}

function handleAddToCart(productId, buttonEl) {
  addProductToCart(productId, buttonEl, { onAdded: flyToCart });
  render();
}

function afterFavoriteToggle(productId) {
  bump($(`[data-fav="${productId}"]`), 'pop');
}

let lastRenderedTab = null;
let lastTabIndex = -1;

export function render() {
  const tab = currentTab();
  const tabChanged = tab !== lastRenderedTab;
  lastRenderedTab = tab;
  $$('.topnav button[data-go]').forEach((b) => b.classList.toggle('on', b.dataset.go === tab));

  const app = $('#app');
  const prevScroll = window.scrollY;
  app.innerHTML = viewHtmlFor(tab) + footerHtml();

  /* полноэкранная анимация — только при реальной смене вкладки, а не при каждом клике (корзина/избранное) */
  if (tabChanged) {
    const newIndex = TABS.indexOf(tab);
    const direction = (lastTabIndex >= 0 && newIndex < lastTabIndex) ? 'dir-b' : 'dir-f';
    lastTabIndex = newIndex < 0 ? lastTabIndex : newIndex;
    app.classList.remove('anim', 'dir-f', 'dir-b');
    void app.offsetWidth;
    requestAnimationFrame(() => app.classList.add('anim', direction));
    window.scrollTo(0, 0);
    renderTabBar(tab);
  } else {
    window.scrollTo(0, prevScroll);
    updateCartBadgeInTabBar();
  }

  $('#cartDot').hidden = store.cart.length === 0;
  $('#cartDot').textContent = cartItemCount();
  bindCurrentView(tab);
}

/**
 * Подсветка активной вкладки — отдельная "пилюля" на каждой кнопке (не общий
 * ползунок), которая вспыхивает ярче в момент переключения и гаснет до
 * спокойного состояния — как подсветка вкладок в Telegram.
 */
function renderTabBar(tab) {
  $('#tabs').innerHTML = TABS.map((t) => `<button class="tab ${t === tab ? 'on pop' : ''}" data-go="${t}">${TAB_LABELS[t]}${t === 'cart' && store.cart.length ? `<span class="dot">${cartItemCount()}</span>` : ''}</button>`).join('');
}

/** Точечное обновление бейджа корзины в нижнем таб-баре — без пересборки всех кнопок (устраняет микро-дёрганье при добавлении в корзину). */
function updateCartBadgeInTabBar() {
  const btn = $('#tabs [data-go="cart"]');
  if (!btn) return;
  btn.innerHTML = 'Корзина' + (store.cart.length ? `<span class="dot">${cartItemCount()}</span>` : '');
}

function bindCurrentView(tab) {
  // Общие для всех вкладок обработчики (навигация, добавление в корзину, избранное, лайтбокс).
  $$('[data-go]').forEach((b) => { b.onclick = () => goTo(b.dataset.go); });
  $$('[data-foot-cat]').forEach((b) => { b.onclick = () => { catalogFilter.category = b.dataset.footCat; catalogFilter.query = ''; goTo('cat'); }; });
  $$('[data-add]').forEach((b) => { b.onclick = () => handleAddToCart(isNaN(+b.dataset.add) ? b.dataset.add : +b.dataset.add, b); });
  $$('[data-fav]').forEach((b) => {
    b.onclick = () => {
      const id = +b.dataset.fav;
      store.favorites.has(id) ? store.favorites.delete(id) : store.favorites.set(id, true);
      persist();
      render();
      requestAnimationFrame(() => afterFavoriteToggle(id));
    };
  });
  $$('[data-o]').forEach((el) => { el.onclick = () => openLightbox(+el.dataset.o); });
  $$('[data-lb]').forEach((b) => { b.onclick = () => controlLightbox(b.dataset.lb); });

  const rerender = render;
  if (tab === 'cat') bindCatalogView({ sendToTelegram, rerender });
  if (tab === 'works') bindWorksView();
  if (tab === 'calc') bindCalculatorView({ rerender });
  if (tab === 'cart') bindCartView({ rerender, goTo, sendToTelegram });
  if (tab === 'cab') bindCabinetView({ rerender, goTo });
}

// Админ-панель рисует себя сама (вне обычного render()) и не знает про router напрямую — просит вернуться на вкладку через событие.
window.addEventListener('ik:navigate', (e) => goTo(e.detail));

addEventListener('hashchange', routeHash);

export function startRouter() {
  routeHash();
}
