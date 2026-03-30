"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.getProducts = getProducts;
exports.getProductById = getProductById;
exports.handleCreateCategory = handleCreateCategory;
exports.handleCreateProduct = handleCreateProduct;
const client_1 = require("@prisma/client");
const audit_service_1 = require("../../../services/audit.service");
const prisma = new client_1.PrismaClient();
async function getCategories(request, reply) {
    const categories = await prisma.menuCategory.findMany({
        where: { isActive: true },
        include: { items: { include: { images: true } } },
        orderBy: { sortOrder: 'asc' }
    });
    return reply.send(categories);
}
async function getProducts(request, reply) {
    const products = await prisma.menuItem.findMany({
        where: { isActive: true },
        include: { images: true, category: true }
    });
    return reply.send(products);
}
async function getProductById(request, reply) {
    const product = await prisma.menuItem.findUnique({
        where: { id: request.params.id },
        include: { images: true, category: true }
    });
    if (!product)
        return reply.status(404).send({ error: 'Maxsulot topilmadi' });
    return reply.send(product);
}
async function handleCreateCategory(request, reply) {
    const user = request.user;
    const data = request.body;
    const category = await prisma.menuCategory.create({
        data: {
            nameUz: data.nameUz,
            nameRu: data.nameRu,
            nameEn: data.nameEn,
            sortOrder: data.sortOrder || 0
        }
    });
    await audit_service_1.AuditService.record({
        userId: user.id,
        action: 'CREATE_CATEGORY',
        entity: 'MenuCategory',
        entityId: category.id,
        newValue: category
    });
    return reply.status(201).send(category);
}
async function handleCreateProduct(request, reply) {
    const user = request.user;
    const data = request.body;
    const product = await prisma.menuItem.create({
        data: {
            categoryId: data.categoryId,
            nameUz: data.nameUz,
            nameRu: data.nameRu,
            nameEn: data.nameEn,
            price: data.price,
            stockQuantity: data.stockQuantity || 0
        }
    });
    await audit_service_1.AuditService.record({
        userId: user.id,
        action: 'CREATE_PRODUCT',
        entity: 'MenuItem',
        entityId: product.id,
        newValue: product
    });
    return reply.status(201).send(product);
}
//# sourceMappingURL=menu.controller.js.map