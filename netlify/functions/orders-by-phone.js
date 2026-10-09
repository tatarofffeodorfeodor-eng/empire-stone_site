// Отдаёт личному кабинету покупателя только ЕГО заказы (фильтр по телефону).
// Использует service-role ключ Supabase, который обходит RLS, — поэтому
// живёт в серверной функции, а не в коде браузера: если бы ключ оказался
// на клиенте, через него можно было бы прочитать вообще все таблицы.
// Токен и URL — из переменных окружения Netlify (Site configuration →
// Environment variables → SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: 'Supabase не настроен на сервере (нет переменных окружения)' };
  }

  const phone = (event.queryStringParameters && event.queryStringParameters.phone || '').replace(/\D/g, '');
  if (phone.length < 10) {
    return { statusCode: 400, body: 'Bad phone' };
  }

  try {
    const url = `${supabaseUrl}/rest/v1/orders?phone=eq.${encodeURIComponent(phone)}&order=created_at.desc&select=id,order_no,items,total,status,created_at`;
    const res = await fetch(url, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const text = await res.text();
    if (!res.ok) {
      return { statusCode: 502, body: `Supabase error: ${text}` };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (e) {
    return { statusCode: 500, body: 'Lookup failed: ' + e.message };
  }
};
