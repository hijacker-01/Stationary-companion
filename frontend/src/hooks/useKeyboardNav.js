import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useKeyboardNav() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === "INPUT" || active.tagName === "SELECT" || active.tagName === "TEXTAREA");

      // 1. ESCAPE LOGIC
      if (e.key === "Escape") {
        window.dispatchEvent(new Event("close-modals"));
        const modal = document.querySelector('.fixed.inset-0, [role="dialog"]');
        if (modal) {
          const closeBtn = Array.from(modal.querySelectorAll('button')).find(b => 
            b.textContent.toLowerCase().includes('cancel') || 
            b.textContent.toLowerCase().includes('close') ||
            b.innerHTML.includes('lucide-x')
          );
          if (closeBtn) closeBtn.click();
        } else if (location.pathname !== "/dashboard") {
          navigate("/dashboard");
        }
        return;
      }

      // 2. SIDEBAR ARROW LOGIC (Only if not typing in an input)
      if (!isInput && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        // Prevent scrolling when using arrows to navigate sidebar
        e.preventDefault(); 
        
        const sidebarLinks = Array.from(document.querySelectorAll('.w-52 a[href]'));
        if (sidebarLinks.length === 0) return;
        
        const currentIndex = sidebarLinks.findIndex(link => link.getAttribute('href') === location.pathname);
        let nextIndex = 0;
        
        if (e.key === "ArrowDown") {
          nextIndex = currentIndex < sidebarLinks.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === "ArrowUp") {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : sidebarLinks.length - 1;
        }
        
        const nextHref = sidebarLinks[nextIndex].getAttribute('href');
        if (nextHref) navigate(nextHref);
        return;
      }

      // 3. ENTER LOGIC
      if (e.key === "Enter") {
        if (e.defaultPrevented) return;

        // If focused on a standard button or link, let the browser handle the click
        if (active && (active.tagName === "BUTTON" || active.tagName === "A")) {
          return;
        }

        // If focused on a non-input clickable element (like a custom row), click it
        if (!isInput && active && (active.tagName === "TR" || active.tagName === "LI" || active.getAttribute("role") === "button" || active.classList.contains("cursor-pointer"))) {
          e.preventDefault();
          active.click();
          return;
        }

        // If in an input, act like TAB (move to next input)
        // BUT don't break autocompletes that might be using Enter to select
        // A simple heuristic: if it's an input with role="combobox", let it handle Enter
        if (isInput && active.getAttribute("role") !== "combobox") {
          const focusableSelectors = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
          const scope = active.closest('form, [role="dialog"], body');
          const elements = Array.from(scope.querySelectorAll(focusableSelectors));
          const currentIndex = elements.indexOf(active);

          if (currentIndex > -1 && currentIndex < elements.length - 1) {
            e.preventDefault();
            elements[currentIndex + 1].focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, location]);
}
