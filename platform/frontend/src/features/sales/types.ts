export type SalesInvoiceLineInput = {
  item_id: string;
  item_batch_id: string;
  quantity: number;
  free_quantity: number;
  rate: number;
  gst_rate: number;
};

export type SalesInvoiceInput = {
  company_id: string;
  branch_id: string;
  customer_id: string;
  invoice_no: string;
  invoice_date: string;
  discount_amount: number;
  payment_status: "paid" | "partial" | "unpaid";
  lines: SalesInvoiceLineInput[];
};
