import { db } from '../db.js';
import { STORES } from '../utils/constants.js';
import { nowISO } from '../utils/helpers.js';

const STORE = STORES.SHOPPING_LIST_ITEMS ?? STORES.CART;

async function getAll() {
  const all = await db.getAll(STORE);
  return all.sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0));
}

async function getItem(productId) {
  const all = await getAll();
  return all.find(i => i.productId === productId) ?? null;
}

async function hasItem(productId) {
  return !!(await getItem(productId));
}

async function addItem(productId) {
  const existing = await getItem(productId);
  if (existing) return existing;

  const all = await getAll();
  const maxOrder = all.reduce((m,i)=>Math.max(m,i.sortOrder??0),-1);

  const record = {
    productId,
    listId: 1,
    quantity: 1,
    unit: "",
    checked: false,
    note: "",
    sortOrder: maxOrder + 1,
    addedAt: nowISO()
  };

  await db.add(STORE, record);
  return record;
}

async function updateItem(productId, changes) {
  const item = await getItem(productId);
  if (!item) throw new Error("العنصر غير موجود");

  const updated = { ...item, ...changes };

  await db.put(STORE, updated);
  return updated;
}

async function removeItem(productId) {
  const item = await getItem(productId);
  if (item) await db.delete(STORE, item.id);
}

async function clear() {
  await db.clear(STORE);
}

async function count() {
  return db.count(STORE);
}

export const shoppingCartRepository = {
  getAll,
  getItem,
  hasItem,
  addItem,
  updateItem,
  removeItem,
  clear,
  count
};
