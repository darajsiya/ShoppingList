import { el, clearNode } from '../utils/helpers.js';
import { catalogService } from '../services/catalogService.js';
import { categoriesRepository } from '../repositories/categories.js';
import { renderCategoryHeader } from '../components/categoryHeader.js';
import { renderCatalogRow } from '../components/productItem.js';
import { formDialog, confirmDialog } from '../components/dialogs.js';
import { showToast } from '../components/toast.js';

export async function renderCatalogView(root) {
  clearNode(root);

  const listContainer = el('div', { class: 'catalog-list-container' });
  const addCategoryBtn = el('button', {
    class: 'btn btn--primary btn--small',
    onclick: handleAddCategory,
    text: '+ تصنيف جديد',
  });

  root.appendChild(el('div', { class: 'view view--catalog' }, [
    el('div', { class: 'view__header' }, [
      el('h2', { class: 'view__title', text: 'الكتالوج' }),
      addCategoryBtn,
    ]),
    listContainer,
  ]));

  async function handleAddCategory() {
    const values = await formDialog({
      title: 'تصنيف جديد',
      fields: [
        { name: 'name', label: 'اسم التصنيف' },
        { name: 'icon', label: 'رمز (اختياري)', type: 'emoji-picker', value: '📦' },
      ],
    });
    if (!values) return;
    try {
      await catalogService.createCategory({ name: values.name, icon: values.icon });
      showToast('تم إضافة التصنيف', 'success');
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleEditCategory(category) {
    const values = await formDialog({
      title: 'تعديل التصنيف',
      fields: [
        { name: 'name', label: 'اسم التصنيف', value: category.name },
        { name: 'icon', label: 'رمز', type: 'emoji-picker', value: category.icon },
      ],
    });
    if (!values) return;
    try {
      await catalogService.updateCategory(category.id, { name: values.name, icon: values.icon });
      showToast('تم تحديث التصنيف', 'success');
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDeleteCategory(category, productCount) {
    if (productCount > 0) {
      showToast(`لا يمكن حذف "${category.name}" لأنه يحتوي ${productCount} منتج. انقل المنتجات أولاً`, 'error');
      return;
    }
    const confirmed = await confirmDialog({
      title: `حذف "${category.name}"؟`,
      message: 'لا يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'حذف',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await catalogService.deleteCategory(category.id);
      showToast('تم حذف التصنيف', 'success');
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleAddProduct(category) {
    const values = await formDialog({
      title: `منتج جديد في ${category.name}`,
      fields: [{ name: 'name', label: 'اسم المنتج' }],
    });
    if (!values) return;
    try {
      await catalogService.createProduct({ name: values.name, categoryId: category.id });
      showToast('تم إضافة المنتج', 'success');
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleEditProduct(product) {
    const categories = await categoriesRepository.getAll();
    const values = await formDialog({
      title: 'تعديل المنتج',
      fields: [
        { name: 'name', label: 'اسم المنتج', value: product.name },
        {
          name: 'categoryId',
          label: 'التصنيف',
          type: 'select',
          value: String(product.categoryId),
          options: categories.map((c) => ({ value: String(c.id), label: `${c.icon} ${c.name}` })),
        },
        { name: 'notes', label: 'ملاحظات افتراضية (اختياري)', type: 'textarea', value: product.notes },
      ],
    });
    if (!values) return;
    try {
      await catalogService.updateProduct(product.id, {
        name: values.name,
        categoryId: Number(values.categoryId),
        notes: values.notes,
      });
      showToast('تم تحديث المنتج', 'success');
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDeleteProduct(product) {
    const confirmed = await confirmDialog({
      title: `حذف "${product.name}"؟`,
      message: 'سيتم حذفه من الكتالوج والسلة.',
      confirmLabel: 'حذف',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await catalogService.deleteProduct(product.id);
      showToast('تم حذف المنتج', 'success');
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleToggleFavorite(productId) {
    try {
      await catalogService.toggleFavorite(productId);
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function refresh() {
    clearNode(listContainer);
    const grouped = await catalogService.getCatalogGroupedByCategory();

    if (grouped.length === 0) {
      listContainer.appendChild(el('div', { class: 'empty-state' }, [
        el('span', { class: 'empty-state__icon', text: '📦' }),
        el('p', { text: 'لا توجد تصنيفات بعد. أضف أول تصنيف للبدء.' }),
      ]));
      return;
    }

    grouped.forEach(({ category, products }) => {
      const section = el('section', { class: 'catalog-section' });
      const headerRow = el('div', { class: 'catalog-section__header-row' }, [
        renderCategoryHeader(category, { count: products.length }),
        el('div', { class: 'catalog-section__actions' }, [
          el('button', { class: 'icon-btn', onclick: () => handleAddProduct(category), text: '+' }),
          el('button', { class: 'icon-btn', onclick: () => handleEditCategory(category), text: '✎' }),
          el('button', { class: 'icon-btn', onclick: () => handleDeleteCategory(category, products.length), text: '🗑' }),
        ]),
      ]);
      section.appendChild(headerRow);

      if (products.length === 0) {
        section.appendChild(el('p', { class: 'catalog-section__empty', text: 'لا توجد منتجات في هذا التصنيف' }));
      } else {
        const list = el('ul', { class: 'catalog-list' });
        products.forEach((product) => list.appendChild(renderCatalogRow(product, {
          onToggleFavorite: handleToggleFavorite,
          onEdit: handleEditProduct,
          onDelete: handleDeleteProduct,
        })));
        section.appendChild(list);
      }
      listContainer.appendChild(section);
    });
  }

  await refresh();
}
