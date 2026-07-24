import { el } from '../utils/helpers.js';

export function renderCategoryHeader(category, extra = {}) {
  const { count } = extra;
  return el('div', { class: 'category-header' }, [
    el('span', { class: 'category-header__icon', text: category.icon || '📦' }),
    el('span', { class: 'category-header__name', text: category.name }),
    count !== undefined ? el('span', { class: 'category-header__count', text: String(count) }) : null,
  ]);
}
