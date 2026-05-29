const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const sequelize = require('../config/db');
const AuditLog = require('../models/AuditLog');
const accounting = require('../services/accounting');

// /api/portals/whatsapp-webhook
router.post('/whatsapp-webhook', (req, res) => {
    const { Body, From } = req.body || { Body: 'ORDER Dolo 650', From: 'whatsapp:+1234567890' };
    
    res.json({
        success: true,
        message: 'Webhook received',
        parsedIntent: 'order',
        item: 'Dolo 650'
    });
});

module.exports = router;
