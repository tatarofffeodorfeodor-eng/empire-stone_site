import { supabase, isBackendConfigured } from './supabase.js';

/** Заявка на обратный звонок — пишется в общую БД, видна админу с любого устройства. */
export async function createLead({ phone, name }) {
  if (!isBackendConfigured) return null;
  const { data, error } = await supabase.from('leads').insert({ phone, name: name || null }).select().single();
  if (error) { console.error('[leads] insert failed:', error); return null; }
  return data;
}

/** Заказ из корзины. Возвращает читаемый номер заказа (order_no) или null, если бэкенд не настроен/упал. */
export async function createOrder({ phone, items, total }) {
  if (!isBackendConfigured) return null;
  const { data, error } = await supabase.from('orders').insert({ phone, items, total }).select().single();
  if (error) { console.error('[orders] insert failed:', error); return null; }
  return data;
}

/** Только для админ-панели (RLS пропускает select по этим таблицам только админа). */
export async function fetchLeadsAdmin() {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[leads] fetch failed:', error); return []; }
  return data || [];
}

export async function deleteLeadAdmin(id) {
  if (!isBackendConfigured) return;
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchOrdersAdmin() {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[orders] fetch failed:', error); return []; }
  return data || [];
}

export async function updateOrderStatusAdmin(id, status) {
  if (!isBackendConfigured) return;
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteOrderAdmin(id) {
  if (!isBackendConfigured) return;
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}
