/** Категории каталога для фильтра-чипов. 'Все' — специальное значение "без фильтра". */
export const CATEGORIES = [
  'Все', 'Памятники', 'Для могилы', 'Плитка', 'Камины', 'Кресты', 'Ограды',
  'Столы и скамьи', 'Фонтаны', 'Подоконники', 'Лестницы', 'Ландшафтный дизайн',
];

/**
 * Готовые товары каталога. id — число, m — код материала (см. MATERIALS),
 * c — категория из CATEGORIES, img — фото товара, tag — необязательная плашка
 * ("Акция", "Спецпредложение" и т.п.).
 */
export const PRODUCTS = [
  { id: 1, name: 'Памятник из гранита простой АртГ00001', price: 12380, category: 'Памятники', material: 'g',
    image: 'https://granit-tmb.ru/wp-content/uploads/2023/02/АртГ0001.jpg' },
  { id: 2, name: 'Памятник из мрамора Коелга АртМ0034', price: 51500, category: 'Памятники', material: 'k', tag: 'Спецпредложение',
    image: 'https://granit-tmb.ru/wp-content/uploads/2023/03/АртМ0034-e1697616320348.jpg' },
  { id: 3, name: 'Памятник из красного гранита АртВ00093-18', price: 27000, category: 'Памятники', material: 'r',
    image: 'https://granit-tmb.ru/wp-content/uploads/2023/07/Арт00093-18-2-e1697608884469.jpeg' },
  { id: 4, name: 'Памятник из гранита фигурный АртГ00005', price: 48000, category: 'Памятники', material: 'd',
    image: 'https://granit-tmb.ru/wp-content/uploads/2023/02/АртЭ0005.jpg' },
  { id: 5, name: 'Ваза из гранита Габбро-диабаз, h=30 см', price: 4500, category: 'Для могилы', material: 'g', tag: 'Спецпредложение',
    image: 'https://granit-tmb.ru/wp-content/uploads/2023/04/РВ0007-Ваза-гранит.jpg' },
  { id: 6, name: 'Плитка 300×300×20 мм, Дымовский гранит', price: 7500, category: 'Плитка', material: 'd', tag: 'Акция',
    image: 'https://granit-tmb.ru/wp-content/uploads/2023/01/Гранит-Дымовский-4-scaled.jpg' },
  { id: 7, name: 'Камин из мрамора Коелга', price: 220000, category: 'Камины', material: 'k',
    image: 'https://granit-tmb.ru/wp-content/uploads/2023/02/На-продажу-scaled.jpg' },
];
