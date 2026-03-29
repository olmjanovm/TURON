const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

// Catalog
router.get('/categories', customerController.getCatalog);

// Promo
router.post('/promo/validate', customerController.validatePromoCode);

// Orders
router.get('/my-orders', customerController.getMyOrders);
router.post('/orders', customerController.createOrder);

module.exports = router;
