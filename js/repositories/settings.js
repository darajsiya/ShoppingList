import { db } from '../db.js';
import { STORES } from '../utils/constants.js';

async function get(key, fallback = null) {
  const record = await db.get(STORES.SETTINGS, key);
  return record ? record.value : fallback;
}

async function set(key, value) {
  await db.put(STORES.SETTINGS, { key, value });
}

async function getAll() {
  return db.getAll(STORES.SETTINGS);
}

export const settingsRepository = { get, set, getAll };
