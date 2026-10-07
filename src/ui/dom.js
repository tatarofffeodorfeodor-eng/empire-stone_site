export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => [...document.querySelectorAll(selector)];

/** Форматирует число как рубли: 12380 -> "12 380 ₽". */
export const formatRub = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';

/** Короткий случайный id для элементов корзины/заказов/расчётов. */
export const generateId = () => 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
