import { $$, formatRub } from '../ui/dom.js';
import { toast, showOkAnimation, confetti } from '../ui/toast.js';
import { MATERIALS } from '../data/materials.js';
import { calcState, calculate } from '../calculator/calculator.js';
import { store, persist, cartTotal } from '../state/store.js';
import { createOrder } from '../lib/leads-orders.js';

export function cartViewHtml() {
  const total = cartTotal();
  return `
  <div class="top"><h1>Корзина</h1><div class="sub">${store.cart.length ? store.cart.length + ' позиции' : 'Пока пусто'}</div></div>
  ${store.cart.length ? store.cart.map((item, ix) => `
    <div class="it">
      <div class="sw" style="background:radial-gradient(90% 70% at 50% 100%,${MATERIALS[item.material] ? MATERIALS[item.material].colorLight : '#8c1f2b'},${MATERIALS[item.material] ? MATERIALS[item.material].colorDark : '#3b2628'})"></div>
      <div class="n">${item.name}<br><span style="color:var(--mute);font-weight:600">${formatRub(item.price)}</span></div>
      <div class="q"><button data-q="-${ix}">–</button><b>${item.qty}</b><button data-q="+${ix}">+</button></div>
    </div>`).join('') : `<div class="empty">Добавьте товары из каталога или расчёта</div>`}
  ${store.cart.length ? `
  <div class="box" style="margin-top:14px"><div class="row"><b>Итого</b><b>${formatRub(total)}</b></div></div>
  <button class="btn" id="checkout">Оформить заказ</button>
  <button class="lnk danger" id="clearCart" style="display:block;margin:12px auto 0">Очистить корзину</button>` : ''}
  `;
}

/** Добавляет текущий расчёт из калькулятора в корзину как отдельную позицию. */
export function addCalculationToCart({ rerender, onAdded } = {}) {
  const result = calculate();
  if (result.price == null) return;
  let name;
  if (calcState.mode === 'sill') {
    name = `Подоконник ${calcState.sill.length}×${calcState.sill.depth} см${calcState.sill.stone === 'limestone' ? ', мраморизованный известняк' : ''}`;
  } else if (calcState.mode === 'table') {
    name = `Стол круглый, Ø${calcState.table.diameter} см`;
  } else {
    name = `${MATERIALS[calcState.material].name}, ${calcState.mode === 'volume' ? `${calcState.length}×${calcState.width}×${calcState.height} см` : `${calcState.length}×${calcState.width} см, ${calcState.tileThickness} см плитка`}${calcState.chamfer ? ' + фаска' : ''}`;
  }
  store.cart.push({
    id: 'calc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name, price: result.price, qty: 1,
    material: (calcState.mode === 'sill' || calcState.mode === 'table') ? null : calcState.material,
  });
  persist();
  toast('Расчёт добавлен в корзину');
  rerender();
  onAdded?.();
}

export function bindCartView({ rerender, goTo, sendToTelegram }) {
  $$('[data-q]').forEach((b) => {
    b.onclick = () => {
      const data = b.dataset.q;
      const ix = +data.slice(1);
      store.cart[ix].qty += data[0] === '+' ? 1 : -1;
      if (store.cart[ix].qty <= 0) store.cart.splice(ix, 1);
      persist();
      rerender();
    };
  });
  const checkout = document.querySelector('#checkout');
  if (checkout) {
    checkout.onclick = () => {
      if (!store.user) { toast('Войдите, чтобы оформить заказ'); goTo('cab'); return; }
      const total = cartTotal();
      const items = store.cart.map((i) => ({ name: i.name, qty: i.qty }));
      const tempLabel = '№' + (store.orders.length + 1001);
      // Мгновенный оптимистичный отклик — не ждём сеть, чтобы не тормозить UI.
      store.orders.push({ id: tempLabel, date: new Date().toLocaleDateString('ru-RU'), items, total, status: 'new' });
      store.cart = [];
      persist();
      showOkAnimation();
      confetti();
      toast('Заказ оформлен!');
      setTimeout(() => goTo('cab'), 600);
      // Настоящая запись — в общую БД (виден админу с любого устройства и
      // попадёт в историю покупателя в личном кабинете при следующей загрузке).
      createOrder({ phone: store.user.phone, items, total })
        .then((saved) => sendToTelegram({ type: 'order', orderId: saved ? '№' + saved.order_no : tempLabel, items, total }))
        .catch(() => sendToTelegram({ type: 'order', orderId: tempLabel, items, total }));
    };
  }
  const clearCart = document.querySelector('#clearCart');
  if (clearCart) {
    clearCart.onclick = () => {
      if (!store.cart.length) return;
      if (confirm('Очистить корзину? Все товары будут удалены.')) {
        store.cart = [];
        persist();
        toast('Корзина очищена');
        rerender();
      }
    };
  }
}
