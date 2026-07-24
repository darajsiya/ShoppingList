import { db } from '../db.js';
import { STORES } from '../utils/constants.js';
import { nowISO } from '../utils/helpers.js';

async function getAll() {
  const all = await db.getAll(STORES.HISTORY);
  return all.sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function getById(id) {
  return db.get(STORES.HISTORY, id);
}

async function create({ itemCount }) {
  const record = {
    date: nowISO(),
    itemCount
  };

  const id = await db.add(STORES.HISTORY, record);
  return { ...record, id };
}

async function addItems(historyId, items) {
  await Promise.all(
    items.map(item =>
      db.add(STORES.PURCHASE_ITEMS, {
        historyId,
        ...item
      })
    )
  );
}

async function getItemsByHistory(historyId) {
  return db.getAllByIndex(STORES.PURCHASE_ITEMS, 'historyId', historyId);
}

export const historyRepository = {
  getAll,
  getById,
  create,
  addItems,
  getItemsByHistory
};
