import { el, clearNode } from '../utils/helpers.js';

function getRoot() {
  return document.getElementById('dialog-root');
}

let escapeHandler = null;

function closeDialog() {
  const root = getRoot();
  root.classList.remove('dialog-root--open');
  clearNode(root);
  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }
}

// onDismiss يُستدعى عند الإغلاق من خارج زر صريح (نقر خارج الصندوق أو مفتاح Escape)
// حتى يُحسم الـ Promise المرتبط بالحوار دائماً، تماماً كما لو ضغط المستخدم "إلغاء".
function openDialog(contentNode, onDismiss) {
  const root = getRoot();
  clearNode(root);
  contentNode.setAttribute('role', 'dialog');
  contentNode.setAttribute('aria-modal', 'true');
  const overlay = el('div', {
    class: 'dialog-overlay',
    onclick: (e) => { if (e.target === overlay) onDismiss(); },
  }, contentNode);
  root.appendChild(overlay);
  root.classList.add('dialog-root--open');
  const firstInput = contentNode.querySelector('input, select, textarea, button');
  if (firstInput) firstInput.focus();

  escapeHandler = (e) => { if (e.key === 'Escape') onDismiss(); };
  document.addEventListener('keydown', escapeHandler);
}

// حوار تأكيد بسيط (نعم / إلغاء)
export function confirmDialog({ title, message, confirmLabel = 'تأكيد', danger = false }) {
  return new Promise((resolve) => {
    const cancel = () => { closeDialog(); resolve(false); };
    const confirm = () => { closeDialog(); resolve(true); };

    const box = el('div', { class: 'dialog-box' }, [
      el('h3', { class: 'dialog-box__title', text: title }),
      message ? el('p', { class: 'dialog-box__message', text: message }) : null,
      el('div', { class: 'dialog-box__actions' }, [
        el('button', { class: 'btn btn--ghost', onclick: cancel, text: 'إلغاء' }),
        el('button', { class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`, onclick: confirm, text: confirmLabel }),
      ]),
    ]);
    openDialog(box, cancel);
  });
}

// حوار نموذج مرن يعرض حقول ويعيد القيم عند الحفظ، أو null عند الإلغاء
export function formDialog({ title, fields, submitLabel = 'حفظ' }) {
  return new Promise((resolve) => {
    const inputs = {};

    const fieldNodes = fields.map((field) => {
      let input;
      if (field.type === 'select') {
        input = el('select', { class: 'field__input', name: field.name });
        field.options.forEach((opt) => {
          const optionEl = el('option', { value: opt.value, text: opt.label });
          if (opt.value === field.value) optionEl.selected = true;
          input.appendChild(optionEl);
        });
      } else if (field.type === 'textarea') {
        input = el('textarea', { class: 'field__input', name: field.name, placeholder: field.placeholder || '' });
        input.value = field.value || '';
      } else if (field.type === 'emoji-picker') {
        input = el('input', {
          class: 'field__input field__input--emoji',
          name: field.name,
          maxlength: '8',
          placeholder: field.placeholder || '🛒',
        });
        input.value = field.value || '';
      } else {
        input = el('input', {
          class: 'field__input',
          type: field.type || 'text',
          name: field.name,
          placeholder: field.placeholder || '',
          autocomplete: 'off',
        });
        input.value = field.value || '';
      }
      inputs[field.name] = input;
      return el('label', { class: 'field' }, [
        el('span', { class: 'field__label', text: field.label }),
        input,
      ]);
    });

    const cancel = () => { closeDialog(); resolve(null); };
    const submit = (e) => {
      e.preventDefault();
      const values = {};
      for (const [name, node] of Object.entries(inputs)) values[name] = node.value;
      closeDialog();
      resolve(values);
    };

    const form = el('form', { class: 'dialog-box', onsubmit: submit }, [
      el('h3', { class: 'dialog-box__title', text: title }),
      ...fieldNodes,
      el('div', { class: 'dialog-box__actions' }, [
        el('button', { class: 'btn btn--ghost', type: 'button', onclick: cancel, text: 'إلغاء' }),
        el('button', { class: 'btn btn--primary', type: 'submit', text: submitLabel }),
      ]),
    ]);
    openDialog(form, cancel);
  });
}

export { closeDialog };

