// EventBus.js — In-process event system for BPartner Hyper Automation
// Routes emit events → EventBus evaluates AutomationRules → executes matching actions

const EventEmitter = require("events");
const AutomationRule = require("../models/AutomationRule");
const AutomationLog = require("../models/AutomationLog");

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this._setupCoreListeners();
  }

  _setupCoreListeners() {
    // Listen to all known trigger types
    const triggers = [
      "invoice_created", "stock_below_reorder", "payment_overdue",
      "expiry_approaching", "high_value_invoice", "payment_received",
      "purchase_created", "custom"
    ];
    triggers.forEach(trigger => {
      this.on(trigger, (payload) => this._evaluateRules(trigger, payload));
    });
  }

  async _evaluateRules(trigger, payload) {
    try {
      const rules = await AutomationRule.findAll({
        where: { trigger, isActive: true }
      });

      for (const rule of rules) {
        try {
          const shouldFire = this._checkConditions(rule, payload);
          if (!shouldFire) {
            await AutomationLog.create({
              ruleId: rule.id, ruleName: rule.name, trigger, action: rule.action,
              payload, result: "skipped"
            });
            continue;
          }

          await this._executeAction(rule, payload);

          await rule.update({
            executionCount: rule.executionCount + 1,
            lastExecuted: new Date()
          });

          await AutomationLog.create({
            ruleId: rule.id, ruleName: rule.name, trigger, action: rule.action,
            payload, result: "success"
          });
        } catch (err) {
          await AutomationLog.create({
            ruleId: rule.id, ruleName: rule.name, trigger, action: rule.action,
            payload, result: "failure", error: err.message
          });
        }
      }
    } catch (err) {
      console.error("[EventBus] Rule evaluation failed:", err.message);
    }
  }

  _checkConditions(rule, payload) {
    const config = rule.triggerConfig || {};

    // Check threshold conditions
    if (config.minAmount && payload.total && payload.total < config.minAmount) return false;
    if (config.maxAmount && payload.total && payload.total > config.maxAmount) return false;
    if (config.customerName && payload.customerName && !payload.customerName.toLowerCase().includes(config.customerName.toLowerCase())) return false;

    return true;
  }

  async _executeAction(rule, payload) {
    const config = rule.actionConfig || {};

    switch (rule.action) {
      case "send_whatsapp": {
        const phone = payload.customerPhone || payload.phone || config.phone;
        const template = config.messageTemplate || "Hello {name}, your invoice #{billNo} of ₹{total} has been generated.";
        const message = template
          .replace("{name}", payload.customerName || "Customer")
          .replace("{billNo}", payload.billNo || "N/A")
          .replace("{total}", payload.total || 0);
        // Log the WhatsApp deep link (actual sending needs WhatsApp Business API)
        console.log(`[EventBus] WhatsApp → ${phone}: ${message}`);
        console.log(`[EventBus] Link: https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
        break;
      }
      case "notify_manager": {
        console.log(`[EventBus] NOTIFICATION → Manager: ${config.message || `Action required for ${rule.trigger}`}`);
        break;
      }
      case "webhook": {
        if (config.url) {
          try {
            const resp = await fetch(config.url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ event: rule.trigger, payload, timestamp: new Date() }),
              signal: AbortSignal.timeout(5000)
            });
            if (!resp.ok) throw new Error(`Webhook returned ${resp.status}`);
          } catch (e) {
            console.error(`[EventBus] Webhook failed: ${e.message}`);
            throw e;
          }
        }
        break;
      }
      case "log": {
        console.log(`[EventBus] LOG → ${rule.trigger}: ${JSON.stringify(payload).substring(0, 200)}`);
        break;
      }
      default:
        console.log(`[EventBus] Action '${rule.action}' not yet implemented`);
    }
  }
}

// Singleton
const eventBus = new EventBus();
module.exports = eventBus;
