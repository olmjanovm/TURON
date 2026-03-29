const { CATEGORY_PREFIX, PRODUCT_PREFIX, BACK_TO_CATEGORIES_CALLBACK } = require('../constants');

/**
 * Generates an inline keyboard object containing a list of categories.
 * Each button sends a callback payload like `category_<id>`.
 * 
 * @param {Array<Object>} categories - An array of category objects.
 * @returns {Object} An object compatible with Telegraf's `reply_markup`.
 */
function categoriesKeyboard(categories) {
  const inline_keyboard = categories.map(category => [
    {
      text: category.name,
      callback_data: `${CATEGORY_PREFIX}${category.id}`
    }
  ]);

  return { inline_keyboard };
}

/**
 * Generates an inline keyboard object containing a list of products.
 * Each button shows the product name and its price formatted.
 * Appends a 'Back' button to return to the categories list.
 * 
 * @param {Array<Object>} products - An array of product objects.
 * @returns {Object} An object compatible with Telegraf's `reply_markup`.
 */
function productsKeyboard(products) {
  const inline_keyboard = products.map(product => {
    // Format the price with spaces (e.g. "50 000"), assuming price is a Prisma Decimal or Number
    const formattedPrice = Number(product.price).toLocaleString('ru-RU');
    
    return [
      {
        text: `${product.name} – ${formattedPrice} UZS`,
        callback_data: `${PRODUCT_PREFIX}${product.id}`
      }
    ];
  });

  // Append a standard Back button at the bottom of the keyboard grid
  inline_keyboard.push([
    {
      text: '⬅️ Back',
      callback_data: BACK_TO_CATEGORIES_CALLBACK
    }
  ]);

  return { inline_keyboard };
}

module.exports = {
  categoriesKeyboard,
  productsKeyboard
};
