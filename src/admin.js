import { $, $$ } from './ui/dom.js';
import { toast } from './ui/toast.js';
import { storage } from './state/storage.js';
import { store } from './state/store.js';
import { MATERIALS } from './data/materials.js';
import { PRODUCTS, CATEGORIES } from './data/product-catalog.js';
import { GALLERY } from './data/gallery.js';
import { calcState } from './calculator/calculator.js';

/**
 * Админ-панель. Пока нет общей базы данных — правки сохраняются в
 * localStorage ЭТОГО устройства и применяются поверх заводских данных из
 * src/data/*. Удобно для черновика, но другие посетители сайта их пока не
 * увидят — для этого нужен общий бэкенд (например, Supabase).
 */
const ADMIN_PIN = '2580'; // поменяем в любой момент, если попросите

export function isAdmin() {
  return storage.get('ik_admin_auth', false) === true;
}

/** Накатывает сохранённые в localStorage правки админа поверх заводских данных. При старте приложения — один раз. */
export function applyAdminOverrides() {
  const savedProducts = storage.get('ik_admin_P', null);
  if (savedProducts) { PRODUCTS.length = 0; savedProducts.forEach((x) => PRODUCTS.push(x)); }
  const savedGallery = storage.get('ik_admin_G', null);
  if (savedGallery) { GALLERY.length = 0; savedGallery.forEach((x) => GALLERY.push(x)); }
  const savedMaterials = storage.get('ik_admin_M', null);
  if (savedMaterials) Object.keys(savedMaterials).forEach((k) => { if (MATERIALS[k]) Object.assign(MATERIALS[k], savedMaterials[k]); });
  const savedChamferRate = storage.get('ik_admin_fas', null);
  if (savedChamferRate != null) calcState.chamferRate = savedChamferRate;
}

function persistCatalog() { storage.set('ik_admin_P', PRODUCTS); }
function persistGallery() { storage.set('ik_admin_G', GALLERY); }
function persistMaterials() { storage.set('ik_admin_M', MATERIALS); storage.set('ik_admin_fas', calcState.chamferRate); }

function adminGateViewHtml() {
  return `<div class="loginwrap"><div class="demo-badge">Только для владельца сайта</div><h1>Админ-панель</h1><div class="sub">Введите PIN-код</div>
  <input type="tel" id="apin" placeholder="PIN"><button class="btn" id="adminGo" style="margin-top:14px">Войти</button></div>`;
}

function renderAdminGate() {
  $('#app').innerHTML = adminGateViewHtml();
  $('#adminGo').onclick = () => {
    if ($('#apin').value.trim() === ADMIN_PIN) {
      storage.set('ik_admin_auth', true);
      toast('Добро пожаловать, админ');
      renderAdmin();
    } else {
      toast('Неверный PIN');
    }
  };
}

