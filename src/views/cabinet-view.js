import { $, $$, formatRub } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { MATERIALS } from '../data/materials.js';
import { PRODUCTS } from '../data/product-catalog.js';
import { store, persist } from '../state/store.js';
import { calcState } from '../calculator/calculator.js';

function statusLabel(status) {
  if (status === 'new') return ['Новый', 'st-new'];
  if (status === 'work') return ['В работе', 'st-work'];
  return ['Выполнен', 'st-done'];
}

export function cabinetViewHtml() {
  if (!store.user) {
    return `<div class="cab-locked"><h1>Кабинет</h1><p class="sub">Войдите, чтобы увидеть заказы, расчёты и избранное</p><button class="btn" id="goLogin" style="width:auto">Войти по телефону</button>
    <div style="margin-top:34px"><button class="lnk" id="adminLink" style="font-size:11px;opacity:.5">Панель администратора</button></div></div>`;
  }
  const favoriteProducts = PRODUCTS.filter((p) => store.favorites.has(p.id));
  return `
  <div class="cab-head"><div><div class="who">Личный кабинет</div><div class="phone">+${store.user.phone}</div></div><button class="lnk danger" id="logout">Выйти</button></div>

  <div class="cab-sec">Мои заказы${store.orders.length ? `<button class="lnk danger" id="clearOrders">Очистить все</button>` : ''}</div>
  ${store.orders.length ? store.orders.slice().reverse().map((o) => {
    const [label, cls] = statusLabel(o.status);
    return `
    <div class="ord"><div class="row1"><span class="id">Заказ ${o.id}</span><span class="st ${cls}">${label}</span></div>
    <div class="lines">${o.items.map((i) => `${i.name} ×${i.qty}`).join('\n')}</div>
    <div class="tot">${formatRub(o.total)} · ${o.date}</div></div>`;
  }).join('') : `<div class="empty-small">Заказов пока нет</div>`}

  <div class="cab-sec">Сохранённые расчёты</div>
  ${store.savedCalculations.length ? store.savedCalculations.slice().reverse().map((c) => `
    <div class="calcsav"><div class="sw" style="background:radial-gradient(90% 70% at 50% 100%,${MATERIALS[c.material] ? MATERIALS[c.material].colorLight : '#8c1f2b'},${MATERIALS[c.material] ? MATERIALS[c.material].colorDark : '#3b2628'})"></div>
    <div class="ri"><b>${formatRub(c.result)}</b><span>${MATERIALS[c.material] ? MATERIALS[c.material].name : ''} · ${c.length}×${c.width}${c.mode === 'volume' ? '×' + c.height : ''} см</span></div>
    <button class="lnk" data-usecalc="${c.id}">Повторить</button></div>`).join('') : `<div class="empty-small">Пока нет сохранённых расчётов</div>`}

  <div class="cab-sec">Избранное</div>
  ${favoriteProducts.length ? favoriteProducts.map((p) => `
    <div class="calcsav"><div class="sw" style="background:radial-gradient(90% 70% at 50% 100%,${MATERIALS[p.material].colorLight},${MATERIALS[p.material].colorDark})"></div>
    <div class="ri"><b>${p.name}</b><span>${formatRub(p.price)}</span></div>
    <button class="lnk" data-add="${p.id}">В корзину</button></div>`).join('') : `<div class="empty-small">Нажимайте ♡ в каталоге, чтобы сохранить сюда</div>`}

  <div class="cab-sec">Адреса<button class="lnk" id="addAddr">+ Добавить</button></div>
  ${store.addresses.length ? store.addresses.map((a, ix) => `<div class="addrow"><span style="flex:1">${a}</span><button class="lnk danger" data-deladdr="${ix}">Удалить</button></div>`).join('') : `<div class="empty-small">Адреса пока не добавлены</div>`}

  <div style="text-align:center;margin-top:30px"><button class="lnk" id="adminLink" style="font-size:11px;opacity:.5">Панель администратора</button></div>
  `;
}

export function bindCabinetView({ rerender, goTo }) {
  const goLogin = $('#goLogin');
  if (goLogin) goLogin.onclick = () => goTo('login');
  const adminLink = $('#adminLink');
  if (adminLink) adminLink.onclick = () => goTo('admin');
  const logout = $('#logout');
  if (logout) logout.onclick = () => { store.user = null; persist(); rerender(); };
  const clearOrders = $('#clearOrders');
  if (clearOrders) {
    clearOrders.onclick = () => {
      if (confirm('Очистить всю историю заказов? Это действие нельзя отменить.')) {
        store.orders = [];
        persist();
        toast('История заказов очищена');
        rerender();
      }
    };
  }
  const addAddr = $('#addAddr');
  if (addAddr) {
    addAddr.onclick = () => {
      const address = prompt('Введите адрес:');
      if (address && address.trim()) { store.addresses.push(address.trim()); persist(); rerender(); }
    };
  }
  $$('[data-deladdr]').forEach((b) => { b.onclick = () => { store.addresses.splice(+b.dataset.deladdr, 1); persist(); rerender(); }; });
  $$('[data-usecalc]').forEach((b) => {
    b.onclick = () => {
      const saved = store.savedCalculations.find((c) => c.id === b.dataset.usecalc);
      if (!saved) return;
      calcState.mode = saved.mode;
      calcState.material = saved.material;
      calcState.length = saved.length;
      calcState.width = saved.width;
      calcState.height = saved.height;
      calcState.tileThickness = saved.tileThickness;
      calcState.chamfer = saved.chamfer;
      goTo('calc');
    };
  });
}
