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

/** Кубическое ease-out — быстрый старт, плавное, предсказуемое замедление к цели. */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Маленькая светящаяся точка "+1", которая летит от нажатой кнопки к иконке
 * корзины в шапке.
 *
 * Траектория целиком считается здесь, в JS, кадр за кадром (через Web
 * Animations API), а не CSS-кейфреймами с отдельной `animation-timing-function` —
 * раньше это были две наложенные друг на друга "кривые" (сама кривая пути +
 * CSS-тайминг поверх неё), которые искажали друг друга и давали неровный,
 * рывками, полёт. Здесь кривая ровно одна: позиция и дуга считаются по
 * одному и тому же `t` на 30 чётко заданных кадрах, браузер просто линейно
 * интерполирует между соседними кадрами — визуально это абсолютно плавная
 * кривая. Плюс точка не начинает гаснуть, пока не "доедет" почти до конца.
 */
export function flyToCart(fromEl) {
  if (!fromEl) return;
  const from = fromEl.getBoundingClientRect();
  const cartEl = $('.cartbtn');
  if (!cartEl) return;
  const to = cartEl.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const sx = from.left + from.width / 2;
  const sy = from.top + from.height / 2;
  const ex = to.left + to.width / 2;
  const ey = to.top + to.height / 2;
  const dx = ex - sx;
  const dy = ey - sy;
  const dist = Math.hypot(dx, dy) || 1;
  const duration = Math.round(Math.min(680, Math.max(480, dist * 1.05)));

  const dot = document.createElement('div');
  dot.className = 'flydot';
  dot.style.left = (sx - 7) + 'px';
  dot.style.top = (sy - 7) + 'px';
  document.body.appendChild(dot);

  const land = () => { dot.remove(); bump($('#cartDot'), 'bump'); };

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || typeof dot.animate !== 'function') {
    land();
    return;
  }

  const bow = Math.min(80, dist * 0.26); // горбинка дуги — чуть выше прямой линии, как бросок
  const fadeFrom = 0.55; // точка летит на полной яркости первые 55% пути, затем плавно садится и гаснет
  const steps = 30;
  const frames = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const e = easeOutCubic(t);
    const arc = 4 * t * (1 - t); // 0 в начале и в конце пути, пик строго на середине — без рывков
    const x = dx * e;
    const y = dy * e - bow * arc;
    const settle = t < fadeFrom ? 0 : (t - fadeFrom) / (1 - fadeFrom);
    frames.push({
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - 0.82 * settle).toFixed(3)})`,
      opacity: `${(1 - settle).toFixed(3)}`,
    });
  }

  const anim = dot.animate(frames, { duration, easing: 'linear', fill: 'forwards' });
  anim.onfinish = land;
  anim.oncancel = land;
}
