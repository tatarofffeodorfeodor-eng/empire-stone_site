import { GALLERY } from '../data/gallery.js';

const FEATURED_PHOTO_INDEXES = [1, 6, 9];

export function aboutViewHtml() {
  const photos = FEATURED_PHOTO_INDEXES.filter((i) => GALLERY[i]);
  return `
  <div class="about-hero">
    <div class="crown">♛</div>
    <h1>ИМПЕРИЯ КАМНЯ</h1>
    <div class="goldbar"><span class="n"></span><span class="w"></span><span class="n"></span></div>
    <div class="tag">Семейные традиции, проверенные временем</div>
    <p class="sub2" style="max-width:480px;margin:10px auto 0">Работаем с гранитом и мрамором в Тамбове — памятники, лестницы, кухни и камины, которые остаются в семье на поколения.</p>
    <div class="stat30"><b>30</b><span>лет мы работаем с камнем</span></div>
  </div>

  <div class="box">
    <div class="cab-sec" style="margin:0 0 8px">Наша история</div>
    <p style="margin:0 0 10px;line-height:1.55">Империя камня — семейное дело: уже 30 лет мы занимаемся камнем, и за это время прошли путь от первых изделий до своего производства. От выбора плиты в карьере до монтажа на объекте всё проходит через одну команду, которая помнит в лицо каждого клиента. Для нас гранит и мрамор — не просто материал, а вещь, которая останется в доме на поколения, поэтому мы и называем свои традиции семейными: одно и то же качество от заказа к заказу и слово, которое мы держим.</p>
    <p style="margin:0;line-height:1.55;color:var(--mute)">Сегодня у нас два салона в Тамбове, свой цех обработки камня и сотни изделий — от памятников и ступеней до кухонных столешниц и каминов — уже стоящих в домах наших заказчиков.</p>
  </div>

  <div class="cab-sec" style="margin-top:18px">Путь компании</div>
  <div class="timeline">
    <div class="tl-item"><b>Начало пути</b>Небольшая мастерская и простое правило: камень должен служить долго, а цена — быть честной.</div>
    <div class="tl-item"><b>30 лет с камнем</b>Опыт, который накапливался год за годом — от первых памятников до сложных проектов под ключ.</div>
    <div class="tl-item"><b>Свой цех обработки камня</b>Перестали зависеть от подрядчиков — теперь весь цикл, от распила до полировки, под нашим контролем.</div>
    <div class="tl-item"><b>Два салона в Тамбове</b>ул. Бастионная, 29 и ул. Мичуринская, 275 — чтобы к нам было удобно приехать из любой части города.</div>
    <div class="tl-item"><b>Сотни семей</b>Памятники, лестницы, кухни и камины — для тех, кто выбрал камень на поколения вперёд.</div>
  </div>

  <div class="cab-sec" style="margin-top:4px">Почему нам доверяют</div>
  <div class="vals">
    <div class="val"><div class="ic">💎</div><b>Отбор камня</b><span>Берём плиту сами и отбраковываем всё, что ниже нашей планки</span></div>
    <div class="val"><div class="ic">🛡️</div><b>Гарантия до 10 лет</b><span>На изделия из гранита и мрамора — камень, который не подведёт</span></div>
    <div class="val"><div class="ic">🤝</div><b>Честная цена</b><span>Расчёт по факту размера и материала, без скрытых наценок</span></div>
    <div class="val"><div class="ic">👪</div><b>Личный подход</b><span>Одна семья работает с другой — помним каждого клиента в лицо</span></div>
  </div>

  ${photos.length ? `<div class="about-photos">${photos.map((i) => `<img src="${GALLERY[i].src}" data-o="${i}" alt="${GALLERY[i].caption}" loading="lazy" decoding="async">`).join('')}</div>` : ''}

  <div class="cta-box">
    <p>Расскажем о камне то, что знаем сами, и поможем подобрать решение под ваш дом</p>
    <button class="btn" data-go="calc">Рассчитать стоимость</button>
  </div>
  `;
}
