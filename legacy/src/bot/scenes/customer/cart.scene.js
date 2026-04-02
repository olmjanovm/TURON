const { Scenes } = require('telegraf');
const menuService = require('../../../services/menu.service');
const promoService = require('../../../services/promo.service');

const cartScene = new Scenes.BaseScene('cart');

// Central renderer to dynamically rebuild visually accurate cart matrices
async function renderCart(ctx) {
  const cart = ctx.session.cart || [];
  
  if (cart.length === 0) {
    return ctx.reply('🛒 Your shopping cart is currently empty.', {
      reply_markup: {
        inline_keyboard: [[{ text: '⬅️ Back to Menu', callback_data: 'back_to_menu' }]]
      }
    });
  }

  let total = 0;
  let summaryText = '🛒 *Your Shopping Cart:*\n\n';
  const inline_keyboard = [];

  for (const item of cart) {
    const product = await menuService.getProductById(item.productId);
    if (!product) continue;

    const unitPrice = Number(product.price);
    const itemTotal = unitPrice * item.quantity;
    total += itemTotal;

    const priceLocale = unitPrice.toLocaleString('ru-RU');
    const totalLocale = itemTotal.toLocaleString('ru-RU');

    summaryText += `🍽 *${product.name}*\n└ ${item.quantity} x ${priceLocale} = ${totalLocale} UZS\n\n`;

    inline_keyboard.push([
      { text: '➖', callback_data: `decrease_${product.id}` },
      { text: `📝 ${product.name} (${item.quantity})`, callback_data: `ignore_${product.id}` },
      { text: '➕', callback_data: `increase_${product.id}` },
      { text: '❌', callback_data: `remove_${product.id}` }
    ]);
  }

  summaryText += `-----------------------\n*Base Total:* ${total.toLocaleString('ru-RU')} UZS`;

  if (ctx.session.promo) {
    // Inject and format promo deduction if successfully activated prior
    const promo = ctx.session.promo;
    summaryText += `\n*Promo applied:* ${promo.code}`;
    
    let discount = 0;
    if (promo.discountType === 'PERCENTAGE') {
        discount = total * (Number(promo.discountValue) / 100);
    } else {
        discount = Number(promo.discountValue);
    }
    
    const finalTotal = total - discount > 0 ? total - discount : 0;
    summaryText += `\n*Final Total:* ${finalTotal.toLocaleString('ru-RU')} UZS`;
  }

  inline_keyboard.push([{ text: '🍽 Add more items', callback_data: 'back_to_menu' }]);
  inline_keyboard.push([{ text: '🎟 Apply promo code', callback_data: 'apply_promo' }]);
  inline_keyboard.push([{ text: '🚀 Proceed to Checkout', callback_data: 'proceed_checkout' }]);

  await ctx.replyWithMarkdown(summaryText, {
    reply_markup: { inline_keyboard }
  });
}

// Scene Root Execution Logic
cartScene.enter(async (ctx) => {
  try {
    ctx.session.awaitingPromo = false; 
    await renderCart(ctx);
  } catch (error) {
    console.error('Cart render execution error:', error);
    await ctx.reply('Failed to load your cart.').catch(() => {});
  }
});

// Acknowledging generic list elements silently
cartScene.action(/ignore_(\d+)/, async (ctx) => {
   await ctx.answerCbQuery().catch(() => {});
});

function fetchCartNode(ctx, productId) {
   return ctx.session.cart ? ctx.session.cart.find(i => i.productId === productId) : null;
}

// Quantity Adjusters
cartScene.action(/increase_(\d+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const productId = parseInt(ctx.match[1], 10);
    
    const item = fetchCartNode(ctx, productId);
    if (item) {
        item.quantity += 1;
        await ctx.deleteMessage().catch(() => {});
        await renderCart(ctx);
    }
  } catch (err) { console.error('Increment block error:', err); }
});

cartScene.action(/decrease_(\d+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const productId = parseInt(ctx.match[1], 10);
    
    const item = fetchCartNode(ctx, productId);
    if (item) {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            ctx.session.cart = ctx.session.cart.filter(i => i.productId !== productId);
        }
        await ctx.deleteMessage().catch(() => {});
        await renderCart(ctx);
    }
  } catch (err) { console.error('Decrement block error:', err); }
});

cartScene.action(/remove_(\d+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery('Item trashed.');
    const productId = parseInt(ctx.match[1], 10);
    
    if (ctx.session.cart) {
        ctx.session.cart = ctx.session.cart.filter(i => i.productId !== productId);
    }
    
    await ctx.deleteMessage().catch(() => {});
    await renderCart(ctx);
  } catch (err) { console.error('Trash block error:', err); }
});

// Core Routing Modifiers
cartScene.action('back_to_menu', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(() => {});
    await ctx.scene.enter('menu');
  } catch (err) { console.error(err); }
});

cartScene.action('proceed_checkout', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(() => {});
    await ctx.scene.enter('checkout'); 
  } catch (err) { console.error(err); }
});

// Promo Integration Handlers
cartScene.action('apply_promo', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    ctx.session.awaitingPromo = true;
    await ctx.reply('🎟 Please type in your Promo Code:');
  } catch (err) { console.error(err); }
});

cartScene.on('text', async (ctx, next) => {
  if (ctx.session.awaitingPromo) {
     const code = ctx.message.text.trim();
     let total = 0;
     
     // Recalculate generic total asynchronously since session operates in memory references
     for (const item of (ctx.session.cart || [])) {
         const catalog = await menuService.getProductById(item.productId);
         if (catalog) total += Number(catalog.price) * item.quantity;
     }

     try {
         const evaluation = await promoService.validatePromo(code, total);
         if (evaluation.valid) {
             ctx.session.promo = evaluation.promo;
             ctx.session.awaitingPromo = false;
             await ctx.reply(`✅ Promo Code "${code}" Accepted! Discount has been applied.`);
             
             // Regenerate cart metrics safely via entry
             await renderCart(ctx);
         } else {
             await ctx.reply(`❌ Code invalid: ${evaluation.reason}\nPlease try another one or jump out of chat buffer via inline buttons above.`);
         }
     } catch (err) {
         console.error('Promo evaluation execution failed.', err);
         await ctx.reply('There was a technical error interacting with Promo servers.');
         ctx.session.awaitingPromo = false;
     }
  } else {
     return next();
  }
});

module.exports = cartScene;
