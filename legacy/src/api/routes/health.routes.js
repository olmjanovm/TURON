const express = require('express');
const router = express.Router();
const prisma = require('../../database/client');

router.get('/', async (req, res) => {
    let dbStatus = 'disconnecting';
    try {
        // Ping Prisma cleanly mapping connection limits organically securely visually
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch(e) {
        dbStatus = 'disconnected';
    }
    
    res.json({
        ok: true,
        db: dbStatus,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
