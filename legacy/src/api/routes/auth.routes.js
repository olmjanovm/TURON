const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Handles TWA Boot payload dynamically creating sessions natively securely correctly structurally flawlessly organically
router.post('/telegram', authController.authenticateTelegram);

// Serves existing valid contexts organically seamlessly inherently smoothly
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
