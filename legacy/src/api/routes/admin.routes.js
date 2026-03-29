const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middlewares/role.middleware');

// Apply admin guard to all routes in this group
router.use(requireAdmin);

// Orders Management
router.get('/orders', adminController.getOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.patch('/orders/:id/assign-courier', adminController.assignCourier);

// Menu & Catalog
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.upsertCategory);
router.patch('/categories/:id', adminController.upsertCategory);

router.get('/products', adminController.getProducts);
router.post('/products', adminController.upsertProduct);
router.patch('/products/:id', adminController.upsertProduct);

// Analytics
router.get('/stats/overview', adminController.getStats);

module.exports = router;
