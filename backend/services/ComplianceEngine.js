const ComplianceRule = require("../models/ComplianceRule");
const ComplianceAuditLog = require("../models/ComplianceAuditLog");

class ComplianceEngine {
  /**
   * Evaluate a transaction against all active compliance rules.
   * @param {Object} context - Data to evaluate e.g. { module: 'Sales', user: 1, customer: {}, items: [], total: 100000 }
   * @returns {Object} result - { allowed: boolean, requiresApproval: boolean, alerts: [] }
   */
  static async evaluateTransaction(context) {
    const rules = await ComplianceRule.findAll({ where: { isActive: true } });
    const result = { allowed: true, requiresApproval: false, alerts: [] };

    for (const rule of rules) {
      const isTriggered = this._checkRule(rule, context);
      
      if (isTriggered) {
        // Log the audit event if required
        if (rule.requiresAudit) {
          await ComplianceAuditLog.create({
            userId: context.user,
            moduleName: context.module,
            ruleTriggered: rule.ruleName,
            severity: rule.severity,
            actionTaken: rule.actionToTake,
            transactionRef: context.ref || null,
            previousState: context,
            newState: {}
          });
        }

        // Apply action based on severity
        if (rule.severity === "CRITICAL" && rule.actionToTake === "BLOCK") {
          result.allowed = false;
          result.alerts.push({ rule: rule.ruleName, type: "error", message: `Blocked: ${rule.ruleName}` });
        } else if (rule.severity === "HIGH" && rule.actionToTake === "APPROVAL_REQUIRED") {
          result.requiresApproval = true;
          result.alerts.push({ rule: rule.ruleName, type: "warning", message: `Approval Required: ${rule.ruleName}` });
        } else if (rule.severity === "MEDIUM" && rule.actionToTake === "WARNING") {
          result.alerts.push({ rule: rule.ruleName, type: "info", message: `Warning: ${rule.ruleName}` });
        } else {
          result.alerts.push({ rule: rule.ruleName, type: "info", message: `Alert: ${rule.ruleName}` });
        }
      }
    }

    return result;
  }

  static _checkRule(rule, context) {
    // Hardcoded handlers for different rule types configurable in the DB
    switch (rule.ruleType) {
      case "expired_drug":
        return context.items && context.items.some(i => new Date(i.expiry) < new Date());
      case "schedule_x_prescription":
        return context.items && context.items.some(i => i.schedule === "X") && !context.hasPrescription;
      case "credit_limit":
        const limit = rule.config?.threshold || context.customer?.creditLimit || 0;
        return context.total > limit;
      case "high_value_sale":
        return context.total >= (rule.config?.highValueThreshold || 500000);
      case "negative_margin":
        return context.items && context.items.some(i => i.selling_price < i.cost_price);
      default:
        return false;
    }
  }
}

module.exports = ComplianceEngine;
