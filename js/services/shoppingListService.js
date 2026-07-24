import { shoppingListsRepository } from '../repositories/shoppingLists.js';

export async function getCurrentShoppingList() {
  const lists = await shoppingListsRepository.getAll();

  if (lists.length) {
    return lists[0];
  }

  const id = await shoppingListsRepository.save({
    name: 'قائمة التسوق',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    active: true
  });

  return shoppingListsRepository.get(id);
}
