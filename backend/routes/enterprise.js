const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const sequelize = require('../config/db');
const AuditLog = require('../models/AuditLog');
const accounting = require('../services/accounting');

const Bin = require('../models/Bin');
const Route = require('../models/Route');
const CRMLead = require('../models/CRMLead');
const Document = require('../models/Document');
const ItemBatch = require('../models/ItemBatch');
const Bill = require('../models/Bill');
const SalesChallan = require('../models/SalesChallan');

// /api/enterprise/wms/bins
router.get('/wms/bins', protect, async (req, res) => {
    try {
        const bins = await Bin.findAll();
        res.json({ success: true, data: bins });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// /api/enterprise/logistics/routes
router.get('/logistics/routes', protect, async (req, res) => {
    try {
        const routes = await Route.findAll();
        res.json({ success: true, data: routes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// /api/enterprise/approvals
router.get('/approvals', protect, (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'APP1001', type: 'invoice', amount: 5000, requestedBy: 'user1', status: 'pending' },
            { id: 'APP1002', type: 'payment', amount: 12000, requestedBy: 'user2', status: 'pending' }
        ]
    });
});

// /api/enterprise/crm/leads
router.get('/crm/leads', protect, async (req, res) => {
    try {
        const leads = await CRMLead.findAll();
        res.json({ success: true, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// /api/enterprise/dms/files
router.get('/dms/files', protect, async (req, res) => {
    try {
        const docs = await Document.findAll();
        res.json({ success: true, data: docs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// /api/enterprise/recall
router.get('/recall', protect, async (req, res) => {
    try {
        const batchNo = req.query.batch;
        if (!batchNo) {
            return res.status(400).json({ success: false, error: 'Batch number is required' });
        }

        const batch = await ItemBatch.findOne({ where: { batchNo } });
        if (!batch) {
            return res.status(404).json({ success: false, error: 'Batch not found' });
        }

        const allBills = await Bill.findAll();
        const allChallans = await SalesChallan.findAll();

        const affectedBills = allBills.filter(b => {
            const items = typeof b.items === 'string' ? JSON.parse(b.items) : (b.items || []);
            return items.some(i => i.batch === batchNo);
        });

        const affectedChallans = allChallans.filter(c => {
            const items = typeof c.items === 'string' ? JSON.parse(c.items) : (c.items || []);
            return items.some(i => i.batch === batchNo);
        });

        res.json({
            success: true,
            data: {
                batch: batchNo,
                batchDetails: batch,
                affectedBills: affectedBills.map(b => b.billNo),
                affectedChallans: affectedChallans.map(c => c.challanNo),
                totalAffected: affectedBills.length + affectedChallans.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
