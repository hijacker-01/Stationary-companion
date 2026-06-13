/**
 * advanceFocusFrom(element) — Move focus from the given element to the next
 * focusable field in the form/main scope. Used by custom dropdowns after
 * a selection is made.
 */
export function advanceFocusFrom(element) {
  if (!element) return;
  setTimeout(() => {
    const scope = element.closest('[data-form-scope]') || element.closest('main') || document.body;
    const focusables = Array.from(scope.querySelectorAll(
      'input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button:not([disabled])'
    )).filter(el => {
      if (el.closest('header, nav, aside, [data-section="sidebar"]')) return false;
      if (el.offsetParent === null) return false;
      return true;
    });
    const idx = focusables.indexOf(element);
    if (idx > -1 && focusables[idx + 1]) {
      const next = focusables[idx + 1];
      next.focus();
      if (next.tagName === 'INPUT' && next.type !== 'checkbox' && next.type !== 'radio') {
        setTimeout(() => next.select(), 0);
      }
    }
  }, 10);
}

/**
 * focusFirstField(containerSelector) — Focus the first focusable input inside a
 * container. Used when switching to a "create" view to auto-focus the first field.
 */
export function focusFirstField(containerSelector) {
  setTimeout(() => {
    const container = typeof containerSelector === 'string' 
      ? document.querySelector(containerSelector) 
      : containerSelector;
    if (!container) return;
    const first = container.querySelector(
      'input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly])'
    );
    if (first) {
      first.focus();
      if (first.tagName === 'INPUT') setTimeout(() => first.select(), 0);
    }
  }, 100);
}
