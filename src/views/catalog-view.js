import { $, $$, formatRub, generateId } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { MATERIALS, MATERIAL_SHORT_NAME } from '../data/materials.js';
import { PRODUCTS, CATEGORIES } from '../data/product-catalog.js';
import { GALLERY } from '../data/gallery.js';
import { store, persist } from '../state/store.js';
import { createLead } from '../lib/leads-orders.js';

/** Фильтр каталога — живёт на уровне модуля, т.к. должен сохраняться между перерисовками. */
export const catalogFilter = { category: 'Все', query: '', material: 'Все', priceMin: '', priceMax: '' };
let searchDebounce = null;
let filtersOpen = false;

/** Список на сравнение — до 3 товаров, живёт на уровне модуля (сбрасывается при перезагрузке страницы, это нормально). */
const compareIds = [];
const COMPARE_LIMIT = 3;
let compareOpen = false;

function favoriteButtonHtml(productId) {
  const isFav = store.favorites.has(productId);
  return `<button class="fvb ${isFav ? 'on' : ''}" data-fav="${productId}">${isFav ? '♥' : '♡'}</button>`;
}

function featuredWorksStripHtml() {
  const items = GALLERY.slice(0, 6);
  return `<div class="h2">Наши работы<button class="lnk" data-go="works">Все</button></div>
  <div class="strip">${items.map((g, i) => `<img src="${g.src}" data-o="${i}" alt="${g.caption}" loading="lazy" decoding="async">`).join('')}</div>`;
}

function filteredProducts() {
  const { category, query, material, priceMin, priceMax } = catalogFilter;
  const min = priceMin === '' ? -Infinity : Number(priceMin);
  const max = priceMax === '' ? Infinity : Number(priceMax);
  return PRODUCTS.filter((p) =>
    (category === 'Все' || p.category === category) &&
    (material === 'Все' || p.material === material) &&
    p.price >= min && p.price <= max &&
    (!query || p.name.toLowerCase().includes(query.toLowerCase())),
  );
}

function filtersHtml() {
  const { material, priceMin, priceMax } = catalogFilter;
  const active = material !== 'Все' || priceMin !== '' || priceMax !== '';
  return `
  <button class="lnk" id="toggleFilters" style="margin-bottom:${filtersOpen ? '10px' : '12px'}">Фильтры${active ? ' · активны' : ''} ${filtersOpen ? '▲' : '▼'}</button>
  ${filtersOpen ? `
  <div class="box" style="margin-bottom:12px">
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <select id="fMaterial" style="flex:1;min-width:140px">
        <option value="Все" ${material === 'Все' ? 'selected' : ''}>Любой материал</option>
        ${Object.entries(MATERIALS).map(([k, v]) => `<option value="${k}" ${material === k ? 'selected' : ''}>${v.name}</option>`).join('')}
      </select>
    </div>
    <div class="row" style="gap:8px;margin-top:8px">
      <input type="text" inputmode="numeric" id="fPriceMin" placeholder="Цена от" value="${priceMin}" style="flex:1;min-width:0">
      <input type="text" inputmode="numeric" id="fPriceMax" placeholder="Цена до" value="${priceMax}" style="flex:1;min-width:0">
    </div>
    ${active ? `<button class="lnk" id="fReset" style="margin-top:8px">Сбросить фильтры</button>` : ''}
  </div>` : ''}
  `;
}

function compareBarHtml() {
  if (compareIds.length < 2) return '';
  return `<div class="comparebar"><span>Сравнить (${compareIds.length})</span><button class="btn" id="openCompare" style="width:auto">Сравнить</button><button class="lnk" id="clearCompare">Очистить</button></div>`;
}

