const { Scenes, Markup } = require('telegraf');
const orderService = require('../../../services/order.service');
const prisma = require('../../../database/client');

const ordersScene = new Scenes.BaseScene('admin_orders');

// --- HELPER FUNCTIONS ---

/**
 * Parses and displays macro-layer metadata relating to lists of orders iteratively.
 */
function formatAdminOrderList(orders) {
    let msg = `📋 *Admin Order Management*\n\n`;
    if (orders.length === 0) return msg + `No orders match this explicit filter locally.`;
    
    orders.forEach(o => {
        const name = o.user ? (o.user.name || 'Unknown User') : 'Unknown User';
        const total = Number(o.totalPrice).toLocaleString('ru-RU');
        msg += `📦 *#${o.id}* | 👤 ${name}\n`;
        msg += `💰 ${total} UZS | 💳 ${o.paymentMethod || 'Method Unknown'}\n`;
        msg += `📊 Status: ${o.status} | 💸 Payment: ${o.paymentStatus}\n\n`;
    });
    return msg;
}

/**
 * Deconstructs nested singular payloads revealing addresses, financial records, and exact basket items.
 */
function formatSingleOrder(order) {
    let msg = `📦 *Order #${order.id}*\n`;
    msg += `🕒 Created: ${order.createdAt.toLocaleString()}\n\n`;
    
    msg += `👤 *Customer Info:*\n`;
    msg += `Name: ${order.user?.name || 'Unknown'}\n`;
    msg += `ID: @${order.user?.telegramId || 'Missing'}\n`;
    msg += `Phone: ${order.user?.phone || 'N/A'}\n\n`;
    
    msg += `📍 *Delivery Address:*\n`;
    msg += `Route: ${order.address?.addressText || 'Location Pin Interpolated'}\n`;
    if (order.address?.latitude && order.address?.longitude) {
        msg += `Geo: ${order.address.latitude}, ${order.address.longitude}\n`;
    }

    msg += `\n🛒 *Basket Data:*\n`;
    order.orderItems.forEach(item => {
        const prodName = item.product?.name || 'Unknown Food';
        const price = Number(item.unitPrice).toLocaleString('ru-RU');
        msg += `- ${prodName} (x${item.quantity}) = ${price} UZS\n`;
    });
    
    msg += `\n💰 *Financial Metrics:*\n`;
    if (order.promoCode) {
        msg += `Promo Attached: ${order.promoCode.code}\n`;
    }
    msg += `Total Checkout: ${Number(order.totalPrice).toLocaleString('ru-RU')} UZS\n`;
    msg += `Method Selected: ${order.paymentMethod || 'N/A'}`;
    if (order.paymentProvider) msg += ` (${order.paymentProvider})`;
    msg += `\nTransfer Status: ${order.paymentStatus}\n\n`;
    
    msg += `📊 *Pipeline Status:*\n`;
    msg += `Sequence Tracker: ${order.status}\n`;
    if (order.courier) {
        msg += `🚚 Courier Assigned: #${order.courier.id}\n`;
    }
    return msg;
}

/**
 * Logically maps toggle buttons ensuring impossible actions (like verifying Cash on PREPARING natively) aren't allowed.
 */
function buildOrderActionKeyboard(order) {
    const kb = [];
    
    // Approval & Pipeline Stages
    if (order.status === 'PENDING') {
        kb.push([
            Markup.button.callback('✅ Approve Order', `admin_approve_${order.id}`),
            Markup.button.callback('🍳 Mark Preparing', `admin_preparing_${order.id}`)
        ]);
    } else if (order.status === 'PREPARING') {
        kb.push([
            Markup.button.callback('🚚 Mark Delivering', `admin_delivering_${order.id}`),
            Markup.button.callback('🛵 Assign Courier', `admin_assign_courier_${order.id}`)
        ]);
    } else if (order.status === 'DELIVERING') {
        kb.push([Markup.button.callback('🏁 Mark Delivered', `admin_delivered_${order.id}`)]);
    }
    
    // Financial Verifications
    if (order.paymentMethod === 'card_transfer' && order.paymentStatus !== 'PAID') {
        kb.push([
            Markup.button.callback('🤑 Verify Card Transfer', `admin_verify_payment_${order.id}`),
            Markup.button.callback('❌ Reject Card Payment', `admin_reject_payment_${order.id}`)
        ]);
    } else if (order.paymentMethod === 'cash' && order.paymentStatus !== 'PAID' && order.status === 'DELIVERED') {
        kb.push([Markup.button.callback('🤑 Verify Cash Collection', `admin_verify_payment_${order.id}`)]);
    }
    
    // Safety Net Cancellations (Hidden if already delivered or naturally closed)
    if (order.status !== 'DELIVERED' && order.status !== 'CANCELED') {
        kb.push([Markup.button.callback('🚫 Cancel Order Safely', `admin_cancel_${order.id}`)]);
    }
    
    kb.push([Markup.button.callback('⬅️ Back into Orders Tree', 'admin_orders_list')]);
    
    return Markup.inlineKeyboard(kb);
}

