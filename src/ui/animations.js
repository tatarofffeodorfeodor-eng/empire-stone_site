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

let supportsOffsetPath = null;
function offsetPathSupported() {
  if (supportsOffsetPath === null) {
    supportsOffsetPath = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('offset-path', 'path("M0 0")');
  }
  return supportsOffsetPath;
}

/**
 * Маленькая светящаяся точка "+1", которая летит от нажатой кнопки к иконке
 * корзины в шапке по единой плавной дуге (offset-path — настоящая кривая,
 * без рывков и "ступенек"; в браузерах без поддержки — запасной вариант на
 * параболе, которая тоже точно равна нулю в начале и в конце пути).
 * Длительность подстраивается под расстояние, а бейдж корзины подпрыгивает
 * ровно в момент, когда точка долетает (а не по отдельному таймеру).
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
  const duration = Math.round(Math.min(620, Math.max(420, dist * 0.85)));

  const dot = document.createElement('div');
  dot.className = 'flydot';
  dot.style.left = (sx - 7) + 'px';
  dot.style.top = (sy - 7) + 'px';
  dot.style.animationDuration = duration + 'ms';

  if (offsetPathSupported()) {
    // Дугу всегда гнём чуть вверх — так полёт выглядит как бросок, а не скольжение по прямой.
    const bow = Math.min(70, dist * 0.24);
    const mx = dx / 2;
    const my = dy / 2 - bow;
    dot.style.offsetPath = `path("M 0 0 Q ${mx.toFixed(1)} ${my.toFixed(1)}, ${dx.toFixed(1)} ${dy.toFixed(1)}")`;
    dot.classList.add('flydot-path');
  } else {
    dot.style.setProperty('--dx', dx + 'px');
    dot.style.setProperty('--dy', dy + 'px');
    dot.style.setProperty('--arc', (-Math.min(90, 40 + Math.abs(dy) * 0.12)) + 'px');
    dot.classList.add('flydot-fallback');
  }

  document.body.appendChild(dot);
  dot.addEventListener('animationend', () => {
    dot.remove();
    bump($('#cartDot'), 'bump');
  }, { once: true });
}
