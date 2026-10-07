import { $$ } from '../ui/dom.js';
import { GALLERY } from '../data/gallery.js';

export function worksViewHtml() {
  return `
  <div class="brandhero works-hero">
    <div class="crown">♛</div>
    <h1>НАШИ РАБОТЫ</h1>
    <div class="goldbar"><span class="n"></span><span class="w"></span><span class="n"></span></div>
    <p class="sub2">${GALLERY.length} реальных объектов из гранита и мрамора — ступени, кухни, камины, ландшафт</p>
  </div>
  <div class="showcase">${GALLERY.map((g, i) => `
    <figure class="showcase-item" data-o="${i}" style="--i:${i}">
      <img src="${g.src}" alt="${g.caption}" loading="lazy" decoding="async">
      <figcaption><span>${g.caption}</span></figcaption>
    </figure>`).join('')}</div>
  `;
}

/** Плавное появление фото при прокрутке — каждая карточка "всплывает" один раз, когда попадает в экран. */
export function bindWorksView() {
  const items = $$('.showcase-item');
  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el) => observer.observe(el));
}
