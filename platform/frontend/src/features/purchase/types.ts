export type PurchaseInvoiceLineInput = {
  item_id: string;
  item_batch_id: string;
  quantity: number;
  free_quantity: number;
  rate: number;
  gst_rate: number;
};

export type PurchaseInvoiceInput = {
  company_id: string;
  branch_id: string;
  supplier_id: string;
  invoice_no: string;
  invoice_date: string;
  discount_amount: number;
  lines: PurchaseInvoiceLineInput[];
};
