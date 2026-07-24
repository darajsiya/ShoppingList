import { categoriesRepository } from '../repositories/categories.js';
import { productsRepository } from '../repositories/products.js';
import { shoppingListItemsRepository } from '../repositories/shoppingListItems.js';

async function createCategory({ name, icon }) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('اسم التصنيف مطلوب');
  if (await categoriesRepository.existsByName(trimmed)) {
    throw new Error('يوجد تصنيف بنفس الاسم بالفعل');
  }
  return categoriesRepository.create({ name: trimmed, icon });
}

async function updateCategory(id, { name, icon }) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('اسم التصنيف مطلوب');
  if (await categoriesRepository.existsByName(trimmed, id)) {
    throw new Error('يوجد تصنيف بنفس الاسم بالفعل');
  }
  return categoriesRepository.update(id, { name: trimmed, icon });
}

async function deleteCategory(id) {
  const products = await productsRepository.getByCategory(id);
  if (products.length > 0) {
    const error = new Error('لا يمكن حذف تصنيف يحتوي على منتجات. انقل المنتجات أولاً.');
    error.code = 'CATEGORY_NOT_EMPTY';
    error.productCount = products.length;
    throw error;
  }
  await categoriesRepository.hardDelete(id);
}

async function reorderCategories(orderedIds) {
  await categoriesRepository.reorder(orderedIds);
}

async function createProduct({ name, categoryId, notes }) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('اسم المنتج مطلوب');
  if (!categoryId) throw new Error('يجب اختيار تصنيف للمنتج');
  if (await productsRepository.existsByName(trimmed)) {
    throw new Error('يوجد منتج بنفس الاسم بالفعل');
  }
  return productsRepository.create({ name: trimmed, categoryId, notes });
}

async function updateProduct(id, changes) {
  if (changes.name) {
    const trimmed = changes.name.trim();
    if (!trimmed) throw new Error('اسم المنتج مطلوب');
    if (await productsRepository.existsByName(trimmed, id)) {
      throw new Error('يوجد منتج بنفس الاسم بالفعل');
    }
    changes = { ...changes, name: trimmed };
  }
  return productsRepository.update(id, changes);
}

async function moveProductToCategory(productId, categoryId) {
  return productsRepository.update(productId, { categoryId });
}

async function toggleFavorite(productId) {
  const product = await productsRepository.getById(productId);
  if (!product) throw new Error('المنتج غير موجود');
  return productsRepository.update(productId, { favorite: !product.favorite });
}

async function deleteProduct(id) {
  await productsRepository.softDelete(id);
  await shoppingListItemsRepository.removeItem(id);
}

async function getCatalogGroupedByCategory() {
  const [categories, products] = await Promise.all([
    categoriesRepository.getAll(),
    productsRepository.getAll(),
  ]);
  return categories.map((category) => ({
    category,
    products: products
      .filter((p) => p.categoryId === category.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export const catalogService = {
  createCategory, updateCategory, deleteCategory, reorderCategories,
  createProduct, updateProduct, moveProductToCategory, toggleFavorite, deleteProduct,
  getCatalogGroupedByCategory,
};

