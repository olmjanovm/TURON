const { Scenes } = require('telegraf');
const menuService = require('../../../services/menu.service');
const { categoriesKeyboard, productsKeyboard } = require('../../keyboards/menu');
const { CATEGORY_PREFIX, PRODUCT_PREFIX, BACK_TO_CATEGORIES_CALLBACK } = require('../../constants');

const menuScene = new Scenes.BaseScene('menu');

menuScene.enter(async (ctx) => {
  try {
    const categories = await menuService.getCategories();
    const text = ctx.t ? ctx.t('menu_choose_category') : 'Please choose a category:';

    await ctx.reply(text, {
      reply_markup: categoriesKeyboard(categories)
    });
  } catch (error) {
    console.error('Error entering menu scene:', error);
    await ctx.reply('Failed to load menu.').catch(() => {});
  }
});

// Category callback handler using RegExp prefix evaluation
menuScene.action(new RegExp(`^${CATEGORY_PREFIX}(\\d+)$`), async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const categoryId = parseInt(ctx.match[1], 10);
    const products = await menuService.getProductsByCategory(categoryId);

    if (!products || products.length === 0) {
      await ctx.editMessageText('No products available in this category yet.', {
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Back', callback_data: BACK_TO_CATEGORIES_CALLBACK }]]
        }
      });
      return;
    }

    const text = ctx.t ? ctx.t('menu_choose_product') : 'Please choose a product:';
    await ctx.editMessageText(text, {
      reply_markup: productsKeyboard(products)
    });
  } catch (error) {
    console.error('Error handling product expansion:', error);
    await ctx.answerCbQuery('Failed to load products.').catch(() => {});
  }
});

// Product selection handler directly depositing to cart array in session
menuScene.action(new RegExp(`^${PRODUCT_PREFIX}(\\d+)$`), async (ctx) => {
  try {
    const productId = parseInt(ctx.match[1], 10);
    const product = await menuService.getProductById(productId);

    if (!product) {
      return ctx.answerCbQuery('Item is currently unavailable.', { show_alert: true }).catch(() => {});
    }

    await ctx.answerCbQuery(`Added ${product.name} to cart.`);

    if (!ctx.session.cart) {
      ctx.session.cart = [];
    }

    const cart = ctx.session.cart;
    const existingIndex = cart.findIndex((item) => item.productId === productId);

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ productId, quantity: 1 });
    }

    const confirmMsg = `✅ *${product.name}* added to cart.\\nPrice: ${Number(product.price).toLocaleString('ru-RU')} UZS`;

    // Drop the inline keyboard message securely to swap mapping to a photo module
    await ctx.deleteMessage().catch(() => {});

    const keyboard = {
      inline_keyboard: [
        [{ text: '🔄 Continue Browsing', callback_data: 'menu_again' }],
        [{ text: '🛒 Open Cart', callback_data: 'open_cart' }]
      ]
    };

    if (product.imageUrl) {
      await ctx.replyWithPhoto(product.imageUrl, {
        caption: confirmMsg,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } else {
      await ctx.replyWithMarkdown(confirmMsg, {
        reply_markup: keyboard
      });
    }

  } catch (error) {
    console.error('Error dispatching item to cart:', error);
    await ctx.answerCbQuery('Action failed.').catch(() => {});
  }
});

// Backward navigation interceptor
menuScene.action(BACK_TO_CATEGORIES_CALLBACK, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const categories = await menuService.getCategories();
    const text = ctx.t ? ctx.t('menu_choose_category') : 'Please choose a category:';
    
    await ctx.editMessageText(text, {
      reply_markup: categoriesKeyboard(categories)
    });
  } catch (error) {
    console.error('Failed backward navigation step:', error);
    await ctx.answerCbQuery().catch(() => {});
  }
});

// Re-renders the core frame
menuScene.action('menu_again', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.scene.enter('menu');
  } catch (error) {
    console.error('Loop bounce failure:', error);
  }
});

// Funnels user out to adjacent Cart scene
menuScene.action('open_cart', async (ctx) => {
  try {
    await ctx.answerCbQuery('Fetching Cart...');
    await ctx.scene.enter('cart'); 
  } catch (error) {
    console.error('Cart transfer fail:', error);
    await ctx.reply('Cart module pending compilation!').catch(() => {});
  }
});

module.exports = menuScene;
