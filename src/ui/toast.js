import { $ } from './dom.js';

let toastTimer = null;
export function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
}

export function showOkAnimation() {
  const el = $('#okanim');
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 1400);
}

/** Конфетти при оформлении заказа — простая canvas-анимация частиц, самоудаляется через 70 кадров. */
export function confetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:30;pointer-events:none';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  addEventListener('resize', resize);

  const colors = ['#e6c068', '#8c1f2b', '#fff6e6'];
  const particles = Array.from({ length: 70 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: Math.random() * -10 - 4,
    gravity: 0.35, size: 3 + Math.random() * 4,
    color: colors[~~(Math.random() * 3)],
    rotation: Math.random() * 6, rotationSpeed: (Math.random() - 0.5) * 0.3,
  }));

  let frame = 0;
  (function tick() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2 * 0.6);
      ctx.restore();
    });
    if (frame < 70) requestAnimationFrame(tick);
    else canvas.remove();
  })();
}
