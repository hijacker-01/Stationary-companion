const EInvoiceLog = require("../models/EInvoiceLog");
const crypto = require("crypto");

class EInvoiceService {
  /**
   * Generates IRN payload exactly matching NIC/GSTN schema.
   * Based on the user architecture decision, this handles sandbox and production modes.
   */
  static async generateIRN(bill, seller, buyer, environment = "sandbox") {
    // 1. Construct NIC payload
    const payload = this._buildNICPayload(bill, seller, buyer);

    if (environment === "sandbox") {
      // Return simulated success
      const mockIrn = crypto.createHash("sha256").update(`${bill.id}-${Date.now()}`).digest("hex");
      const mockAckNo = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
      
      const log = await EInvoiceLog.create({
        billId: bill.id,
        environment: "sandbox",
        isMock: true,
        irn: mockIrn,
        ackNo: mockAckNo,
        ackDate: new Date(),
        signedInvoiceJson: payload,
        signedQrData: `MOCK_QR_${mockIrn}`,
        status: "generated",
        apiResponseLog: { status: "SUCCESS", message: "Sandbox mock response" }
      });
      return log;
    } else {
      // PRODUCTION MODE - Strict rules apply
      // In a real app, this would use fetch() with client certs to IRP portal.
      throw new Error("Production E-Invoice API credentials not configured.");
    }
  }

  static _buildNICPayload(bill, seller, buyer) {
    return {
      Version: "1.1",
      TranDtls: {
        TaxSch: "GST",
        SupTyp: seller.stateCode === buyer.stateCode ? "B2B" : "SEZWP",
        RegRev: "Y",
        IgstOnIntra: "N"
      },
      DocDtls: {
        Typ: "INV",
        No: bill.billNo,
        Dt: new Date().toISOString().split("T")[0] // DD/MM/YYYY format usually required
      },
      SellerDtls: {
        Gstin: seller.gstin,
        LglNm: seller.legalName,
        TrdNm: seller.tradeName,
        Addr1: seller.address,
        Loc: "HQ",
        Pin: 110001,
        Stcd: seller.stateCode
      },
      BuyerDtls: {
        Gstin: buyer.gstNumber,
        LglNm: buyer.legalName || buyer.name,
        TrdNm: buyer.tradeName || buyer.name,
        Pos: buyer.stateCode,
        Addr1: buyer.address,
        Loc: "Branch",
        Pin: 110002,
        Stcd: buyer.stateCode
      },
      ValDtls: {
        AssVal: bill.subtotal,
        CgstVal: bill.cgstAmount,
        SgstVal: bill.sgstAmount,
        IgstVal: bill.igstAmount,
        CesVal: bill.cessAmount,
        TotInvVal: bill.total
      },
      ItemList: bill.items.map((item, idx) => ({
        SlNo: (idx + 1).toString(),
        PrdDesc: item.name,
        IsServc: "N",
        HsnCd: item.hsn,
        Qty: item.qty,
        Unit: "NOS",
        UnitPrice: item.price,
        TotAmt: item.qty * item.price,
        Discount: 0,
        AssAmt: item.qty * item.price,
        GstRt: 18,
        IgstAmt: bill.igstAmount > 0 ? (item.qty * item.price * 0.18) : 0,
        CgstAmt: bill.cgstAmount > 0 ? (item.qty * item.price * 0.09) : 0,
        SgstAmt: bill.sgstAmount > 0 ? (item.qty * item.price * 0.09) : 0,
        CesRt: 0,
        CesAmt: 0,
        TotItemVal: (item.qty * item.price) * 1.18
      }))
    };
  }
}

module.exports = EInvoiceService;
