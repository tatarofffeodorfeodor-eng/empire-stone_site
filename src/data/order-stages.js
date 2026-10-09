/** Этапы заказа — общий список для админки (переключатель статуса) и личного кабинета (таймлайн). */
export const ORDER_STAGES = [
  { value: 'new', label: 'Принят' },
  { value: 'material', label: 'Камень подобран' },
  { value: 'engraving', label: 'Обработка/гравировка' },
  { value: 'ready', label: 'Готов' },
  { value: 'done', label: 'Выдан/доставлен' },
];

export function orderStageIndex(status) {
  const ix = ORDER_STAGES.findIndex((s) => s.value === status);
  return ix < 0 ? 0 : ix;
}
