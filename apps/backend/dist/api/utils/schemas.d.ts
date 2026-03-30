import { z } from 'zod';
import { OrderStatusEnum, PaymentMethodEnum, PromoDiscountTypeEnum, DeliveryStageEnum } from '@turon/shared';
export declare const UuidSchema: z.ZodString;
export declare const IdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const TelegramAuthSchema: z.ZodObject<{
    initData: z.ZodString;
}, z.core.$strip>;
export declare const CategorySchema: z.ZodObject<{
    nameUz: z.ZodString;
    nameRu: z.ZodString;
    nameEn: z.ZodString;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const MenuItemSchema: z.ZodObject<{
    categoryId: z.ZodString;
    nameUz: z.ZodString;
    nameRu: z.ZodString;
    nameEn: z.ZodString;
    price: z.ZodNumber;
    stockQuantity: z.ZodNumber;
}, z.core.$strip>;
export declare const AddressSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
}, z.core.$strip>;
export declare const CreateOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        menuItemId: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
    deliveryAddressId: z.ZodString;
    paymentMethod: z.ZodEnum<typeof PaymentMethodEnum>;
    promoCode: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<typeof OrderStatusEnum>;
}, z.core.$strip>;
export declare const UpdateDeliveryStageSchema: z.ZodObject<{
    stage: z.ZodEnum<typeof DeliveryStageEnum>;
}, z.core.$strip>;
export declare const PromoCodeSchema: z.ZodObject<{
    code: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    discountType: z.ZodEnum<typeof PromoDiscountTypeEnum>;
    discountValue: z.ZodNumber;
    minOrderValue: z.ZodDefault<z.ZodNumber>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    usageLimit: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const ValidatePromoSchema: z.ZodObject<{
    code: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map