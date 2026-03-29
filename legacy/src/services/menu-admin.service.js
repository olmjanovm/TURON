const prisma = require('../database/client');

async function createCategory(data) {
    return await prisma.category.create({ data });
}

async function updateCategory(id, data) {
    return await prisma.category.update({
        where: { id: parseInt(id, 10) },
        data
    });
}

async function deleteCategory(id) {
    // Safety handled natively outside this call but strict scoping is good
    return await prisma.category.delete({
        where: { id: parseInt(id, 10) }
    });
}

async function getCategoriesWithCounts() {
    return await prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
            _count: {
                select: { products: true }
            }
        }
    });
}

async function getCategoryById(id) {
    return await prisma.category.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
            _count: {
                select: { products: true }
            }
        }
    });
}

async function getLatestProducts(take = 20) {
    return await prisma.product.findMany({
        orderBy: { id: 'desc' },
        take,
        include: { category: true }
    });
}

async function createProduct(data) {
    return await prisma.product.create({ data });
}

async function updateProduct(id, data) {
    return await prisma.product.update({
        where: { id: parseInt(id, 10) },
        data
    });
}

async function getProductById(id) {
    return await prisma.product.findUnique({
        where: { id: parseInt(id, 10) },
        include: { category: true }
    });
}

async function searchProducts(query) {
    return await prisma.product.findMany({
        where: {
            name: {
                contains: query,
                mode: 'insensitive'
            }
        },
        take: 10,
        include: { category: true }
    });
}

async function toggleProductActive(id) {
    const p = await getProductById(id);
    if (!p) return null;
    return await prisma.product.update({
        where: { id: parseInt(id, 10) },
        data: { isActive: !p.isActive }
    });
}

async function softDeleteProduct(id) {
    // We enforce logical isolation avoiding breaking existing OrderItem relationships structurally.
    return await prisma.product.update({
        where: { id: parseInt(id, 10) },
        data: { isActive: false }
    });
}

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesWithCounts,
    getCategoryById,
    getLatestProducts,
    createProduct,
    updateProduct,
    getProductById,
    searchProducts,
    toggleProductActive,
    softDeleteProduct
};
