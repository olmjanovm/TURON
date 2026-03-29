const prisma = require('../../database/client');
const orderService = require('../../services/order.service');
const menuAdminService = require('../../services/menu-admin.service');
const promoService = require('../../services/promo.service');

async function getOrders(req, res) {
    try {
        const { status } = req.query;
        const orders = await prisma.order.findMany({
            where: status && status !== 'ALL' ? { status } : {},
            orderBy: { createdAt: 'desc' },
            include: { 
                user: true, 
                orderItems: { include: { product: true } } 
            }
        });
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: 'Buyurtmalar ro\'yxati yuklanmadi.' });
    }
}

async function updateOrderStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = await orderService.updateOrderStatus(id, status);
        res.json({ success: true, order });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function assignCourier(req, res) {
    try {
        const { id } = req.params;
        const { courierId } = req.body;
        const order = await orderService.assignCourier(id, courierId);
        res.json({ success: true, order });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function getStats(req, res) {
    try {
        const todayAtZero = new Date();
        todayAtZero.setHours(0, 0, 0, 0);

        const [ordersCount, revenue] = await Promise.all([
            prisma.order.count({ where: { createdAt: { gte: todayAtZero } } }),
            prisma.order.aggregate({
                where: { createdAt: { gte: todayAtZero }, status: { not: 'CANCELED' } },
                _sum: { totalPrice: true }
            })
        ]);

        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        res.json({
            today: {
                ordersCount,
                revenue: Number(revenue._sum.totalPrice || 0)
            },
            topProducts
        });
    } catch (err) {
        res.status(500).json({ error: 'Statistika yuklanmadi.' });
    }
}

async function getCategories(req, res) {
    try {
        const categories = await menuAdminService.getCategoriesWithCounts();
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function upsertCategory(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;
        let category;
        if (id) {
            category = await menuAdminService.updateCategory(id, data);
        } else {
            category = await menuAdminService.createCategory(data);
        }
        res.json({ success: true, category });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function getProducts(req, res) {
    try {
        const products = await menuAdminService.getLatestProducts(100);
        res.json({ products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function upsertProduct(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;
        let product;
        if (id) {
            product = await menuAdminService.updateProduct(id, data);
        } else {
            product = await menuAdminService.createProduct(data);
        }
        res.json({ success: true, product });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports = {
    getOrders,
    updateOrderStatus,
    assignCourier,
    getStats,
    getCategories,
    upsertCategory,
    getProducts,
    upsertProduct
};
