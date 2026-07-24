import { getCurrentShoppingList } from './shoppingListService.js';
import { shoppingCartRepository } from '../repositories/shoppingCart.js';
import { productsRepository } from '../repositories/products.js';
import { historyRepository } from '../repositories/history.js';

async function finishShopping() {
  await getCurrentShoppingList();

  const cartItems = await shoppingCartRepository.getAll();

  if (cartItems.length === 0) {
    const error = new Error('السلة فارغة، لا يوجد ما يتم إنهاؤه');
    error.code = 'EMPTY_CART';
    throw error;
  }

  const products = await productsRepository.getAll();
  const map = new Map(products.map(p => [p.id, p]));

  const historyRecord = await historyRepository.create({
    itemCount: cartItems.length
  });

  await historyRepository.addItems(
    historyRecord.id,
    cartItems.map(item => {
      const p = map.get(item.productId) || {};

      return {
        productId: item.productId,
        productName: p.name ?? '',
        categoryId: p.categoryId ?? null,
        categoryName: p.categoryName ?? '',
        quantity: item.quantity ?? 1,
        unit: item.unit ?? '',
        purchasedAt: Date.now()
      };
    })
  );

  await Promise.all(
    cartItems.map(i => productsRepository.incrementPurchaseCount(i.productId))
  );

  await shoppingCartRepository.clear();

  return {
    historyRecord,
    itemCount: cartItems.length
  };
}

async function getHistoryWithDetails() {
  return historyRepository.getAll();
}

export const purchaseService = {
  finishShopping,
  getHistoryWithDetails
};
