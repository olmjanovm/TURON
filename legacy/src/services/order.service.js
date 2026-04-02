const prisma = require('../database/client');
const promoService = require('./promo.service');

/**
 * Creates a new order using a Prisma transaction to ensure atomicity 
 * between stock modification, promo updates, and order generation.
 * 
 * @param {Object} params
 * @param {number|string} params.userId - User placing the order.
 * @param {Array<Object>} params.items - Arrays describing order. { productId, quantity }.
 * @param {number|string} [params.promoCodeId] - Promo code DB ID to apply.
 * @param {number|string} params.addressId - Associated Delivery address ID.
 * @param {string} [params.paymentMethod] - Defined gateway selection.
 * @param {string} [params.paymentProvider] - Configured provider.
 * @returns {Promise<Object>} The complete created order.
 */
async function createOrder({ userId, items, promoCodeId, addressId, paymentMethod, paymentProvider }) {
  try {
    return await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];
      const productsToUpdate = [];

      // 1. Check stock and calculate native total for requested items
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: parseInt(item.productId, 10) }
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found.`);
        }
        
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Not enough stock available for ${product.name}. Available: ${product.stockQuantity}`);
        }

        const unitPrice = Number(product.price);
        subtotal += unitPrice * item.quantity;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price
        });

        productsToUpdate.push({
          id: product.id,
          decrement: item.quantity
        });
      }

      let finalPrice = subtotal;
      const parsedPromoId = promoCodeId ? parseInt(promoCodeId, 10) : null;

      // 2. Safely apply promo code if assigned
      if (parsedPromoId) {
        const promo = await tx.promoCode.findUnique({ where: { id: parsedPromoId } });
        if (!promo) throw new Error('Applied promo code record not found in system.');
        
        // Use validation logic from promoService mapping directly to the subtotal
        const validation = await promoService.validatePromo(promo.code, subtotal);
        if (!validation.valid) {
          throw new Error(`Invalid promo code applied: ${validation.reason}`);
        }
        
        const discountValue = Number(promo.discountValue);
        if (promo.discountType === 'PERCENTAGE') {
          finalPrice = subtotal - (subtotal * (discountValue / 100));
        } else if (promo.discountType === 'FIXED') {
          finalPrice = subtotal - discountValue;
        }

        if (finalPrice < 0) finalPrice = 0;

        // Atomically commit usage increment utilizing current tx wrapper
        await promoService.incrementUsage(parsedPromoId, tx);
      }

      // 3 & 4. Spawn Order and its Items respectively linking to related entities
      const order = await tx.order.create({
        data: {
          userId: parseInt(userId, 10),
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          paymentMethod,
          paymentProvider,
          totalPrice: finalPrice,
          ...(parsedPromoId && { promoCodeId: parsedPromoId }),
          ...(addressId && { addressId: parseInt(addressId, 10) }),
          orderItems: {
            create: orderItemsData
          }
        },
        include: { orderItems: true } // Bundle items into the return
      });

      // 5. Subtract quantities globally from product entities
      for (const update of productsToUpdate) {
        await tx.product.update({
          where: { id: update.id },
          data: { stockQuantity: { decrement: update.decrement } }
        });
      }

      return order;
    });
  } catch (error) {
    console.error('Error executing createOrder transaction:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
}

/**
 * Grabs a unique order based on its id, including broad relational footprints.
 * 
 * @param {number|string} orderId - Primary ID of the Order.
 * @returns {Promise<Object|null>} Populated Order object or null.
 */
async function getOrderById(orderId) {
  try {
    return await prisma.order.findUnique({
      where: { id: parseInt(orderId, 10) },
      include: {
        orderItems: {
          include: { product: true }
        },
        user: true,
        address: true,
        promoCode: true,
        courier: true
      }
    });
  } catch (error) {
    console.error(`Error querying order ${orderId}:`, error);
    throw new Error(`Failed to fetch order details: ${error.message}`);
  }
}

/**
 * Finds all orders created universally by a specific user scoped chronologically backwards.
 * 
 * @param {number|string} userId - Target user's DB ID.
 * @returns {Promise<Array<Object>>} List of Orders.
 */
async function getOrdersByUser(userId) {
  try {
    return await prisma.order.findMany({
      where: { userId: parseInt(userId, 10) },
      orderBy: { createdAt: 'desc' },
      include: { orderItems: true }
    });
  } catch (error) {
    console.error(`Error extracting historical orders for user ${userId}:`, error);
    throw new Error(`Failed to query user orders: ${error.message}`);
  }
}

/**
 * Switches overarching pipeline statuses for an order generically.
 * 
 * @param {number|string} orderId - Primary ID of the Order.
 * @param {string} status - Supported Enum state literal wrapper (PREPARING, DELIVERING etc).
 * @returns {Promise<Object>} The shifted Order object.
 */
async function updateOrderStatus(orderId, status) {
  try {
    return await prisma.order.update({
      where: { id: parseInt(orderId, 10) },
      data: { status }
    });
  } catch (error) {
    console.error(`Failed to flip order status on #${orderId} to ${status}:`, error);
    throw new Error(`Failed to update order pipeline status: ${error.message}`);
  }
}

/**
 * Specifically assigns tracking allocation metrics to couriers, auto switching to 'DELIVERING'.
 * 
 * @param {number|string} orderId - Primary Order DB locator.
 * @param {number|string} courierId - Targeted Courier DB logic mapping.
 * @returns {Promise<Object>} Shifted Order representation payload.
 */
async function assignCourier(orderId, courierId) {
  try {
    return await prisma.order.update({
      where: { id: parseInt(orderId, 10) },
      data: {
        courierId: parseInt(courierId, 10),
        status: 'DELIVERING'
      }
    });
  } catch (error) {
    console.error(`Assignment disruption during Courier allocation on order ${orderId}:`, error);
    throw new Error(`Failed to assign a delivery courier reliably: ${error.message}`);
  }
}

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  assignCourier
};
