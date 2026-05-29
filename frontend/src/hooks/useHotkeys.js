import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useHotkeys() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      const activeTag = document.activeElement.tagName;
      const isInput = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";
      
      // Unless they specifically press Ctrl
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            navigate("/sales-challan");
            break;
          case "p":
            e.preventDefault();
            navigate("/purchase-challan");
            break;
          case "r":
            e.preventDefault();
            navigate("/receipt-voucher");
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
