import { useEffect } from "react";

export function useFormNav() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      
      if (!active || active.tagName === 'A') return;
      
      const isInput = active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA';
      const isButton = active.tagName === 'BUTTON';
      
      if (!isInput && !isButton) return;
      if (active.closest('table')) return; // Let useTableNav handle it
      if (active.closest('header, nav, aside, [data-section="sidebar"], [data-section="right-sidebar"]')) return; // Let layout navigators handle it

      // Button Navigation (Left/Right Arrow)
      if (isButton && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const buttons = Array.from((active.closest('.flex, .grid, form') || document.body).querySelectorAll('button:not([disabled])'));
        const idx = buttons.indexOf(active);
        if (e.key === 'ArrowLeft' && idx > 0) {
          buttons[idx - 1].focus();
        } else if (e.key === 'ArrowRight' && idx < buttons.length - 1) {
          buttons[idx + 1].focus();
        }
        return;
      }

      const isTextArea = active.tagName === 'TEXTAREA';
      const isSelect = active.tagName === 'SELECT';

      // Navigation triggers: Enter, Shift+Enter, ArrowUp, ArrowDown
      // But avoid ArrowUp/Down inside Textareas or Selects (which use them natively)
      const isNextTrigger = (e.key === 'Enter' && !e.shiftKey) || (e.key === 'ArrowDown' && !isTextArea && !isSelect);
      const isPrevTrigger = (e.key === 'Enter' && e.shiftKey) || (e.key === 'ArrowUp' && !isTextArea && !isSelect);

      // If the input has a custom dropdown open, let it handle its own navigation
      if (active.getAttribute('aria-expanded') === 'true' && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) return;

      if (isNextTrigger || isPrevTrigger) {
        // If it's Enter on a multi-line textarea, let it make a newline, don't prevent default unless Shift is pressed?
        // Actually, ERPs usually use Enter to move next even in some textareas, but let's be safe: 
        // if it's a textarea and they pressed Enter without Shift/Ctrl, maybe let them type.
        if (isTextArea && e.key === 'Enter' && !e.ctrlKey) return;

        e.preventDefault();
        
        const focusableSelectors = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
        // Scope to closest form, or whole body if not in form
        const scope = active.closest('form') || document.body;
        const elements = Array.from(scope.querySelectorAll(focusableSelectors));
        
        const currentIndex = elements.indexOf(active);
        
        if (isPrevTrigger) {
          // Move to previous field
          if (currentIndex > 0) {
            const prev = elements[currentIndex - 1];
            prev.focus();
            if (prev.tagName === 'INPUT') prev.select();
          }
        } else if (isNextTrigger) {
          // Move to next field
          if (currentIndex > -1 && currentIndex < elements.length - 1) {
            const next = elements[currentIndex + 1];
            next.focus();
            if (next.tagName === 'INPUT') next.select();
          } else if (currentIndex === elements.length - 1) {
            // Loop back or try to submit
            const submitBtn = scope.querySelector('button[type="submit"]') || Array.from(scope.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('save'));
            if (submitBtn) {
              submitBtn.focus();
            } else {
              elements[0].focus();
              if (elements[0].tagName === 'INPUT') elements[0].select();
            }
          }
        }
      }
    };

    const handleInvalid = (e) => {
      const form = e.target.closest('form');
      if (form) {
        const firstInvalid = form.querySelector(':invalid, [aria-invalid="true"]');
        if (firstInvalid) {
          firstInvalid.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("invalid", handleInvalid, true);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("invalid", handleInvalid, true);
    };
  }, []);
}
