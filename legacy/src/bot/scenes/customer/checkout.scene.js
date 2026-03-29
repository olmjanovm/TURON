const { Scenes, Markup } = require('telegraf');
const menuService = require('../../../services/menu.service');
const orderService = require('../../../services/order.service');
const prisma = require('../../../database/client');

// --- HELPER FUNCTIONS ---

/**
 * Calculates current price metrics for a basket of products seamlessly.
 */
async function calculateCartSummary(cart, promo) {
    let subtotal = 0;
    const items = [];
    
    for (const item of cart) {
        const product = await menuService.getProductById(item.productId);
        if (product) {
            const price = Number(product.price);
            subtotal += price * item.quantity;
            items.push({ 
                product, 
                quantity: item.quantity, 
                price, 
                total: price * item.quantity 
            });
        }
    }

    let discount = 0;
    if (promo) {
        if (promo.discountType === 'PERCENTAGE') {
            discount = subtotal * (Number(promo.discountValue) / 100);
        } else {
            discount = Number(promo.discountValue);
        }
    }
    
    let total = subtotal - discount;
    if (total < 0) total = 0;

    return { items, subtotal, discount, total, promo };
}

/**
 * Renders cleanly formatted order items payload visually matching cart structures.
 */
function formatOrderSummary(summary) {
    let text = `🛒 *Order Summary*\n\n`;
    for (const item of summary.items) {
        text += `🍽 *${item.product.name}*\n└ ${item.quantity} x ${item.price.toLocaleString('ru-RU')} = ${item.total.toLocaleString('ru-RU')} UZS\n`;
    }
    text += `\n*Subtotal:* ${summary.subtotal.toLocaleString('ru-RU')} UZS\n`;
    
    if (summary.discount > 0) {
        text += `*Discount (${summary.promo.code}):* -${summary.discount.toLocaleString('ru-RU')} UZS\n`;
    }
    
    text += `*Total To Pay:* ${summary.total.toLocaleString('ru-RU')} UZS\n`;
    return text;
}

/**
 * Renders localized address bindings alongside payment toggle matrices natively.
 */
async function showPaymentMethodSelection(ctx) {
    const summary = await calculateCartSummary(ctx.session.cart, ctx.session.promo);
    const summaryText = formatOrderSummary(summary);
    
    const addr = ctx.session.checkoutAddress || {};
    const addrText = addr.addressText || '📍 Location Pin Captured';
    
    const text = `${summaryText}\n📍 *Delivery Address:*\n${addrText}\n\n💳 Please select your payment method:`;
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('💵 Cash', 'payment_cash')],
        [Markup.button.callback('💳 Card transfer', 'payment_card_transfer')],
        [Markup.button.callback('⬅️ Back', 'back_to_cart')] 
    ]);

    await ctx.replyWithMarkdown(text, keyboard).catch(() => {});
}

/**
 * Final order commitment gateway showing entire payloads to correctly verify metrics.
 */
async function showFinalConfirmation(ctx) {
    const summary = await calculateCartSummary(ctx.session.cart, ctx.session.promo);
    const summaryText = formatOrderSummary(summary);
    
    const addr = ctx.session.checkoutAddress || {};
    const addrText = addr.addressText || '📍 Location Pin Captured';
    
    let paymentText = ctx.session.paymentMethod === 'cash' ? '💵 Cash' : '💳 Card transfer';
    if (ctx.session.paymentProvider) {
        paymentText += ` (${ctx.session.paymentProvider})`;
    }

    let text = `${summaryText}\n📍 *Delivery Address:*\n${addrText}\n\n💰 *Payment Method:*\n${paymentText}\n\n`;
    
    if (ctx.session.paymentMethod === 'card_transfer') {
        text += `⚠️ *Note:* Payment confirmation will be checked manually by admin for now.\n\n`;
    }
    
    text += `Ready to confirm your order?`;

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm order', 'confirm_order')],
        [Markup.button.callback('❌ Cancel', 'cancel_checkout')],
        [Markup.button.callback('⬅️ Back', 'payment_back')]
    ]);

    await ctx.replyWithMarkdown(text, keyboard).catch(() => {});
}

const checkoutScene = new Scenes.BaseScene('checkout');

// --- STEP 1: VALIDATE CART ---
checkoutScene.enter(async (ctx) => {
    try {
        const cart = ctx.session.cart || [];
        if (cart.length === 0) {
            return ctx.reply('Your cart is empty.', Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Back to menu', 'back_to_menu')]
            ]));
        }

        const summary = await calculateCartSummary(cart, ctx.session.promo);
        const text = formatOrderSummary(summary) + '\n\n📍 How would you like to provide your delivery address?';
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📍 Send location', 'checkout_location')],
            [Markup.button.callback('✍️ Enter address manually', 'checkout_manual_address')],
            [Markup.button.callback('⬅️ Back to cart', 'back_to_cart')]
        ]);

        await ctx.replyWithMarkdown(text, keyboard);
    } catch (err) {
        console.error('Checkout routing failure:', err);
    }
});

// --- NAVIGATION CATCHES ---
checkoutScene.action('back_to_cart', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(()=>{});
    await ctx.scene.enter('cart');
});

checkoutScene.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(()=>{});
    await ctx.scene.enter('menu');
});

// --- STEP 3A: SEND LOCATION ---
checkoutScene.action('checkout_location', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.checkoutStep = 'waiting_location';
    await ctx.deleteMessage().catch(()=>{});
    
    // Natively we tell users to pull attachment clip to send location
    await ctx.reply('📍 Please send your location using the Telegram attachment menu 📎 (Location pin).', Markup.keyboard([
        Markup.button.locationRequest('📍 Send Location')
    ]).resize().oneTime());
});

