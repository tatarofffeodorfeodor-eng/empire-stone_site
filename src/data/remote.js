import { supabase, isBackendConfigured } from '../lib/supabase.js';
import { MATERIALS } from './materials.js';
import { PRODUCTS } from './product-catalog.js';
import { GALLERY } from './gallery.js';
import { calcState } from '../calculator/calculator.js';

/**
 * Подтягивает каталог/цены/фото работ из Supabase и подменяет ими содержимое
 * MATERIALS/PRODUCTS/GALLERY ПРЯМО В ТЕХ ЖЕ объектах/массивах (не создаёт
 * новые) — это те самые объекты, которые импортированы по всему остальному
 * приложению, так что после загрузки все экраны сразу видят актуальные
 * данные без дополнительной "прокачки" через пропсы.
 *
 * Если Supabase не настроен (нет .env) или запрос не удался — остаются
 * заводские данные из src/data/*.js, сайт продолжает работать в демо-режиме.
 */
export async function loadRemoteData() {
  if (!isBackendConfigured) return;
  try {
    const [materialsRes, productsRes, galleryRes] = await Promise.all([
      supabase.from('materials').select('*'),
      supabase.from('products').select('*').order('id', { ascending: true }),
      supabase.from('gallery').select('*').order('position', { ascending: true }),
    ]);
    if (materialsRes.error) throw materialsRes.error;
    if (productsRes.error) throw productsRes.error;
    if (galleryRes.error) throw galleryRes.error;

    // Материалы: набор ключей (g/d/s/r/k/q) зашит в калькулятор, поэтому
    // обновляем только название/цену у уже известных ключей, а не
    // пересоздаём объект целиком.
    (materialsRes.data || []).forEach((row) => {
      if (MATERIALS[row.key]) {
        MATERIALS[row.key].name = row.name;
        MATERIALS[row.key].pricePerM3 = Number(row.price_per_m3) || 0;
      }
    });
    // Ставка фаски хранится как общее число в каждой строке materials — берём любую.
    const chamferRow = (materialsRes.data || [])[0];
    if (chamferRow && chamferRow.chamfer_rate != null) calcState.chamferRate = Number(chamferRow.chamfer_rate) || calcState.chamferRate;

    if (productsRes.data) {
      PRODUCTS.length = 0;
      productsRes.data.forEach((row) => PRODUCTS.push({
        id: row.id, name: row.name, price: Number(row.price) || 0,
        category: row.category, material: row.material, image: row.image,
        tag: row.tag || undefined,
      }));
    }

    if (galleryRes.data) {
      GALLERY.length = 0;
      galleryRes.data.forEach((row) => GALLERY.push({
        id: row.id, src: row.src, caption: row.caption,
        lat: row.lat != null ? Number(row.lat) : null,
        lng: row.lng != null ? Number(row.lng) : null,
      }));
    }
  } catch (err) {
    console.error('[remote] не удалось загрузить данные из Supabase, остаёмся на заводских:', err);
  }
}

/** Ставка фаски — общая величина (хранится в каждой строке materials одинаковой, см. remote.js loadRemoteData). */
export async function saveChamferRate(rate) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  const { error } = await supabase.from('materials').update({ chamfer_rate: rate }).neq('key', '');
  if (error) throw error;
}

export async function saveMaterialPrice(key, pricePerM3) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  const { error } = await supabase.from('materials').update({ price_per_m3: pricePerM3 }).eq('key', key);
  if (error) throw error;
}

export async function createProduct(product) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  const { data, error } = await supabase.from('products').insert({
    name: product.name, price: product.price, category: product.category, material: product.material,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, patch) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  const { error } = await supabase.from('products').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function updateGalleryCaption(id, caption) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  const { error } = await supabase.from('gallery').update({ caption }).eq('id', id);
  if (error) throw error;
}

export async function deleteGalleryPhoto(id) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw error;
}

/** Координаты объекта — для карты работ (src/views/works-view.js). Пусто = не показывать на карте. */
export async function updateGalleryLocation(id, lat, lng) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  const { error } = await supabase.from('gallery').update({ lat, lng }).eq('id', id);
  if (error) throw error;
}

/** Загружает фото в Storage (bucket gallery-photos) и создаёт запись в таблице gallery. */
export async function addGalleryPhoto(file, caption) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('gallery-photos').upload(path, file, {
    cacheControl: '31536000', upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data: pub } = supabase.storage.from('gallery-photos').getPublicUrl(path);
  const maxPosition = GALLERY.reduce((max, g, ix) => Math.max(max, ix), -1);
  const { data, error } = await supabase.from('gallery')
    .insert({ src: pub.publicUrl, caption: caption || 'Новая работа', position: maxPosition + 1 })
    .select().single();
  if (error) throw error;
  return data;
}