/**
 * Connects directly to DB returning queried lists mapped perfectly alongside callback payload buttons natively.
 */
async function showOrdersList(ctx, filter = 'ALL', edit = false) {
    let customWhere = {};
    if (filter === 'PENDING') {
        customWhere.status = 'PENDING';
    } else if (filter === 'UNPAID_CARD') {
        customWhere.paymentStatus = 'UNPAID';    
        customWhere.paymentMethod = 'card_transfer';
    }
    
    // Pull explicitly 10 to keep screens readable sequentially
    const orders = await prisma.order.findMany({
        where: customWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: true }
    });
    
    const displayMsg = formatAdminOrderList(orders);
    
    const kb = [];
    let rowBuffer = [];
    orders.forEach((o, index) => {
        rowBuffer.push(Markup.button.callback(`View #${o.id}`, `admin_order_${o.id}`));
        if (rowBuffer.length === 2 || index === orders.length - 1) {
            kb.push([...rowBuffer]);
            rowBuffer = [];
        }
    });
    
    kb.push([
        Markup.button.callback('🔄 Refresh Metrics', 'admin_orders_refresh'),
        Markup.button.callback('⬅️ Leave Admin Portal', 'admin_orders_back')
    ]);
    kb.push([
        Markup.button.callback('⏳ Verify Payments', 'admin_pending_payments'),
        Markup.button.callback('🆕 Catch New Orders', 'admin_new_orders')
    ]);
    
    if (edit) {
        await ctx.editMessageText(displayMsg, { parse_mode: 'Markdown', reply_markup: Markup.inlineKeyboard(kb).reply_markup }).catch(()=>{});
    } else {
        await ctx.replyWithMarkdown(displayMsg, Markup.inlineKeyboard(kb));
    }
}

/**
 * Reusuable trigger rendering isolated target profiles explicitly overaying the initial dashboard natively.
 */
async function renderSingleOrder(ctx, targetId) {
    const orderPayload = await orderService.getOrderById(targetId);
    if (!orderPayload) return ctx.answerCbQuery('Order vanished or structurally missing.', {show_alert:true});
    
    const content = formatSingleOrder(orderPayload);
    const mappingKeyboard = buildOrderActionKeyboard(orderPayload);
    
    await ctx.editMessageText(content, { parse_mode: 'Markdown', reply_markup: mappingKeyboard.reply_markup }).catch(()=>{});
}


// --- SCENE ROOT ENTRY PROTOCOLS ---

ordersScene.enter(async (ctx) => {
    try {
        if (ctx.state.role !== 'admin') {
            await ctx.reply('⛔️ Access fully denied. Administrative layers are restricted globally.');
            return ctx.scene.leave();
        }
        await showOrdersList(ctx, 'ALL');
    } catch (err) {
        console.error('Initial admin routing block entry exception:', err);
    }
});


// --- GENERIC NAVIGATIONAL MAPS ---

ordersScene.action('admin_orders_refresh', async ctx => {
    await ctx.answerCbQuery();
    await showOrdersList(ctx, 'ALL', true);
});
ordersScene.action('admin_pending_payments', async ctx => {
    await ctx.answerCbQuery();
    await showOrdersList(ctx, 'UNPAID_CARD', true);
});
ordersScene.action('admin_new_orders', async ctx => {
    await ctx.answerCbQuery();
    await showOrdersList(ctx, 'PENDING', true);
});
ordersScene.action('admin_orders_list', async ctx => {
    await ctx.answerCbQuery();
    await showOrdersList(ctx, 'ALL', true);
});
ordersScene.action('admin_orders_back', async ctx => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(()=>{});
    await ctx.scene.leave();
});

