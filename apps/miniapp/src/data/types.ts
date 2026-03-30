import { 
  OrderStatusEnum as OrderStatus, 
  PaymentMethodEnum as PaymentMethod, 
  PaymentStatusEnum as PaymentStatus, 
  DeliveryStageEnum as DeliveryStage,
  PromoDiscountTypeEnum as DiscountType
} from '@turon/shared';
import { Product } from './mockData';

export { OrderStatus, PaymentMethod, PaymentStatus, DeliveryStage, DiscountType };
export interface CartItem extends Product {
  quantity: number;
}

export interface Promo {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  minSubtotal?: number;
}

export interface Address {
  id: string;
  label: string; // e.g., 'Uy', 'Ish', 'Boshqa'
  addressText: string;
  latitude: number;
  longitude: number;
  note?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  promoCode?: string;
  note?: string;
  createdAt: string;
  orderStatus: OrderStatus;
  customerAddress?: Address;
  courierId?: string;
  courierName?: string;
  deliveryStage?: DeliveryStage;
  verificationStatus?: boolean;
  verifiedByAdmin?: string;
  verifiedAt?: string;
  paymentReference?: string;
  externalTransactionId?: string;
}

export interface PromoValidationResult {
  isValid: boolean;
  message: string;
  promo?: Promo;
}
