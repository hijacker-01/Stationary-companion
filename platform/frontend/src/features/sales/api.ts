import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { SalesInvoiceInput } from "./types";

export function usePostSalesInvoice() {
  return useMutation({
    mutationFn: async (payload: SalesInvoiceInput) => {
      const { data } = await apiClient.post("/transactions/sales-invoices", payload);
      return data;
    },
  });
}
