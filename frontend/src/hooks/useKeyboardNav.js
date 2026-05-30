import { useEffect } from "react";

export function useKeyboardNav() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle ESCAPE globally to close modals if any
      if (e.key === "Escape") {
        window.dispatchEvent(new Event("close-modals"));
        const modal = document.querySelector('.fixed.inset-0, [role="dialog"]');
        if (modal) {
          const closeBtn = Array.from(modal.querySelectorAll('button')).find(b => 
            b.textContent.toLowerCase().includes('cancel') || 
            b.textContent.toLowerCase().includes('close') ||
            b.innerHTML.includes('lucide-x') // X icon
          );
          if (closeBtn) closeBtn.click();
        }
      }

      // Handle ENTER and Arrow keys for form navigation
      const active = document.activeElement;
      if (!active || (active.tagName !== "INPUT" && active.tagName !== "SELECT" && active.tagName !== "BUTTON" && active.tagName !== "TEXTAREA")) {
        return;
      }

      // Gather all focusable elements in the current logical container (form, table row, or main content)
      const focusableSelectors = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      
      // We limit scope to the closest modal or the main body to avoid jumping randomly
      const scope = active.closest('[role="dialog"]') || document.body;
      const elements = Array.from(scope.querySelectorAll(focusableSelectors));
      const currentIndex = elements.indexOf(active);

      if (currentIndex === -1) return;

      if (e.key === "Enter") {
        // Only prevent default on Enter if it's not a submit button or textarea
        if (active.tagName !== "BUTTON" && active.tagName !== "TEXTAREA") {
          e.preventDefault();
          const nextElement = elements[currentIndex + 1];
          if (nextElement) nextElement.focus();
        }
      } else if (e.key === "ArrowRight") {
        if (active.tagName === "INPUT" && active.selectionStart < active.value.length) return; // Allow text navigation
        e.preventDefault();
        const nextElement = elements[currentIndex + 1];
        if (nextElement) nextElement.focus();
      } else if (e.key === "ArrowLeft") {
        if (active.tagName === "INPUT" && active.selectionStart > 0) return; // Allow text navigation
        e.preventDefault();
        const prevElement = elements[currentIndex - 1];
        if (prevElement) prevElement.focus();
      } else if (e.key === "ArrowDown") {
        // If we are in a table grid, we want to go down to the same column in the next row.
        // We'll approximate this by finding the element with the same name/class in the next logical group,
        // or simply moving focus to the element roughly `cols` away.
        // For simplicity, standard arrow down in our dense UI moves to the next element if it's a dropdown,
        // but if it's a standard input, let's try to jump to next row.
        const currentName = active.getAttribute("name");
        if (currentName) {
           const sameNameElements = Array.from(scope.querySelectorAll(`[name="${currentName}"]`));
           const myIdx = sameNameElements.indexOf(active);
           if (myIdx > -1 && sameNameElements[myIdx + 1]) {
               e.preventDefault();
               sameNameElements[myIdx + 1].focus();
           }
        }
      } else if (e.key === "ArrowUp") {
        const currentName = active.getAttribute("name");
        if (currentName) {
           const sameNameElements = Array.from(scope.querySelectorAll(`[name="${currentName}"]`));
           const myIdx = sameNameElements.indexOf(active);
           if (myIdx > 0 && sameNameElements[myIdx - 1]) {
               e.preventDefault();
               sameNameElements[myIdx - 1].focus();
           }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