// Single Drill Down Call
ordersScene.action(/admin_order_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery();
        const isolatedId = parseInt(ctx.match[1], 10);
        await renderSingleOrder(ctx, isolatedId);
    } catch (e) {
        console.error('Isolator logic fail:', e); 
    }
});


// --- SPECIFIC PIPELINE ACTIONS AND USER NOTIFICATIONS ---

ordersScene.action(/admin_approve_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery('Successfully stamped Approval.');
        const idx = parseInt(ctx.match[1], 10);
        await prisma.order.update({ where: { id: idx }, data: { status: 'PENDING' }});
        
        const coreOrder = await orderService.getOrderById(idx);
        if(coreOrder.user?.telegramId) {
             await ctx.telegram.sendMessage(coreOrder.user.telegramId, `✅ Your order #${idx} has been formally examined and approved by Turon administration!`).catch(()=>{});
        }
        await renderSingleOrder(ctx, idx);
    } catch (e) { console.error(e); }
});

ordersScene.action(/admin_cancel_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery('Safety Cancel Protocol triggered.');
        const idx = parseInt(ctx.match[1], 10);
        await orderService.updateOrderStatus(idx, 'CANCELED');
        
        const coreOrder = await orderService.getOrderById(idx);
        
        // Atomically map rollback mechanics against products directly bypassing active trackers natively
        for (const item of coreOrder.orderItems) {
            await prisma.product.update({
                 where: { id: item.productId },
                 data: { stockQuantity: { increment: item.quantity } }
            });
        }
        
        if(coreOrder.user?.telegramId) {
             await ctx.telegram.sendMessage(coreOrder.user.telegramId, `❌ Your order #${idx} has been formally Canceled by Turon administration. If it involved card payments, refunds will process naturally.`).catch(()=>{});
        }
        await renderSingleOrder(ctx, idx);
    } catch (e) { console.error('Refund rollback fail:', e); }
});

ordersScene.action(/admin_preparing_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery();
        const idx = parseInt(ctx.match[1], 10);
        await orderService.updateOrderStatus(idx, 'PREPARING');
        
        const coreOrder = await orderService.getOrderById(idx);
        if(coreOrder.user?.telegramId) {
             await ctx.telegram.sendMessage(coreOrder.user.telegramId, `🍳 Great news! Cooks are now preparing your order #${idx}!`).catch(()=>{});
        }
        await renderSingleOrder(ctx, idx);
    } catch (e) { console.error(e); }
});

ordersScene.action(/admin_delivering_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery();
        const idx = parseInt(ctx.match[1], 10);
        await orderService.updateOrderStatus(idx, 'DELIVERING');
        
        const coreOrder = await orderService.getOrderById(idx);
        if(coreOrder.user?.telegramId) {
             await ctx.telegram.sendMessage(coreOrder.user.telegramId, `🚚 Your order #${idx} is officially on the route out to you now!`).catch(()=>{});
        }
        await renderSingleOrder(ctx, idx);
    } catch (e) { console.error(e); }
});

ordersScene.action(/admin_delivered_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery();
        const idx = parseInt(ctx.match[1], 10);
        await orderService.updateOrderStatus(idx, 'DELIVERED');
        
        const coreOrder = await orderService.getOrderById(idx);
        if(coreOrder.user?.telegramId) {
             await ctx.telegram.sendMessage(coreOrder.user.telegramId, `✅ Delivered! Order #${idx} has dropped successfully. We hope you enjoy your meal beautifully!`).catch(()=>{});
        }
        await renderSingleOrder(ctx, idx);
    } catch (e) { console.error(e); }
});


// --- FINANCIAL VERIFICATION FLOWS ---

