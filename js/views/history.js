import { el, clearNode, formatDateTime } from '../utils/helpers.js';
import { purchaseService } from '../services/purchaseService.js';

export async function renderHistoryView(root) {
  clearNode(root);

  const listContainer = el('div', { class: 'history-list-container' });

  root.appendChild(el('div', { class: 'view view--history' }, [
    el('div', { class: 'view__header' }, [
      el('h2', { class: 'view__title', text: 'السجل' }),
    ]),
    listContainer,
  ]));

  const records = await purchaseService.getHistoryWithDetails();

  if (records.length === 0) {
    listContainer.appendChild(el('div', { class: 'empty-state' }, [
      el('span', { class: 'empty-state__icon', text: '🧾' }),
      el('p', { text: 'لا توجد عمليات شراء سابقة بعد.' }),
    ]));
    return;
  }

  records.forEach((record) => {
    const card = el('article', { class: 'history-card' }, [
      el('div', { class: 'history-card__header' }, [
        el('span', { class: 'history-card__date', text: formatDateTime(record.date) }),
        el('span', { class: 'history-card__count', text: `${record.itemCount} منتج` }),
      ]),
      el('ul', { class: 'history-card__items' },
        record.products.map((product) => el('li', { text: product.name }))),
    ]);
    listContainer.appendChild(card);
  });
}

