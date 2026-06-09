import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useFocusMemory() {
  const location = useLocation();

  useEffect(() => {
    // 1. On mount (or location change), attempt to restore focus
    const timer = setTimeout(() => {
      // Don't steal focus if user explicitly focused something (like a modal)
      if (document.activeElement && document.activeElement.tagName !== 'BODY' && document.activeElement.closest('[role="dialog"]')) {
        return;
      }

      const storedSelector = sessionStorage.getItem(`focus_mem_${location.pathname}`);
      let restored = false;
      
      if (storedSelector) {
        try {
          const el = document.querySelector(storedSelector);
          if (el) {
            el.focus();
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
              el.select();
            }
            restored = true;
          }
        } catch (e) {
          // invalid selector, ignore
        }
      }

      // If nothing restored, default to the top bar (header)
      if (!restored) {
        const topBarBtn = document.querySelector('header button, [data-section="header"] button');
        if (topBarBtn && !topBarBtn.closest('[role="dialog"]')) {
          topBarBtn.focus();
        } else {
          // Fallback to first input
          const firstInput = document.querySelector('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])');
          if (firstInput && !firstInput.closest('[role="dialog"]')) { 
            firstInput.focus();
            if (firstInput.tagName === 'INPUT') firstInput.select();
          }
        }
      }
    }, 150); // slight delay to allow React to render elements

    // 2. Before unmount (or location change), save the currently focused element
    return () => {
      clearTimeout(timer);
      const active = document.activeElement;
      
      // Do not save focus state if we are inside a modal, or if body is focused
      if (active && active.tagName !== "BODY" && !active.closest('[role="dialog"]')) {
        let selector = "";
        if (active.id) {
          selector = `#${CSS.escape(active.id)}`;
        } else if (active.name) {
          selector = `${active.tagName.toLowerCase()}[name="${CSS.escape(active.name)}"]`;
        } else if (active.hasAttribute('data-index')) {
          selector = `${active.tagName.toLowerCase()}[data-index="${active.getAttribute('data-index')}"]`;
        } else {
          // Generate a CSS path
          const getPath = (el) => {
             if (!el || el.tagName === 'BODY' || el.tagName === 'HTML') return '';
             if (el.id) return `#${CSS.escape(el.id)}`;
             let nth = 1;
             let sibling = el;
             while ((sibling = sibling.previousElementSibling)) nth++;
             return `${getPath(el.parentElement)} > ${el.tagName}:nth-child(${nth})`;
          };
          selector = getPath(active);
        }
        
        if (selector) {
          sessionStorage.setItem(`focus_mem_${location.pathname}`, selector);
        }
      }
    };
  }, [location.pathname]);
}