function adminViewHtml() {
  return `
  <div class="top"><h1>Админ-панель</h1><div class="sub">Правки видны сразу у вас. Чтобы их видели все посетители — нужен шаг 2 (общая база данных)</div></div>

  <div class="cab-sec">Цены на камень, ₽/м³</div>
  <div class="box">${Object.entries(MATERIALS).map(([k, v]) => `
    <div class="row" style="margin-bottom:8px"><span>${v.name}</span><input type="text" inputmode="numeric" style="width:130px;text-align:right" data-mp="${k}" value="${v.pricePerM3}"></div>`).join('')}
  </div>

  <div class="cab-sec">Фаска, ₽ за пог. метр</div>
  <div class="box"><input type="text" inputmode="numeric" id="fasInput" value="${calcState.chamferRate}"></div>
  <button class="btn" id="saveStone">Сохранить цены</button>

  <div class="cab-sec" style="margin-top:26px">Заявки на обратный звонок (${store.leads.length})</div>
  ${store.leads.length ? store.leads.slice().reverse().map((l) => `
    <div class="lead"><b>+${l.phone}</b>${l.name ? l.name + ' · ' : ''}${l.date}
    <button class="lnk danger" data-leaddel="${l.id}" style="margin-left:8px">Удалить</button></div>`).join('') : `<div class="empty-small">Заявок пока нет</div>`}

  <div class="cab-sec" style="margin-top:26px">Товары каталога (${PRODUCTS.length})</div>
  ${PRODUCTS.map((p, ix) => `
    <div class="box">
      <input type="text" data-pn="${ix}" value="${p.name}" style="margin-bottom:8px">
      <div class="row" style="gap:8px">
        <input type="text" inputmode="numeric" data-pp="${ix}" value="${p.price}" style="flex:1;min-width:0">
        <select data-pc="${ix}" style="flex:1;min-width:0">${CATEGORIES.filter((c) => c !== 'Все').map((c) => `<option ${c === p.category ? 'selected' : ''}>${c}</option>`).join('')}</select>
        <select data-pm="${ix}" style="flex:1;min-width:0">${Object.entries(MATERIALS).map(([k, v]) => `<option value="${k}" ${k === p.material ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
      </div>
      <button class="lnk danger" data-pdel="${ix}" style="margin-top:6px">Удалить товар</button>
    </div>`).join('')}
  <button class="btn g2" id="addProduct">+ Добавить товар</button>

  <div class="cab-sec" style="margin-top:26px">Фото работ (${GALLERY.length})</div>
  ${GALLERY.map((g, ix) => `
    <div class="box"><img src="${g.src}" style="width:100%;border-radius:10px;margin-bottom:8px">
    <input type="text" data-gt="${ix}" value="${g.caption}">
    <button class="lnk danger" data-gdel="${ix}" style="margin-top:6px">Удалить фото</button></div>`).join('')}
  <label class="btn g2" style="display:block;text-align:center;cursor:pointer">+ Добавить фото<input type="file" accept="image/*" id="addPhoto" style="display:none"></label>

  <button class="lnk" id="adminLogout" style="margin:28px 0 10px">Выйти из админ-панели</button>
  `;
}

function renderAdmin() {
  $('#app').innerHTML = adminViewHtml();
  bindAdmin();
}

function bindAdmin() {
  $$('[data-go]').forEach((b) => { b.onclick = () => window.dispatchEvent(new CustomEvent('ik:navigate', { detail: b.dataset.go })); });
  $$('[data-mp]').forEach((i) => { i.onchange = () => { MATERIALS[i.dataset.mp].pricePerM3 = +i.value || 0; }; });
  $('#fasInput').onchange = (e) => { calcState.chamferRate = +e.target.value || 0; };
  $('#saveStone').onclick = () => { persistMaterials(); toast('Цены сохранены'); };
  $$('[data-leaddel]').forEach((b) => { b.onclick = () => { store.leads = store.leads.filter((l) => l.id !== b.dataset.leaddel); storage.set('ik_leads', store.leads); renderAdmin(); }; });

  $$('[data-pn]').forEach((i) => { i.onchange = () => { PRODUCTS[+i.dataset.pn].name = i.value; persistCatalog(); }; });
  $$('[data-pp]').forEach((i) => { i.onchange = () => { PRODUCTS[+i.dataset.pp].price = +i.value || 0; persistCatalog(); }; });
  $$('[data-pc]').forEach((i) => { i.onchange = () => { PRODUCTS[+i.dataset.pc].category = i.value; persistCatalog(); }; });
  $$('[data-pm]').forEach((i) => { i.onchange = () => { PRODUCTS[+i.dataset.pm].material = i.value; persistCatalog(); }; });
  $$('[data-pdel]').forEach((b) => { b.onclick = () => { if (confirm('Удалить товар?')) { PRODUCTS.splice(+b.dataset.pdel, 1); persistCatalog(); renderAdmin(); } }; });
  $('#addProduct').onclick = () => { PRODUCTS.push({ id: Date.now(), name: 'Новый товар', price: 0, category: CATEGORIES[1], material: Object.keys(MATERIALS)[0] }); persistCatalog(); renderAdmin(); };

  $$('[data-gt]').forEach((i) => { i.onchange = () => { GALLERY[+i.dataset.gt].caption = i.value; persistGallery(); }; });
  $$('[data-gdel]').forEach((b) => { b.onclick = () => { if (confirm('Удалить фото?')) { GALLERY.splice(+b.dataset.gdel, 1); persistGallery(); renderAdmin(); } }; });
  $('#addPhoto').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { GALLERY.push({ src: reader.result, caption: 'Новая работа' }); persistGallery(); renderAdmin(); };
    reader.readAsDataURL(file);
  };
  $('#adminLogout').onclick = () => { storage.set('ik_admin_auth', false); window.dispatchEvent(new CustomEvent('ik:navigate', { detail: 'cab' })); };
}

export function routeAdmin() {
  isAdmin() ? renderAdmin() : renderAdminGate();
}
