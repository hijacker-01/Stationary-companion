import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useParams } from "react-router-dom";
import { Printer, Loader2 } from "lucide-react";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function InvoicePrint() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  const settings = JSON.parse(localStorage.getItem("settings") || "{}");
  const companyName = settings.companyName || "BPartners Pharma Pvt. Ltd.";
  const companyAddress = settings.companyAddress || "123 Health Street, Medicity";
  const companyPhone = settings.companyPhone || "+91 9876543210";
  const companyGST = settings.gstNumber || "23AAPCB1234C1Z5";
  const companyDL = settings.dlNumber || "DL-20B-12345 / DL-21B-67890";

  useEffect(() => {
    axios
      .get(`/billing/${id}`)
      .then((res) => setBill(res.data))
      .catch(() => setBill(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading invoice...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-red-500 text-sm font-medium">
        Invoice not found or failed to load.
      </div>
    );
  }

  const items = bill.items || [];
  const subtotal = items.reduce((sum, it) => sum + Number(it.amount || it.total || 0), 0);
  const discountAmt = Number(bill.discountAmount || bill.discount || 0);
  const gstAmt = Number(bill.gstAmount || bill.taxAmount || 0);
  const grandTotal = Number(bill.grandTotal || bill.total || subtotal - discountAmt + gstAmt);

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      {/* Print Button */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow-lg text-sm font-bold cursor-pointer flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print Invoice
        </button>
      </div>

      {/* Invoice Container */}
      <div className="bg-white min-h-screen flex justify-center py-4 print:py-0">
        <div className="w-[210mm] max-w-[210mm] mx-auto border border-gray-800 print:border-black font-mono text-[11px] leading-tight bg-white text-black p-6">

          {/* Company Header */}
          <div className="border-b-2 border-black pb-3 mb-3">
            <div className="text-center">
              <h1 className="text-lg font-extrabold uppercase tracking-wide">{companyName}</h1>
              <p className="text-[10px] text-gray-700">{companyAddress}</p>
              <p className="text-[10px] text-gray-700">Phone: {companyPhone}</p>
              <div className="flex justify-center gap-6 mt-1 text-[10px]">
                <span><strong>GSTIN:</strong> {companyGST}</span>
                <span><strong>DL No:</strong> {companyDL}</span>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="border border-black px-4 py-0.5 text-xs font-extrabold uppercase tracking-widest">Tax Invoice</span>
            </div>
          </div>

          {/* Invoice Details & Customer */}
          <div className="flex justify-between mb-3 border-b border-gray-400 pb-2">
            <div className="flex-1">
              <p><strong>Invoice No:</strong> {bill.billNumber || bill.invoiceNumber || bill.id}</p>
              <p><strong>Date:</strong> {fmtDate(bill.date || bill.createdAt)}</p>
            </div>
            <div className="flex-1 text-right">
              <p><strong>Customer:</strong> {bill.customerName || bill.customer?.name || "Walk-in"}</p>
              <p><strong>Address:</strong> {bill.customerAddress || bill.customer?.address || "—"}</p>
              <p><strong>Phone:</strong> {bill.customerPhone || bill.customer?.phone || "—"}</p>
              {(bill.customerGSTIN || bill.customer?.gstin) && (
                <p><strong>GSTIN:</strong> {bill.customerGSTIN || bill.customer?.gstin}</p>
              )}
              {(bill.customerDL || bill.customer?.dlNumber) && (
                <p><strong>DL No:</strong> {bill.customerDL || bill.customer?.dlNumber}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse border border-black mb-3">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-1 py-1 text-center w-8">Sr.</th>
                <th className="border border-black px-1 py-1 text-left">Drug / Product Name</th>
                <th className="border border-black px-1 py-1 text-center w-16">HSN</th>
                <th className="border border-black px-1 py-1 text-center w-16">Batch</th>
                <th className="border border-black px-1 py-1 text-center w-16">Expiry</th>
                <th className="border border-black px-1 py-1 text-center w-10">Qty</th>
                <th className="border border-black px-1 py-1 text-right w-16">MRP</th>
                <th className="border border-black px-1 py-1 text-right w-16">Rate</th>
                <th className="border border-black px-1 py-1 text-center w-12">Disc%</th>
                <th className="border border-black px-1 py-1 text-center w-12">GST%</th>
                <th className="border border-black px-1 py-1 text-right w-20">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "" : "bg-gray-50"}>
                  <td className="border border-black px-1 py-0.5 text-center">{idx + 1}</td>
                  <td className="border border-black px-1 py-0.5 font-semibold">{item.name || item.itemName || item.productName}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.hsn || item.hsnCode || "—"}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.batch || item.batchNumber || "—"}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.expiry || item.expiryDate || "—"}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.quantity || item.qty}</td>
                  <td className="border border-black px-1 py-0.5 text-right">{fmt(item.mrp)}</td>
                  <td className="border border-black px-1 py-0.5 text-right">{fmt(item.rate || item.price)}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.discountPercent || item.disc || 0}%</td>
                  <td className="border border-black px-1 py-0.5 text-center">{item.gstPercent || item.gst || item.taxRate || 0}%</td>
                  <td className="border border-black px-1 py-0.5 text-right font-semibold">{fmt(item.amount || item.total)}</td>
                </tr>
              ))}
              {/* Fill empty rows for minimum print aesthetics */}
              {items.length < 5 &&
                Array.from({ length: 5 - items.length }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-black px-1 py-1.5">&nbsp;</td>
                    <td className="border border-black px-1 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5"></td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-4">
            <div className="w-64 border border-black">
              <div className="flex justify-between px-3 py-1 border-b border-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold">₹{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between px-3 py-1 border-b border-gray-400">
                <span>Discount</span>
                <span className="font-semibold text-red-700">- ₹{fmt(discountAmt)}</span>
              </div>
              <div className="flex justify-between px-3 py-1 border-b border-gray-400">
                <span>GST Amount</span>
                <span className="font-semibold">₹{fmt(gstAmt)}</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 bg-gray-100 font-extrabold text-[13px]">
                <span>Grand Total</span>
                <span>₹{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="border-t border-black pt-2 mb-4">
            <p className="text-[10px]">
              <strong>Amount in Words:</strong> Rupees {numberToWords(Math.round(grandTotal))} Only
            </p>
          </div>

          {/* Terms & Signature */}
          <div className="flex justify-between items-end mt-6 pt-3 border-t border-black">
            <div className="text-[9px] text-gray-600 max-w-[55%]">
              <p className="font-bold text-[10px] text-black mb-1">Terms & Conditions:</p>
              <p>1. Goods once sold will not be taken back or exchanged.</p>
              <p>2. All disputes are subject to local jurisdiction.</p>
              <p>3. Goods are delivered on the risk of the purchaser.</p>
              <p>4. E.&O.E. (Errors & Omissions Excepted).</p>
            </div>
            <div className="text-center w-40">
              <div className="border-b border-black mb-1 h-10"></div>
              <p className="text-[10px] font-bold">Authorized Signatory</p>
              <p className="text-[9px] text-gray-600">For {companyName}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 pt-2 border-t border-gray-400 text-[9px] text-gray-500">
            This is a computer-generated invoice. No signature required unless specified.
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Convert number to Indian English words for invoice amount display.
 */
function numberToWords(num) {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertBelowHundred = (n) => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  };

  const convertBelowThousand = (n) => {
    if (n < 100) return convertBelowHundred(n);
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convertBelowHundred(n % 100) : "");
  };

  // Indian numbering: Lakh (100,000), Crore (10,000,000)
  let result = "";
  if (num >= 10000000) {
    result += convertBelowThousand(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertBelowHundred(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertBelowHundred(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (num > 0) {
    result += convertBelowThousand(num);
  }
  return result.trim();
}
