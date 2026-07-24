import { db } from '../db.js';
import { STORES } from '../utils/constants.js';
import { nowISO } from '../utils/helpers.js';

async function getAll() {
  const all = await db.getAll(STORES.CART);
  return all.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

async function getItem(productId) {
  return db.get(STORES.CART, productId);
}

async function hasItem(productId) {
  const item = await getItem(productId);
  return Boolean(item);
}

async function addItem(productId) {
  const existing = await getItem(productId);
  if (existing) return existing;
  const all = await getAll();
  const maxOrder = all.reduce((max, i) => Math.max(max, i.sortOrder ?? 0), -1);
  const record = {
    productId,
    checked: false,
    note: '',
    sortOrder: maxOrder + 1,
    addedAt: nowISO(),
  };
  await db.put(STORES.CART, record);
  return record;
}

async function updateItem(productId, changes) {
  const existing = await getItem(productId);
  if (!existing) throw new Error('العنصر غير موجود في السلة');
  const updated = { ...existing, ...changes };
  await db.put(STORES.CART, updated);
  return updated;
}

async function removeItem(productId) {
  await db.delete(STORES.CART, productId);
}

async function clear() {
  await db.clear(STORES.CART);
}

async function count() {
  return db.count(STORES.CART);
}

export const shoppingCartRepository = {
  getAll, getItem, hasItem, addItem, updateItem, removeItem, clear, count,
};
