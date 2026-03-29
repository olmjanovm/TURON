const { Scenes, Markup } = require('telegraf');
const adminMenuService = require('../../../services/menu-admin.service');

const menuEditorScene = new Scenes.BaseScene('admin_menu_editor');

// --- HELPER WRAPPERS ---
function resetAdminMenuSession(ctx) {
    delete ctx.session.adminMenuStep;
    delete ctx.session.editingCategoryId;
    delete ctx.session.editingProductId;
    delete ctx.session.productDraft;
    delete ctx.session.tempCatName;
}

function formatCategoryList(categories) {
    let msg = `📂 *Menu Categories Dashboard*\n\n`;
    categories.forEach(c => {
        msg += `📁 ${c.name} (Attached Items: ${c._count?.products || 0})\n`;
    });
    return msg;
}

function formatProductList(products) {
    let msg = `🍽 *Menu Products Matrix (Latest Generation)*\n\n`;
    products.forEach(p => {
        const statusIcon = p.isActive ? '🟢' : '🔴';
        msg += `${statusIcon} *${p.name}* | ${Number(p.price).toLocaleString('ru-RU')} UZS | Stock Tracker: ${p.stockQuantity}\n`;
    });
    return msg;
}

function formatSingleProduct(p) {
    let msg = `📦 *Product System Identification #${p.id}*\n\n`;
    msg += `*Logical Target:* ${p.name}\n`;
    msg += `*Mapped Cluster:* ${p.category?.name || 'Unknown Zone'}\n`;
    msg += `*Native Text:* ${p.description}\n`;
    msg += `*Configured Baseline:* ${Number(p.price).toLocaleString('ru-RU')} UZS\n`;
    msg += `*Availability Matrix:* ${p.stockQuantity}\n`;
    msg += `*Gateway Node:* ${p.isActive ? '🟢 Active' : '🔴 Inactive'}\n`;
    msg += `*Media Render Pipeline:* ${p.imageUrl ? p.imageUrl.substring(0, 30) + '...' : 'Missing Media'}\n`;
    return msg;
}


// --- ENTRY NODE ---

menuEditorScene.enter(async (ctx) => {
    try {
        if (ctx.state.role !== 'admin') {
            await ctx.reply('⛔️ Safety Check: Access denied. Privileges isolated structurally.');
            return ctx.scene.leave();
        }
        resetAdminMenuSession(ctx);
        const structureKb = Markup.inlineKeyboard([
            [Markup.button.callback('📂 Browse Categories', 'admin_categories'), Markup.button.callback('🍽 Browse Products', 'admin_products')],
            [Markup.button.callback('➕ Append Category', 'admin_add_category'), Markup.button.callback('➕ Deploy Product', 'admin_add_product')],
            [Markup.button.callback('🔎 Initiate Search Scan', 'admin_search_product')],
            [Markup.button.callback('⬅️ Drop Console Connections', 'admin_menu_back')]
        ]);
        await ctx.replyWithMarkdown('🛠 *Administrator UI Engineering Module*\nDirect an operation natively:', structureKb);
    } catch (e) { console.error('Menu Editor genesis crash:', e); }
});


// --- MAIN NAVIGATION ROUTES ---

menuEditorScene.action('admin_menu_back', async ctx => {
    resetAdminMenuSession(ctx);
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(()=>{});
    await ctx.scene.leave();
});

menuEditorScene.action('admin_menu_main', async ctx => {
    resetAdminMenuSession(ctx);
    await ctx.answerCbQuery();
    const structureKb = Markup.inlineKeyboard([
        [Markup.button.callback('📂 Browse Categories', 'admin_categories'), Markup.button.callback('🍽 Browse Products', 'admin_products')],
        [Markup.button.callback('➕ Append Category', 'admin_add_category'), Markup.button.callback('➕ Deploy Product', 'admin_add_product')],
        [Markup.button.callback('🔎 Initiate Search Scan', 'admin_search_product')],
        [Markup.button.callback('⬅️ Drop Console Connections', 'admin_menu_back')]
    ]);
    await ctx.editMessageText('🛠 *Administrator UI Engineering Module*\nDirect an operation natively:', { parse_mode: 'Markdown', reply_markup: structureKb.reply_markup }).catch(()=>{});
});


// --- CATEGORIES EXECUTION LAYER ---

