import { el } from '../utils/helpers.js';

// صف منتج داخل السلة: مربع تحديد، اسم، ملاحظة قابلة للتحرير، زر حذف.
export function renderCartRow(item, product, handlers) {
  const { onToggleChecked, onNoteChange, onRemove } = handlers;

  const checkbox = el('button', {
    class: `stamp-check ${item.checked ? 'stamp-check--checked' : ''}`,
    'aria-label': 'تحديد كمشترى',
    onclick: () => onToggleChecked(item.productId, !item.checked),
    text: item.checked ? '✓' : '',
  });

  const noteInput = el('input', {
    class: 'cart-row__note',
    type: 'text',
    placeholder: 'ملاحظة (كمية، وصف...)',
  });
  noteInput.value = item.note || '';
  noteInput.addEventListener('change', () => onNoteChange(item.productId, noteInput.value));

  const removeBtn = el('button', {
    class: 'cart-row__remove',
    'aria-label': 'حذف من السلة',
    onclick: () => onRemove(item.productId),
    text: '✕',
  });

  return el('li', { class: `cart-row ${item.checked ? 'cart-row--checked' : ''}`, 'data-product-id': String(item.productId) }, [
    checkbox,
    el('div', { class: 'cart-row__body' }, [
      el('span', { class: 'cart-row__name', text: product ? product.name : '(منتج محذوف)' }),
      noteInput,
    ]),
    removeBtn,
  ]);
}

// صف منتج داخل الكتالوج: اسم، تصنيف اختياري، أزرار مفضلة/تعديل/حذف.
export function renderCatalogRow(product, handlers) {
  const { onToggleFavorite, onEdit, onDelete } = handlers;

  const favBtn = el('button', {
    class: `catalog-row__fav ${product.favorite ? 'catalog-row__fav--active' : ''}`,
    'aria-label': 'مفضلة',
    onclick: () => onToggleFavorite(product.id),
    text: product.favorite ? '★' : '☆',
  });

  return el('li', { class: 'catalog-row', 'data-product-id': String(product.id) }, [
    favBtn,
    el('span', { class: 'catalog-row__name', text: product.name }),
    product.purchaseCount > 0 ? el('span', { class: 'catalog-row__count', text: `×${product.purchaseCount}` }) : null,
    el('button', { class: 'catalog-row__edit', onclick: () => onEdit(product), text: '✎' }),
    el('button', { class: 'catalog-row__delete', onclick: () => onDelete(product), text: '🗑' }),
  ]);
}

// صف نتيجة بحث لإضافة سريعة للسلة
export function renderSearchResultRow(product, onSelect) {
  return el('li', { class: 'search-result', onclick: () => onSelect(product) }, [
    el('span', { class: 'search-result__name', text: product.name }),
    product.favorite ? el('span', { class: 'search-result__star', text: '★' }) : null,
  ]);
}
