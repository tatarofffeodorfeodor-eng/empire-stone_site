import { $, $$, formatRub } from './ui/dom.js';
import { PRODUCTS } from './data/product-catalog.js';
import { GALLERY } from './data/gallery.js';
import { FAQ_ITEMS } from './views/about-view.js';
import { catalogFilter } from './views/catalog-view.js';
import { openLightbox } from './ui/lightbox.js';

function norm(s) { return (s || '').toLowerCase(); }

function search(query) {
  const q = norm(query).trim();
  if (q.length < 2) return [];
  const results = [];

  PRODUCTS.forEach((p) => {
    if (norm(p.name).includes(q) || norm(p.category).includes(q)) {
      results.push({ type: 'product', title: p.name, sub: `${p.category} · ${formatRub(p.price)}`, data: p });
    }
  });

  GALLERY.forEach((g, i) => {
    if (norm(g.caption).includes(q)) {
      results.push({ type: 'gallery', title: g.caption, sub: 'Наши работы', data: { ...g, i } });
    }
  });

  FAQ_ITEMS.forEach((f) => {
    if (norm(f.q).includes(q) || norm(f.a).includes(q)) {
      results.push({ type: 'faq', title: f.q, sub: 'Частые вопросы', data: f });
    }
  });

  return results.slice(0, 20);
}

function resultsHtml(results, query) {
  if (!query || query.trim().length < 2) return `<div class="empty-small">Введите минимум 2 символа</div>`;
  if (!results.length) return `<div class="empty-small">Ничего не найдено по запросу «${query}»</div>`;
  return `<div class="searchresults">${results.map((r, ix) => `
    <button class="searchrow" data-sr="${ix}">
      <span class="sr-badge">${r.type === 'product' ? 'Товар' : r.type === 'gallery' ? 'Фото' : 'Вопрос'}</span>
      <span class="sr-main"><b>${r.title}</b><span>${r.sub}</span></span>
    </button>`).join('')}</div>`;
}

let lastResults = [];

function render(query) {
  lastResults = search(query);
  $('#searchResults').innerHTML = resultsHtml(lastResults, query);
  bindResultClicks();
}

function bindResultClicks() {
  $$('[data-sr]').forEach((btn) => {
    btn.onclick = () => {
      const r = lastResults[+btn.dataset.sr];
      if (!r) return;
      closeSearch();
      if (r.type === 'product') {
        catalogFilter.category = 'Все';
        catalogFilter.query = r.data.name;
        window.dispatchEvent(new CustomEvent('ik:navigate', { detail: 'cat' }));
      } else if (r.type === 'gallery') {
        window.dispatchEvent(new CustomEvent('ik:navigate', { detail: 'works' }));
        setTimeout(() => openLightbox(r.data.i), 0);
      } else if (r.type === 'faq') {
        window.dispatchEvent(new CustomEvent('ik:navigate', { detail: 'about' }));
      }
    };
  });
}

function openSearch() {
  $('#searchModal').classList.add('on');
  $('#searchInput').value = '';
  $('#searchResults').innerHTML = `<div class="empty-small">Ищите товары, фото работ, ответы на вопросы</div>`;
  setTimeout(() => $('#searchInput').focus(), 50);
}
function closeSearch() { $('#searchModal').classList.remove('on'); }

export function initSiteSearch() {
  const btn = $('#searchBtn');
  if (btn) btn.onclick = openSearch;
  const modal = $('#searchModal');
  if (modal) modal.onclick = (e) => { if (e.target.id === 'searchModal') closeSearch(); };
  const closeBtn = $('#searchClose');
  if (closeBtn) closeBtn.onclick = closeSearch;
  const input = $('#searchInput');
  if (input) {
    let debounce = null;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => render(input.value), 150);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });
  }
}
