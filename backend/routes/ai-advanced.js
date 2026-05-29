const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const sequelize = require('../config/db');
const AuditLog = require('../models/AuditLog');
const accounting = require('../services/accounting');
const JournalVoucher = require('../models/JournalVoucher');
const Bill = require('../models/Bill');

// /api/ai-advanced/forecast
router.get('/forecast', protect, (req, res) => {
    res.json({
        success: true,
        data: {
            '30_days': { expectedRevenue: 50000, expectedExpenses: 30000 },
            '60_days': { expectedRevenue: 105000, expectedExpenses: 62000 },
            '90_days': { expectedRevenue: 160000, expectedExpenses: 95000 }
        }
    });
});

// /api/ai-advanced/health-score
router.get('/health-score', protect, async (req, res) => {
    try {
        const totalCash = await JournalVoucher.sum('amount') || 0;
        const totalReceivables = await Bill.sum('total', { where: { status: 'unpaid' } }) || 0;
        
        let score = 50;
        if (totalCash > totalReceivables) score += 20;
        if (totalCash > 1000) score += 10;
        if (totalReceivables < 500) score += 10;
        
        res.json({
            success: true,
            data: {
                score: Math.min(score, 100),
                factors: {
                    cashFlow: totalCash > 1000 ? 'Healthy' : 'Needs Attention',
                    receivables: totalReceivables > 5000 ? 'High' : 'Good',
                    totalCash,
                    totalReceivables
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// /api/ai-advanced/bank-rec
router.post('/bank-rec', protect, idempotency, async (req, res) => {
    try {
        const transactions = req.body.transactions || [];
        
        const jvs = await JournalVoucher.findAll();
        const jvAmounts = jvs.map(jv => jv.amount);
        
        const matched = [];
        const unmatched = [];
        
        for (const t of transactions) {
            const amount = parseFloat(t.amount);
            if (jvAmounts.includes(amount)) {
                matched.push(t);
                const idx = jvAmounts.indexOf(amount);
                jvAmounts.splice(idx, 1);
            } else {
                unmatched.push(t);
            }
        }
        
        res.json({
            success: true,
            message: 'Bank reconciliation completed',
            data: {
                parsedTransactions: transactions.length,
                matched: matched.length,
                unmatched: unmatched.length,
                unmatchedTransactions: unmatched
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
