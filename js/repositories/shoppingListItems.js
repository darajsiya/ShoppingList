import { db } from '../db.js';
import { STORES } from '../utils/constants.js';

export const shoppingListItemsRepository = {
  getAll() {
    return db.getAll(STORES.SHOPPING_LIST_ITEMS);
  },

  getByList(listId) {
    return db.getAllByIndex(STORES.SHOPPING_LIST_ITEMS, 'listId', listId);
  },

  save(item) {
    return db.put(STORES.SHOPPING_LIST_ITEMS, item);
  },

  remove(id) {
    return db.delete(STORES.SHOPPING_LIST_ITEMS, id);
  },

  clear() {
    return db.clear(STORES.SHOPPING_LIST_ITEMS);
  }
};
