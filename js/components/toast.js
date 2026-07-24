import { el } from '../utils/helpers.js';

let container = null;

function ensureContainer() {
  if (!container) {
    container = document.getElementById('toast-container');
  }
  return container;
}

export function showToast(message, type = 'info') {
  const root = ensureContainer();
  if (!root) return;
  const toast = el('div', { class: `toast toast--${type}` }, message);
  root.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

