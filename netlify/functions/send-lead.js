// Пересылает заявки с сайта в Telegram владельцу.
// Токен бота и chat ID берутся из переменных окружения Netlify (не из кода!) —
// заданы в Netlify: Project configuration → Environment variables.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
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
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: 502, body: `Telegram error: ${errText}` };
    }
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    return { statusCode: 500, body: 'Send failed: ' + e.message };
  }
};
