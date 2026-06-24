import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEscReverse } from "./useEscReverse";
import { useArrowOptionNav } from "./useArrowOptionNav";
import { useHistoryStack } from "./useHistoryStack";
import { useTableNav } from "./useTableNav";
import { useFormNav } from "./useFormNav";
import { useFocusMemory } from "./useFocusMemory";
import { useModalFocus } from "./useModalFocus";

export function useKeyboardNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize sub-hooks. useEscReverse is first so its capture-phase Esc
  // handler runs before the forward Enter-nav (table/form) hooks.
  useEscReverse();
  useArrowOptionNav();
  useHistoryStack();
  useTableNav();
  useFormNav();
  useFocusMemory();
  useModalFocus();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === "INPUT" || active.tagName === "SELECT" || active.tagName === "TEXTAREA");

      // 1. ESCAPE LOGIC — "go one step back" everywhere.
      if (e.key === "Escape") {
        if (e.defaultPrevented) return; // Allow other hooks like useTableNav to intercept

        // Step 1: an open modal/dialog is the closest "step back" — close it.
        window.dispatchEvent(new Event("close-modals"));
        const modal = document.querySelector('.fixed.inset-0, [role="dialog"]');
        if (modal) {
          const closeBtn = Array.from(modal.querySelectorAll('button')).find(b =>
            b.textContent.toLowerCase().includes('cancel') ||
            b.textContent.toLowerCase().includes('close') ||
            b.innerHTML.includes('lucide-x')
          );
          if (closeBtn) closeBtn.click();
          return;
        }

        // Step 2: give the current page a chance to step its own sub-view back
        // (e.g. a bill's preview -> create -> list). Those handlers run after
        // this one and call preventDefault. If none claims the ESC, move one
        // step back in history — so Esc is a universal "go back" key.
        setTimeout(() => {
          if (e.defaultPrevented) return;
          if (location.pathname !== "/dashboard" && location.pathname !== "/") {
            navigate(-1);
          }
        }, 0);
        return;
      }

      // 2. MACRO TABBING (Section Navigation)
      if (e.key === "Tab") {
        // If we are not in an input, we can override Tab to jump between main layout sections
        if (!isInput) {
          const sections = Array.from(document.querySelectorAll('nav[role="tree"], main, aside, [role="region"], [data-section]'));
          if (sections.length > 0) {
            e.preventDefault();
            let currentIndex = sections.indexOf(active) !== -1 ? sections.indexOf(active) : sections.indexOf(active?.closest('nav[role="tree"], main, aside, [role="region"], [data-section]'));
            
            if (e.shiftKey) {
              // Previous section
              let prevIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
              sections[prevIndex].focus();
            } else {
              // Next section
              let nextIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
              sections[nextIndex].focus();
            }
          }
        }
      }

      // (Removed macro Left/Right spatial nav: arrows must never jump focus into
      // the left sidebar or right rail. Option-to-option arrow movement inside
      // the page content is handled by useArrowOptionNav.)
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, location]);
}
