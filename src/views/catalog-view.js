import { $, $$, formatRub, generateId } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { MATERIALS, MATERIAL_SHORT_NAME } from '../data/materials.js';
import { PRODUCTS, CATEGORIES } from '../data/product-catalog.js';
import { GALLERY } from '../data/gallery.js';
import { store, persist } from '../state/store.js';

/** Фильтр каталога — живёт на уровне модуля, т.к. должен сохраняться между перерисовками. */
export const catalogFilter = { category: 'Все', query: '' };
let searchDebounce = null;

function favoriteButtonHtml(productId) {
  const isFav = store.favorites.has(productId);
  return `<button class="fvb ${isFav ? 'on' : ''}" data-fav="${productId}">${isFav ? '♥' : '♡'}</button>`;
}

function featuredWorksStripHtml() {
  const items = GALLERY.slice(0, 6);
  return `<div class="h2">Наши работы<button class="lnk" data-go="works">Все</button></div>
  <div class="strip">${items.map((g, i) => `<img src="${g.src}" data-o="${i}" alt="${g.caption}" loading="lazy" decoding="async">`).join('')}</div>`;
}

export function catalogViewHtml() {
  const { category, query } = catalogFilter;
  const list = PRODUCTS.filter((p) =>
    (category === 'Все' || p.category === category) &&
    (!query || p.name.toLowerCase().includes(query.toLowerCase())),
  );
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
  ${category === 'Все' && !query ? featuredWorksStripHtml() : ''}
  ${list.length ? `<div class="grid">${list.map((p) => `
    <div class="p">
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
  <div class="box" style="margin-top:20px">
    <div class="cab-sec" style="margin:0 0 8px">Остались вопросы?</div>
    <div class="sub" style="margin-bottom:12px">Перезвоним в течение 10 минут и проведём бесплатную консультацию</div>
    <input type="text" id="qName" placeholder="Ваше имя">
    <input type="tel" id="qPhone" placeholder="Номер телефона" style="margin-top:8px">
    <label class="chk"><input type="checkbox" id="qAgree"> Даю согласие на обработку моих персональных данных</label>
    <button class="btn" id="qSend">Заказать расчёт</button>
  </div>
  `;
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
      sendToTelegram({ type: 'callback', phone, name });
      $('#qPhone').value = ''; $('#qName').value = ''; $('#qAgree').checked = false;
    };
  }
}
