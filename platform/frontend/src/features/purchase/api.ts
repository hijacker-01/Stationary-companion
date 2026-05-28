import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PurchaseInvoiceInput } from "./types";

export function usePostPurchaseInvoice() {
  return useMutation({
    mutationFn: async (payload: PurchaseInvoiceInput) => {
      const { data } = await apiClient.post("/transactions/purchase-invoices", payload);
      return data;
    },
  });
}
