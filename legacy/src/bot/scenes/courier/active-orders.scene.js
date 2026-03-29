const { Scenes, Markup } = require('telegraf');
const orderService = require('../../../services/order.service');
const prisma = require('../../../database/client');

const activeOrdersScene = new Scenes.BaseScene('courier_active_orders');

// --- HELPER FUNCTIONS ---

/**
 * Formats a list of assigned orders natively for the courier UI layer.
 */
function formatCourierOrderList(orders, isActiveFilter) {
    let msg = isActiveFilter ? `🚚 *My Active Route Assignments*\n\n` : `📦 *My Delivered History*\n\n`;
    
    if (orders.length === 0) return msg + `No assignments matching this filter natively exist locally.`;
    
    orders.forEach(o => {
        const addrTokens = o.address?.addressText ? o.address.addressText.substring(0, 30) : 'Secure GPS Pin';
        msg += `📦 *#${o.id}* | 👤 ${o.user?.name || 'Client'}\n`;
        msg += `📍 ${addrTokens}...\n`;
        msg += `💰 ${Number(o.totalPrice).toLocaleString('ru-RU')} UZS | 💳 ${o.paymentMethod || 'Variable'}\n`;
        msg += `📊 Active Status: ${o.status}\n\n`;
    });
    return msg;
}

/**
 * Parses isolated order details hiding unnecessary system identifiers from drivers.
 */
function formatCourierSingleOrder(order) {
    let msg = `📦 *Courier Order Protocol #${order.id}*\n`;
    
    msg += `👤 *Customer Details:*\n`;
    msg += `Name: ${order.user?.name || 'Secure Mask'}\n`;
    msg += `Phone: ${order.user?.phone || 'Missing Record'}\n\n`;
    
    msg += `📍 *Delivery Coordinates:*\n`;
    msg += `Address: ${order.address?.addressText || 'Location Coordinates Interpolated'}\n\n`;
    
    msg += `🛒 *Physical Basket:*\n`;
    order.orderItems.forEach(item => {
        const prodName = item.product?.name || 'Anonymous Object';
        msg += `- ${prodName} (x${item.quantity})\n`;
    });
    
    msg += `\n💰 *Financial Collections & Methods:*\n`;
    msg += `Requirement: ${Number(order.totalPrice).toLocaleString('ru-RU')} UZS\n`;
    msg += `Gateway: ${order.paymentMethod || 'N/A'}\n`;
    msg += `Clearance: ${order.paymentStatus}\n\n`;
    
    msg += `📊 *Tracking Array:* ${order.status}\n`;
    
    return msg;
}

/**
 * Constructs contextual keyboards strictly mapping impossible actions logically away internally.
 */
function buildCourierOrderKeyboard(order) {
    const kb = [];
    
    // Delivery progression block
    if (order.status !== 'DELIVERED' && order.status !== 'CANCELED') {
        if (order.status !== 'DELIVERING') {
            kb.push([Markup.button.callback('🚚 Broadcast "On The Way"', `courier_on_the_way_${order.id}`)]);
        }
        kb.push([Markup.button.callback('✅ Mark Safely Delivered', `courier_delivered_${order.id}`)]);
    }
    
    // GPS & Contact
    kb.push([Markup.button.callback('📞 Access Customer Comms & GPS', `courier_customer_info_${order.id}`)]);
    kb.push([Markup.button.callback('⬅️ Drop Action Back', 'courier_orders_list')]);
    
    return Markup.inlineKeyboard(kb);
}

/**
 * Evaluates execution privileges robustly checking target orders against courier's Prisma assignments securely.
 */
async function verifyCourierOwnership(ctx, orderId) {
    const courierRecord = await prisma.courier.findUnique({ where: { userId: ctx.state.user.id } });
    if (!courierRecord) return false;
    
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.courierId !== courierRecord.id) return false;
    
    return true;
}

/**
 * Executes a global sync dynamically querying Prisma matching Courier's live queue.
 */
