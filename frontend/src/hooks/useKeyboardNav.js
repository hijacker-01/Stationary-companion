import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHistoryStack } from "./useHistoryStack";
import { useTableNav } from "./useTableNav";
import { useFormNav } from "./useFormNav";
import { useFocusMemory } from "./useFocusMemory";
import { useModalFocus } from "./useModalFocus";

export function useKeyboardNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize sub-hooks
  useHistoryStack();
  useTableNav();
  useFormNav();
  useFocusMemory();
  useModalFocus();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === "INPUT" || active.tagName === "SELECT" || active.tagName === "TEXTAREA");

      // 1. ESCAPE LOGIC (Close modals or navigate back)
      if (e.key === "Escape") {
        if (e.defaultPrevented) return; // Allow other hooks like useTableNav to intercept
        
        window.dispatchEvent(new Event("close-modals"));
        const modal = document.querySelector('.fixed.inset-0, [role="dialog"]');
        
        if (modal) {
          const closeBtn = Array.from(modal.querySelectorAll('button')).find(b => 
            b.textContent.toLowerCase().includes('cancel') || 
            b.textContent.toLowerCase().includes('close') ||
            b.innerHTML.includes('lucide-x')
          );
          if (closeBtn) closeBtn.click();
        } else if (location.pathname !== "/dashboard" && location.pathname !== "/") {
          // Classic Marg ERP: ESC goes back to main menu
          navigate("/dashboard");
        }
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

      // 3. MACRO SPATIAL NAVIGATION (Left/Right Arrows outside inputs)
      if (!isInput && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        // Wait a tick to see if another hook (like useFormNav for buttons) prevented default
        setTimeout(() => {
          if (e.defaultPrevented) return;
          
          const leftNav = document.querySelector('nav[data-section="sidebar"]');
          const rightNav = document.querySelector('aside[data-section="right-sidebar"]');
          const main = document.querySelector('main');
          
          const activeAfter = document.activeElement;
          const isInLeft = activeAfter === leftNav || leftNav?.contains(activeAfter);
          const isInRight = activeAfter === rightNav || rightNav?.contains(activeAfter);
          const isInMain = activeAfter === main || main?.contains(activeAfter) || activeAfter.tagName === 'BODY';

          if (e.key === "ArrowRight") {
            // From main to right nav
            if (isInMain && rightNav) {
              const firstBtn = rightNav.querySelector('button');
              if (firstBtn) firstBtn.focus();
              else rightNav.focus();
            } else if (isInLeft && main) {
              // From left nav to main
              main.setAttribute('tabindex', '-1');
              main.focus();
            }
          } else if (e.key === "ArrowLeft") {
            if (isInRight && main) {
              // From right nav to main
              main.setAttribute('tabindex', '-1');
              main.focus();
            } else if (isInMain && leftNav) {
              // From main to left nav
              leftNav.focus();
            }
          }
        }, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, location]);
}
