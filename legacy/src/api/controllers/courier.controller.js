const prisma = require('../../database/client');
const orderService = require('../../services/order.service');

async function getAssignedOrders(req, res) {
    try {
        const orders = await prisma.order.findMany({
            where: {
                courierId: req.dbUser.id,
                status: { in: ['PREPARING', 'DELIVERING'] }
            },
            orderBy: { createdAt: 'desc' },
            include: { user: true, address: true, orderItems: { include: { product: true } } }
        });
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: 'Topshiriqlar yuklanmadi.' });
    }
}

async function updateDeliveryStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Logical safety ensuring couriers only flip their own orders
        const order = await prisma.order.findUnique({ where: { id: parseInt(id, 10) } });
        if (!order || order.courierId !== req.dbUser.id) {
            return res.status(403).json({ error: '🚫 Bu buyurtmani boshqarish ruxsati yo\'q.' });
        }

        const updated = await orderService.updateOrderStatus(id, status);
        res.json({ success: true, order: updated });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function getDeliveryHistory(req, res) {
    try {
        const orders = await prisma.order.findMany({
            where: { courierId: req.dbUser.id, status: 'DELIVERED' },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: 'Tarix yuklanmadi.' });
    }
}

module.exports = {
    getAssignedOrders,
    updateDeliveryStatus,
    getDeliveryHistory
};
