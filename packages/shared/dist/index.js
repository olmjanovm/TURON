export var UserRoleEnum;
(function (UserRoleEnum) {
    UserRoleEnum["CUSTOMER"] = "CUSTOMER";
    UserRoleEnum["ADMIN"] = "ADMIN";
    UserRoleEnum["COURIER"] = "COURIER";
})(UserRoleEnum || (UserRoleEnum = {}));
export var LanguageEnum;
(function (LanguageEnum) {
    LanguageEnum["UZ"] = "UZ";
    LanguageEnum["RU"] = "RU";
    LanguageEnum["EN"] = "EN";
})(LanguageEnum || (LanguageEnum = {}));
export var OrderStatusEnum;
(function (OrderStatusEnum) {
    OrderStatusEnum["PENDING"] = "PENDING";
    OrderStatusEnum["PREPARING"] = "PREPARING";
    OrderStatusEnum["READY_FOR_PICKUP"] = "READY_FOR_PICKUP";
    OrderStatusEnum["DELIVERING"] = "DELIVERING";
    OrderStatusEnum["DELIVERED"] = "DELIVERED";
    OrderStatusEnum["CANCELLED"] = "CANCELLED";
})(OrderStatusEnum || (OrderStatusEnum = {}));
export var PaymentMethodEnum;
(function (PaymentMethodEnum) {
    PaymentMethodEnum["CASH"] = "CASH";
    PaymentMethodEnum["MANUAL_TRANSFER"] = "MANUAL_TRANSFER";
    PaymentMethodEnum["EXTERNAL_PAYMENT"] = "EXTERNAL_PAYMENT";
})(PaymentMethodEnum || (PaymentMethodEnum = {}));
export var PaymentStatusEnum;
(function (PaymentStatusEnum) {
    PaymentStatusEnum["PENDING"] = "PENDING";
    PaymentStatusEnum["COMPLETED"] = "COMPLETED";
    PaymentStatusEnum["FAILED"] = "FAILED";
    PaymentStatusEnum["CANCELLED"] = "CANCELLED";
})(PaymentStatusEnum || (PaymentStatusEnum = {}));
export var PromoDiscountTypeEnum;
(function (PromoDiscountTypeEnum) {
    PromoDiscountTypeEnum["PERCENTAGE"] = "PERCENTAGE";
    PromoDiscountTypeEnum["FIXED_AMOUNT"] = "FIXED_AMOUNT";
})(PromoDiscountTypeEnum || (PromoDiscountTypeEnum = {}));
export var NotificationTypeEnum;
(function (NotificationTypeEnum) {
    NotificationTypeEnum["INFO"] = "INFO";
    NotificationTypeEnum["SUCCESS"] = "SUCCESS";
    NotificationTypeEnum["WARNING"] = "WARNING";
    NotificationTypeEnum["ERROR"] = "ERROR";
    NotificationTypeEnum["ORDER_STATUS_UPDATE"] = "ORDER_STATUS_UPDATE";
    NotificationTypeEnum["PROMO_CAMPAIGN"] = "PROMO_CAMPAIGN";
    NotificationTypeEnum["ADMIN_NOTICE"] = "ADMIN_NOTICE";
})(NotificationTypeEnum || (NotificationTypeEnum = {}));
export var AppEventEnum;
(function (AppEventEnum) {
    AppEventEnum["ORDER_CREATED"] = "ORDER_CREATED";
    AppEventEnum["ORDER_CONFIRMED"] = "ORDER_CONFIRMED";
    AppEventEnum["ORDER_PREPARING"] = "ORDER_PREPARING";
    AppEventEnum["ORDER_READY_FOR_PICKUP"] = "ORDER_READY_FOR_PICKUP";
    AppEventEnum["ORDER_PICKED_UP"] = "ORDER_PICKED_UP";
    AppEventEnum["ORDER_DELIVERING"] = "ORDER_DELIVERING";
    AppEventEnum["ORDER_DELIVERED"] = "ORDER_DELIVERED";
    AppEventEnum["ORDER_CANCELLED"] = "ORDER_CANCELLED";
    AppEventEnum["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    AppEventEnum["PAYMENT_VERIFIED"] = "PAYMENT_VERIFIED";
    AppEventEnum["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    AppEventEnum["COURIER_ASSIGNED"] = "COURIER_ASSIGNED";
    AppEventEnum["COURIER_UNASSIGNED"] = "COURIER_UNASSIGNED";
    AppEventEnum["PROMO_CREATED"] = "PROMO_CREATED";
    AppEventEnum["PROMO_EXPIRED"] = "PROMO_EXPIRED";
})(AppEventEnum || (AppEventEnum = {}));
export var CourierAssignmentStatusEnum;
(function (CourierAssignmentStatusEnum) {
    CourierAssignmentStatusEnum["ASSIGNED"] = "ASSIGNED";
    CourierAssignmentStatusEnum["REJECTED"] = "REJECTED";
    CourierAssignmentStatusEnum["COMPLETED"] = "COMPLETED";
    CourierAssignmentStatusEnum["CANCELLED"] = "CANCELLED";
})(CourierAssignmentStatusEnum || (CourierAssignmentStatusEnum = {}));
export var DeliveryStageEnum;
(function (DeliveryStageEnum) {
    DeliveryStageEnum["IDLE"] = "IDLE";
    DeliveryStageEnum["GOING_TO_RESTAURANT"] = "GOING_TO_RESTAURANT";
    DeliveryStageEnum["ARRIVED_AT_RESTAURANT"] = "ARRIVED_AT_RESTAURANT";
    DeliveryStageEnum["PICKED_UP"] = "PICKED_UP";
    DeliveryStageEnum["DELIVERING"] = "DELIVERING";
    DeliveryStageEnum["ARRIVED_AT_DESTINATION"] = "ARRIVED_AT_DESTINATION";
    DeliveryStageEnum["DELIVERED"] = "DELIVERED";
})(DeliveryStageEnum || (DeliveryStageEnum = {}));
export var ProductAvailabilityEnum;
(function (ProductAvailabilityEnum) {
    ProductAvailabilityEnum["AVAILABLE"] = "AVAILABLE";
    ProductAvailabilityEnum["TEMPORARILY_UNAVAILABLE"] = "TEMPORARILY_UNAVAILABLE";
    ProductAvailabilityEnum["OUT_OF_STOCK"] = "OUT_OF_STOCK";
})(ProductAvailabilityEnum || (ProductAvailabilityEnum = {}));
export var ProductBadgeEnum;
(function (ProductBadgeEnum) {
    ProductBadgeEnum["NONE"] = "NONE";
    ProductBadgeEnum["NEW"] = "NEW";
    ProductBadgeEnum["POPULAR"] = "POPULAR";
    ProductBadgeEnum["DISCOUNT"] = "DISCOUNT";
})(ProductBadgeEnum || (ProductBadgeEnum = {}));
//# sourceMappingURL=index.js.map