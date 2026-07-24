import { el, clearNode, debounce } from '../utils/helpers.js';
import { searchService } from '../services/searchService.js';
import { renderSearchResultRow } from './productItem.js';

/**
 * ينشئ شريط بحث ذاتي الاكتفاء: يبحث أثناء الكتابة، يعرض نتائج فورية،
 * وعند عدم وجود نتائج يعرض خيار "إضافة منتج جديد".
 *
 * options.onSelectProduct(product)   -> عند اختيار منتج موجود
 * options.onCreateNew(term)          -> عند طلب إنشاء منتج جديد بهذا الاسم
 * options.autoFocus                  -> تركيز تلقائي عند الإنشاء
 */
export function createSearchBar(options) {
  const { onSelectProduct, onCreateNew, autoFocus = true, placeholder = 'ابحث أو أضف منتج...' } = options;

  const input = el('input', {
    class: 'search-bar__input',
    type: 'text',
    placeholder,
    autocomplete: 'off',
    'aria-label': 'بحث عن منتج',
  });

  const resultsList = el('ul', { class: 'search-bar__results' });
  const emptyState = el('div', { class: 'search-bar__empty', style: 'display:none' });

  const wrapper = el('div', { class: 'search-bar' }, [
    el('div', { class: 'search-bar__field' }, [
      el('span', { class: 'search-bar__icon', text: '🔍' }),
      input,
    ]),
    resultsList,
    emptyState,
  ]);

  function reset() {
    input.value = '';
    clearNode(resultsList);
    emptyState.style.display = 'none';
    resultsList.style.display = 'none';
  }

  function focus() {
    input.focus();
  }

  async function runSearch(term) {
    if (!term.trim()) {
      clearNode(resultsList);
      emptyState.style.display = 'none';
      resultsList.style.display = 'none';
      return;
    }
    const matches = await searchService.suggest(term);
    clearNode(resultsList);

    if (matches.length === 0) {
      resultsList.style.display = 'none';
      clearNode(emptyState);
      emptyState.style.display = 'flex';
      emptyState.appendChild(el('span', { text: `لا يوجد "${term}" في الكتالوج` }));
      emptyState.appendChild(el('button', {
        class: 'btn btn--primary btn--small',
        onclick: () => onCreateNew(term.trim()),
        text: '+ إضافة منتج جديد',
      }));
      return;
    }

    emptyState.style.display = 'none';
    resultsList.style.display = 'block';
    matches.forEach((product) => {
      resultsList.appendChild(renderSearchResultRow(product, (p) => {
        onSelectProduct(p);
        reset();
      }));
    });
  }

  const debouncedSearch = debounce((term) => runSearch(term), 150);

  input.addEventListener('input', () => debouncedSearch(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstRow = resultsList.querySelector('.search-result');
      if (firstRow) firstRow.click();
      else if (input.value.trim()) onCreateNew(input.value.trim());
    } else if (e.key === 'Escape') {
      reset();
    }
  });

  if (autoFocus) {
    setTimeout(focus, 50);
  }

  return { node: wrapper, reset, focus };
}

