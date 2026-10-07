import { $, $$, formatRub, generateId } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { MATERIALS, SERVICES, RETOUCH_LABELS, WINDOWSILL_PRICING, ROUND_TABLE_PRICING } from '../data/materials.js';
import { calcState, calcUi, calculate, servicesTotal, serviceFamily } from '../calculator/calculator.js';
import { store, persist } from '../state/store.js';
import { addCalculationToCart } from './cart-view.js';

export function calculatorViewHtml() {
  const result = calculate();
  const isStoneMode = calcState.mode === 'volume' || calcState.mode === 'tile';
  const family = serviceFamily();
  const rates = SERVICES[family];
  return `
  <div class="top"><h1>Расчёт стоимости</h1><div class="sub">Прикидочная цена, точную скажет мастер при замере</div></div>
  <div class="box">
    <label>Тип расчёта</label>
    <div class="seg" style="flex-wrap:wrap;row-gap:4px">
      <button data-md="volume" class="${calcState.mode === 'volume' ? 'on' : ''}">Объём (м³)</button>
      <button data-md="tile" class="${calcState.mode === 'tile' ? 'on' : ''}">Плитка (м²)</button>
      <button data-md="sill" class="${calcState.mode === 'sill' ? 'on' : ''}">Подоконник</button>
      <button data-md="table" class="${calcState.mode === 'table' ? 'on' : ''}">Стол круглый</button>
    </div>
    ${isStoneMode ? `
    <label style="margin-top:10px">Камень</label>
    <select id="ms">${Object.entries(MATERIALS).map(([k, v]) => `<option value="${k}" ${k === calcState.material ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
    <div class="row" style="gap:10px;margin-top:14px">
      <div style="flex:1"><label>Длина, см</label><input type="text" inputmode="numeric" id="cl" value="${calcState.length}"></div>
      <div style="flex:1"><label>Ширина, см</label><input type="text" inputmode="numeric" id="cw" value="${calcState.width}"></div>
    </div>
    ${calcState.mode === 'volume'
      ? `<label>Высота, см</label><input type="text" inputmode="numeric" id="ch" value="${calcState.height}">`
      : `<label>Толщина плитки</label><div class="seg"><button data-th="2" class="${calcState.tileThickness == 2 ? 'on' : ''}">2 см</button><button data-th="3" class="${calcState.tileThickness == 3 ? 'on' : ''}">3 см</button></div>`}
    <label class="chk" style="margin-top:14px"><input type="checkbox" id="cf" ${calcState.chamfer ? 'checked' : ''}> Фаска по периметру (+${calcState.services.wideChamfer ? rates.wideChamfer : calcState.chamferRate} ₽/пог.м)</label>
    <label class="chk"><input type="checkbox" id="cWideFas" ${calcState.services.wideChamfer ? 'checked' : ''}> Огранка — фаска от 5мм (${rates.wideChamfer} ₽/пог.м вместо обычной)</label>
    ` : calcState.mode === 'sill' ? `
    <div class="row" style="gap:10px;margin-top:10px">
      <div style="flex:1"><label>Длина, см</label><input type="text" inputmode="numeric" id="sl" value="${calcState.sill.length}"></div>
      <div style="flex:1"><label>Ширина (вынос), см</label><input type="text" inputmode="numeric" id="sd" value="${calcState.sill.depth}"></div>
    </div>
    <label>Заходы на стену (углы)</label>
    <div class="seg"><button data-sc="0" class="${calcState.sill.corners === 0 ? 'on' : ''}">0</button><button data-sc="1" class="${calcState.sill.corners === 1 ? 'on' : ''}">1</button><button data-sc="2" class="${calcState.sill.corners === 2 ? 'on' : ''}">2</button></div>
    <label>Материал</label>
    <div class="seg"><button data-ss="granite" class="${calcState.sill.stone === 'granite' ? 'on' : ''}">Гранит/мрамор</button><button data-ss="limestone" class="${calcState.sill.stone === 'limestone' ? 'on' : ''}">Мрамориз. известняк</button></div>
    ${calcState.sill.stone === 'granite'
      ? `<label class="chk" style="margin-top:12px"><input type="checkbox" id="sInstall" ${calcState.sill.withInstall ? 'checked' : ''}> С установкой (${formatRub(WINDOWSILL_PRICING.granite.priceWithInstall)}/м² вместо ${formatRub(WINDOWSILL_PRICING.granite.price)}/м²)</label>`
      : `<div class="note">Цена известняка — без установки</div>`}
    <label class="chk"><input type="checkbox" id="sFas" ${calcState.sill.chamfer ? 'checked' : ''}> Фаска по переднему краю (+${formatRub(WINDOWSILL_PRICING.chamferPerMeter)}/пог.м)</label>
    ` : `
    <div class="row" style="gap:10px;margin-top:10px">
      <div style="flex:1"><label>Диаметр столешницы, см</label><input type="text" inputmode="numeric" id="td" value="${calcState.table.diameter}"></div>
      <div style="flex:1"><label>Толщина, см</label><input type="text" inputmode="numeric" id="tt" value="${calcState.table.thickness}"></div>
    </div>
    <div class="note">Высота стола — стандартно 83 см. Цена плиты ${formatRub(ROUND_TABLE_PRICING.pricePerM2)}/м² + резка торца по площади кромки.</div>
    `}
  </div>

  ${isStoneMode ? `
  <details class="box" ${calcUi.servicesOpen ? 'open' : ''} id="svcBox">
    <summary style="cursor:pointer;font:700 14px Unbounded,Manrope">Доп. услуги (по желанию)${servicesTotal() ? ` · +${formatRub(servicesTotal())}` : ''}</summary>
    <div style="margin-top:12px">
      <div class="row" style="gap:10px">
        <div style="flex:1"><label>Отверстия, шт (${rates.hole} ₽/шт)</label><input type="text" inputmode="numeric" id="svHoles" value="${calcState.services.holes}"></div>
        <div style="flex:1"><label>Надпись, символов (${rates.inscription} ₽/симв.)</label><input type="text" inputmode="numeric" id="svInscr" value="${calcState.services.inscriptionChars}"></div>
      </div>
      <label>Крест / свеча / цветок, позиций (${rates.item} ₽/шт)</label>
      <input type="text" inputmode="numeric" id="svItem" value="${calcState.services.items}">
      <label>Ретушь / гравировка портрета</label>
      <select id="svRetouch">${Object.entries(rates.retouch).map(([k]) => `<option value="${k}" ${calcState.services.retouch === k ? 'selected' : ''}>${RETOUCH_LABELS[k]}${rates.retouch[k] ? ' — ' + formatRub(rates.retouch[k]) : ''}</option>`).join('')}</select>
      <label class="chk" style="margin-top:10px"><input type="checkbox" id="svCandle" ${calcState.services.burnCandle ? 'checked' : ''}> Горящая свеча + розы/гвоздики (+${formatRub(rates.burnCandle)})</label>
      <label class="chk"><input type="checkbox" id="svPaint" ${calcState.services.paint ? 'checked' : ''}> Покраска гравировки + «Антидождь» (+${formatRub(rates.paint)})</label>
      <label>Доставка</label>
      <div class="seg"><button data-sv-del="city" class="${calcState.services.delivery === 'city' ? 'on' : ''}">По городу — бесплатно</button><button data-sv-del="region" class="${calcState.services.delivery === 'region' ? 'on' : ''}">В область</button></div>
      ${calcState.services.delivery === 'region' ? `<label>Расстояние, км (${rates.km} ₽/км в обе стороны)</label><input type="text" inputmode="numeric" id="svKm" value="${calcState.services.distanceKm}">` : ''}
    </div>
  </details>` : ''}

  <div class="res">
    <small>Ориентировочная стоимость</small>
    <div class="big">${result.price != null ? formatRub(result.price) : '—'}</div>
    <small>${result.area.toFixed(2)} ${result.unit}${result.chamferCost ? ` · фаска ${formatRub(result.chamferCost)}` : ''}${result.servicesCost ? ` · услуги ${formatRub(result.servicesCost)}` : ''}</small>
  </div>
  ${result.price != null ? `<button class="btn" id="calcAdd">Добавить в корзину</button>
  <button class="btn g2" id="calcSave" style="margin-top:8px">Сохранить расчёт в кабинет</button>` :
    `<div class="note">Для этой толщины нет данных по плитке — выберите другой камень или толщину.</div>`}
  `;
}

export function bindCalculatorView({ rerender }) {
  $$('[data-md]').forEach((b) => { b.onclick = () => { calcState.mode = b.dataset.md; rerender(); }; });
  $$('[data-th]').forEach((b) => { b.onclick = () => { calcState.tileThickness = +b.dataset.th; rerender(); }; });

  const material = $('#ms');
  if (material) material.onchange = (e) => { calcState.material = e.target.value; rerender(); };
  const length = $('#cl');
  if (length) length.oninput = (e) => { calcState.length = +e.target.value || 0; rerender(); };
  const width = $('#cw');
  if (width) width.oninput = (e) => { calcState.width = +e.target.value || 0; rerender(); };
  const height = $('#ch');
  if (height) height.oninput = (e) => { calcState.height = +e.target.value || 0; rerender(); };
  const chamfer = $('#cf');
  if (chamfer) chamfer.onchange = (e) => { calcState.chamfer = e.target.checked; rerender(); };
  const wideChamfer = $('#cWideFas');
  if (wideChamfer) wideChamfer.onchange = (e) => { calcState.services.wideChamfer = e.target.checked; rerender(); };

  /* подоконник */
  const sillLen = $('#sl');
  if (sillLen) sillLen.oninput = (e) => { calcState.sill.length = +e.target.value || 0; rerender(); };
  const sillDepth = $('#sd');
  if (sillDepth) sillDepth.oninput = (e) => { calcState.sill.depth = +e.target.value || 0; rerender(); };
  $$('[data-sc]').forEach((b) => { b.onclick = () => { calcState.sill.corners = +b.dataset.sc; rerender(); }; });
  $$('[data-ss]').forEach((b) => { b.onclick = () => { calcState.sill.stone = b.dataset.ss; rerender(); }; });
  const sillInstall = $('#sInstall');
  if (sillInstall) sillInstall.onchange = (e) => { calcState.sill.withInstall = e.target.checked; rerender(); };
  const sillChamfer = $('#sFas');
  if (sillChamfer) sillChamfer.onchange = (e) => { calcState.sill.chamfer = e.target.checked; rerender(); };

  /* круглый стол */
  const tableDiam = $('#td');
  if (tableDiam) tableDiam.oninput = (e) => { calcState.table.diameter = +e.target.value || 0; rerender(); };
  const tableThickness = $('#tt');
  if (tableThickness) tableThickness.oninput = (e) => { calcState.table.thickness = +e.target.value || 0; rerender(); };

  /* доп. услуги */
  const svcBox = $('#svcBox');
  if (svcBox) svcBox.addEventListener('toggle', (e) => { calcUi.servicesOpen = e.target.open; });
  const svHoles = $('#svHoles');
  if (svHoles) svHoles.oninput = (e) => { calcState.services.holes = +e.target.value || 0; rerender(); };
  const svInscr = $('#svInscr');
  if (svInscr) svInscr.oninput = (e) => { calcState.services.inscriptionChars = +e.target.value || 0; rerender(); };
  const svItem = $('#svItem');
  if (svItem) svItem.oninput = (e) => { calcState.services.items = +e.target.value || 0; rerender(); };
  const svRetouch = $('#svRetouch');
  if (svRetouch) svRetouch.onchange = (e) => { calcState.services.retouch = e.target.value; rerender(); };
  const svCandle = $('#svCandle');
  if (svCandle) svCandle.onchange = (e) => { calcState.services.burnCandle = e.target.checked; rerender(); };
  const svPaint = $('#svPaint');
  if (svPaint) svPaint.onchange = (e) => { calcState.services.paint = e.target.checked; rerender(); };
  $$('[data-sv-del]').forEach((b) => { b.onclick = () => { calcState.services.delivery = b.dataset.svDel; calcUi.servicesOpen = true; rerender(); }; });
  const svKm = $('#svKm');
  if (svKm) svKm.oninput = (e) => { calcState.services.distanceKm = +e.target.value || 0; rerender(); };

  const calcAdd = $('#calcAdd');
  if (calcAdd) calcAdd.onclick = () => addCalculationToCart({ rerender });
  const calcSave = $('#calcSave');
  if (calcSave) {
    calcSave.onclick = () => {
      const result = calculate();
      store.savedCalculations.push({ id: generateId(), date: new Date().toLocaleDateString('ru-RU'), result: result.price, ...calcState });
      persist();
      toast(store.user ? 'Расчёт сохранён в кабинет' : 'Сохранено — войдите, чтобы увидеть в кабинете');
    };
  }
}