menuEditorScene.action('admin_categories', async ctx => {
    resetAdminMenuSession(ctx);
    await ctx.answerCbQuery();
    
    const fetchedCategories = await adminMenuService.getCategoriesWithCounts();
    const parseOut = formatCategoryList(fetchedCategories);
    
    let subKeyboard = [];
    fetchedCategories.forEach(c => {
        subKeyboard.push([Markup.button.callback(`📁 ${c.name}`, `admin_category_${c.id}`)]);
    });
    subKeyboard.push([Markup.button.callback('➕ Form New Category Layer', 'admin_add_category')]);
    subKeyboard.push([Markup.button.callback('⬅️ Revert to Console root', 'admin_menu_main')]);
    
    await ctx.editMessageText(parseOut, { parse_mode: 'Markdown', reply_markup: Markup.inlineKeyboard(subKeyboard).reply_markup }).catch((e)=>console.error(e));
});

menuEditorScene.action(/admin_category_(\d+)/, async ctx => {
    resetAdminMenuSession(ctx);
    await ctx.answerCbQuery();
    const trackId = parseInt(ctx.match[1], 10);
    const targetCat = await adminMenuService.getCategoryById(trackId);
    
    if(!targetCat) return ctx.answerCbQuery('Category metadata corrupted.', {show_alert:true});
    
    let dataDump = `📂 *Detailed Layer Operations*\n\n`;
    dataDump += `Database UUID: ${targetCat.id}\n`;
    dataDump += `Structural Tag: ${targetCat.name}\n`;
    dataDump += `Linear Order Metric: ${targetCat.sortOrder}\n`;
    dataDump += `Nested Children Present: ${targetCat._count?.products || 0}\n`;
    
    const gridOut = Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Rename Node', `admin_category_rename_${trackId}`), Markup.button.callback('🔢 Override Order Value', `admin_category_sort_${trackId}`)],
        [Markup.button.callback('🗑 Drop Record Safely', `admin_category_delete_${trackId}`)],
        [Markup.button.callback('⬅️ Egress up to Categories', 'admin_categories')]
    ]);
    
    await ctx.editMessageText(dataDump, { parse_mode: 'Markdown', reply_markup: gridOut.reply_markup }).catch(()=>{});
});

menuEditorScene.action(/admin_category_rename_(\d+)/, async ctx => {
    await ctx.answerCbQuery();
    ctx.session.adminMenuStep = 'rename_category';
    ctx.session.editingCategoryId = parseInt(ctx.match[1], 10);
    await ctx.reply('Input the fresh identifier string for this target:');
});
menuEditorScene.action(/admin_category_sort_(\d+)/, async ctx => {
    await ctx.answerCbQuery();
    ctx.session.adminMenuStep = 'change_category_sort';
    ctx.session.editingCategoryId = parseInt(ctx.match[1], 10);
    await ctx.reply('Send exact integer value mapping linear sort indexes (ex. 7):');
});
menuEditorScene.action(/admin_category_delete_(\d+)/, async ctx => {
    await ctx.answerCbQuery();
    const tarId = parseInt(ctx.match[1], 10);
    const tarCheck = await adminMenuService.getCategoryById(tarId);
    
    if (tarCheck._count?.products > 0) {
        return ctx.reply('⚠️ Architectural Block: Cannot delete category with existing native products nested inherently! Move isolated entities first.');
    }
    
    await adminMenuService.deleteCategory(tarId);
    await ctx.reply(`🗑 Category removed permanently without structural regressions.`);
    resetAdminMenuSession(ctx);
});

// Category Appender
menuEditorScene.action('admin_add_category', async ctx => {
    await ctx.answerCbQuery();
    ctx.session.adminMenuStep = 'add_category_name';
    await ctx.reply('Provide standard name tagging for this new directory layer:');
});


// --- PRODUCTS ROUTING LAYER ---

menuEditorScene.action('admin_products', async ctx => {
    resetAdminMenuSession(ctx);
    await ctx.answerCbQuery();
    
    const latestItems = await adminMenuService.getLatestProducts(20);
    const textualDump = formatProductList(latestItems);
    
    let logicalKeyboard = [];
    latestItems.forEach(p => {
        logicalKeyboard.push([Markup.button.callback(`🍽 ${p.name}`, `admin_product_${p.id}`)]);
    });
    logicalKeyboard.push([Markup.button.callback('➕ Scaffold New Product', 'admin_add_product'), Markup.button.callback('🔎 Deep Search Parameter', 'admin_search_product')]);
    logicalKeyboard.push([Markup.button.callback('⬅️ Fallback Controller Base', 'admin_menu_main')]);
    
    await ctx.editMessageText(textualDump, { parse_mode: 'Markdown', reply_markup: Markup.inlineKeyboard(logicalKeyboard).reply_markup }).catch(()=>{});
});