async function showCourierList(ctx, filter = 'ACTIVE', edit = false) {
    const courierRecord = await prisma.courier.findUnique({
        where: { userId: ctx.state.user.id }
    });
    
    if (!courierRecord) {
        const abortMsg = 'System error: You currently miss physical `Courier` flag mappings internally. Hit up an admin!';
        return edit ? ctx.editMessageText(abortMsg).catch(()=>{}) : ctx.reply(abortMsg);
    }

    let customWhere = { courierId: courierRecord.id };
    
    if (filter === 'ACTIVE') {
        customWhere.status = { notIn: ['DELIVERED', 'CANCELED'] };
    } else if (filter === 'DELIVERED') {
        customWhere.status = 'DELIVERED';
    }

    const linkedAssignments = await prisma.order.findMany({
        where: customWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: true, address: true }
    });

    const outputBoard = formatCourierOrderList(linkedAssignments, filter === 'ACTIVE');
    
    let kb = [];
    let inlineRow = [];
    
    linkedAssignments.forEach((o, idx) => {
        inlineRow.push(Markup.button.callback(`View #${o.id}`, `courier_order_${o.id}`));
        if (inlineRow.length === 2 || idx === linkedAssignments.length - 1) {
            kb.push([...inlineRow]);
            inlineRow = [];
        }
    });

    kb.push([
        Markup.button.callback('🔄 Resync Live Feed', 'courier_refresh'),
        Markup.button.callback('⬅️ Disable Route Layer', 'courier_back')
    ]);
    kb.push([
        Markup.button.callback('🏃 My Assigned Tasks', 'courier_active_only'),
        Markup.button.callback('📦 My Execution History', 'courier_delivered_list')
    ]);

    if(edit) {
        await ctx.editMessageText(outputBoard, { parse_mode: 'Markdown', reply_markup: Markup.inlineKeyboard(kb).reply_markup }).catch(()=>{});
    } else {
        await ctx.replyWithMarkdown(outputBoard, Markup.inlineKeyboard(kb));
    }
}


// --- SCENE ENTRY LAYER ---

activeOrdersScene.enter(async (ctx) => {
    try {
        if (ctx.state.role !== 'courier' && ctx.state.role !== 'admin') {
            await ctx.reply('⛔️ Safety Intercept: Courier features dynamically restricted.');
            return ctx.scene.leave();
        }
        await showCourierList(ctx, 'ACTIVE');
    } catch (err) {
        console.error('Courier scene runtime disruption:', err);
    }
});


// --- GENERIC WORKFLOW MODULES ---

activeOrdersScene.action('courier_refresh', async ctx => {
    try {
        await ctx.answerCbQuery();
        await showCourierList(ctx, 'ACTIVE', true);
    } catch (e) { console.error(e); }
});

activeOrdersScene.action('courier_active_only', async ctx => {
    try {
        await ctx.answerCbQuery();
        await showCourierList(ctx, 'ACTIVE', true);
    } catch (e) { console.error(e); }
});

activeOrdersScene.action('courier_delivered_list', async ctx => {
    try {
        await ctx.answerCbQuery();
        await showCourierList(ctx, 'DELIVERED', true);
    } catch (e) { console.error(e); }
});

activeOrdersScene.action('courier_orders_list', async ctx => {
    try {
        await ctx.answerCbQuery();
        await showCourierList(ctx, 'ACTIVE', true);
    } catch (e) { console.error(e); }
});

activeOrdersScene.action('courier_back', async ctx => {
    try {
        await ctx.answerCbQuery();
        await ctx.deleteMessage().catch(()=>{});
        await ctx.scene.leave();
    } catch (e) { console.error(e); }
});


// --- ISOLATED TARGET VIEW PROTOCOL ---

activeOrdersScene.action(/courier_order_(\d+)/, async ctx => {
    try {
        const fetchId = parseInt(ctx.match[1], 10);
        if (!(await verifyCourierOwnership(ctx, fetchId))) {
            return ctx.answerCbQuery('Assignment rejection: Target safely bounded away natively.', { show_alert: true });
        }
        
        await ctx.answerCbQuery();
        const coreRecord = await orderService.getOrderById(fetchId);
        
        const dump = formatCourierSingleOrder(coreRecord);
        const structure = buildCourierOrderKeyboard(coreRecord);
        
        await ctx.editMessageText(dump, { parse_mode: 'Markdown', reply_markup: structure.reply_markup }).catch(()=>{});
    } catch (e) { console.error(e); }
});


// --- ASSIGNMENT PIPELINE EXECUTIONS ---

