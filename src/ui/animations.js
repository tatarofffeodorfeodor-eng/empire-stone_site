import { $ } from './dom.js';

/**
 * Короткий "бамп" — снять и тут же вернуть CSS-класс, чтобы анимация сыграла
 * заново даже при повторных кликах подряд (иначе повторное добавление класса
 * на уже анимированный элемент не запускает анимацию заново).
 */
export function bump(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth; // форсируем reflow, чтобы браузер "забыл" предыдущее состояние анимации
  el.classList.add(className);
  el.addEventListener('animationend', () => el.classList.remove(className), { once: true });
}

/**
 * Маленькая точка "+1", которая летит от нажатой кнопки к иконке корзины в шапке.
 * Траектория — дуга: у неё есть "горбинка" (--arc), которая равна нулю в начале
 * и в конце пути (кейфреймы см. site.css), поэтому точка всегда точно
 * приземляется в иконку корзины, без рывков.
 */
export function flyToCart(fromEl) {
  if (!fromEl) return;
  const from = fromEl.getBoundingClientRect();
  const to = $('.cartbtn').getBoundingClientRect();
  if (!from.width || !to.width) return;

  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2);

  const dot = document.createElement('div');
  dot.className = 'flydot';
  dot.style.left = (from.left + from.width / 2 - 7) + 'px';
  dot.style.top = (from.top + from.height / 2 - 7) + 'px';
  dot.style.setProperty('--dx', dx + 'px');
  dot.style.setProperty('--dy', dy + 'px');
  dot.style.setProperty('--arc', (-Math.min(90, 40 + Math.abs(dy) * 0.12)) + 'px');
  document.body.appendChild(dot);
  dot.addEventListener('animationend', () => dot.remove(), { once: true });
  setTimeout(() => bump($('#cartDot'), 'bump'), 720); // бейдж подпрыгивает в момент "приземления" точки
}
