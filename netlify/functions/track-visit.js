// Пишет/обновляет строку в таблице visitors (кто заходил в кабинет, когда,
// сколько раз, сколько суммарно времени провёл на сайте) — для вкладки
// "Пользователи" в админке. Идёт через service-role ключ, потому что в этой
// таблице телефоны всех клиентов сайта — её не открываем для прямых
// анонимных запросов (см. supabase/schema.sql, visitors не имеет policy).
//
// event: 'login' — клиент вошёл в кабинет (увеличивает visits_count)
// event: 'heartbeat' — клиент на сайте, добавляет seconds к time_spent_seconds
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: 'Supabase не настроен на сервере' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'Bad JSON' }; }

  const phone = (body.phone || '').replace(/\D/g, '');
  const evt = body.event === 'heartbeat' ? 'heartbeat' : 'login';
  const seconds = Math.max(0, Math.min(300, Number(body.seconds) || 0)); // защита от случайного огромного значения

  if (phone.length < 10) {
    return { statusCode: 400, body: 'Bad phone' };
  }

  const headers = {
    apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json',
  };

  try {
    const getRes = await fetch(`${supabaseUrl}/rest/v1/visitors?phone=eq.${encodeURIComponent(phone)}&select=phone,visits_count,time_spent_seconds`, { headers });
    const existing = (await getRes.json())[0];

    const nowIso = new Date().toISOString();
    const row = existing
      ? {
          phone,
          last_seen: nowIso,
          visits_count: existing.visits_count + (evt === 'login' ? 1 : 0),
          time_spent_seconds: existing.time_spent_seconds + (evt === 'heartbeat' ? seconds : 0),
        }
      : { phone, first_seen: nowIso, last_seen: nowIso, visits_count: 1, time_spent_seconds: evt === 'heartbeat' ? seconds : 0 };

    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/visitors`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(row),
    });
    if (!upsertRes.ok) {
      const text = await upsertRes.text();
      return { statusCode: 502, body: `Supabase error: ${text}` };
    }
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    return { statusCode: 500, body: 'Track failed: ' + e.message };
  }
};
