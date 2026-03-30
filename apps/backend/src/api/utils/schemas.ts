import { z } from 'zod';
import { 
  UserRoleEnum, 
  LanguageEnum, 
  OrderStatusEnum, 
  PaymentMethodEnum, 
  PromoDiscountTypeEnum, 
  DeliveryStageEnum 
} from '@turon/shared';

// Common Schemas
export const UuidSchema = z.string().uuid();
export const IdParamSchema = z.object({ id: UuidSchema });

// Auth
export const TelegramAuthSchema = z.object({
  initData: z.string().min(1),
});

// Menu
export const CategorySchema = z.object({
  nameUz: z.string().min(2),
  nameRu: z.string().min(2),
  nameEn: z.string().min(2),
  sortOrder: z.number().int().optional(),
});

export const MenuItemSchema = z.object({
  categoryId: UuidSchema,
  nameUz: z.string().min(2),
  nameRu: z.string().min(2),
  nameEn: z.string().min(2),
  price: z.number().positive(),
  stockQuantity: z.number().int().min(0),
});

// Addresses
export const AddressSchema = z.object({
  title: z.string().optional(),
  address: z.string().min(5),
  latitude: z.number(),
  longitude: z.number(),
});

// Orders
export const CreateOrderSchema = z.object({
  items: z.array(z.object({
    menuItemId: UuidSchema,
    quantity: z.number().int().positive(),
  })).min(1),
  deliveryAddressId: UuidSchema,
  paymentMethod: z.nativeEnum(PaymentMethodEnum),
  promoCode: z.string().optional(),
  note: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatusEnum),
});

export const UpdateDeliveryStageSchema = z.object({
  stage: z.nativeEnum(DeliveryStageEnum),
});

// Promos
export const PromoCodeSchema = z.object({
  code: z.string().min(3).transform(val => val.toUpperCase()),
  discountType: z.nativeEnum(PromoDiscountTypeEnum),
  discountValue: z.number().positive(),
  minOrderValue: z.number().min(0).default(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usageLimit: z.number().int().positive().optional(),
});

export const ValidatePromoSchema = z.object({
  code: z.string().min(1).transform(val => val.toUpperCase()),
});
