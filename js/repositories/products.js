import { db } from '../db.js';
import { STORES } from '../utils/constants.js';
import { normalizeArabic, nowISO } from '../utils/helpers.js';

async function getAll() {
  const all = await db.getAll(STORES.PRODUCTS);
  return all.filter((p) => !p.deleted);
}

async function getById(id) {
  return db.get(STORES.PRODUCTS, id);
}

async function getByCategory(categoryId) {
  const all = await getAll();
  return all.filter((p) => p.categoryId === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

async function getFavorites() {
  const all = await getAll();
  return all.filter((p) => p.favorite);
}

async function existsByName(name, excludeId = null) {
  const normalized = normalizeArabic(name);
  const all = await getAll();
  return all.some((p) => p.id !== excludeId && p.normalizedName === normalized);
}

async function searchByName(term) {
  const normalized = normalizeArabic(term);
  if (!normalized) return [];
  const all = await getAll();
  return all
    .filter((p) => p.normalizedName.includes(normalized))
    .sort((a, b) => {
      const aStarts = a.normalizedName.startsWith(normalized) ? 0 : 1;
      const bStarts = b.normalizedName.startsWith(normalized) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return b.purchaseCount - a.purchaseCount;
    });
}

async function create({ name, categoryId, notes = '' }) {
  const all = await getAll();
  const siblings = all.filter((p) => p.categoryId === categoryId);
  const maxOrder = siblings.reduce((max, p) => Math.max(max, p.sortOrder ?? 0), -1);
  const record = {
    name: name.trim(),
    normalizedName: normalizeArabic(name),
    categoryId,
    favorite: false,
    purchaseCount: 0,
    notes,
    sortOrder: maxOrder + 1,
    deleted: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  const id = await db.add(STORES.PRODUCTS, record);
  return { ...record, id };
}

async function update(id, changes) {
  const existing = await getById(id);
  if (!existing) throw new Error('المنتج غير موجود');
  const updated = { ...existing, ...changes, updatedAt: nowISO() };
  if (changes.name) updated.normalizedName = normalizeArabic(changes.name);
  await db.put(STORES.PRODUCTS, updated);
  return updated;
}

async function softDelete(id) {
  await update(id, { deleted: true });
}

async function incrementPurchaseCount(id) {
  const existing = await getById(id);
  if (!existing) return;
  await update(id, { purchaseCount: (existing.purchaseCount || 0) + 1 });
}

async function reorderWithinCategory(categoryId, orderedIds) {
  const products = await getByCategory(categoryId);
  const byId = new Map(products.map((p) => [p.id, p]));
  await Promise.all(orderedIds.map((id, index) => {
    const product = byId.get(id);
    if (!product) return Promise.resolve();
    return db.put(STORES.PRODUCTS, { ...product, sortOrder: index, updatedAt: nowISO() });
  }));
}

export const productsRepository = {
  getAll, getById, getByCategory, getFavorites, existsByName, searchByName,
  create, update, softDelete, incrementPurchaseCount, reorderWithinCategory,
};
