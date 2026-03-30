"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatePromoSchema = exports.PromoCodeSchema = exports.UpdateDeliveryStageSchema = exports.UpdateOrderStatusSchema = exports.CreateOrderSchema = exports.AddressSchema = exports.MenuItemSchema = exports.CategorySchema = exports.TelegramAuthSchema = exports.IdParamSchema = exports.UuidSchema = void 0;
const zod_1 = require("zod");
const shared_1 = require("@turon/shared");
// Common Schemas
exports.UuidSchema = zod_1.z.string().uuid();
exports.IdParamSchema = zod_1.z.object({ id: exports.UuidSchema });
// Auth
exports.TelegramAuthSchema = zod_1.z.object({
    initData: zod_1.z.string().min(1),
});
// Menu
exports.CategorySchema = zod_1.z.object({
    nameUz: zod_1.z.string().min(2),
    nameRu: zod_1.z.string().min(2),
    nameEn: zod_1.z.string().min(2),
    sortOrder: zod_1.z.number().int().optional(),
});
exports.MenuItemSchema = zod_1.z.object({
    categoryId: exports.UuidSchema,
    nameUz: zod_1.z.string().min(2),
    nameRu: zod_1.z.string().min(2),
    nameEn: zod_1.z.string().min(2),
    price: zod_1.z.number().positive(),
    stockQuantity: zod_1.z.number().int().min(0),
});
// Addresses
exports.AddressSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    address: zod_1.z.string().min(5),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
});
// Orders
exports.CreateOrderSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        menuItemId: exports.UuidSchema,
        quantity: zod_1.z.number().int().positive(),
    })).min(1),
    deliveryAddressId: exports.UuidSchema,
    paymentMethod: zod_1.z.nativeEnum(shared_1.PaymentMethodEnum),
    promoCode: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
});
exports.UpdateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(shared_1.OrderStatusEnum),
});
exports.UpdateDeliveryStageSchema = zod_1.z.object({
    stage: zod_1.z.nativeEnum(shared_1.DeliveryStageEnum),
});
// Promos
exports.PromoCodeSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).transform(val => val.toUpperCase()),
    discountType: zod_1.z.nativeEnum(shared_1.PromoDiscountTypeEnum),
    discountValue: zod_1.z.number().positive(),
    minOrderValue: zod_1.z.number().min(0).default(0),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    usageLimit: zod_1.z.number().int().positive().optional(),
});
exports.ValidatePromoSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).transform(val => val.toUpperCase()),
});
//# sourceMappingURL=schemas.js.map