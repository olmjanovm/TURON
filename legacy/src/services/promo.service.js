const prisma = require('../database/client');

/**
 * Creates a new promo code.
 * @param {Object} data - Contains code, discountType, discountValue, minOrderValue, startDate, endDate, usageLimit.
 * @returns {Promise<Object>} The created promo record.
 */
async function createPromo(data) {
  try {
    return await prisma.promoCode.create({ data });
  } catch (error) {
    console.error('Error creating promo code:', error);
    throw new Error(`Failed to create promo code: ${error.message}`);
  }
}

/**
 * Retrieves a promo code by its code string.
 * @param {string} code - The promo code to search for.
 * @returns {Promise<Object|null>} The promo code record, or null if not found.
 */
async function getPromoByCode(code) {
  try {
    return await prisma.promoCode.findUnique({
      where: { code }
    });
  } catch (error) {
    console.error(`Error fetching promo code '${code}':`, error);
    throw new Error(`Failed to fetch promo code: ${error.message}`);
  }
}

/**
 * Validates whether a given promo code can be applied to an order total.
 * @param {string} code - The code to validate.
 * @param {number|Prisma.Decimal} orderTotal - The prospective total of the order.
 * @returns {Promise<Object>} Status of the validation ({ valid: true, promo } or { valid: false, reason }).
 */
async function validatePromo(code, orderTotal) {
  try {
    const promo = await getPromoByCode(code);
    
    if (!promo) {
      return { valid: false, reason: 'Promo code does not exist.' };
    }
    
    if (!promo.isActive) {
      return { valid: false, reason: 'Promo code is deactivated.' };
    }

    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      return { valid: false, reason: 'Promo code is expired or not yet active.' };
    }

    if (promo.usageLimit !== null && promo.timesUsed >= promo.usageLimit) {
      return { valid: false, reason: 'Promo code usage limit has been reached.' };
    }

    if (Number(orderTotal) < Number(promo.minOrderValue)) {
      return { valid: false, reason: `Minimum order value not met. Minimum is ${promo.minOrderValue}.` };
    }

    return { valid: true, promo };
  } catch (error) {
    console.error(`Error validating promo code '${code}':`, error);
    throw new Error(`Failed to validate promo code: ${error.message}`);
  }
}

/**
 * Increments the timesUsed for a promo code. Deactivates it if its usage limit is reached.
 * @param {number|string} promoId - The ID of the promo code.
 * @param {Object} [txClient=prisma] - Optional Prisma Transaction client.
 * @returns {Promise<Object>} The updated promo code record.
 */
async function incrementUsage(promoId, txClient = prisma) {
  try {
    const parsedId = parseInt(promoId, 10);
    const promo = await txClient.promoCode.findUnique({
      where: { id: parsedId }
    });

    if (!promo) {
      throw new Error(`Promo Code ID ${parsedId} not found.`);
    }

    const newTimesUsed = promo.timesUsed + 1;
    let isActive = promo.isActive;

    // Check if limits exceeded
    if (promo.usageLimit !== null && newTimesUsed >= promo.usageLimit) {
      isActive = false;
    }

    return await txClient.promoCode.update({
      where: { id: parsedId },
      data: {
        timesUsed: newTimesUsed,
        isActive
      }
    });

  } catch (error) {
    console.error(`Error incrementing usage for promo ${promoId}:`, error);
    throw new Error(`Failed to increment usage: ${error.message}`);
  }
}

module.exports = {
  createPromo,
  getPromoByCode,
  validatePromo,
  incrementUsage
};