activeOrdersScene.action(/courier_on_the_way_(\d+)/, async ctx => {
    try {
        const id = parseInt(ctx.match[1], 10);
        if (!(await verifyCourierOwnership(ctx, id))) {
            return ctx.answerCbQuery('Action inherently blocked securely.', { show_alert: true });
        }
        
        await ctx.answerCbQuery('Triggered: Status changed to DELIVERING');
        await orderService.updateOrderStatus(id, 'DELIVERING');
        
        const coreRecord = await orderService.getOrderById(id);
        if (coreRecord.user?.telegramId) {
            await ctx.telegram.sendMessage(coreRecord.user.telegramId, `🚚 Thrilling update! Your designated driver is actively speeding onto route with your #Turon order #${id}. Stay tuned!`).catch(()=>{});
        }
        
        const targetText = formatCourierSingleOrder(coreRecord);
        const mappedKb = buildCourierOrderKeyboard(coreRecord);
        await ctx.editMessageText(targetText, { parse_mode: 'Markdown', reply_markup: mappedKb.reply_markup }).catch(()=>{});
    } catch (e) { console.error(e); }
});

activeOrdersScene.action(/courier_delivered_(\d+)/, async ctx => {
    try {
        const id = parseInt(ctx.match[1], 10);
        if (!(await verifyCourierOwnership(ctx, id))) {
            return ctx.answerCbQuery('Action inherently blocked securely.', { show_alert: true });
        }
        
        await ctx.answerCbQuery('Execution: Package safely closed out natively.');
        await orderService.updateOrderStatus(id, 'DELIVERED');
        
        const courierData = await prisma.courier.findUnique({ where: { userId: ctx.state.user.id } });
        // Automatically strip BUSY status allowing fresh dispatcher assignments perfectly natively
        await prisma.courier.update({ where: { id: courierData.id }, data: { status: 'AVAILABLE' }});
        
        const coreRecord = await orderService.getOrderById(id);
        
        if (coreRecord.user?.telegramId) {
            await ctx.telegram.sendMessage(coreRecord.user.telegramId, `✅ Complete Success! Courier flagged package #${id} delivered! Enjoy your foods natively.`).catch(()=>{});
        }
        
        const targetText = formatCourierSingleOrder(coreRecord);
        const mappedKb = buildCourierOrderKeyboard(coreRecord);
        await ctx.editMessageText(targetText, { parse_mode: 'Markdown', reply_markup: mappedKb.reply_markup }).catch(()=>{});
    } catch (e) { console.error(e); }
});


// --- DEEP INTEL LOGIC ---

activeOrdersScene.action(/courier_customer_info_(\d+)/, async ctx => {
    try {
        await ctx.answerCbQuery('Fetching target metrics locally...');
        const fetchId = parseInt(ctx.match[1], 10);
        if (!(await verifyCourierOwnership(ctx, fetchId))) {
            return ctx.answerCbQuery('Assignment rejection locally natively.', { show_alert: true });
        }
        
        const coreRecord = await orderService.getOrderById(fetchId);
        
        let intMsg = `📞 *Client Communications Intel | Order #${fetchId}*\n\n`;
        intMsg += `👤 Linked Name: ${coreRecord.user?.name || 'Missing Record'}\n`;
        intMsg += `📱 Direct Phone: ${coreRecord.user?.phone || 'Missing Digit Map'}\n\n`;
        intMsg += `📍 Descriptive Drop: ${coreRecord.address?.addressText || 'Blank Value'}\n`;
        
        if (coreRecord.address?.latitude && coreRecord.address?.longitude) {
            const gpsLat = Number(coreRecord.address.latitude);
            const gpsLng = Number(coreRecord.address.longitude);
            intMsg += `🗺 GPS Grid: ${gpsLat}, ${gpsLng}\n`;
            intMsg += `🌐 *Live Routing Map:* https://maps.google.com/?q=${gpsLat},${gpsLng}\n`;
        }
        
        const escapeKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Fallback to Tracking Scope', `courier_order_${fetchId}`)]
        ]);
        
        // Use disable_web_page_preview to omit huge Map frame bloat from filling the UI cleanly
        await ctx.editMessageText(intMsg, { parse_mode: 'Markdown', disable_web_page_preview: true, reply_markup: escapeKeyboard.reply_markup }).catch(()=>{});
    } catch (e) { console.error(e); }
});

module.exports = activeOrdersScene;
