import { storage } from './storage.js';

/**
 * Состояние приложения на клиенте. Пока единственный источник хранения —
 * localStorage (см. persist()); когда появится общий бэкенд (Supabase или
 * аналог), именно здесь будет точка подмены.
 *
 * store — обычный изменяемый объект: импортирующие модули читают и пишут
 * его поля напрямую (store.cart.push(...), store.cart = [] и т.д.) и вызывают
 * persist() после изменений, которые должны пережить перезагрузку страницы.
 */
export const store = {
  cart: storage.get('ik_cart', []),            // [{id, name, price, qty, material}]
  favorites: new Map(storage.get('ik_fav', [])), // productId -> true
  user: storage.get('ik_user', null),           // {phone}
  orders: storage.get('ik_orders', []),         // [{id, date, items, total, status}]
  savedCalculations: storage.get('ik_calc', []),// [{id, date, result, ...состояние калькулятора}]
  addresses: storage.get('ik_addr', []),        // [string]
  leads: storage.get('ik_leads', []),           // [{id, date, name, phone}] — заявки на обратный звонок
};

export function persist() {
  storage.set('ik_cart', store.cart);
  storage.set('ik_fav', [...store.favorites]);
  storage.set('ik_user', store.user);
  storage.set('ik_orders', store.orders);
  storage.set('ik_calc', store.savedCalculations);
  storage.set('ik_addr', store.addresses);
  storage.set('ik_leads', store.leads);
}

export function cartItemCount() {
  return store.cart.reduce((sum, item) => sum + item.qty, 0);
}

export function cartTotal() {
  return store.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}
