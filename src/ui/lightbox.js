import { $ } from './dom.js';
import { GALLERY } from '../data/gallery.js';

let currentIndex = 0;

function renderCurrent() {
  const item = GALLERY[currentIndex];
  $('#lbi').src = item.src;
  $('#lbt').textContent = `${item.caption}  ·  ${currentIndex + 1}/${GALLERY.length}`;
  $('#lb').classList.add('on');
}

export function openLightbox(index) {
  currentIndex = index;
  renderCurrent();
}

/** action: 'n' (next), 'p' (prev), 'x' (close). */
export function controlLightbox(action) {
  if (action === 'x') { $('#lb').classList.remove('on'); return; }
  currentIndex = (currentIndex + (action === 'n' ? 1 : -1) + GALLERY.length) % GALLERY.length;
  renderCurrent();
}

/** Свайп влево/вправо по фото в лайтбоксе — переключает соседнее фото. Вызвать один раз при старте. */
export function initLightboxSwipe() {
  let touchStartX = 0;
  const lb = $('#lb');
  lb.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) controlLightbox(delta < 0 ? 'n' : 'p');
  });
}
