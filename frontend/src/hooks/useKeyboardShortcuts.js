import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent running shortcuts when typing in inputs/textareas
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
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