ordersScene.action(/admin_verify_payment_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery();
        const idx = parseInt(ctx.match[1], 10);
        await prisma.order.update({ where: { id: idx }, data: { paymentStatus: 'PAID' }});
        
        const coreOrder = await orderService.getOrderById(idx);
        if(coreOrder.user?.telegramId) {
             await ctx.telegram.sendMessage(coreOrder.user.telegramId, `💸 Transaction cleared! Payment metrics for order #${idx} have officially verified securely natively.`).catch(()=>{});
        }
        await renderSingleOrder(ctx, idx);
    } catch (e) { console.error(e); }
});

ordersScene.action(/admin_reject_payment_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery();
        const idx = parseInt(ctx.match[1], 10);
        await prisma.order.update({ where: { id: idx }, data: { paymentStatus: 'UNPAID' }});
        
        const coreOrder = await orderService.getOrderById(idx);
        if(coreOrder.user?.telegramId) {
             await ctx.telegram.sendMessage(coreOrder.user.telegramId, `❌ Unfortunately, digital payment proof for order #${idx} was rejected administratively inside verification processes. You can retry paying the assigned courier with physical cash natively.`).catch(()=>{});
        }
        await renderSingleOrder(ctx, idx);
    } catch (e) { console.error(e); }
});


// --- COURIER ASSIGNMENT ENGINE ---

ordersScene.action(/admin_assign_courier_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery();
        const idx = parseInt(ctx.match[1], 10);
        
        // Query isolated registered courier roles actively
        const couriersScope = await prisma.courier.findMany({ include: { user: true }});
        
        if (couriersScope.length === 0) {
            return ctx.answerCbQuery('Error: No users have `Courier` flag natively enabled.', { show_alert: true });
        }
        
        let subKb = [];
        couriersScope.forEach(c => {
             const identifier = c.user?.name || `Employee #${c.id}`;
             const activeIcon = c.status === 'AVAILABLE' ? '🟢' : (c.status === 'BUSY' ? '🔴' : '⚫');
             subKb.push([Markup.button.callback(`${activeIcon} ${identifier}`, `courier_pick_${idx}_${c.id}`)]);
        });
        subKb.push([Markup.button.callback('⬅️ Cancel Selection Tool', `admin_order_${idx}`)]);
        
        await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(subKb).reply_markup).catch(()=>{});
    } catch (e) { console.error('Courier fetch breakdown:', e); }
});

ordersScene.action(/courier_pick_(\d+)_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery('Courier formally allocated.');
        
        const oId = parseInt(ctx.match[1], 10);
        const cId = parseInt(ctx.match[2], 10);
        
        // Run service natively modifying the parent object cleanly
        await orderService.assignCourier(oId, cId);
        await prisma.courier.update({ where: { id: cId }, data: { status: 'BUSY' }});
        
        // Pull context models strictly securing addresses safely
        const coreOrder = await orderService.getOrderById(oId);
        const mappedCourier = await prisma.courier.findUnique({ where: { id: cId }, include: { user: true }});
        
        // Notification logic bridging 2 independent connections natively
        if (coreOrder.user?.telegramId) {
            await ctx.telegram.sendMessage(coreOrder.user.telegramId, `🛵 Great news! Courier ${mappedCourier.user?.name} has safely been designated and will depart toward your coordinates natively!`).catch(()=>{});
        }
        
        if (mappedCourier.user?.telegramId) {
            const locText = coreOrder.address?.addressText || 'Location Coordinates Mode';
            const dumpData = `🔔 **Urgent Assignment!**\n\nOrder #${oId}\nCustomer: ${coreOrder.user?.name}\nPhone: ${coreOrder.user?.phone || 'Missing'}\nDropoff: ${locText}`;
            await ctx.telegram.sendMessage(mappedCourier.user.telegramId, dumpData).catch(()=>{});
            
            // Render Geo native mapping efficiently letting external drivers map correctly automatically
            if (coreOrder.address?.latitude && coreOrder.address?.longitude) {
                await ctx.telegram.sendLocation(mappedCourier.user.telegramId, Number(coreOrder.address.latitude), Number(coreOrder.address.longitude)).catch(()=>{});
            }
        }
        
        await renderSingleOrder(ctx, oId);
    } catch (e) {
        console.error('Courier injection failing operation:', e);
    }
});

module.exports = ordersScene;
