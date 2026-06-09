import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useHotkeys() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // In Marg ERP, Alt combinations work globally even if typing in an input
      if (e.altKey) {
        let path = null;
        switch (e.key.toLowerCase()) {
          case "n": 
            e.preventDefault();
            window.dispatchEvent(new Event("open-quick-create"));
            break;
          case "s": path = "/billing"; break;           // Alt+S -> Sales Bill
          case "p": path = "/purchase-bills"; break;    // Alt+P -> Purchase Bill
          case "c": path = "/sales-challan"; break;     // Alt+C -> Sales Challan
          case "r": path = "/receipt-voucher"; break;   // Alt+R -> Receipt Voucher
          case "v": path = "/payment-voucher"; break;   // Alt+V -> Payment Voucher
          case "i": path = "/inventory"; break;         // Alt+I -> Inventory
          case "d": path = "/dashboard"; break;         // Alt+D -> Dashboard
          case "a": path = "/ledger"; break;            // Alt+A -> Accounts/Ledger
          case "m": path = "/items"; break;             // Alt+M -> Masters/Items
          default: break;
        }

        if (path) {
          e.preventDefault();
          navigate(path);
        }
      }

      // Legacy Ctrl shortcuts if still needed
      if (e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
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
