import { CATEGORIES } from '../data/product-catalog.js';
import { LOGO_SRC } from '../data/gallery.js';

export function footerHtml() {
  return `
  <footer class="sfoot">
    <div class="sfoot-brand"><img class="lg sm" src="${LOGO_SRC}" alt="" loading="lazy" decoding="async"><span>Империя камня</span></div>
    <div class="goldbar"><span class="n"></span><span class="w"></span><span class="n"></span></div>
    <div class="sfoot-cols">
      <div class="sfoot-col">
        <b>Компания</b>
        <button class="sfoot-lnk" data-go="about">О нас</button>
        <button class="sfoot-lnk" data-go="works">Наши работы</button>
        <button class="sfoot-lnk" data-go="calc">Расчёт стоимости</button>
      </div>
      <div class="sfoot-col">
        <b>Каталог</b>
        ${CATEGORIES.filter((c) => c !== 'Все').map((c) => `<button class="sfoot-lnk" data-foot-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="sfoot-col">
        <b>Контакты</b>
        <a href="tel:+79204812075">+7 (920) 481-20-75</a>
        <a href="https://wa.me/79204812075" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://vk.com/club76623292" target="_blank" rel="noopener">ВКонтакте</a>
      </div>
      <div class="sfoot-col">
        <b>Адреса</b>
        <span>ул. Бастионная, 29<br>ежедневно 8:30–17:30</span>
        <span>ул. Мичуринская, 275<br>ежедневно 9:00–18:00</span>
      </div>
    </div>
    <div class="sfoot-copy">© ${new Date().getFullYear()} Империя камня · Тамбов</div>
  </footer>`;
}
