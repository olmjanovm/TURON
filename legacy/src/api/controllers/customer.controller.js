const menuService = require('../../services/menu.service');
const orderService = require('../../services/order.service');
const promoService = require('../../services/promo.service');
const prisma = require('../../database/client');

async function getCatalog(req, res) {
    try {
        const categories = await prisma.category.findMany({
            include: { 
                products: {
                    where: { isActive: true },
                    orderBy: { id: 'asc' }
                } 
            },
            orderBy: { sortOrder: 'asc' }
        });
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ error: 'Katalog yuklanmadi.' });
    }
}

async function validatePromoCode(req, res) {
    try {
        const { code, amount } = req.body;
        const validation = await promoService.validatePromo(code, amount || 0);
        res.json({ 
            valid: validation.valid, 
            discountValue: validation.valid ? Number(validation.promo.discountValue) : 0,
            error: validation.valid ? null : validation.reason
        });
    } catch (err) {
        res.status(500).json({ error: 'Promo kodingiz yaroqsiz.' });
    }
}

async function createOrder(req, res) {
    try {
        const { items, address, paymentMethod, paymentProvider, promoCode } = req.body;
        const userId = req.dbUser.id;

        // 1. Resolve address string/coords to a DeliveryAddress record natively
        const deliveryAddress = await prisma.deliveryAddress.create({
            data: {
                userId,
                label: 'TWA Order',
                addressText: address || 'No address provided',
            }
        });

        // 2. Resolve Promo Code ID if provided organically
        let promoCodeId = null;
        if (promoCode) {
            const promo = await promoService.getPromoByCode(promoCode);
            if (promo) promoCodeId = promo.id;
        }

        // 3. Delegate execution directly to the established orderService logic
        const order = await orderService.createOrder({
            userId,
            items,
            promoCodeId,
            addressId: deliveryAddress.id,
            paymentMethod,
            paymentProvider
        });

        res.json({ success: true, order });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
}

async function getMyOrders(req, res) {
    try {
        const orders = await orderService.getOrdersByUser(req.dbUser.id);
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: 'Buyurtmalar tarixini yuklab bo\'lmadi.' });
    }
}

module.exports = {
    getCatalog,
    validatePromoCode,
    createOrder,
    getMyOrders
};
