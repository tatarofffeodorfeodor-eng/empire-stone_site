import { supabase, isBackendConfigured } from './supabase.js';

/** Отзывы покупателей — публичное чтение (видно всем), запись — через форму ниже. */
export async function fetchReviews() {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[reviews] fetch failed:', error); return []; }
  return data || [];
}

/** Публикует отзыв; фото — опционально, грузится в bucket review-photos. */
export async function createReview({ authorName, rating, text, photoFile }) {
  if (!isBackendConfigured) throw new Error('Backend not configured');
  let photoUrl = null;
  if (photoFile) {
    const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('review-photos').upload(path, photoFile, {
      cacheControl: '31536000', upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: pub } = supabase.storage.from('review-photos').getPublicUrl(path);
    photoUrl = pub.publicUrl;
  }
  const { data, error } = await supabase.from('reviews').insert({
    author_name: authorName, rating, text, photo_url: photoUrl,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchReviewsAdmin() {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[reviews] admin fetch failed:', error); return []; }
  return data || [];
}

export async function deleteReviewAdmin(id) {
  if (!isBackendConfigured) return;
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}
