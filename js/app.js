import { openDB } from './db.js';
import { VIEWS } from './utils/constants.js';
import { renderCartView } from './views/cart.js';
import { renderCatalogView } from './views/catalog.js';
import { renderHistoryView } from './views/history.js';
import { renderSettingsView } from './views/settings.js';
import { showToast } from './components/toast.js';

const routes = {
  [VIEWS.CART]: renderCartView,
  [VIEWS.CATALOG]: renderCatalogView,
  [VIEWS.HISTORY]: renderHistoryView,
  [VIEWS.SETTINGS]: renderSettingsView,
};

const NAV_ITEMS = [
  { key: VIEWS.CART, label: 'السلة', icon: '🧺' },
  { key: VIEWS.CATALOG, label: 'الكتالوج', icon: '📦' },
  { key: VIEWS.HISTORY, label: 'السجل', icon: '🧾' },
  { key: VIEWS.SETTINGS, label: 'الإعدادات', icon: '⚙️' },
];

const appRoot = document.getElementById('app-root');
const navRoot = document.getElementById('bottom-nav');

function currentRouteKey() {
  const hash = location.hash.replace('#/', '');
  return routes[hash] ? hash : VIEWS.CART;
}

function renderNav(activeKey) {
  navRoot.innerHTML = '';
  NAV_ITEMS.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = `bottom-nav__btn ${item.key === activeKey ? 'bottom-nav__btn--active' : ''}`;
    btn.innerHTML = `<span class="bottom-nav__icon">${item.icon}</span><span class="bottom-nav__label">${item.label}</span>`;
    btn.addEventListener('click', () => { location.hash = `#/${item.key}`; });
    navRoot.appendChild(btn);
  });
}

async function router() {
  const key = currentRouteKey();
  renderNav(key);
  try {
    await routes[key](appRoot);
  } catch (err) {
    console.error(err);
    showToast('حدث خطأ غير متوقع: ' + err.message, 'error');
  }
}

async function init() {
  try {
    await openDB();
  } catch (err) {
    appRoot.innerHTML = `<div class="empty-state"><p>تعذر فتح قاعدة البيانات المحلية.<br>${err.message}</p></div>`;
    return;
  }

  if (!location.hash) location.hash = `#/${VIEWS.CART}`;
  window.addEventListener('hashchange', router);
  await router();
}

init();
