import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts(onToggleModal) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        if (onToggleModal) onToggleModal();
        return;
      }

      // Prevent running shortcuts when typing in inputs/textareas
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Ctrl+Shift+H: Toggle focus between header and main content
      if (e.ctrlKey && e.shiftKey && e.key === "H") {
        e.preventDefault();
        const header = document.querySelector('[data-section="header"]');
        const main = document.querySelector("main");
        
        if (header && main) {
          main.tabIndex = 0;
          if (header.contains(document.activeElement)) {
            main.focus();
          } else {
            const firstBtn = header.querySelector("button");
            if (firstBtn) firstBtn.focus();
          }
        }
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            navigate("/billing");
            break;
          case "p":
            e.preventDefault();
            navigate("/purchase-entry");
            break;
          case "i":
            e.preventDefault();
            navigate("/items");
            break;
          case "l":
            e.preventDefault();
            navigate("/ledger");
            break;
          case "d":
            e.preventDefault();
            navigate("/dashboard");
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}
