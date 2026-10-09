import { supabase, isBackendConfigured } from './supabase.js';

/** Заявка "свой проект" — с описанием и опциональным фото/эскизом (bucket custom-order-photos). */
export async function createCustomOrder({ phone, name, description, photoFile }) {
  if (!isBackendConfigured) return null;
  let photoUrl = null;
  if (photoFile) {
    const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('custom-order-photos').upload(path, photoFile, {
      cacheControl: '31536000', upsert: false,
    });
    if (uploadError) { console.error('[custom-orders] upload failed:', uploadError); }
    else {
      const { data: pub } = supabase.storage.from('custom-order-photos').getPublicUrl(path);
      photoUrl = pub.publicUrl;
    }
  }
  const { data, error } = await supabase.from('custom_orders').insert({
    phone, name: name || null, description, photo_url: photoUrl,
  }).select().single();
  if (error) { console.error('[custom-orders] insert failed:', error); return null; }
  return data;
}

export async function fetchCustomOrdersAdmin() {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase.from('custom_orders').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[custom-orders] admin fetch failed:', error); return []; }
  return data || [];
}

export async function updateCustomOrderStatusAdmin(id, status) {
  if (!isBackendConfigured) return;
  const { error } = await supabase.from('custom_orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteCustomOrderAdmin(id) {
  if (!isBackendConfigured) return;
  const { error } = await supabase.from('custom_orders').delete().eq('id', id);
  if (error) throw error;
}
