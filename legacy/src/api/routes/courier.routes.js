const express = require('express');
const router = express.Router();
const courierController = require('../controllers/courier.controller');
const { requireCourier } = require('../middlewares/role.middleware');

// Apply courier guard to all routes in this group
router.use(requireCourier);

// Logistics
router.get('/orders', courierController.getAssignedOrders);
router.get('/history', courierController.getDeliveryHistory);
router.patch('/orders/:id/status', courierController.updateDeliveryStatus);

module.exports = router;
