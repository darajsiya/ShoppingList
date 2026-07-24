import { el, clearNode } from '../utils/helpers.js';
import { productsRepository } from '../repositories/products.js';
import { shoppingListItemsRepository } from '../repositories/shoppingListItems.js';
import { confirmDialog } from '../components/dialogs.js';
import { showToast } from '../components/toast.js';
import { db } from '../db.js';
import { STORES } from '../utils/constants.js';

export async function renderSettingsView(root) {
  clearNode(root);

  const favoritesContainer = el('div', { class: 'settings-favorites' });

  root.appendChild(el('div', { class: 'view view--settings' }, [
    el('div', { class: 'view__header' }, [
      el('h2', { class: 'view__title', text: 'الإعدادات' }),
    ]),

    el('section', { class: 'settings-section' }, [
      el('h3', { class: 'settings-section__title', text: '⭐ المفضلة' }),
      favoritesContainer,
    ]),

    el('section', { class: 'settings-section' }, [
      el('h3', { class: 'settings-section__title', text: 'حول التطبيق' }),
      el('p', { class: 'settings-section__text', text: 'ShoppingList — يعمل بالكامل دون اتصال بالإنترنت، وجميع بياناتك محفوظة على جهازك فقط.' }),
      el('p', { class: 'settings-section__text settings-section__text--muted', text: 'الإصدار 1.0' }),
    ]),

    el('section', { class: 'settings-section' }, [
      el('h3', { class: 'settings-section__title', text: 'إدارة البيانات' }),
      el('button', { class: 'btn btn--danger', onclick: handleResetData, text: 'حذف جميع البيانات' }),
    ]),
  ]));

  async function refreshFavorites() {
    clearNode(favoritesContainer);
    const favorites = await productsRepository.getFavorites();
    if (favorites.length === 0) {
      favoritesContainer.appendChild(el('p', { class: 'settings-section__text settings-section__text--muted', text: 'لا توجد منتجات مفضلة بعد.' }));
      return;
    }
    const list = el('ul', { class: 'settings-favorites__list' });
    favorites.forEach((product) => {
      list.appendChild(el('li', { class: 'settings-favorites__item' }, [
        el('span', { text: product.name }),
        el('button', {
          class: 'btn btn--small btn--primary',
          onclick: async () => {
            try {
              await shoppingListItemsRepository.addItem(product.id);
              showToast(`أُضيف "${product.name}" للسلة`, 'success');
            } catch (err) {
              showToast(err.message, 'error');
            }
          },
          text: '+ للسلة',
        }),
      ]));
    });
    favoritesContainer.appendChild(list);
  }

  async function handleResetData() {
    const confirmed = await confirmDialog({
      title: 'حذف جميع البيانات؟',
      message: 'سيتم حذف كل التصنيفات والمنتجات والسلة والسجل نهائياً. هذا الإجراء لا يمكن التراجع عنه.',
      confirmLabel: 'حذف كل شيء',
      danger: true,
    });
    if (!confirmed) return;
    await Promise.all(Object.values(STORES).map((store) => db.clear(store)));
    showToast('تم حذف جميع البيانات', 'success');
    location.hash = '#/cart';
    location.reload();
  }

  await refreshFavorites();
}

