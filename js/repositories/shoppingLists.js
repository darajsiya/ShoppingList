import { db } from '../db.js';
import { STORES } from '../utils/constants.js';

export const shoppingListsRepository = {
  getAll() {
    return db.getAll(STORES.SHOPPING_LISTS);
  },

  get(id) {
    return db.get(STORES.SHOPPING_LISTS, id);
  },

  save(list) {
    return db.put(STORES.SHOPPING_LISTS, {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...list,
    });
  },

  remove(id) {
    return db.delete(STORES.SHOPPING_LISTS, id);
  },
};
