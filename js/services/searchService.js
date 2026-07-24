import { productsRepository } from '../repositories/products.js';
import { shoppingListItemsRepository } from '../repositories/shoppingListItems.js';

const MAX_RESULTS = 15;

async function suggest(term) {
  const matches = await productsRepository.searchByName(term);
  return matches.slice(0, MAX_RESULTS);
}

async function addProductToCart(productId) {
  return shoppingListItemsRepository.addItem(productId);
}

export const searchService = { suggest, addProductToCart };

