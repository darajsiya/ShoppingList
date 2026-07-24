import { db } from '../db.js';
import { STORES } from '../utils/constants.js';
import { normalizeArabic, nowISO } from '../utils/helpers.js';

async function getAll() {
  const all = await db.getAll(STORES.CATEGORIES);
  return all.filter((c) => !c.deleted).sort((a, b) => a.sortOrder - b.sortOrder);
}

async function getById(id) {
  return db.get(STORES.CATEGORIES, id);
}

async function existsByName(name, excludeId = null) {
  const normalized = normalizeArabic(name);
  const all = await getAll();
  return all.some((c) => c.id !== excludeId && normalizeArabic(c.name) === normalized);
}

async function create({ name, icon }) {
  const all = await getAll();
  const maxOrder = all.reduce((max, c) => Math.max(max, c.sortOrder ?? 0), -1);
  const record = {
    name: name.trim(),
    icon: icon || '📦',
    sortOrder: maxOrder + 1,
    deleted: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  const id = await db.add(STORES.CATEGORIES, record);
  return { ...record, id };
}

async function update(id, changes) {
  const existing = await getById(id);
  if (!existing) throw new Error('التصنيف غير موجود');
  const updated = { ...existing, ...changes, updatedAt: nowISO() };
  await db.put(STORES.CATEGORIES, updated);
  return updated;
}

async function reorder(orderedIds) {
  const all = await getAll();
  const byId = new Map(all.map((c) => [c.id, c]));
  await Promise.all(orderedIds.map((id, index) => {
    const cat = byId.get(id);
    if (!cat) return Promise.resolve();
    return db.put(STORES.CATEGORIES, { ...cat, sortOrder: index, updatedAt: nowISO() });
  }));
}

async function hardDelete(id) {
  await db.delete(STORES.CATEGORIES, id);
}

export const categoriesRepository = {
  getAll, getById, existsByName, create, update, reorder, hardDelete,
};