export function catalogViewHtml() {
  const { category, query } = catalogFilter;
  const list = filteredProducts();
  return `
  <div class="brandhero">
    <div class="crown">♛</div>
    <h1>ИМПЕРИЯ КАМНЯ</h1>
    <div class="goldbar"><span class="n"></span><span class="w"></span><span class="n"></span></div>
    <div class="tag">Семейные традиции, проверенные временем</div>
    <p class="sub2">Гранит и мрамор в Тамбове: памятники, лестницы, кухни, камины — уже 30 лет работаем с камнем</p>
    <button class="lnk" data-go="about" style="color:var(--acc);margin-top:10px">Узнать нашу историю →</button>
  </div>
  <div class="top"><h1>Каталог</h1><div class="sub">Готовые изделия и материалы — ${PRODUCTS.length} позиций</div></div>
  <div class="promo"><b>Скидка 15%</b>на витринные образцы в наличии · принимаем заявки от организаций (тендеры) — звоните</div>
  <input type="text" placeholder="Поиск по каталогу…" id="sq" value="${query}" style="margin-bottom:12px">
  <div class="chips">${CATEGORIES.map((c) => `<button class="chip ${c === category ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
  ${filtersHtml()}
  ${category === 'Все' && !query ? featuredWorksStripHtml() : ''}
  ${list.length ? `<div class="grid">${list.map((p) => `
    <div class="p">
      <label class="cmpchk"><input type="checkbox" data-cmp="${p.id}" ${compareIds.includes(p.id) ? 'checked' : ''}> Сравнить</label>
      <div class="st" style="background:radial-gradient(90% 70% at 50% 100%,${MATERIALS[p.material].colorLight},${MATERIALS[p.material].colorDark})">${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.remove()">` : `<b>${MATERIAL_SHORT_NAME[p.material] || ''}</b>`}</div>
      <div class="pb">
        <div class="pn">${p.name}</div>
        <div class="row"><div class="pr">${formatRub(p.price)}</div>${favoriteButtonHtml(p.id)}</div>
        <button class="btn" data-add="${p.id}">В корзину</button>
      </div>
    </div>`).join('')}</div>` : `
  <div class="cta-box">
    <p>${query ? 'Ничего не найдено по этому запросу.' : 'В этом разделе цена считается индивидуально — по размеру, материалу и объёму работ.'}</p>
    <button class="btn" id="openCallback">Оставить заявку на расчёт</button>
  </div>`}
  ${compareBarHtml()}
  <div class="box" style="margin-top:20px">
    <div class="cab-sec" style="margin:0 0 8px">Остались вопросы?</div>
    <div class="sub" style="margin-bottom:12px">Перезвоним в течение 10 минут и проведём бесплатную консультацию</div>
    <input type="text" id="qName" placeholder="Ваше имя">
    <input type="tel" id="qPhone" placeholder="Номер телефона" style="margin-top:8px">
    <label class="chk"><input type="checkbox" id="qAgree"> Даю согласие на обработку моих персональных данных</label>
    <button class="btn" id="qSend">Заказать расчёт</button>
  </div>
  ${compareOpen ? compareModalHtml() : ''}
  `;
}

function compareModalHtml() {
  const items = compareIds.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  return `
  <div class="ovl on" id="compareOvl"><div class="ob" style="max-width:480px;width:94vw">
    <div class="cab-sec" style="margin:0 0 12px">Сравнение товаров</div>
    <div class="cmptable">
      <div class="cmprow cmphead">${items.map((p) => `<div class="cmpcell"><div class="cmpname">${p.name}</div></div>`).join('')}</div>
      <div class="cmprow"><div class="cmplabel">Цена</div>${items.map((p) => `<div class="cmpcell">${formatRub(p.price)}</div>`).join('')}</div>
      <div class="cmprow"><div class="cmplabel">Материал</div>${items.map((p) => `<div class="cmpcell">${MATERIALS[p.material] ? MATERIALS[p.material].name : '—'}</div>`).join('')}</div>
      <div class="cmprow"><div class="cmplabel">Категория</div>${items.map((p) => `<div class="cmpcell">${p.category}</div>`).join('')}</div>
      <div class="cmprow"><div class="cmplabel"></div>${items.map((p) => `<div class="cmpcell"><button class="btn" data-add="${p.id}" style="width:auto">В корзину</button></div>`).join('')}</div>
    </div>
    <button class="btn g2" id="closeCompare" style="margin-top:14px">Закрыть</button>
  </div></div>`;
}

export function addProductToCart(productId, buttonEl, { onAdded } = {}) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  const existing = store.cart.find((i) => i.id === product.id);
  if (existing) existing.qty++;
  else store.cart.push({ id: product.id, name: product.name, price: product.price, qty: 1, material: product.material });
  persist();
  toast('Добавлено в корзину');
  onAdded?.(buttonEl);
}

function normalizePhone(value) {
  return value.replace(/\D/g, '');
}

export function bindCatalogView({ sendToTelegram, rerender }) {
  const search = $('#sq');
  if (search) {
    search.oninput = (e) => {
      catalogFilter.query = e.target.value;
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        rerender();
        const el = $('#sq');
        if (el) { el.focus(); el.setSelectionRange(catalogFilter.query.length, catalogFilter.query.length); }
      }, 140);
    };
  }
  $$('[data-cat]').forEach((b) => { b.onclick = () => { catalogFilter.category = b.dataset.cat; rerender(); }; });
  const openCallbackBtn = $('#openCallback');
  if (openCallbackBtn) openCallbackBtn.onclick = () => $('#cbModal').classList.add('on');
  const sendBtn = $('#qSend');
  if (sendBtn) {
    sendBtn.onclick = () => {
      if (!$('#qAgree').checked) { toast('Подтвердите согласие на обработку данных'); return; }
      const phone = normalizePhone($('#qPhone').value);
      if (phone.length < 10) { toast('Введите номер полностью'); return; }
      const name = $('#qName').value.trim();
      store.leads.push({ id: generateId(), date: new Date().toLocaleDateString('ru-RU'), phone, name });
      persist();
      toast('Заявка отправлена — мы вам перезвоним!');
      createLead({ phone, name });
      sendToTelegram({ type: 'callback', phone, name });
      $('#qPhone').value = ''; $('#qName').value = ''; $('#qAgree').checked = false;
    };
  }

  const toggleFilters = $('#toggleFilters');
  if (toggleFilters) toggleFilters.onclick = () => { filtersOpen = !filtersOpen; rerender(); };
  const fMaterial = $('#fMaterial');
  if (fMaterial) fMaterial.onchange = () => { catalogFilter.material = fMaterial.value; rerender(); };
  const fPriceMin = $('#fPriceMin');
  if (fPriceMin) fPriceMin.onchange = () => { catalogFilter.priceMin = fPriceMin.value.replace(/\D/g, ''); rerender(); };
  const fPriceMax = $('#fPriceMax');
  if (fPriceMax) fPriceMax.onchange = () => { catalogFilter.priceMax = fPriceMax.value.replace(/\D/g, ''); rerender(); };
  const fReset = $('#fReset');
  if (fReset) fReset.onclick = () => { catalogFilter.material = 'Все'; catalogFilter.priceMin = ''; catalogFilter.priceMax = ''; rerender(); };

  $$('[data-cmp]').forEach((cb) => {
    cb.onchange = () => {
      const id = +cb.dataset.cmp;
      if (cb.checked) {
        if (compareIds.length >= COMPARE_LIMIT) { toast(`Можно сравнить максимум ${COMPARE_LIMIT} товара`); cb.checked = false; return; }
        compareIds.push(id);
      } else {
        const ix = compareIds.indexOf(id);
        if (ix >= 0) compareIds.splice(ix, 1);
      }
      rerender();
    };
  });
  const openCompare = $('#openCompare');
  if (openCompare) openCompare.onclick = () => { compareOpen = true; rerender(); };
  const closeCompare = $('#closeCompare');
  if (closeCompare) closeCompare.onclick = () => { compareOpen = false; rerender(); };
  const compareOvl = $('#compareOvl');
  if (compareOvl) compareOvl.onclick = (e) => { if (e.target.id === 'compareOvl') { compareOpen = false; rerender(); } };
  const clearCompare = $('#clearCompare');
  if (clearCompare) clearCompare.onclick = () => { compareIds.length = 0; compareOpen = false; rerender(); };
}
