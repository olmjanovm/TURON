import { AppEventEnum, NotificationTypeEnum, UserRoleEnum } from '@turon/shared';
import { EventPayload } from './notificationTypes';

export interface Template {
  title: string;
  message: string;
  type: NotificationTypeEnum;
  roleTarget: UserRoleEnum;
}

export const getNotificationTemplate = (event: AppEventEnum, payload: EventPayload): Template[] => {
  const templates: Template[] = [];

  switch (event) {
    case AppEventEnum.ORDER_CREATED:
      // Customer confirmation
      templates.push({
        title: "Buyurtma qabul qilindi",
        message: `Buyurtmangiz #${payload.orderNumber} muvaffaqiyatli yaratildi. Tasdiqlanishini kuting.`,
        type: NotificationTypeEnum.SUCCESS,
        roleTarget: UserRoleEnum.CUSTOMER
      });
      // Admin notification
      templates.push({
        title: "Yangi buyurtma!",
        message: `Yangi buyurtma #${payload.orderNumber} kelib tushdi. Summa: ${payload.total?.toLocaleString()} so'm.`,
        type: NotificationTypeEnum.INFO,
        roleTarget: UserRoleEnum.ADMIN
      });
      break;

    case AppEventEnum.ORDER_CONFIRMED:
      templates.push({
        title: "Buyurtma tasdiqlandi",
        message: `Buyurtmangiz #${payload.orderNumber} admin tomonidan tasdiqlandi. Tez orada tayyor bo'ladi.`,
        type: NotificationTypeEnum.SUCCESS,
        roleTarget: UserRoleEnum.CUSTOMER
      });
      break;

    case AppEventEnum.PAYMENT_VERIFIED:
      templates.push({
        title: "To'lov tasdiqlandi",
        message: `Buyurtma #${payload.orderNumber} uchun to'lov qabul qilindi. Rahmat!`,
        type: NotificationTypeEnum.SUCCESS,
        roleTarget: UserRoleEnum.CUSTOMER
      });
      templates.push({
        title: "To'lov verifikatsiyasi",
        message: `Buyurtma #${payload.orderNumber} to'lovi muvaffaqiyatli verifikatsiya qilindi.`,
        type: NotificationTypeEnum.SUCCESS,
        roleTarget: UserRoleEnum.ADMIN
      });
      break;

    case AppEventEnum.PAYMENT_FAILED:
      templates.push({
        title: "To'lov rad etildi",
        message: `Buyurtma #${payload.orderNumber} to'lovi rad etildi. Iltimos, qaytadan urinib ko'ring yoki admin bilan bog'laning.`,
        type: NotificationTypeEnum.WARNING,
        roleTarget: UserRoleEnum.CUSTOMER
      });
      break;

    case AppEventEnum.COURIER_ASSIGNED:
      templates.push({
        title: "Kuryer tayinlandi",
        message: `Buyurtmangiz #${payload.orderNumber} kuryer ${payload.courierName} ga topshirildi.`,
        type: NotificationTypeEnum.INFO,
        roleTarget: UserRoleEnum.CUSTOMER
      });
      templates.push({
        title: "Yangi buyurtma tayinlandi",
        message: `Sizga yangi buyurtma #${payload.orderNumber} tayinlandi. Restoranga yetib borishingiz kutilmoqda.`,
        type: NotificationTypeEnum.INFO,
        roleTarget: UserRoleEnum.COURIER
      });
      break;

    case AppEventEnum.ORDER_PICKED_UP:
      templates.push({
        title: "Buyurtma yo'lda",
        message: `Kuryer buyurtmangiz #${payload.orderNumber}ni restorandan olib chiqdi. Kutib turing!`,
        type: NotificationTypeEnum.INFO,
        roleTarget: UserRoleEnum.CUSTOMER
      });
      break;

    case AppEventEnum.ORDER_DELIVERED:
      templates.push({
        title: "Yoqimli ishtaha!",
        message: `Buyurtmangiz #${payload.orderNumber} muvaffaqiyatli yetkazildi. Bizni tanlaganingiz uchun rahmat!`,
        type: NotificationTypeEnum.SUCCESS,
        roleTarget: UserRoleEnum.CUSTOMER
      });
      templates.push({
        title: "Muvaffaqiyatli yetkazish",
        message: `Buyurtma #${payload.orderNumber} kuryer tomonidan yetkazib berildi.`,
        type: NotificationTypeEnum.SUCCESS,
        roleTarget: UserRoleEnum.ADMIN
      });
      break;

    case AppEventEnum.ORDER_CANCELLED:
      templates.push({
        title: "Buyurtma bekor qilindi",
        message: `Buyurtmangiz #${payload.orderNumber} bekor qilindi. Sabab: ${payload.reason || 'Noma\'lum'}`,
        type: NotificationTypeEnum.ERROR,
        roleTarget: UserRoleEnum.CUSTOMER
      });
      break;

    default:
      break;
  }

  return templates;
};
