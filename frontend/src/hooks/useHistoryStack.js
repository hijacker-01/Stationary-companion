import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useHistoryStack() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if inside an input, unless we really want it globally
      const activeTag = document.activeElement?.tagName;
      const isInput = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";
      if (isInput) return;

      if (e.ctrlKey) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          navigate(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          navigate(1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}
