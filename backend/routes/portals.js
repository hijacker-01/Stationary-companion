const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const sequelize = require('../config/db');
const AuditLog = require('../models/AuditLog');
const accounting = require('../services/accounting');
const Item = require('../models/Item');
const SalesChallan = require('../models/SalesChallan');

// /api/portals/whatsapp-webhook
router.post('/whatsapp-webhook', async (req, res) => {
    try {
        const { text, phone } = req.body || {};
        
        if (!text) {
            return res.status(400).json({ success: false, message: 'No text provided' });
        }

        if (text.toUpperCase().startsWith("ORDER")) {
            const match = text.match(/^ORDER\s+(.+?)(?:\s+(\d+))?$/i);
            
            if (match) {
                const productName = match[1].trim();
                const qty = parseInt(match[2] || "1", 10);
                
                const item = await Item.findOne({ where: { name: productName } });
                
                if (item) {
                    const challan = await SalesChallan.create({
                        customerName: phone || "Unknown WhatsApp User",
                        customerPhone: phone,
                        status: 'draft',
                        items: [{
                            name: item.name,
                            batch: item.batch,
                            expiry: item.expiry,
                            qty: qty,
                            rate: item.selling_price || item.mrp || 0,
                            mrp: item.mrp || 0,
                            amount: (item.selling_price || item.mrp || 0) * qty
                        }],
                        subtotal: (item.selling_price || item.mrp || 0) * qty,
                        total: (item.selling_price || item.mrp || 0) * qty
                    });

                    return res.json({
                        success: true,
                        message: 'Webhook received, order created',
                        challanId: challan.id
                    });
                } else {
                    return res.json({
                        success: false,
                        message: 'Item not found'
                    });
                }
            }
        }
        
        res.json({
            success: true,
            message: 'Webhook received'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
