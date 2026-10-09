/**
 * Шлёт короткие "пинги" на сервер (netlify/functions/track-visit.js), чтобы
 * в админке на вкладке "Пользователи" было видно, кто заходил и сколько
 * времени провёл на сайте. Работает только для вошедших в кабинет (у нас
 * есть только телефон — анонимных посетителей не трекаем, это не спрашивали).
 */
const HEARTBEAT_SECONDS = 20;
let heartbeatTimer = null;

function send(payload) {
  fetch('/.netlify/functions/track-visit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }).catch(() => {});
}

export function startHeartbeat(phone) {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (document.visibilityState === 'visible') send({ phone, event: 'heartbeat', seconds: HEARTBEAT_SECONDS });
  }, HEARTBEAT_SECONDS * 1000);
}

export function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

/** Вызывается один раз при успешном входе (и при старте приложения, если вход уже был сохранён). */
export function trackLogin(phone) {
  if (!phone) return;
  send({ phone, event: 'login' });
  startHeartbeat(phone);
}
