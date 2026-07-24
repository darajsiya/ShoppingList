import { shoppingCartRepository } from '../repositories/shoppingCart.js';
import { productsRepository } from '../repositories/products.js';
import { historyRepository } from '../repositories/history.js';

async function finishShopping() {
  const cartItems = await shoppingCartRepository.getAll();
  if (cartItems.length === 0) {
    const error = new Error('السلة فارغة، لا يوجد ما يتم إنهاؤه');
    error.code = 'EMPTY_CART';
    throw error;
  }

  const productIds = cartItems.map((item) => item.productId);
  const historyRecord = await historyRepository.create({ itemCount: productIds.length });
  await historyRepository.addItems(historyRecord.id, productIds);
  await Promise.all(productIds.map((id) => productsRepository.incrementPurchaseCount(id)));
  await shoppingCartRepository.clear();

  return { historyRecord, itemCount: productIds.length };
}

async function getHistoryWithDetails() {
  const history = await historyRepository.getAll();
  const allProducts = await productsRepository.getAll();
  const productsById = new Map(allProducts.map((p) => [p.id, p]));

  return Promise.all(history.map(async (record) => {
    const items = await historyRepository.getItemsByHistory(record.id);
    return {
      ...record,
      products: items.map((item) => productsById.get(item.productId)).filter(Boolean),
    };
  }));
}

export const purchaseService = { finishShopping, getHistoryWithDetails };
