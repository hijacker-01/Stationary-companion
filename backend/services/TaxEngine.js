const GSTStateMaster = require("../models/GSTStateMaster");
const GSTCategory = require("../models/GSTCategory");

class TaxEngine {
  /**
   * Determine intra-state vs inter-state tax splits.
   * @param {string} sellerStateCode - e.g. '27'
   * @param {string} buyerStateCode - e.g. '29'
   * @param {number} taxCategoryId - reference to GSTCategory
   * @param {number} taxableValue - Amount to tax
   */
  static async calculateTax(sellerStateCode, buyerStateCode, taxCategoryId, taxableValue) {
    if (!taxCategoryId) {
      return { cgst: 0, sgst: 0, igst: 0, cess: 0, totalTax: 0 };
    }
    
    const category = await GSTCategory.findByPk(taxCategoryId);
    if (!category) {
      throw new Error(`Invalid Tax Category ID: ${taxCategoryId}`);
    }

    let cgst = 0, sgst = 0, igst = 0, cess = 0;

    // Intra-state vs Inter-state check
    if (sellerStateCode === buyerStateCode) {
      cgst = (taxableValue * category.cgstRate) / 100;
      sgst = (taxableValue * category.sgstRate) / 100;
    } else {
      igst = (taxableValue * category.igstRate) / 100;
    }

    if (category.cessRate > 0) {
      cess = (taxableValue * category.cessRate) / 100;
    }

    return {
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      cess: Math.round(cess * 100) / 100,
      totalTax: Math.round((cgst + sgst + igst + cess) * 100) / 100
    };
  }

  static isEWayBillRequired(invoiceValue, isInterState) {
    // Basic threshold rules: 
    // Inter-state > 50,000 generally requires EWB.
    // Intra-state > 50,000 or 1,00,000 depending on state, we use 50k as strict baseline.
    return invoiceValue > 50000;
  }
}

module.exports = TaxEngine;