async function serveProductView(ctx, isolatedTarget) {
    const rawProd = await adminMenuService.getProductById(isolatedTarget);
    if (!rawProd) return;
    
    const infoDump = formatSingleProduct(rawProd);
    const gridMatrix = Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Edit Identifier', `admin_product_name_${isolatedTarget}`), Markup.button.callback('📝 Remap Text Structure', `admin_product_description_${isolatedTarget}`)],
        [Markup.button.callback('💰 Alter Financial Values', `admin_product_price_${isolatedTarget}`), Markup.button.callback('📦 Resync Physical Stock', `admin_product_stock_${isolatedTarget}`)],
        [Markup.button.callback('🖼 Embed Visual Nodes', `admin_product_image_${isolatedTarget}`), Markup.button.callback('📂 Map to New Parent', `admin_product_category_${isolatedTarget}`)],
        [Markup.button.callback(rawProd.isActive ? '⛔ Suspend Component' : '✅ Unleash Component', `admin_product_toggle_${isolatedTarget}`), Markup.button.callback('🗑 Soft Archive Module', `admin_product_delete_${isolatedTarget}`)],
        [Markup.button.callback('⬅️ Cancel Target Intercept', 'admin_products')]
    ]);
    
    await ctx.deleteMessage().catch(()=>{});
    
    // Safely mapping telegram native photos or raw HTML assets protecting bot exceptions smoothly 
    if (rawProd.imageUrl && rawProd.imageUrl.startsWith('http')) {
        await ctx.replyWithPhoto(rawProd.imageUrl, { caption: infoDump, parse_mode: 'Markdown', reply_markup: gridMatrix.reply_markup }).catch(() => {
            ctx.replyWithMarkdown(infoDump + "\n*(Structural rendering failure hitting HTTP endpoint)*", gridMatrix);
        });
    } else if (rawProd.imageUrl) {
        await ctx.replyWithPhoto(rawProd.imageUrl, { caption: infoDump, parse_mode: 'Markdown', reply_markup: gridMatrix.reply_markup }).catch(() => {
            ctx.replyWithMarkdown(infoDump + "\n*(Stored internal File_ID expired or invalid)*", gridMatrix);
        });
    } else {
        await ctx.replyWithMarkdown(infoDump, gridMatrix);
    }
}

menuEditorScene.action(/admin_product_(\d+)/, async ctx => {
    resetAdminMenuSession(ctx);
    await ctx.answerCbQuery();
    const activeRouteId = parseInt(ctx.match[1], 10);
    await serveProductView(ctx, activeRouteId);
});

// Mapping Dynamic String Field Operations
['name', 'description', 'price', 'stock', 'image'].forEach(fieldKey => {
    menuEditorScene.action(new RegExp(`admin_product_${fieldKey}_(\\d+)`), async ctx => {
        await ctx.answerCbQuery();
        ctx.session.adminMenuStep = `edit_product_${fieldKey}`;
        ctx.session.editingProductId = parseInt(ctx.match[1], 10);
        await ctx.reply(`System armed. Overwrite [${fieldKey}] providing the raw data replacement:`);
    });
});

menuEditorScene.action(/admin_product_toggle_(\d+)/, async ctx => {
    await ctx.answerCbQuery('Active boolean flipped natively.');
    const nodeTarget = parseInt(ctx.match[1], 10);
    await adminMenuService.toggleProductActive(nodeTarget);
    await serveProductView(ctx, nodeTarget);
});

menuEditorScene.action(/admin_product_delete_(\d+)/, async ctx => {
    await ctx.answerCbQuery('Isolation Sequence Completed.');
    const obliterateTarget = parseInt(ctx.match[1], 10);
    await adminMenuService.softDeleteProduct(obliterateTarget);
    await ctx.reply('⚠️ Safety engaged: The item was technically deactivated to safely preserve historical transaction layers locally.');
    await serveProductView(ctx, obliterateTarget);
});

menuEditorScene.action(/admin_product_category_(\d+)/, async ctx => {
    await ctx.answerCbQuery();
    const movingProd = parseInt(ctx.match[1], 10);
    const openCats = await adminMenuService.getCategoriesWithCounts();
    
    let remapGrid = [];
    openCats.forEach(c => {
        remapGrid.push([Markup.button.callback(`📁 Tie structurally to -> ${c.name}`, `admin_move_product_${movingProd}_${c.id}`)]);
    });
    remapGrid.push([Markup.button.callback('⬅️ Cancel Parent Substitution', `admin_product_${movingProd}`)]);
    
    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(remapGrid).reply_markup).catch(()=>{});
});

