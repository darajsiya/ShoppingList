import { el, clearNode } from '../utils/helpers.js';
import { shoppingListItemsRepository } from '../repositories/shoppingListItems.js';
import { productsRepository } from '../repositories/products.js';
import { categoriesRepository } from '../repositories/categories.js';
import { settingsRepository } from '../repositories/settings.js';
import { catalogService } from '../services/catalogService.js';
import { purchaseService } from '../services/purchaseService.js';
import { createSearchBar } from '../components/searchBar.js';
import { renderCartRow } from '../components/productItem.js';
import { renderCategoryHeader } from '../components/categoryHeader.js';
import { formDialog, confirmDialog } from '../components/dialogs.js';
import { showToast } from '../components/toast.js';
import { CART_SORT, SETTINGS_KEYS } from '../utils/constants.js';

export async function renderCartView(root) {
  clearNode(root);

  let viewMode = await settingsRepository.get(SETTINGS_KEYS.CART_VIEW_MODE, CART_SORT.ADDED);

  const searchBar = createSearchBar({
    onSelectProduct: async (product) => {
      await shoppingListItemsRepository.addItem(product.id);
      showToast(`أُضيف "${product.name}" للسلة`, 'success');
      await refreshList();
    },
    onCreateNew: async (term) => {
      await handleCreateProduct(term);
    },
  });

  const modeToggle = el('div', { class: 'segmented' }, [
    el('button', {
      class: `segmented__btn ${viewMode === CART_SORT.ADDED ? 'segmented__btn--active' : ''}`,
      onclick: () => switchMode(CART_SORT.ADDED),
      text: 'حسب الإضافة',
    }),
    el('button', {
      class: `segmented__btn ${viewMode === CART_SORT.CATEGORY ? 'segmented__btn--active' : ''}`,
      onclick: () => switchMode(CART_SORT.CATEGORY),
      text: 'حسب التصنيف',
    }),
  ]);

  const listContainer = el('div', { class: 'cart-list-container' });
  const summaryBar = el('div', { class: 'cart-summary' });

  const finishBtn = el('button', {
    class: 'btn btn--finish',
    onclick: handleFinishShopping,
    text: '✓ إنهاء التسوق',
  });

  root.appendChild(el('div', { class: 'view view--cart' }, [
    el('div', { class: 'view__header' }, [searchBar.node]),
    modeToggle,
    listContainer,
    summaryBar,
    el('div', { class: 'cart-footer' }, [finishBtn]),
  ]));

  async function switchMode(mode) {
    viewMode = mode;
    await settingsRepository.set(SETTINGS_KEYS.CART_VIEW_MODE, mode);
    renderCartView(root);
  }

  async function handleCreateProduct(name) {
    const categories = await categoriesRepository.getAll();
    if (categories.length === 0) {
      showToast('أضف تصنيفاً واحداً على الأقل أولاً من شاشة الكتالوج', 'error');
      return;
    }
    const values = await formDialog({
      title: `إضافة "${name}" كمنتج جديد`,
      submitLabel: 'حفظ وإضافة للسلة',
      fields: [
        { name: 'name', label: 'اسم المنتج', value: name },
        {
          name: 'categoryId',
          label: 'التصنيف',
          type: 'select',
          options: categories.map((c) => ({ value: String(c.id), label: `${c.icon} ${c.name}` })),
        },
      ],
    });
    if (!values) return;
    try {
      const product = await catalogService.createProduct({
        name: values.name,
        categoryId: Number(values.categoryId),
      });
      await shoppingListItemsRepository.addItem(product.id);
      showToast(`أُضيف "${product.name}" للسلة`, 'success');
      searchBar.reset();
      searchBar.focus();
      await refreshList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleToggleChecked(productId, checked) {
    try {
      await shoppingListItemsRepository.updateItem(productId, { checked });
      await refreshList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleNoteChange(productId, note) {
    try {
      await shoppingListItemsRepository.updateItem(productId, { note });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleRemove(productId) {
    try {
      await shoppingListItemsRepository.removeItem(productId);
      await refreshList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleFinishShopping() {
    try {
      const confirmed = await confirmDialog({
        title: 'إنهاء التسوق',
        message: 'سيتم حفظ القائمة في السجل وتفريغ السلة. هل أنت متأكد؟',
        confirmLabel: 'إنهاء التسوق',
      });
      if (!confirmed) return;
      const result = await purchaseService.finishShopping();
      showToast(`تم حفظ ${result.itemCount} منتج في السجل`, 'success');
      await refreshList();
    } catch (err) {
      if (err.code === 'EMPTY_CART') showToast('السلة فارغة', 'error');
      else showToast(err.message, 'error');
    }
  }

  async function refreshList() {
    clearNode(listContainer);
    const [cartItems, allProducts] = await Promise.all([
      shoppingListItemsRepository.getAll(),
      productsRepository.getAll(),
    ]);
    const productsById = new Map(allProducts.map((p) => [p.id, p]));

    summaryBar.textContent = cartItems.length
      ? `${cartItems.length} منتج في السلة — ${cartItems.filter((i) => i.checked).length} تم شراؤه`
      : '';

    if (cartItems.length === 0) {
      listContainer.appendChild(el('div', { class: 'empty-state' }, [
        el('span', { class: 'empty-state__icon', text: '🧺' }),
        el('p', { text: 'السلة فارغة. ابحث عن منتج بالأعلى لإضافته.' }),
      ]));
      return;
    }

    const handlers = { onToggleChecked: handleToggleChecked, onNoteChange: handleNoteChange, onRemove: handleRemove };

    if (viewMode === CART_SORT.CATEGORY) {
      const categories = await categoriesRepository.getAll();
      const itemsByCategory = new Map();
      cartItems.forEach((item) => {
        const product = productsById.get(item.productId);
        const catId = product ? product.categoryId : 'unknown';
        if (!itemsByCategory.has(catId)) itemsByCategory.set(catId, []);
        itemsByCategory.get(catId).push(item);
      });

      categories.forEach((category) => {
        const items = itemsByCategory.get(category.id);
        if (!items || items.length === 0) return;
        listContainer.appendChild(renderCategoryHeader(category, { count: items.length }));
        const list = el('ul', { class: 'cart-list' });
        items.forEach((item) => list.appendChild(renderCartRow(item, productsById.get(item.productId), handlers)));
        listContainer.appendChild(list);
      });
    } else {
      const list = el('ul', { class: 'cart-list' });
      cartItems.forEach((item) => list.appendChild(renderCartRow(item, productsById.get(item.productId), handlers)));
      listContainer.appendChild(list);
    }
  }

  await refreshList();
}

