"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = menuRoutes;
const menu_controller_1 = require("./menu.controller");
const schemas_1 = require("../../utils/schemas");
const shared_1 = require("@turon/shared");
async function menuRoutes(fastify) {
    // Public routes
    fastify.get('/categories', menu_controller_1.getCategories);
    fastify.get('/products', menu_controller_1.getProducts);
    fastify.get('/products/:id', {
        schema: { params: schemas_1.IdParamSchema }
    }, menu_controller_1.getProductById);
    // Admin and store management routes
    fastify.register(async (admin) => {
        admin.addHook('preHandler', admin.authorize([shared_1.UserRoleEnum.ADMIN]));
        admin.post('/categories', {
            schema: { body: schemas_1.CategorySchema }
        }, menu_controller_1.handleCreateCategory);
        admin.post('/products', {
            schema: { body: schemas_1.MenuItemSchema }
        }, menu_controller_1.handleCreateProduct);
    });
}
//# sourceMappingURL=menu.routes.js.map