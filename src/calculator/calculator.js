import { MATERIALS, TILE_PRICE, SERVICE_FAMILY, SERVICES, WINDOWSILL_PRICING, ROUND_TABLE_PRICING, DEFAULT_CHAMFER_RATE } from '../data/materials.js';

/** Состояние калькулятора — какой режим выбран и что пользователь ввёл. */
export const calcState = {
  mode: 'volume', // 'volume' | 'tile' | 'sill' | 'table'
  material: 'g',
  length: 80, width: 40, height: 5, tileThickness: 2,
  chamfer: false,
  chamferRate: DEFAULT_CHAMFER_RATE, // перезаписываемая ставка фаски (меняется в админ-панели)
  services: {
    holes: 0, inscriptionChars: 0, items: 0,
    burnCandle: false, paint: false, wideChamfer: false,
    retouch: 'none', delivery: 'city', distanceKm: 0,
  },
  sill: { length: 120, depth: 30, corners: 1, stone: 'granite', withInstall: false, chamfer: false },
  table: { diameter: 100, thickness: 3 },
};

/** Раскрыта ли панель «доп. услуги» — чисто UI-состояние, но живёт рядом с остальным вводом. */
export const calcUi = { servicesOpen: false };

export function serviceFamily() {
  return SERVICE_FAMILY[calcState.material] || 'gran';
}

export function servicesTotal() {
  const rates = SERVICES[serviceFamily()];
  const s = calcState.services;
  let total = 0;
  total += (s.holes || 0) * rates.hole;
  total += (s.inscriptionChars || 0) * rates.inscription;
  total += (s.items || 0) * rates.item;
  if (s.burnCandle) total += rates.burnCandle;
  if (s.paint) total += rates.paint;
  if (s.retouch && s.retouch !== 'none') total += rates.retouch[s.retouch] || 0;
  if (s.delivery === 'region') total += (s.distanceKm || 0) * rates.km;
  return total;
}

function calcWindowsill() {
  const sill = calcState.sill;
  const lengthM = (sill.length + (sill.corners || 0) * 6) / 100;
  const depthM = sill.depth / 100;
  const area = lengthM * depthM;
  const isLimestone = sill.stone === 'limestone';
  const rate = isLimestone
    ? WINDOWSILL_PRICING.limestone.price
    : (sill.withInstall ? WINDOWSILL_PRICING.granite.priceWithInstall : WINDOWSILL_PRICING.granite.price);
  let total = area * rate;
  const chamferCost = sill.chamfer ? (sill.length / 100) * WINDOWSILL_PRICING.chamferPerMeter : 0;
  total += chamferCost;
  return { area, price: total, unit: 'м²', chamferCost, servicesCost: 0 };
}

function calcRoundTable() {
  const table = calcState.table;
  const radiusM = (table.diameter / 100) / 2;
  const areaM2 = Math.PI * radiusM * radiusM;
  const circumferenceM = Math.PI * (table.diameter / 100);
  const edgeCost = (circumferenceM * 10) * (table.thickness / 10) * ROUND_TABLE_PRICING.edgePerDm2;
  return { area: areaM2, price: areaM2 * ROUND_TABLE_PRICING.pricePerM2 + edgeCost, unit: 'м²', chamferCost: 0, servicesCost: edgeCost };
}

/**
 * Считает итоговую цену для текущего calcState.
 * Возвращает {area, price, unit, chamferCost, servicesCost} — price===null значит
 * "для этого сочетания параметров нет данных" (например, нет цены плитки такой толщины).
 */
export function calculate() {
  if (calcState.mode === 'sill') return calcWindowsill();
  if (calcState.mode === 'table') return calcRoundTable();

  const chamferRate = calcState.services.wideChamfer ? SERVICES[serviceFamily()].wideChamfer : calcState.chamferRate;
  const perimeterM = 2 * (calcState.length + calcState.width) / 100;
  const chamferCost = calcState.chamfer ? perimeterM * chamferRate : 0;
  const areaM2 = calcState.length * calcState.width / 10000;
  const servicesCost = servicesTotal();

  if (calcState.mode === 'tile') {
    const rate = (TILE_PRICE[calcState.material] || {})[calcState.tileThickness];
    return { area: areaM2, price: rate ? areaM2 * rate + chamferCost + servicesCost : null, unit: 'м²', chamferCost, servicesCost };
  }

  const volumeM3 = calcState.length * calcState.width * calcState.height / 1e6;
  return { area: volumeM3, price: volumeM3 * MATERIALS[calcState.material].pricePerM3 + chamferCost + servicesCost, unit: 'м³', chamferCost, servicesCost };
}