menuEditorScene.action(/admin_move_product_(\d+)_(\d+)/, async ctx => {
    await ctx.answerCbQuery('Relation migration executed flawlessly.');
    const productMovedId = parseInt(ctx.match[1], 10);
    const nextCatHomeId = parseInt(ctx.match[2], 10);
    await adminMenuService.updateProduct(productMovedId, { categoryId: nextCatHomeId });
    await serveProductView(ctx, productMovedId);
});

// Search Initiator
menuEditorScene.action('admin_search_product', async ctx => {
    await ctx.answerCbQuery();
    ctx.session.adminMenuStep = 'search_product';
    await ctx.reply('🔎 Fire a precise textual parameter (Search matches insensitive strings queries globally):');
});


// --- CREATION WIZARD ENGINE ---

menuEditorScene.action('admin_add_product', async ctx => {
    await ctx.answerCbQuery();
    ctx.session.adminMenuStep = 'add_product_name';
    ctx.session.productDraft = {};
    await ctx.reply('Sequence 1/6 Initiated. Provide the standard Product Title:');
});


// --- UNIVERSAL TEXTUAL ROUTER ---

menuEditorScene.on('text', async (ctx, next) => {
    const activeRouteVar = ctx.session.adminMenuStep;
    if (!activeRouteVar) return next();
    
    const captureStream = ctx.message.text.trim();
    if(captureStream.length === 0) return ctx.reply('Refused empty payload injection. Send valid strings.');
    
    try {
        // [Categories]
        if (activeRouteVar === 'rename_category') {
            await adminMenuService.updateCategory(ctx.session.editingCategoryId, { name: captureStream });
            await ctx.reply(`✅ Nomenclature overwritten: ${captureStream}`);
            resetAdminMenuSession(ctx);
        } else if (activeRouteVar === 'change_category_sort') {
            const rawConvert = parseInt(captureStream, 10);
            if(isNaN(rawConvert)) return ctx.reply('Rejection: Payload failed Type Constraints (Requires generic Int).');
            await adminMenuService.updateCategory(ctx.session.editingCategoryId, { sortOrder: rawConvert });
            await ctx.reply(`✅ System order aligned against block # ${rawConvert}`);
            resetAdminMenuSession(ctx);
        } else if (activeRouteVar === 'add_category_name') {
            ctx.session.tempCatName = captureStream;
            ctx.session.adminMenuStep = 'add_category_sort';
            await ctx.reply('Supply index baseline (e.g., Sequence Integer = 3):');
        } else if (activeRouteVar === 'add_category_sort') {
            const rawConvert = parseInt(captureStream, 10);
            if(isNaN(rawConvert)) return ctx.reply('Rejection: Int payload implicitly required.');
            await adminMenuService.createCategory({ name: ctx.session.tempCatName, sortOrder: rawConvert });
            await ctx.reply(`✅ Structural Hierarchy successfully compiled and natively embedded. Check logs.`);
            resetAdminMenuSession(ctx);
        }
        
        // [Editable Fields Router]
        else if (activeRouteVar.startsWith('edit_product_')) {
            const rootEntity = ctx.session.editingProductId;
            
            if (activeRouteVar === 'edit_product_name') {
                await adminMenuService.updateProduct(rootEntity, { name: captureStream });
            } else if (activeRouteVar === 'edit_product_description') {
                await adminMenuService.updateProduct(rootEntity, { description: captureStream });
            } else if (activeRouteVar === 'edit_product_price') {
                const decConvert = parseFloat(captureStream);
                if(isNaN(decConvert) || decConvert <= 0) return ctx.reply('Rejection: Needs logical Float/Int > 0 for UZS configurations.');
                await adminMenuService.updateProduct(rootEntity, { price: decConvert });
            } else if (activeRouteVar === 'edit_product_stock') {
                const stockVal = parseInt(captureStream, 10);
                if(isNaN(stockVal) || stockVal < 0) return ctx.reply('Rejection: Cannot map negative integer physics onto Real-World items natively.');
                await adminMenuService.updateProduct(rootEntity, { stockQuantity: stockVal });
            } else if (activeRouteVar === 'edit_product_image') {
                await adminMenuService.updateProduct(rootEntity, { imageUrl: captureStream });
            }
            
            await ctx.reply('✅ Directives fully synced locally.');
            const cacheJump = rootEntity;
            resetAdminMenuSession(ctx);
            await serveProductView(ctx, cacheJump);
        }
        
        // [Search Engine Returner]
        else if (activeRouteVar === 'search_product') {
            const dataHits = await adminMenuService.searchProducts(captureStream);
            if (dataHits.length === 0) {
                 await ctx.reply('Query yielded Zero (0) intersecting native nodes.');
                 resetAdminMenuSession(ctx);
                 return;
            }
            let mapKb = [];
            dataHits.forEach(p => mapKb.push([Markup.button.callback(`🔎 Scope Hit: ${p.name}`, `admin_product_${p.id}`)]));
            await ctx.reply(`Query Resolved Successfully (${dataHits.length} items logged):`, Markup.inlineKeyboard(mapKb));
            resetAdminMenuSession(ctx);
        }
        
        // [Wizard Component Creator]
        else if (activeRouteVar === 'add_product_name') {
            ctx.session.productDraft.name = captureStream;
            ctx.session.adminMenuStep = 'add_product_description';
            await ctx.reply('Sequence 2/6: Push internal item descriptor string:');
        } else if (activeRouteVar === 'add_product_description') {
            ctx.session.productDraft.description = captureStream;
            ctx.session.adminMenuStep = 'add_product_price';
            await ctx.reply('Sequence 3/6: Record baseline UZS Price Index:');
        } else if (activeRouteVar === 'add_product_price') {
            const castMath = parseFloat(captureStream);
            if(isNaN(castMath)) return ctx.reply('Numeric casting dropped, supply exact numbers.');
            ctx.session.productDraft.price = castMath;
            ctx.session.adminMenuStep = 'add_product_stock';
            await ctx.reply('Sequence 4/6: Inventory Level Counter:');
        } else if (activeRouteVar === 'add_product_stock') {
            const castStock = parseInt(captureStream, 10);
            if(isNaN(castStock)) return ctx.reply('Invalid counter payload, drop whole integer arrays actively.');
            ctx.session.productDraft.stockQuantity = castStock;
            
            const liveCats = await adminMenuService.getCategoriesWithCounts();
            let matrixCat = [];
            liveCats.forEach(c => matrixCat.push([Markup.button.callback(`📁 Append to: ${c.name}`, `draft_cat_${c.id}`)]));
            
            ctx.session.adminMenuStep = 'add_product_category'; 
            await ctx.reply('Sequence 5/6: Trigger the structural Parent Relation Block externally:', Markup.inlineKeyboard(matrixCat));
            
        } else if (activeRouteVar === 'add_product_image') {
            ctx.session.productDraft.imageUrl = captureStream;
            const finalNodeDrop = await adminMenuService.createProduct({...ctx.session.productDraft, isActive: true });
            
            await ctx.reply('✅ Construction cycle completely generated the node dynamically.');
            resetAdminMenuSession(ctx);
            await serveProductView(ctx, finalNodeDrop.id);
        }

    } catch (e) {
        console.error('Universal Catch Event fired preventing hard drops natively:', e);
        await ctx.reply('Critical runtime bounds violated. Purging task cache dynamically to safeguard DB queries.');
        resetAdminMenuSession(ctx);
    }
});

