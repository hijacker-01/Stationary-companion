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

      // A page can declare an explicit default focus target (e.g. the
      // Dashboard's Bills action). Honor it over remembered/fallback focus so
      // landing on the page (e.g. via ESC) always starts there.
      const pageDefault = document.querySelector('[data-default-focus]');
      if (pageDefault && !pageDefault.closest('[role="dialog"]')) {
        pageDefault.focus();
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

      // If nothing restored, default-focus the page's FIRST interactive control
      // in the MAIN content (left-/top-most), so every page starts ready for
      // typing / arrows / Enter. Priority: a dropdown (if the page has one) →
      // first text field → first option button. NEVER the left sidebar or the
      // top bar — focusing chrome there is logically wrong for data entry.
      if (!restored) {
        const main = document.querySelector("main") || document.body;
        const inMain = (sel) =>
          Array.from(main.querySelectorAll(sel)).find(
            (el) => el.offsetParent !== null && !el.closest('header, nav, aside, [data-section="sidebar"], [data-section="right-sidebar"], [role="dialog"]')
          );
        const dropdown = inMain('[data-smart-select] input:not([disabled]), [role="combobox"]:not([disabled]), select:not([disabled]):not([tabindex="-1"])');
        const firstField = inMain('input:not([disabled]):not([type="hidden"]):not([readonly]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"])');
        const firstOption = inMain('button:not([disabled]):not([tabindex="-1"]), [role="button"]:not([tabindex="-1"]), [role="tab"]:not([tabindex="-1"]), a[href]:not([tabindex="-1"]), [data-option]:not([tabindex="-1"])');
        const target = dropdown || firstField || firstOption; // never header/sidebar
        if (target && !target.closest('[role="dialog"]')) {
          target.focus();
          if (target.tagName === "INPUT") { try { target.select(); } catch (_) { /* date/number */ } }
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
