import { useEffect } from "react";

/**
 * useFormNav — Global Enter-key form navigation.
 * Press Enter to move to the next focusable field.
 * Press Shift+Enter to move to the previous field.
 * Skips readonly fields, hidden inputs, disabled elements.
 * Defers to useTableNav when inside a table.
 * Defers to custom dropdowns when aria-expanded="true".
 */
export function useFormNav() {
  useEffect(() => {
    // Elements with tabindex="-1" are intentionally kept out of the Enter-chain
    // (e.g. the barcode-scan button), so callers can opt fields out of the flow.
    const FOCUSABLE = 'input:not([disabled]):not([type="hidden"]):not([readonly]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([readonly]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [data-smart-select] input:not([disabled])';

    const handleKeyDown = (e) => {
      if (e.key !== 'Enter') return;
      // Shift+Enter is reserved app-wide for "finish/save" (useDocumentKeyboard
      // and the per-form save handlers). Esc now handles reverse navigation, so
      // don't hijack Shift+Enter for backward field movement.
      if (e.shiftKey) return;

      const active = document.activeElement;
      if (!active) return;

      const isInput = active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA';
      const isButton = active.tagName === 'BUTTON';
      const isTextArea = active.tagName === 'TEXTAREA';

      // Only handle inputs and selects (not buttons — Enter should click buttons)
      if (!isInput && !isButton) return;
      if (isButton) return; // Let Enter click the button naturally

      // Don't handle if inside a table — useTableNav owns that
      if (active.closest('table')) return;

      // Don't handle if a custom dropdown is open — the dropdown's own handler owns Enter
      if (active.getAttribute('aria-expanded') === 'true') return;

      // Don't handle multiline textareas (let Enter create newlines)
      if (isTextArea && !e.ctrlKey) return;

      // Don't interfere with sidebar/header navigation
      if (active.closest('header, nav, aside, [data-section="sidebar"], [data-section="right-sidebar"]')) return;

      e.preventDefault();
      e.stopPropagation();

      // Find all focusable elements in scope
      const scope = active.closest('[data-form-scope]') || active.closest('form') || active.closest('main') || document.body;
      const elements = Array.from(scope.querySelectorAll(FOCUSABLE))
        .filter(el => {
          // Skip elements that are inside the sidebar/header
          if (el.closest('header, nav, aside, [data-section="sidebar"]')) return false;
          // Skip invisible elements
          if (el.offsetParent === null && el.type !== 'hidden') return false;
          return true;
        });

      const currentIndex = elements.indexOf(active);

      if (e.shiftKey) {
        // Move backward
        if (currentIndex > 0) {
          const prev = elements[currentIndex - 1];
          prev.focus();
          if (prev.tagName === 'INPUT' && prev.type !== 'checkbox' && prev.type !== 'radio') {
            setTimeout(() => prev.select(), 0);
          }
        }
      } else {
        // Move forward
        if (currentIndex > -1 && currentIndex < elements.length - 1) {
          const next = elements[currentIndex + 1];
          next.focus();
          if (next.tagName === 'INPUT' && next.type !== 'checkbox' && next.type !== 'radio') {
            setTimeout(() => next.select(), 0);
          }
        } else if (currentIndex === elements.length - 1) {
          // At end — try to find a save button
          const saveBtn = scope.querySelector('button[type="submit"]') || 
            Array.from(scope.querySelectorAll('button')).find(b => 
              b.textContent.toLowerCase().includes('save') || b.textContent.includes('F10')
            );
          if (saveBtn) saveBtn.focus();
        }
      }
    };

    // Use capture phase with high priority
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
