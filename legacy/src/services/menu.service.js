const prisma = require('../database/client');

/**
 * Retrieves all categories ordered by `sortOrder`.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of category objects.
 */
async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        sortOrder: 'asc'
      }
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories from database:', error);
    throw error;
  }
}

/**
 * Retrieves all active products belonging to a specific category.
 * @param {number|string} categoryId - The ID of the category.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of product objects.
 */
async function getProductsByCategory(categoryId) {
  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId: parseInt(categoryId, 10),
        isActive: true
      },
      orderBy: {
        id: 'asc' // Ordering by ID as requested
      }
    });
    return products;
  } catch (error) {
    console.error(`Error fetching products for categoryId ${categoryId}:`, error);
    throw error;
  }
}

/**
 * Retrieves a single product by its ID.
 * @param {number|string} productId - The ID of the product.
 * @returns {Promise<Object|null>} A promise that resolves to the product object or null if not found.
 */
async function getProductById(productId) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: parseInt(productId, 10)
      }
    });
    return product;
  } catch (error) {
    console.error(`Error fetching product by ID ${productId}:`, error);
    throw error;
  }
}

module.exports = {
  getCategories,
  getProductsByCategory,
  getProductById
};


