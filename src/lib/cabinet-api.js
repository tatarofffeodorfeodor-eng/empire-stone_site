/**
 * История заказов покупателя в личном кабинете.
 *
 * Вход в кабинет сейчас — демо-режим (просто ввод телефона, без SMS-кода),
 * поэтому доверять такому "пользователю" прямой публичный SELECT по таблице
 * orders нельзя: через Supabase RLS любой мог бы в таком случае читать чужие
 * заказы по API (RLS умеет разрешать/запрещать строки, но не умеет "только
 * свой телефон" без настоящей аутентификации). Вместо этого запрос идёт через
 * серверную функцию Netlify, у которой есть service-role ключ: она сама
 * фильтрует заказы по телефону и возвращает только их.
 */
export async function fetchOrdersByPhone(phone) {
  try {
    const res = await fetch(`/.netlify/functions/orders-by-phone?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[cabinet] не удалось загрузить заказы:', err);
    return [];
  }
}
