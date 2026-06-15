const StockMovement = require("../models/StockMovement");

exports.recordOut = async (item, quantity, referenceType, referenceId, userId, notes, transaction) => {
  return StockMovement.create({
    itemId: item.id,
    batchNo: item.batch || "",
    type: "out",
    quantity: quantity,
    referenceType,
    referenceId,
    userId,
    notes,
    branchId: item.branchId,
  }, { transaction });
};

exports.recordIn = async (item, quantity, referenceType, referenceId, userId, notes, transaction) => {
  return StockMovement.create({
    itemId: item.id,
    batchNo: item.batch || "",
    type: "in",
    quantity: quantity,
    referenceType,
    referenceId,
    userId,
    notes,
    branchId: item.branchId,
  }, { transaction });
};

exports.recordAdjustment = async (item, quantity, referenceId, userId, notes, transaction) => {
  const type = quantity > 0 ? "in" : (quantity < 0 ? "out" : "adjust");
  return StockMovement.create({
    itemId: item.id,
    batchNo: item.batch || "",
    type,
    quantity: Math.abs(quantity),
    referenceType: "adjust",
    referenceId,
    userId,
    notes,
    branchId: item.branchId,
  }, { transaction });
};
