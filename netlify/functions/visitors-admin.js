// Отдаёт список посетителей (вкладка "Пользователи" в админке) — телефоны
// ВСЕХ клиентов разом, поэтому, в отличие от orders-by-phone.js (там нужно
// заранее знать конкретный номер), этот эндпоинт обязан сам проверить, что
// запрос действительно от залогиненного админа, а не просто кто угодно,
// кто нашёл адрес функции. Проверка — тем же способом, что и RLS на сайте:
// токен клиента → кто это по мнению Supabase Auth → есть ли он в admins.
export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: 'Supabase не настроен на сервере' };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) {
    return { statusCode: 401, body: 'No token' };
  }

  const svcHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  try {
    // Кто стучится — через его собственный токен, не service-role.
    const whoRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${accessToken}` },
    });
    if (!whoRes.ok) return { statusCode: 401, body: 'Invalid session' };
    const who = await whoRes.json();

    const adminRes = await fetch(`${supabaseUrl}/rest/v1/admins?user_id=eq.${who.id}&select=user_id`, { headers: svcHeaders });
    const adminRows = await adminRes.json();
    if (!Array.isArray(adminRows) || adminRows.length === 0) {
      return { statusCode: 403, body: 'Not an admin' };
    }

    const listRes = await fetch(`${supabaseUrl}/rest/v1/visitors?select=*&order=last_seen.desc`, { headers: svcHeaders });
    const text = await listRes.text();
    if (!listRes.ok) return { statusCode: 502, body: `Supabase error: ${text}` };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: text };
  } catch (e) {
    return { statusCode: 500, body: 'Lookup failed: ' + e.message };
  }
};
