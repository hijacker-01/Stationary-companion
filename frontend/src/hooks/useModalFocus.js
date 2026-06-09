import { useEffect } from "react";

export function useModalFocus() {
  useEffect(() => {
    // We can't simply listen for a modal to open globally because React might mount/unmount them at any time.
    // Instead, we will listen for Tab keypresses globally and trap them if a modal is open.
    // But we also need to auto-focus when it opens. We can use a MutationObserver to detect new modals!
    
    const trapFocus = (e) => {
      if (e.key === 'Tab') {
        const modal = document.querySelector('.fixed.inset-0, [role="dialog"]');
        if (!modal) return; // no modal open
        
        // If we are outside the modal, we shouldn't be!
        const focusableSelectors = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(modal.querySelectorAll(focusableSelectors));
        
        if (focusableElements.length === 0) return;
        
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        
        // Trap focus inside
        if (e.shiftKey) {
          if (document.activeElement === first || !modal.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modal.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", trapFocus, true);

    // MutationObserver to auto-focus when a modal is added to the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // ELEMENT_NODE
              const modal = node.matches('.fixed.inset-0, [role="dialog"]') ? node : node.querySelector('.fixed.inset-0, [role="dialog"]');
              if (modal) {
                // Modal found, focus its first focusable element
                const focusableSelectors = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
                const first = modal.querySelector(focusableSelectors);
                if (first) {
                  // Slight delay to allow animations/renders to finish
                  setTimeout(() => {
                    first.focus();
                    if (first.tagName === 'INPUT' || first.tagName === 'TEXTAREA') first.select();
                  }, 50);
                }
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("keydown", trapFocus, true);
      observer.disconnect();
    };
  }, []);
}
