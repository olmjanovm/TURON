import { 
  OrderStatusEnum as OrderStatus, 
  PaymentMethodEnum as PaymentMethod, 
  PaymentStatusEnum as PaymentStatus, 
  DeliveryStageEnum as DeliveryStage,
  PromoDiscountTypeEnum as DiscountType
} from '@turon/shared';

export { OrderStatus, PaymentMethod, PaymentStatus, DeliveryStage, DiscountType };

export interface ProductSnapshot {
  id: string;
  menuItemId?: string | null;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isAvailable?: boolean;
}

export interface CartItem extends ProductSnapshot {
  quantity: number;
}

export interface AppliedPromo {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  discountAmount?: number;
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

export interface CourierTrackingLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmh?: number;
  remainingDistanceKm?: number;
  remainingEtaMinutes?: number;
  updatedAt: string;
}

export interface OrderTrackingState {
  isLive: boolean;
  lastEventAt: string;
  courierLocation?: CourierTrackingLocation;
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
  customerUserId?: string;
  customerName?: string;
  customerPhone?: string;
  pickupLat?: number;
  pickupLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  courierAssignmentStatus?: string;
  tracking?: OrderTrackingState;
}

export interface CourierOrderPreview {
  id: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  deliveryStage?: DeliveryStage;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  destinationAddress: string;
  createdAt: string;
  itemCount: number;
}

export interface AdminCourierOption {
  id: string;
  fullName: string;
  phoneNumber: string;
  activeAssignments: number;
}

export interface PromoValidationResult {
  isValid: boolean;
  message: string;
  discountAmount: number;
  promo?: AppliedPromo;
}

export interface SupportMessage {
  id: string;
  senderRole: 'CUSTOMER' | 'ADMIN' | 'COURIER';
  senderLabel: string;
  text: string;
  channel: 'MINI_APP' | 'TELEGRAM';
  createdAt: string;
}

export interface SupportThread {
  id: string;
  orderId?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages: SupportMessage[];
}
