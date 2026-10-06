// Пересылает заявки с сайта в Telegram владельцу.
// Токен бота и chat ID берутся из переменных окружения Netlify (не из кода!) —
// заданы в Netlify: Project configuration → Environment variables.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log('TELEGRAM_BOT_TOKEN set:', !!token, 'length:', token ? token.length : 0);
  console.log('TELEGRAM_CHAT_ID set:', !!chatId, 'value:', chatId);

  if (!token || !chatId) {
    console.log('Missing env vars, aborting');
    return { statusCode: 500, body: 'Telegram не настроен (нет переменных окружения)' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Bad JSON' };
  }

  const { type, name, phone, items, total, orderId } = data;

  let text;
  if (type === 'order') {
    const lines = (items || []).map(i => `• ${i.n} × ${i.qty}`).join('\n');
    text =
      `🛒 Новый заказ ${orderId || ''}\n` +
      (lines ? lines + '\n' : '') +
      `Сумма: ${total ? total.toLocaleString('ru-RU') + ' ₽' : '—'}`;
  } else {
    text =
      `📞 Новая заявка на расчёт\n` +
      `Телефон: ${phone || '—'}` +
      (name ? `\nИмя: ${name}` : '');
  }

  try {
    console.log('Sending to Telegram, chatId:', chatId, 'text:', text);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const resText = await res.text();
    console.log('Telegram response status:', res.status, 'body:', resText);
    if (!res.ok) {
      return { statusCode: 502, body: `Telegram error: ${resText}` };
    }
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.log('Exception while sending:', e.message);
    return { statusCode: 500, body: 'Send failed: ' + e.message };
  }
};
