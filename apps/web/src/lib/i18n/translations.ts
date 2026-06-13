/**
 * Customer panel translations.
 * 3 tilda: uz-Latn (default), uz-Cyrl, ru.
 * Yangi key qo'shganda uchala obyektga ham qo'shing.
 */

export const LOCALES = ['uz', 'uz-Cyrl', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  'uz':      { label: "O'zbekcha",   flag: '🇺🇿' },
  'uz-Cyrl': { label: 'Ўзбекча',     flag: '🇺🇿' },
  'ru':      { label: 'Русский',     flag: '🇷🇺' },
};

type Dict = Record<string, string>;
type TranslationKey = keyof typeof TRANSLATIONS.uz;

export const TRANSLATIONS = {
  uz: {
    // common
    'common.back': 'Orqaga',
    'common.cancel': 'Bekor qilish',
    'common.save': 'Saqlash',
    'common.delete': "O'chirish",
    'common.edit': 'Tahrirlash',
    'common.add': "Qo'shish",
    'common.confirm': 'Tasdiqlash',
    'common.continue': 'Davom etish',
    'common.loading': 'Yuklanmoqda...',
    'common.error': 'Xatolik',
    'common.retry': 'Qayta urinish',
    'common.search': 'Qidirish',
    'common.empty': "Ma'lumot yo'q",
    'common.required': 'Majburiy',
    'common.optional': 'Ixtiyoriy',
    'common.address': 'Manzil',
    'common.phone': 'Telefon',
    'common.name': 'Ism',
    'common.note': 'Izoh',
    'common.currency': "so'm",
    'common.minutes': 'daq',
    'common.km': 'km',

    // nav
    'nav.home': 'Bosh',
    'nav.search': 'Qidiruv',
    'nav.orders': 'Buyurtmalar',
    'nav.profile': 'Profil',
    'nav.cart': 'Savat',
    'nav.favorites': 'Sevimli',

    // home
    'home.delivery_to': 'Yetkazib berish',
    'home.choose_address': 'Manzilni tanlang',
    'home.categories.all': 'Hammasi',
    'home.section.new': 'Yangi taomlar',
    'home.section.popular': 'Ommabop',
    'home.empty.no_products': "Bu bo'limda mahsulot yo'q",

    // product
    'product.add_to_cart': "Savatga qo'shish",
    'product.in_cart': 'Savatda',
    'product.description': 'Tavsif',
    'product.similar': "O'xshash taomlar",
    'product.out_of_stock': 'Tugagan',
    'product.new': 'Yangi',
    'product.popular': 'Ommabop',
    'product.discount': 'Chegirma',
    'product.quantity': 'Miqdor',

    // cart
    'cart.title': 'Savat',
    'cart.empty.title': 'Savat bo\'sh',
    'cart.empty.desc': 'Menyudan tanlang va savatga qo\'shing',
    'cart.empty.cta': 'Menyu',
    'cart.subtotal': 'Mahsulotlar',
    'cart.delivery_fee': 'Yetkazib berish',
    'cart.discount': 'Chegirma',
    'cart.total': 'Jami',
    'cart.promo.placeholder': 'Promo kod',
    'cart.promo.apply': "Qo'llash",
    'cart.promo.applied': 'Qo\'llandi',
    'cart.promo.invalid': 'Promo kod noto\'g\'ri',
    'cart.checkout': 'Buyurtma berish',
    'cart.remove': 'Olib tashlash',
    'cart.delete_confirm': "Mahsulotni savatdan o'chirish?",

    // checkout
    'checkout.title': 'Buyurtma',
    'checkout.address.title': 'Yetkazib berish manzili',
    'checkout.address.choose': 'Manzilni tanlang',
    'checkout.address.new': "Yangi manzil qo'shish",
    'checkout.payment.title': "To'lov usuli",
    'checkout.payment.cash': 'Naqd (kuryer qabul qiladi)',
    'checkout.payment.transfer': "Bank o'tkazmasi",
    'checkout.note.title': "Buyurtmaga izoh",
    'checkout.note.placeholder': "Masalan: domofon ishlamaydi, ostonaga qoldiring...",
    'checkout.summary.title': 'Hisob-kitob',
    'checkout.submit': 'Buyurtmani tasdiqlash',
    'checkout.error.no_address': 'Manzilni tanlang',
    'checkout.error.no_payment': "To'lov usulini tanlang",

    // order success
    'success.title': 'Buyurtma qabul qilindi!',
    'success.desc': "Buyurtmangiz tayyorlanmoqda. Holatini buyurtmalar bo'limidan kuzating.",
    'success.cta.orders': 'Buyurtmalarim',
    'success.cta.home': 'Bosh sahifa',

    // orders
    'orders.title': 'Buyurtmalarim',
    'orders.empty.title': "Hali buyurtma yo'q",
    'orders.empty.desc': "Birinchi buyurtmangizni bering",
    'orders.empty.cta': 'Menyu',
    'orders.status.PENDING': 'Kutilmoqda',
    'orders.status.PREPARING': 'Tayyorlanmoqda',
    'orders.status.READY_FOR_PICKUP': 'Olib chiqishga tayyor',
    'orders.status.DELIVERING': 'Yetkazilmoqda',
    'orders.status.DELIVERED': 'Yetkazildi',
    'orders.status.CANCELLED': 'Bekor qilindi',
    'orders.detail.items': 'Buyurtma',
    'orders.detail.address': 'Yetkazib berish',
    'orders.detail.payment': "To'lov",
    'orders.detail.courier': 'Kuryer',
    'orders.detail.cancel': 'Buyurtmani bekor qilish',
    'orders.detail.cancel_confirm': 'Buyurtmani bekor qilasizmi?',
    'orders.detail.track': 'Kuzatish',

    // address
    'address.title': 'Manzillarim',
    'address.new': 'Yangi manzil',
    'address.edit': 'Manzilni tahrirlash',
    'address.label': 'Nom (uy/ish)',
    'address.label.placeholder': "Masalan: Uy, Ish",
    'address.text': "To'liq manzil",
    'address.text.placeholder': "Ko'cha, uy, kvartira",
    'address.landmark': "Mo'ljal",
    'address.landmark.placeholder': "Masalan: TBC bank yonida",
    'address.default': 'Asosiy manzil',
    'address.empty.title': "Manzillar yo'q",
    'address.empty.desc': "Birinchi manzilingizni qo'shing",
    'address.delete_confirm': "Manzilni o'chirish?",
    'address.detect': "Hozirgi joylashuvni aniqlash",
    'address.detecting': 'Aniqlanmoqda...',
    'address.detect_error': "Joylashuvni aniqlab bo'lmadi",
    'checkout.confirm.title': 'Buyurtmani tasdiqlaysizmi?',
    'checkout.confirm.desc': "Buyurtma yuboriladi va bekor qilib bo'lmaydi",
    'checkout.confirm.yes': 'Ha, tasdiqlayman',
    'checkout.confirm.no': 'Bekor',

    // profile
    'profile.title': 'Profil',
    'profile.edit': 'Profilni tahrirlash',
    'profile.fullname': "To'liq ism",
    'profile.phone': 'Telefon raqami',
    'profile.language': 'Til',
    'profile.theme': 'Mavzu',
    'profile.theme.light': 'Yorug\'',
    'profile.theme.dark': 'Qorong\'i',
    'profile.theme.system': 'Tizim',
    'profile.addresses': 'Manzillarim',
    'profile.notifications': 'Bildirishnomalar',
    'profile.support': 'Yordam',
    'profile.about': 'Ilova haqida',

    // notifications
    'notifications.title': 'Bildirishnomalar',
    'notifications.empty.title': "Bildirishnoma yo'q",
    'notifications.empty.desc': 'Yangi xabar paydo bo\'lganda shu yerda ko\'rinadi',

    // search
    'search.placeholder': "Taom, kategoriya...",
    'search.empty.title': 'Hech narsa topilmadi',
    'search.empty.desc': "Boshqacha so'z bilan qidirib ko'ring",
    'search.recent': "So'nggi qidiruvlar",

    // favorites
    'favorites.title': 'Sevimlilar',
    'favorites.empty.title': "Sevimli yo'q",
    'favorites.empty.desc': "Yurakcha bosib sevimlilarga qo'shing",
  },

  'uz-Cyrl': {
    'common.back': 'Орқага', 'common.cancel': 'Бекор қилиш', 'common.save': 'Сақлаш', 'common.delete': 'Ўчириш', 'common.edit': 'Таҳрирлаш', 'common.add': 'Қўшиш', 'common.confirm': 'Тасдиқлаш', 'common.continue': 'Давом этиш', 'common.loading': 'Юкланмоқда...', 'common.error': 'Хатолик', 'common.retry': 'Қайта уриниш', 'common.search': 'Қидириш', 'common.empty': "Маълумот йўқ", 'common.required': 'Мажбурий', 'common.optional': 'Ихтиёрий', 'common.address': 'Манзил', 'common.phone': 'Телефон', 'common.name': 'Исм', 'common.note': 'Изоҳ', 'common.currency': 'сўм', 'common.minutes': 'дақ', 'common.km': 'км',
    'nav.home': 'Бош', 'nav.search': 'Қидирув', 'nav.orders': 'Буюртмалар', 'nav.profile': 'Профил', 'nav.cart': 'Сават', 'nav.favorites': 'Севимли',
    'home.delivery_to': 'Етказиб бериш', 'home.choose_address': 'Манзилни танланг', 'home.categories.all': 'Ҳаммаси', 'home.section.new': 'Янги таомлар', 'home.section.popular': 'Оммабоп', 'home.empty.no_products': "Бу бўлимда маҳсулот йўқ",
    'product.add_to_cart': 'Саватга қўшиш', 'product.in_cart': 'Саватда', 'product.description': 'Тавсиф', 'product.similar': 'Ўхшаш таомлар', 'product.out_of_stock': 'Тугаган', 'product.new': 'Янги', 'product.popular': 'Оммабоп', 'product.discount': 'Чегирма', 'product.quantity': 'Миқдор',
    'cart.title': 'Сават', 'cart.empty.title': "Сават бўш", 'cart.empty.desc': "Менюдан танланг ва саватга қўшинг", 'cart.empty.cta': 'Меню', 'cart.subtotal': 'Маҳсулотлар', 'cart.delivery_fee': 'Етказиб бериш', 'cart.discount': 'Чегирма', 'cart.total': 'Жами', 'cart.promo.placeholder': 'Промо код', 'cart.promo.apply': 'Қўллаш', 'cart.promo.applied': 'Қўлланди', 'cart.promo.invalid': "Промо код нотўғри", 'cart.checkout': 'Буюртма бериш', 'cart.remove': 'Олиб ташлаш', 'cart.delete_confirm': "Маҳсулотни саватдан ўчириш?",
    'checkout.title': 'Буюртма', 'checkout.address.title': 'Етказиб бериш манзили', 'checkout.address.choose': 'Манзилни танланг', 'checkout.address.new': "Янги манзил қўшиш", 'checkout.payment.title': "Тўлов усули", 'checkout.payment.cash': 'Нақд (курьер қабул қилади)', 'checkout.payment.transfer': "Банк ўтказмаси", 'checkout.note.title': "Буюртмага изоҳ", 'checkout.note.placeholder': "Масалан: домофон ишламайди, остонага қолдиринг...", 'checkout.summary.title': 'Ҳисоб-китоб', 'checkout.submit': 'Буюртмани тасдиқлаш', 'checkout.error.no_address': 'Манзилни танланг', 'checkout.error.no_payment': "Тўлов усулини танланг",
    'success.title': 'Буюртма қабул қилинди!', 'success.desc': "Буюртмангиз тайёрланмоқда. Ҳолатини буюртмалар бўлимидан кузатинг.", 'success.cta.orders': 'Буюртмаларим', 'success.cta.home': 'Бош саҳифа',
    'orders.title': 'Буюртмаларим', 'orders.empty.title': "Ҳали буюртма йўқ", 'orders.empty.desc': "Биринчи буюртмангизни беринг", 'orders.empty.cta': 'Меню', 'orders.status.PENDING': 'Кутилмоқда', 'orders.status.PREPARING': 'Тайёрланмоқда', 'orders.status.READY_FOR_PICKUP': 'Олиб чиқишга тайёр', 'orders.status.DELIVERING': 'Етказилмоқда', 'orders.status.DELIVERED': 'Етказилди', 'orders.status.CANCELLED': 'Бекор қилинди', 'orders.detail.items': 'Буюртма', 'orders.detail.address': 'Етказиб бериш', 'orders.detail.payment': "Тўлов", 'orders.detail.courier': 'Курьер', 'orders.detail.cancel': 'Буюртмани бекор қилиш', 'orders.detail.cancel_confirm': 'Буюртмани бекор қиласизми?', 'orders.detail.track': 'Кузатиш',
    'address.title': 'Манзилларим', 'address.new': 'Янги манзил', 'address.edit': 'Манзилни таҳрирлаш', 'address.label': 'Ном (уй/иш)', 'address.label.placeholder': "Масалан: Уй, Иш", 'address.text': "Тўлиқ манзил", 'address.text.placeholder': "Кўча, уй, квартира", 'address.landmark': "Мўлжал", 'address.landmark.placeholder': "Масалан: TBC bank ёнида", 'address.default': 'Асосий манзил', 'address.empty.title': "Манзиллар йўқ", 'address.empty.desc': "Биринчи манзилингизни қўшинг", 'address.delete_confirm': "Манзилни ўчириш?", 'address.detect': "Ҳозирги жойлашувни аниқлаш", 'address.detecting': 'Аниқланмоқда...', 'address.detect_error': "Жойлашувни аниқлаб бўлмади", 'checkout.confirm.title': 'Буюртмани тасдиқлайсизми?', 'checkout.confirm.desc': "Буюртма юборилади ва бекор қилиб бўлмайди", 'checkout.confirm.yes': 'Ҳа, тасдиқлайман', 'checkout.confirm.no': 'Бекор',
    'profile.title': 'Профил', 'profile.edit': 'Профилни таҳрирлаш', 'profile.fullname': "Тўлиқ исм", 'profile.phone': 'Телефон рақами', 'profile.language': 'Тил', 'profile.theme': 'Мавзу', 'profile.theme.light': 'Ёруғ', 'profile.theme.dark': 'Қоронғи', 'profile.theme.system': 'Тизим', 'profile.addresses': 'Манзилларим', 'profile.notifications': 'Билдиришномалар', 'profile.support': 'Ёрдам', 'profile.about': 'Илова ҳақида',
    'notifications.title': 'Билдиришномалар', 'notifications.empty.title': "Билдиришнома йўқ", 'notifications.empty.desc': "Янги хабар пайдо бўлганда шу ерда кўринади",
    'search.placeholder': "Таом, категория...", 'search.empty.title': 'Ҳеч нарса топилмади', 'search.empty.desc': "Бошқача сўз билан қидириб кўринг", 'search.recent': "Сўнгги қидирувлар",
    'favorites.title': 'Севимлилар', 'favorites.empty.title': "Севимли йўқ", 'favorites.empty.desc': "Юракча босиб севимлиларга қўшинг",
  } as Dict,

  'ru': {
    'common.back': 'Назад', 'common.cancel': 'Отмена', 'common.save': 'Сохранить', 'common.delete': 'Удалить', 'common.edit': 'Редактировать', 'common.add': 'Добавить', 'common.confirm': 'Подтвердить', 'common.continue': 'Продолжить', 'common.loading': 'Загрузка...', 'common.error': 'Ошибка', 'common.retry': 'Повторить', 'common.search': 'Поиск', 'common.empty': 'Нет данных', 'common.required': 'Обязательно', 'common.optional': 'Необязательно', 'common.address': 'Адрес', 'common.phone': 'Телефон', 'common.name': 'Имя', 'common.note': 'Комментарий', 'common.currency': 'сум', 'common.minutes': 'мин', 'common.km': 'км',
    'nav.home': 'Главная', 'nav.search': 'Поиск', 'nav.orders': 'Заказы', 'nav.profile': 'Профиль', 'nav.cart': 'Корзина', 'nav.favorites': 'Избранное',
    'home.delivery_to': 'Доставка', 'home.choose_address': 'Выберите адрес', 'home.categories.all': 'Все', 'home.section.new': 'Новые блюда', 'home.section.popular': 'Популярные', 'home.empty.no_products': 'В этом разделе нет блюд',
    'product.add_to_cart': 'В корзину', 'product.in_cart': 'В корзине', 'product.description': 'Описание', 'product.similar': 'Похожие блюда', 'product.out_of_stock': 'Нет в наличии', 'product.new': 'Новое', 'product.popular': 'Хит', 'product.discount': 'Скидка', 'product.quantity': 'Количество',
    'cart.title': 'Корзина', 'cart.empty.title': 'Корзина пуста', 'cart.empty.desc': 'Выберите блюда из меню', 'cart.empty.cta': 'Меню', 'cart.subtotal': 'Товары', 'cart.delivery_fee': 'Доставка', 'cart.discount': 'Скидка', 'cart.total': 'Итого', 'cart.promo.placeholder': 'Промокод', 'cart.promo.apply': 'Применить', 'cart.promo.applied': 'Применён', 'cart.promo.invalid': 'Неверный промокод', 'cart.checkout': 'Оформить заказ', 'cart.remove': 'Убрать', 'cart.delete_confirm': 'Удалить блюдо из корзины?',
    'checkout.title': 'Оформление', 'checkout.address.title': 'Адрес доставки', 'checkout.address.choose': 'Выберите адрес', 'checkout.address.new': 'Добавить адрес', 'checkout.payment.title': 'Способ оплаты', 'checkout.payment.cash': 'Наличные (курьеру)', 'checkout.payment.transfer': 'Банковский перевод', 'checkout.note.title': 'Комментарий к заказу', 'checkout.note.placeholder': 'Например: не работает домофон, оставьте у двери...', 'checkout.summary.title': 'Сумма', 'checkout.submit': 'Подтвердить заказ', 'checkout.error.no_address': 'Выберите адрес', 'checkout.error.no_payment': 'Выберите способ оплаты',
    'success.title': 'Заказ принят!', 'success.desc': 'Ваш заказ готовится. Следите за статусом в разделе Заказы.', 'success.cta.orders': 'Мои заказы', 'success.cta.home': 'На главную',
    'orders.title': 'Мои заказы', 'orders.empty.title': 'Заказов пока нет', 'orders.empty.desc': 'Сделайте первый заказ', 'orders.empty.cta': 'Меню', 'orders.status.PENDING': 'В ожидании', 'orders.status.PREPARING': 'Готовится', 'orders.status.READY_FOR_PICKUP': 'Готов к выдаче', 'orders.status.DELIVERING': 'В пути', 'orders.status.DELIVERED': 'Доставлен', 'orders.status.CANCELLED': 'Отменён', 'orders.detail.items': 'Состав заказа', 'orders.detail.address': 'Доставка', 'orders.detail.payment': 'Оплата', 'orders.detail.courier': 'Курьер', 'orders.detail.cancel': 'Отменить заказ', 'orders.detail.cancel_confirm': 'Отменить заказ?', 'orders.detail.track': 'Отследить',
    'address.title': 'Мои адреса', 'address.new': 'Новый адрес', 'address.edit': 'Редактировать адрес', 'address.label': 'Название (дом/работа)', 'address.label.placeholder': 'Например: Дом, Работа', 'address.text': 'Полный адрес', 'address.text.placeholder': 'Улица, дом, квартира', 'address.landmark': 'Ориентир', 'address.landmark.placeholder': 'Например: рядом с TBC bank', 'address.default': 'Основной адрес', 'address.empty.title': 'Адресов нет', 'address.empty.desc': 'Добавьте первый адрес', 'address.delete_confirm': 'Удалить адрес?', 'address.detect': 'Определить мою геопозицию', 'address.detecting': 'Определяется...', 'address.detect_error': 'Не удалось определить местоположение', 'checkout.confirm.title': 'Подтвердить заказ?', 'checkout.confirm.desc': 'Заказ будет отправлен и его нельзя будет отменить', 'checkout.confirm.yes': 'Да, подтверждаю', 'checkout.confirm.no': 'Отмена',
    'profile.title': 'Профиль', 'profile.edit': 'Редактировать профиль', 'profile.fullname': 'Полное имя', 'profile.phone': 'Номер телефона', 'profile.language': 'Язык', 'profile.theme': 'Тема', 'profile.theme.light': 'Светлая', 'profile.theme.dark': 'Тёмная', 'profile.theme.system': 'Система', 'profile.addresses': 'Адреса', 'profile.notifications': 'Уведомления', 'profile.support': 'Поддержка', 'profile.about': 'О приложении',
    'notifications.title': 'Уведомления', 'notifications.empty.title': 'Нет уведомлений', 'notifications.empty.desc': 'Новые сообщения появятся здесь',
    'search.placeholder': 'Блюдо, категория...', 'search.empty.title': 'Ничего не найдено', 'search.empty.desc': 'Попробуйте другие слова', 'search.recent': 'Последние запросы',
    'favorites.title': 'Избранное', 'favorites.empty.title': 'Избранное пусто', 'favorites.empty.desc': 'Нажимайте сердечко, чтобы добавить',
  } as Dict,
} as const;

export type { TranslationKey };