// Category callback hook strictly protecting the isolated creation wizard natively
menuEditorScene.action(/draft_cat_(\d+)/, async ctx => {
    if (ctx.session.adminMenuStep !== 'add_product_category') return ctx.answerCbQuery();
    await ctx.answerCbQuery();
    ctx.session.productDraft.categoryId = parseInt(ctx.match[1], 10);
    ctx.session.adminMenuStep = 'add_product_image';
    await ctx.reply('Sequence 6/6: Push external Source URL (or transmit native mobile Camera captures safely through Telegram locally!):');
});


// --- NATIVE IMAGE BUNDLER ---

menuEditorScene.on('photo', async (ctx, next) => {
    const localThread = ctx.session.adminMenuStep;
    if (!localThread) return next();
    
    // Unloads natively heavily compressed telegram pictures mapping exactly max-resolution formats.
    const rawPixArray = ctx.message.photo;
    const peakGradeFileId = rawPixArray[rawPixArray.length - 1].file_id; 
    
    if (localThread === 'edit_product_image') {
        const trgRef = ctx.session.editingProductId;
        await adminMenuService.updateProduct(trgRef, { imageUrl: peakGradeFileId });
        await ctx.reply('✅ Automatically cached and intercepted Telegram graphical files internally locally.');
        resetAdminMenuSession(ctx);
        await serveProductView(ctx, trgRef);
    } else if (localThread === 'add_product_image') {
        ctx.session.productDraft.imageUrl = peakGradeFileId;
        const newDbCore = await adminMenuService.createProduct({...ctx.session.productDraft, isActive: true });
        await ctx.reply('✅ Safely structured module and intrinsically mapped native physical File_Ids locally.');
        resetAdminMenuSession(ctx);
        await serveProductView(ctx, newDbCore.id);
    } else {
        return next();
    }
});

module.exports = menuEditorScene;
