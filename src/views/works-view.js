import { $, $$ } from '../ui/dom.js';
import { GALLERY } from '../data/gallery.js';
import { isBackendConfigured } from '../lib/supabase.js';
import { fetchReviews, createReview } from '../lib/reviews.js';
import { openLightbox } from '../ui/lightbox.js';

// Отзывы — общие (хранятся в Supabase), подгружаются один раз при первом
// открытии вкладки "Работы" и кэшируются в памяти модуля на время сессии.
let reviewsCache = [];
let reviewsLoaded = !isBackendConfigured;
let reviewsLoading = false;
let formOpen = false;
let formRating = 5;
let formBusy = false;
let formError = '';
let mapInstance = null;

function starsHtml(rating, interactive) {
  return `<div class="stars ${interactive ? 'pick' : ''}">${[1, 2, 3, 4, 5].map((n) => `<span data-star="${n}" class="${n <= rating ? 'on' : ''}">★</span>`).join('')}</div>`;
}

function reviewCardHtml(r) {
  return `<div class="revcard">
    <div class="revhead">${starsHtml(r.rating, false)}<b>${r.author_name}</b></div>
    ${r.photo_url ? `<img src="${r.photo_url}" alt="" loading="lazy" class="revphoto">` : ''}
    <p>${r.text}</p>
    <span class="revdate">${new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
  </div>`;
}

function reviewFormHtml() {
  return `<div class="revform">
    <div class="cab-sec" style="margin:0 0 10px">Ваш отзыв</div>
    ${starsHtml(formRating, true)}
    <input type="text" id="revName" placeholder="Ваше имя" maxlength="60">
    <textarea id="revText" placeholder="Расскажите, как всё прошло" rows="3" maxlength="600"></textarea>
    <input type="file" id="revPhoto" accept="image/*">
    ${formError ? `<div class="rev-err">${formError}</div>` : ''}
    <div class="revform-actions">
      <button class="btn" id="revSend" ${formBusy ? 'disabled' : ''}>${formBusy ? 'Отправка…' : 'Опубликовать'}</button>
      <button class="lnk" id="revCancel">Отмена</button>
    </div>
  </div>`;
}

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

  ${GALLERY.some((g) => g.lat != null && g.lng != null) ? `
  <div class="cab-sec" style="margin-top:26px">Где мы уже работали</div>
  <div id="worksMap" class="works-map"></div>
  ` : ''}

  <div class="cab-sec" style="margin-top:26px">Отзывы покупателей${!formOpen && isBackendConfigured ? `<button class="lnk" id="revOpen">+ Оставить отзыв</button>` : ''}</div>
  ${formOpen ? reviewFormHtml() : ''}
  ${!isBackendConfigured ? `<div class="empty-small">Отзывы появятся после настройки бэкенда</div>`
    : !reviewsLoaded ? `<div class="empty-small">Загрузка отзывов…</div>`
    : reviewsCache.length ? `<div class="revlist">${reviewsCache.map(reviewCardHtml).join('')}</div>`
    : `<div class="empty-small">Пока нет отзывов — будьте первым</div>`}
  `;
}

/** Плавное появление фото при прокрутке — каждая карточка "всплывает" один раз, когда попадает в экран. */
export function bindWorksView({ rerender } = {}) {
  const items = $$('.showcase-item');
  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach((el) => el.classList.add('is-visible'));
  } else {
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

  const mapEl = $('#worksMap');
  if (mapEl && window.L) {
    if (mapInstance) { try { mapInstance.remove(); } catch (e) {} mapInstance = null; }
    const pins = GALLERY.map((g, i) => ({ ...g, i })).filter((g) => g.lat != null && g.lng != null);
    if (pins.length) {
      mapInstance = window.L.map('worksMap', { scrollWheelZoom: false });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(mapInstance);
      const bounds = window.L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
      pins.forEach((p) => {
        window.L.marker([p.lat, p.lng]).addTo(mapInstance)
          .bindPopup(p.caption)
          .on('click', () => openLightbox(p.i));
      });
      mapInstance.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      if (pins.length === 1) mapInstance.setZoom(13);
    }
  }

  if (isBackendConfigured && !reviewsLoaded && !reviewsLoading && rerender) {
    reviewsLoading = true;
    fetchReviews().then((data) => {
      reviewsCache = data;
      reviewsLoaded = true;
      reviewsLoading = false;
      rerender();
    });
  }

  const revOpen = $('#revOpen');
  if (revOpen) revOpen.onclick = () => { formOpen = true; formError = ''; rerender && rerender(); };
  const revCancel = $('#revCancel');
  if (revCancel) revCancel.onclick = () => { formOpen = false; formError = ''; rerender && rerender(); };

  $$('.revform .stars.pick [data-star]').forEach((s) => {
    s.onclick = () => { formRating = +s.dataset.star; rerender && rerender(); };
  });

  const revSend = $('#revSend');
  if (revSend) {
    revSend.onclick = async () => {
      const name = $('#revName') ? $('#revName').value.trim() : '';
      const text = $('#revText') ? $('#revText').value.trim() : '';
      const photoFile = $('#revPhoto') && $('#revPhoto').files[0];
      if (!name || !text) { formError = 'Укажите имя и текст отзыва'; rerender && rerender(); return; }
      formBusy = true; formError = '';
      rerender && rerender();
      try {
        const created = await createReview({ authorName: name, rating: formRating, text, photoFile });
        reviewsCache = [created, ...reviewsCache];
        formOpen = false; formRating = 5; formBusy = false;
        rerender && rerender();
      } catch (err) {
        console.error('[reviews] submit failed:', err);
        formBusy = false;
        formError = 'Не удалось отправить отзыв, попробуйте ещё раз';
        rerender && rerender();
      }
    };
  }
}
