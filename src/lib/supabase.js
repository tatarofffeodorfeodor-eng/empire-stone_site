import { createClient } from '@supabase/supabase-js';

const env = import.meta.env || {};
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

/**
 * Клиент Supabase для браузера. Ключ anonKey — публичный по дизайну Supabase
 * (им нельзя сделать ничего, что не разрешено RLS-политиками в supabase/schema.sql),
 * поэтому его можно спокойно собирать в клиентский бандл через Vite.
 *
 * Если переменные окружения не заданы (например, при локальной разработке без
 * своего проекта Supabase) — клиент не создаётся, и остальной код сайта
 * работает на заводских данных из src/data/*.js (см. src/data/remote.js).
 */
export const supabase = (url && anonKey) ? createClient(url, anonKey) : null;

export const isBackendConfigured = Boolean(supabase);

if (!isBackendConfigured && env.DEV) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY не заданы — сайт работает на встроенных данных ' +
    '(каталог/цены/фото не будут общими для всех посетителей, админ-панель и личный кабинет недоступны). ' +
    'См. .env.example.'
  );
}
