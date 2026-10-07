/**
 * Камень, который мы продаём: цена за м³, цвета для карточек/превью, названия.
 * Ключи ('g', 'd', 's', 'r', 'k', 'q') — короткие коды материалов, используются
 * как id по всему приложению (в каталоге, корзине, калькуляторе).
 */
export const MATERIALS = {
  g: { name: 'Габбро-диабаз',     colorDark: '#262c33', colorLight: '#3a4148', pricePerM3: 778650 },
  d: { name: 'Дымовский гранит',  colorDark: '#6b5f60', colorLight: '#a89a97', pricePerM3: 689040 },
  s: { name: 'Сибирский гранит',  colorDark: '#4d5359', colorLight: '#8c949b', pricePerM3: 437900 },
  r: { name: 'Кордайский гранит', colorDark: '#5a1f1f', colorLight: '#a34a43', pricePerM3: 669900 },
  k: { name: 'Мрамор Коелга',     colorDark: '#cfd3d6', colorLight: '#8a939a', pricePerM3: 480000 },
  q: { name: 'Серый мрамор',      colorDark: '#9aa0a5', colorLight: '#5f656a', pricePerM3: 340000 },
};

/** Короткие подписи материала для плашек на карточках товара (там, где нет фото). */
export const MATERIAL_SHORT_NAME = {
  g: 'Габбро-диабаз', d: 'Дымовский', s: 'Сибирский', r: 'Кордайский', k: 'Мрамор',
};

/** Цена плитки, ₽/м², по материалу и толщине (2 или 3 см). */
export const TILE_PRICE = {
  g: { 2: 16750, 3: 22000 },
  d: { 2: 18386, 3: 25839 },
  s: { 2: 10980, 3: 15760 },
};

/** Заводская ставка фаски по периметру, ₽ за погонный метр. */
export const DEFAULT_CHAMFER_RATE = 180;

/**
 * Доп. услуги (прайс «Расчёт заказа гранит/мрамора»): для каждой группы камня —
 * свои расценки. SERVICE_FAMILY сопоставляет материал с группой услуг.
 */
export const SERVICE_FAMILY = { g: 'gran', d: 'gran', s: 'gran', r: 'gran', k: 'marble', q: 'marble' };

export const SERVICES = {
  gran: {
    hole: 300, inscription: 70, item: 500, burnCandle: 1500, paint: 1000, wideChamfer: 800, km: 70,
    retouch: { none: 0, bust: 1500, waistNoBg: 2200, waistBg: 2550, fullNoBg: 4500, fullBg: 5100 },
  },
  marble: {
    hole: 110, inscription: 120, item: 500, burnCandle: 1500, paint: 1000, wideChamfer: 560, km: 40,
    retouch: { none: 0, bust: 1500, full: 3000 },
  },
};

export const RETOUCH_LABELS = {
  none: 'Без ретуши', bust: 'По бюст', waistNoBg: 'По пояс, без фона', waistBg: 'По пояс, с фоном',
  fullNoBg: 'В полный рост, без фона', fullBg: 'В полный рост, с фоном', full: 'В полный рост',
};

/** Подоконники и круглые столы — отдельная методика расчёта из того же прайса. */
export const WINDOWSILL_PRICING = {
  granite: { price: 19000, priceWithInstall: 26000 },
  limestone: { price: 12000, priceWithInstall: null },
  chamferPerMeter: 800,
};

export const ROUND_TABLE_PRICING = { pricePerM2: 25000, edgePerDm2: 400, heightCm: 83 };