checkoutScene.on('location', async (ctx) => {
    if (ctx.session.checkoutStep === 'waiting_location') {
        const { latitude, longitude } = ctx.message.location;
        ctx.session.checkoutAddress = {
            label: 'Location pin',
            addressText: `Geo: ${latitude}, ${longitude}`,
            latitude,
            longitude
        };
        ctx.session.checkoutStep = null;
        
        // Remove reply keyboard securely
        await ctx.reply('Location captured natively ✅', { reply_markup: { remove_keyboard: true }});
        
        await showPaymentMethodSelection(ctx);
    }
});

// --- STEP 3B: MANUAL ADDRESS ---
checkoutScene.action('checkout_manual_address', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.checkoutStep = 'waiting_manual_address';
    await ctx.deleteMessage().catch(()=>{});
    await ctx.reply('✍️ Please type your full delivery address:');
});

checkoutScene.on('text', async (ctx, next) => {
    if (ctx.session.checkoutStep === 'waiting_manual_address') {
        ctx.session.checkoutAddress = {
            label: 'Manual address',
            addressText: ctx.message.text.trim(),
            latitude: null,
            longitude: null
        };
        ctx.session.checkoutStep = null;
        
        await showPaymentMethodSelection(ctx);
    } else {
        return next();
    }
});

// --- STEP 4/5: PAYMENT METHOD INTEGRATION ---
checkoutScene.action('payment_back', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(()=>{});
    await showPaymentMethodSelection(ctx);
});

checkoutScene.action('payment_cash', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.paymentMethod = 'cash';
    ctx.session.paymentProvider = null;
    await ctx.deleteMessage().catch(()=>{});
    await showFinalConfirmation(ctx);
});

checkoutScene.action('payment_card_transfer', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.paymentMethod = 'card_transfer';
    await ctx.deleteMessage().catch(()=>{});
    
    const text = '💳 Please select your preferred payment provider transfer map:';
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Click', 'provider_click'), Markup.button.callback('Payme', 'provider_payme')],
        [Markup.button.callback('Uzum Bank', 'provider_uzum'), Markup.button.callback('Paynet', 'provider_paynet')],
        [Markup.button.callback('⬅️ Back', 'payment_back')]
    ]);
    
    await ctx.replyWithMarkdown(text, keyboard);
});

// Sub-provider route handler explicitly mapping to provider values
const mappedProviders = {
    'provider_click': 'Click',
    'provider_payme': 'Payme',
    'provider_uzum': 'Uzum Bank',
    'provider_paynet': 'Paynet'
};

checkoutScene.action(/provider_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const providerKey = ctx.match[0];
    ctx.session.paymentProvider = mappedProviders[providerKey] || 'Card Transfer';
    await ctx.deleteMessage().catch(()=>{});
    await showFinalConfirmation(ctx);
});

// --- STEP 7: CANCEL FLOW ---
checkoutScene.action('cancel_checkout', async (ctx) => {
    await ctx.answerCbQuery();
    
    delete ctx.session.checkoutStep;
    delete ctx.session.checkoutAddress;
    delete ctx.session.paymentMethod;
    delete ctx.session.paymentProvider;
    
    await ctx.deleteMessage().catch(()=>{});
    await ctx.reply('❌ Checkout sequence natively canceled.', Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Return to Menu', 'back_to_menu')]
    ]));
});

// --- STEP 6: CONFIRM ORDER DATABASE INTERPOLATION ---
checkoutScene.action('confirm_order', async (ctx) => {
    await ctx.answerCbQuery('Processing order payloads...');
    
    try {
        const user = ctx.state.user;
        const cart = ctx.session.cart || [];
        const addressData = ctx.session.checkoutAddress;
        
        if (cart.length === 0) {
            return ctx.reply('Your cart is empty. Process aborted.');
        }

        // Bridge raw address variables into Prisma structure 
        const address = await prisma.deliveryAddress.create({
            data: {
                userId: user.id,
                label: addressData.label,
                addressText: addressData.addressText,
                latitude: addressData.latitude ? Number(addressData.latitude) : null,
                longitude: addressData.longitude ? Number(addressData.longitude) : null
            }
        });

        const parameters = {
            userId: user.id,
            items: cart,
            addressId: address.id,
            paymentMethod: ctx.session.paymentMethod,
            paymentProvider: ctx.session.paymentProvider || null
        };

        if (ctx.session.promo) {
            parameters.promoCodeId = ctx.session.promo.id;
        }

        // Execute robust atomic pipeline inserting order safely
        const order = await orderService.createOrder(parameters);

        // Sanitize cache payloads entirely securing memory states
        ctx.session.cart = [];
        delete ctx.session.checkoutStep;
        delete ctx.session.checkoutAddress;
        delete ctx.session.paymentMethod;
        delete ctx.session.paymentProvider;
        delete ctx.session.promo;

        await ctx.deleteMessage().catch(()=>{});
        
        let successDump = `✅ *Success! Order #${order.id} placed!*\n\nYour parameters are *PENDING* execution.\n\n`;

        if (order.paymentMethod === 'cash') {
            successDump += `💵 *Payment:* Kindly pay native cash natively executing upon delivery point dropoff!`;
        } else {
            successDump += `💳 *Payment:* Please wait securely while an admin sequentially verifies your ${order.paymentProvider} digital transfer manually.`;
        }
        
        await ctx.replyWithMarkdown(successDump, Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Back to menu', 'back_to_menu')]
        ]));

    } catch (err) {
        console.error('Final database order interpolation error:', err);
        await ctx.reply('Server encountered error allocating order.');
    }
});

module.exports = checkoutScene;
