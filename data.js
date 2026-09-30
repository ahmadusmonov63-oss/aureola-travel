/**
 * data.js - Aureon Travel Turlar Ma'lumotlar Bazasi (v3.5 - Ko'p tilli: UZ, RU, EN)
 * 100% Haqiqiy O'zbekiston yodgorliklari fotosuratlari
 */

const DATA_VERSION = "6.0";

const UI_STRINGS = {
  uz: {
    brandSub: "Exclusive Tours & Concierge",
    navTours: "Barcha Turlar",
    navBook: "Bron Qilish",
    navMyBooking: "Buyurtma holati",
    myBookingTitle: "Buyurtma Holatini Tekshirish",
    myBookingDesc: "Buyurtma berganingizda berilgan ID (masalan: BK-123456) yoki telefon raqamingizni kiriting.",
    phBookingSearch: "Masalan: BK-123456 yoki +998901234567",
    btnCheckBooking: "Holatni Ko'rish",
    bookingNotFound: "Ushbu ma'lumotlar bo'yicha hech qanday buyurtma topilmadi. Raqamni to'g'ri kiritganingizni tekshiring.",
    statusPending: "Ko'rib chiqilmoqda",
    statusConfirmed: "Tasdiqlangan",
    statusCancelled: "Bekor qilingan",
    statusConfirmedDesc: "Sizning arizangiz ma'muriyat tomonidan tasdiqlandi. Konsyerjimiz va shaxsiy transportimiz belgilangan vaqtda xizmatingizga tayyor!",
    statusCancelledDesc: "Afsuski, ushbu buyurtma ma'muriyat tomonidan bekor qilindi.",
    statusPendingDesc: "Arizangiz qabul qilingan va operatorimiz tomonidan ko'rib chiqilmoqda. Tez orada tasdiq xabari yuboriladi.",
    conciergeService: "Konsyerj va Eksklyuziv Turlar",
    allFieldsRequired: "Barcha maydonlar majburiy",
    btnNewBooking: "Yangi bron",
    sumDate: "Sana:",
    sumStartTime: "Boshlanish vaqti:",
    sumPickup: "Olib ketish nuqtasi:",
    sumDuration: "Davomiyligi:",
    sumTravelers: "Sayohatchilar:",
    sumHotel: "Otel:",
    sumGuide: "Gid xizmati:",
    modalGallery: "Galereya:",
    priceFree: "0 so'm (bepul)",
    durSub1: "Kunduzgi ekskursiya (otelsiz)",
    durSub2: "1 kecha tunash bilan",
    durSub3: "2 kecha to'liq safar",
    durSub4: "3 kecha grand tur",
    dateNotSelected: "Belgilanmagan",
    dateSelected: "Tanlandi",
    badgeCompleted: "To'ldirildi",
    badgeRequired: "Majburiy",
    nightsLabel: "kecha",
    daysLabel: "kun",
    adultsLabel: "katta",
    childrenLabel: "bola",
    withHotelLabel: "Otel bilan",
    withoutHotelLabel: "Otelsiz",
    withGuideLabel: "Gid bilan",
    withoutGuideLabel: "Gidsiz",
    guideLangUz: "🇺🇿 O'zbek tili",
    guideLangRu: "🇷🇺 Rus tili",
    guideLangEn: "🇬🇧 Ingliz tili",
    heroBadge: "Aureon Travel — Sayohatlaringizning ishonchli hamrohi",
    heroTitle: "O'zbekistonning Eng Go'zal Shaharlari va Tabiatini Kiring",
    heroDesc: "Siz uchun maxsus 6 ta asosiy yo'nalish: Toshkent poytaxti, Amirsoy va Chimyon tog'lari, go'zal Zomin tabiati hamda qadimiy Samarqand, Buxoro va Xiva!",
    btnExplore: "Yo'nalishlarni Ko'rish",
    btnCalc: "Narxni Hisoblash",
    advTransfer: "Mehmonxonadan Transfer",
    advTransferSub: "Eshik oldidan olib ketish",
    advGuide: "Gid Xizmati (Tanlov asosida)",
    advGuideSub: "Gid bilan yoki mustaqil sayr",
    advHotel: "Otel Bilan / Otelsiz",
    advHotelSub: "Ixtiyoriy qulay tunash",
    advSafe: "100% Xavfsiz Safar",
    advSafeSub: "Aureon Travel kafolati",
    toursTag: "Aureon Travel Turlari",
    toursTitle: "Biz Taklif Qilayotgan Maxsus Turlar",
    toursDesc: "O'zingizga ma'qul bo'lgan shaharni tanlang. Batafsil ma'lumot olish uchun kartochka ustiga bosing — nimalar bilan band bo'lishingiz, nimalarni ko'rishingiz va fotosuratlarni tomosha qiling.",
    perPerson: "Kishiga narxi:",
    startFrom: "boshlang'ich paket",
    btnDetails: "Batafsil",
    btnSelect: "Tanlash",
    bookingTag: "Aureon Travel Bron Qilish",
    bookingTitle: "Sayohatni Bron Qilish va Narxni Hisoblash",
    bookingDesc: "Sayohatchilar soni, davomiyligi, mehmonxona va gid xizmatini tanlang. Buyurtma tezda qabul qilinadi va operatorimiz siz bilan bog'lanadi.",
    step1Title: "Yo'nalish va Safar Davomiyligi",
    lblTour: "Turni tanlang *",
    lblDuration: "Safar davomiyligi *",
    dur1: "1 Kunlik",
    dur2: "2 Kun / 1 Kecha",
    dur3: "3 Kun / 2 Kecha",
    dur4: "4 Kun / 3 Kecha",
    hotelTitle: "Mehmonxona (Tunash) Varianti",
    hotelHint: "1 kecha va undan ortiq safarlar uchun",
    hotelWith: "🏨 Otel bilan birga",
    hotelWithDesc: "Shinam mehmonxonada tunash, mazali nonushta kiritilgan",
    hotelWithout: "🚗 Otelsiz (Faqat tur)",
    hotelWithoutDesc: "Mehmonxonani o'zingiz tanlaysiz, faqat transfer va qulay marshrut",
    guideTitle: "Gid Xizmati (Ixtiyoriy Tanlov)",
    guideHint: "Avtomatik emas, tanlovingizga ko'ra",
    guideWith: "🗣 Professional Gid Hamrohligida",
    guideWithDesc: "Tarixchi gid obidalarni batafsil tushuntirib boradi (+200,000 so'm/kun)",
    guideWithout: "🚶 Gidsiz (Mustaqil Sayohat)",
    guideWithoutDesc: "Gid qo'shilmaydi, faqat shaxsiy qulay transport va marshrut (Qo'shimcha to'lovsiz)",
    guideLangLbl: "Gid qaysi tilda gaplashsin?",
    step2Title: "Mehmon Ma'lumotlari va Odamlar Soni",
    lblAdults: "Kattalar soni *",
    lblChildren: "Bolalar (0-12 yosh)",
    lblStartDate: "Boshlanish sanasi *",
    lblStartTime: "Boshlanish vaqti (Jo'nash soati) *",
    lblPickupType: "Qayerdan olib ketilsin? (Boshlanish joyi) *",
    pickupHint: "100% sizning tanlovingiz: qulay shaxsiy transportimiz siz istagan joydan olib ketadi",
    pickupTypeHotel: "Mehmonxonadan",
    pickupTypeAirport: "Aeroportdan (Kutib olish)",
    pickupTypeStation: "Vokzaldan",
    pickupTypeCustom: "Shaxsiy manzildan",
    lblSelectAddress: "Aniq manzil yoki ob'yektni tanlang *",
    quickPicks: "Ommabop variantlar:",
    lblSubDetail: "Xona raqami yoki aniq eslatma (ixtiyoriy)",
    phSubHotel: "Masalan: 412-xona",
    phSubAirport: "Masalan: Reys HY-602 yoki 2-terminal",
    phSubStation: "Masalan: Afrosiyob 762, 3-vagon",
    phSubCustom: "Masalan: 14-uy, 25-xonadon yoki mo'ljal",
    optCustomOption: "✍️ Boshqa manzil (O'zim yozaman)",
    phPickupHotel: "Mehmonxona nomi va xona raqami (masalan: Hyatt Regency, 412)",
    phPickupAirport: "Reys raqami va terminal (masalan: HY-602, 2-terminal)",
    phPickupStation: "Poyezd reysi va vagon (masalan: Afrosiyob 762, 3-vagon)",
    phPickupCustom: "Aniq ko'cha, uy raqami yoki taniqli mo'ljal (masalan: Amir Temur xiyoboni)",
    valErrTime: "Iltimos, tur boshlanish vaqtini belgilang",
    valErrPickup: "Iltimos, sizni qayerdan olib ketish kerakligini (manzil yoki reysni) tanlang",
    lblRoomSync: "Olib ketish va xona ma'lumoti *",
    lblName: "Ism va Familiyangiz *",
    phName: "Masalan: Azizbek Karimov",
    lblPhone: "Telefon raqamingiz *",
    lblRoom: "Mehmonxona yoki xona raqamingiz *",
    phRoom: "Masalan: 305-xona yoki Hyatt Regency",
    lblNote: "Qo'shimcha istaklar yoki izoh *",
    phNote: "Masalan: Maxsus talablar yo'q yoki aeroportdan kutib olish...",
    valErrName: "Iltimos, ism va familiyangizni to'liq kiriting (kamida 2 ta so'z)",
    valErrPhone: "Iltimos, to'liq telefon raqam kiriting (kamida 9 ta raqam)",
    valErrRoom: "Iltimos, mehmonxona yoki xona raqamingizni kiriting",
    valErrDate: "Iltimos, sayohat boshlanish sanasini belgilang",
    valErrNote: "Iltimos, istaklaringizni yozing yoki quyidagi tayyor variantlardan birini bosing",
    valRemainingNotice: "Ariza topshirish uchun yana {n} ta maydon to'ldirilishi kerak",
    valReadyNotice: "Barcha ma'lumotlar to'liq! Turni bron qilishingiz mumkin",
    valAlertBanner: "Diqqat! Ariza qabul qilinishi uchun barcha ma'lumotlarni to'liq to'ldirishingiz shart. To'ldirilmagan joylar qizil rangda ko'rsatildi.",
    btnSubmitDisabled: "Barcha maydonlarni to'ldiring ({n} ta qoldi)",
    chipNoRequests: "Maxsus talablar yo'q (Standart)",
    chipAirport: "Aeroportdan kutib olish",
    chipMorning: "Ertalab 08:00 da boshlash",
    chipChildSeat: "Bolalar uchun o'rindiq",
    chipRoom305: "305-xona",
    chipHyatt: "Hyatt Regency, 412",
    chipHilton: "Hilton Hotel, 308",
    chipArtResidence: "Art Residence",
    chipArtCity: "Art City Appartments",
    chipApartment: "Kvartiradaman (Shaxsiy uy)",
    chipNotHotel: "Mehmonxonada emasman",
    dateQuickTomorrow: "Ertaga",
    dateQuickAfterTomorrow: "Indinga",
    dateQuickWeekend: "Shanba kuni",
    calcTitle: "Taxminiy Narx Hisobi (Aureon Travel)",
    btnSubmit: "Turni Bron Qilish",
    modalActivities: "U joyda nimalar bilan band bo'lasiz? (Sayohat rejasi)",
    modalSights: "Nimalar bilan tanishasiz va qanday taassurotlar olasiz?",
    modalIncluded: "Turga kiritilgan:",
    modalTariffs: "Tariflar:",
    modalBase: "Asosiy paket:",
    modalHotel: "Mehmonxona (otel):",
    modalGuide: "Gid xizmati (ixtiyoriy):",
    modalPerPerson: "/ kishi",
    modalPerNight: "/ kecha",
    modalPerDay: "/ kun",
    modalBtnSelect: "Shu Turni Tanlash va Bron Qilish",
    successTitle: "Buyurtmangiz Qabul Qilindi!",
    successDesc: "So'rovingiz Aureon Travel tizimiga yetib keldi. Tez orada menejerimiz siz bilan bog'lanib, barcha tafsilotlarni tasdiqlaydi.",
    successBtn: "Tushunarli, Rahmat!",
    footerDesc: "O'zbekiston bo'ylab premium sayohat xizmati",
    footerRights: "Barcha huquqlar himoyalangan.",
    backHome: "← Bosh sahifaga qaytish",
    pageBookingTitle: "Sayohatni Bron Qilish va Rasmiylashtirish",
    pageBookingDesc: "O'zingizga qulay variantlarni tanlang — jami hisob va xizmatlar avtomatik tarzda aniq hisoblanadi.",
    stepTour: "1. Turni Tanlang",
    stepTourSelected: "1. Tanlangan Sayohat Yo'nalishi",
    btnChangeTour: "Turni almashtirish",
    btnCloseTourPicker: "Yopish",
    tourSelectedBadge: "Tanlangan",
    stepDateDur: "2. Sayohat Boshlanishi va Davomiyligi (100% Sizning Tanlovingiz)",
    stepTravelers: "3. Sayohatchilar Soni",
    stepHotel: "4. Mehmonxona (Tunash) Varianti",
    stepGuide: "5. Gid Xizmati (Tanlov Asosida)",
    stepGuest: "6. Mehmon Ma'lumotlari",
    invoiceTitle: "Buyurtma Xulosasi",
    ctaTitle: "O'zbekiston Bo'ylab Unutilmas Sayohatga Tayyormisiz?",
    ctaDesc: "Turlardan birini tanlang va bir necha soniyada o'zingizga qulay formatda buyurtma bering.",
    ctaBtn: "Sayohatni Bron Qilish Sahifasi ➔",
    hotelNotNeeded1Day: "ℹ️ 1 kunlik kunduzgi turda mehmonxona talab etilmaydi (avtomatik ravishda otelsiz tanlangan)",
    adultsDesc: "12 yoshdan yuqori",
    childrenDesc: "0 - 12 yosh (chegirma bilan)",
    grandTotal: "JAMI TO'LOV:",
    breakdownBase: "Asosiy paket:",
    breakdownHotel: "Mehmonxona:",
    breakdownGuide: "Gid xizmati:",
    instantConfirmationNotice: "🔒 Buyurtmangiz zudlik bilan konsyerj va Telegram botimizga yetkaziladi.",
    allToursNotice: "Bizning 6 ta eksklyuziv yo'nalishimiz:",
    currencyRate: "Valyuta kursi:"
  },
  ru: {
    brandSub: "Эксклюзивные туры и консьерж-сервис",
    navTours: "Все туры",
    navBook: "Бронирование",
    navMyBooking: "Моя бронь",
    myBookingTitle: "Проверка статуса бронирования",
    myBookingDesc: "Введите номер вашей брони (например: BK-123456) или номер телефона.",
    phBookingSearch: "Например: BK-123456 или +998901234567",
    btnCheckBooking: "Проверить статус",
    bookingNotFound: "Бронирование с такими данными не найдено. Проверьте правильность ввода.",
    statusPending: "В обработке",
    statusConfirmed: "Подтверждено",
    statusCancelled: "Отклонено",
    statusConfirmedDesc: "Ваша заявка успешно подтверждена администратором! Наш консьерж и комфортабельный трансфер встретят вас в назначенное время.",
    statusCancelledDesc: "К сожалению, данная заявка была отклонена администрацией.",
    statusPendingDesc: "Ваша заявка принята и находится на рассмотрении. Скоро вам поступит уведомление.",
    conciergeService: "Консьерж и эксклюзивные туры",
    allFieldsRequired: "Все поля обязательны для заполнения",
    btnNewBooking: "Новая бронь",
    sumDate: "Дата:",
    sumStartTime: "Время начала:",
    sumPickup: "Место встречи:",
    sumDuration: "Длительность:",
    sumTravelers: "Путешественники:",
    sumHotel: "Отель:",
    sumGuide: "Услуги гида:",
    modalGallery: "Галерея:",
    priceFree: "0 сум (бесплатно)",
    durSub1: "Дневная экскурсия (без отеля)",
    durSub2: "С проживанием на 1 ночь",
    durSub3: "Полный тур на 2 ночи",
    durSub4: "Гранд-тур на 3 ночи",
    dateNotSelected: "Не выбрана",
    dateSelected: "Выбрано",
    badgeCompleted: "Заполнено",
    badgeRequired: "Обязательно",
    nightsLabel: "ноч.",
    daysLabel: "дн.",
    adultsLabel: "взр.",
    childrenLabel: "детей",
    withHotelLabel: "С отелем",
    withoutHotelLabel: "Без отеля",
    withGuideLabel: "С гидом",
    withoutGuideLabel: "Без гида",
    guideLangUz: "🇺🇿 Узбекский язык",
    guideLangRu: "🇷🇺 Русский язык",
    guideLangEn: "🇬🇧 Английский язык",
    heroBadge: "Aureon Travel — Ваш надежный спутник в путешествиях",
    heroTitle: "Откройте для себя красивейшие города и природу Узбекистана",
    heroDesc: "Специально для вас 6 главных направлений: столица Ташкент, горы Амирсой и Чимган, живописный Заамин, а также древние Самарканд, Бухара и Хива!",
    btnExplore: "Смотреть направления",
    btnCalc: "Рассчитать стоимость",
    advTransfer: "Трансфер из отеля",
    advTransferSub: "Заберем прямо от порога",
    advGuide: "Услуги гида (на выбор)",
    advGuideSub: "С гидом или самостоятельная прогулка",
    advHotel: "С отелем / Без отеля",
    advHotelSub: "Удобное размещение по выбору",
    advSafe: "100% Безопасность",
    advSafeSub: "Гарантия качества Aureon Travel",
    toursTag: "Туры Aureon Travel",
    toursTitle: "Эксклюзивные туры от нашей компании",
    toursDesc: "Выберите желаемый город. Нажмите на карточку для подробной информации — расписание по часам, достопримечательности и галерея фотографий.",
    perPerson: "Цена за человека:",
    startFrom: "базовый пакет",
    btnDetails: "Подробнее",
    btnSelect: "Выбрать",
    bookingTag: "Бронирование в Aureon Travel",
    bookingTitle: "Забронировать тур и рассчитать стоимость",
    bookingDesc: "Выберите количество путешественников, продолжительность, опции отеля и гида. Заявка моментально поступит нашему менеджеру.",
    step1Title: "Направление и продолжительность поездки",
    lblTour: "Выберите тур *",
    lblDuration: "Длительность поездки *",
    dur1: "1 День",
    dur2: "2 Дня / 1 Ночь",
    dur3: "3 Дня / 2 Ночи",
    dur4: "4 Дня / 3 Ночи",
    hotelTitle: "Вариант проживания в отеле",
    hotelHint: "Для поездок от 1 ночи и более",
    hotelWith: "🏨 С проживанием в отеле",
    hotelWithDesc: "Уютный отель, вкусный завтрак включен",
    hotelWithout: "🚗 Без отеля (только тур)",
    hotelWithoutDesc: "Отель выбираете сами, включен трансфер и маршрут",
    guideTitle: "Услуги гида (по желанию)",
    guideHint: "Не автоматически, а по вашему выбору",
    guideWith: "🗣 В сопровождении профессионального гида",
    guideWithDesc: "Профессиональный гид-историк (+200 000 сум/день)",
    guideWithout: "🚶 Без гида (самостоятельно)",
    guideWithoutDesc: "Без сопровождения гида, только трансфер (без доплаты)",
    guideLangLbl: "На каком языке должен говорить гид?",
    step2Title: "Данные гостя и количество человек",
    lblAdults: "Взрослые *",
    lblChildren: "Дети (0-12 лет)",
    lblStartDate: "Дата начала *",
    lblStartTime: "Время отправления (начала тура) *",
    lblPickupType: "Место отправления (откуда вас забрать) *",
    pickupHint: "100% ваш выбор: наш комфортабельный персональный трансфер заберет вас в удобном для вас месте",
    pickupTypeHotel: "Из отеля",
    pickupTypeAirport: "Из аэропорта (Встреча)",
    pickupTypeStation: "С ж/д вокзала",
    pickupTypeCustom: "Свой адрес / Ориентир",
    lblSelectAddress: "Выберите точное место или объект *",
    quickPicks: "Популярные варианты:",
    lblSubDetail: "Номер комнаты или уточнение (необязательно)",
    phSubHotel: "Например: комната 412",
    phSubAirport: "Например: рейс HY-602 или терминал 2",
    phSubStation: "Например: Афросиаб 762, вагон 3",
    phSubCustom: "Например: дом 14, кв. 25 или ориентир",
    optCustomOption: "✍️ Другой адрес (Ввести вручную)",
    phPickupHotel: "Название отеля и номер комнаты (например: Hyatt Regency, 412)",
    phPickupAirport: "Номер рейса и терминал (например: HY-602, терминал 2)",
    phPickupStation: "Номер поезда и вагон (например: Афросиаб 762, 3-й вагон)",
    phPickupCustom: "Точный адрес, дом или ориентир (например: сквер Амира Темура)",
    valErrTime: "Пожалуйста, укажите время начала тура",
    valErrPickup: "Пожалуйста, укажите или выберите место встречи (адрес, отель или рейс)",
    lblRoomSync: "Место встречи и номер комнаты *",
    lblName: "Ваше имя и фамилия *",
    phName: "Например: Азизбек Каримов",
    lblPhone: "Номер телефона *",
    lblRoom: "Отель или номер комнаты *",
    phRoom: "Например: номер 305 или Hyatt Regency",
    lblNote: "Особые пожелания или комментарий *",
    phNote: "Например: Особых пожеланий нет или трансфер из аэропорта...",
    valErrName: "Пожалуйста, введите имя и фамилию полностью (минимум 2 слова)",
    valErrPhone: "Пожалуйста, введите корректный номер телефона (не менее 9 цифр)",
    valErrRoom: "Пожалуйста, укажите отель или номер комнаты",
    valErrDate: "Пожалуйста, выберите дату начала поездки",
    valErrNote: "Пожалуйста, укажите пожелания или нажмите готовый вариант ниже",
    valRemainingNotice: "Для отправки заявки осталось заполнить еще {n} поля",
    valReadyNotice: "Все поля заполнены! Вы можете подтвердить бронь",
    valAlertBanner: "Внимание! Заявка не может быть принята, пока не заполнены абсолютно все поля. Пропущенные места выделены красным цветом.",
    btnSubmitDisabled: "Заполните все поля (осталось {n})",
    chipNoRequests: "Особых пожеланий нет (Стандарт)",
    chipAirport: "Встреча в аэропорту",
    chipMorning: "Старт утром в 08:00",
    chipChildSeat: "Детское автокресло",
    chipRoom305: "Комната 305",
    chipHyatt: "Hyatt Regency, 412",
    chipHilton: "Hilton Hotel, 308",
    chipArtResidence: "Art Residence",
    chipArtCity: "Art City Appartments",
    chipApartment: "В апартаментах (частная квартира)",
    chipNotHotel: "Не в отеле",
    dateQuickTomorrow: "Завтра",
    dateQuickAfterTomorrow: "Послезавтра",
    dateQuickWeekend: "В субботу",
    calcTitle: "Предварительный расчет (Aureon Travel)",
    btnSubmit: "Забронировать тур",
    modalActivities: "Чем вы будете заняты? (Программа тура)",
    modalSights: "Что вы увидите и какие впечатления получите?",
    modalIncluded: "В стоимость тура входит:",
    modalTariffs: "Тарифы:",
    modalBase: "Базовый пакет:",
    modalHotel: "Проживание в отеле:",
    modalGuide: "Услуги гида (по выбору):",
    modalPerPerson: "/ чел",
    modalPerNight: "/ ночь",
    modalPerDay: "/ день",
    modalBtnSelect: "Выбрать и забронировать этот тур",
    successTitle: "Ваша заявка принята!",
    successDesc: "Ваш запрос успешно поступил в систему Aureon Travel. Скоро наш менеджер свяжется с вами для подтверждения всех деталей.",
    successBtn: "Понятно, спасибо!",
    footerDesc: "Премиальные туристические услуги по Узбекистану",
    footerRights: "Все права защищены.",
    backHome: "← На главную",
    pageBookingTitle: "Оформление и бронирование тура",
    pageBookingDesc: "Выберите удобные параметры — итоговая стоимость и услуги рассчитываются моментально.",
    stepTour: "1. Выберите тур",
    stepTourSelected: "1. Выбранное Направление Тура",
    btnChangeTour: "Сменить тур",
    btnCloseTourPicker: "Закрыть",
    tourSelectedBadge: "Выбрано",
    stepDateDur: "2. Начало тура и длительность (100% ваш выбор)",
    stepTravelers: "3. Количество путешественников",
    stepHotel: "4. Проживание в отеле",
    stepGuide: "5. Услуги гида (по желанию)",
    stepGuest: "6. Контактные данные гостя",
    invoiceTitle: "Детали бронирования",
    ctaTitle: "Готовы к незабываемому путешествию по Узбекистану?",
    ctaDesc: "Выберите подходящий тур и оформите бронь за считанные секунды в удобном формате.",
    ctaBtn: "Перейти к бронированию тура ➔",
    hotelNotNeeded1Day: "ℹ️ Для 1-дневного дневного тура отель не требуется (автоматически без отеля)",
    adultsDesc: "старше 12 лет",
    childrenDesc: "0 - 12 лет (со скидкой)",
    grandTotal: "ИТОГО К ОПЛАТЕ:",
    breakdownBase: "Базовый тур:",
    breakdownHotel: "Проживание в отеле:",
    breakdownGuide: "Услуги гида:",
    instantConfirmationNotice: "🔒 Заявка мгновенно передается нашему консьержу и в Telegram бот.",
    allToursNotice: "Наши 6 эксклюзивных направлений:",
    currencyRate: "Курс валюты:"
  },
  en: {
    brandSub: "Exclusive Tours & Concierge",
    navTours: "All Tours",
    navBook: "Book Now",
    navMyBooking: "My Booking",
    myBookingTitle: "Check Booking Status",
    myBookingDesc: "Enter your Booking ID (e.g., BK-123456) or your phone number.",
    phBookingSearch: "E.g.: BK-123456 or +998901234567",
    btnCheckBooking: "Check Status",
    bookingNotFound: "No booking found with this information. Please verify your ID or phone.",
    statusPending: "Pending Review",
    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    statusConfirmedDesc: "Your booking has been officially confirmed! Our representative and private transfer will meet you at the scheduled time.",
    statusCancelledDesc: "Unfortunately, this booking was cancelled by administration.",
    statusPendingDesc: "Your booking is currently pending review by our concierge manager. You will receive an update shortly.",
    conciergeService: "Concierge & Exclusive Tours",
    allFieldsRequired: "All fields are required",
    btnNewBooking: "New Booking",
    sumDate: "Date:",
    sumStartTime: "Start Time:",
    sumPickup: "Pickup Location:",
    sumDuration: "Duration:",
    sumTravelers: "Travelers:",
    sumHotel: "Hotel:",
    sumGuide: "Guide:",
    modalGallery: "Gallery:",
    priceFree: "0 UZS (Free)",
    durSub1: "Day trip (without hotel)",
    durSub2: "With 1 night stay",
    durSub3: "Full trip with 2 nights",
    durSub4: "Grand tour with 3 nights",
    dateNotSelected: "Not selected",
    dateSelected: "Selected",
    badgeCompleted: "Completed",
    badgeRequired: "Required",
    nightsLabel: "nights",
    daysLabel: "days",
    adultsLabel: "adults",
    childrenLabel: "children",
    withHotelLabel: "With hotel",
    withoutHotelLabel: "Tour only (No hotel)",
    withGuideLabel: "With guide",
    withoutGuideLabel: "Self-guided",
    guideLangUz: "🇺🇿 Uzbek language",
    guideLangRu: "🇷🇺 Russian language",
    guideLangEn: "🇬🇧 English language",
    heroBadge: "Aureon Travel — Your trusted travel companion",
    heroTitle: "Discover the Most Beautiful Cities and Nature of Uzbekistan",
    heroDesc: "Curated 6 major destinations: capital Tashkent, Amirsoy & Chimgan mountains, picturesque Zaamin, and ancient Samarkand, Bukhara & Khiva!",
    btnExplore: "Explore Tours",
    btnCalc: "Calculate Price",
    advTransfer: "Hotel Pickup & Transfer",
    advTransferSub: "Direct from your doorstep",
    advGuide: "Guide Service (Optional)",
    advGuideSub: "With guide or self-guided journey",
    advHotel: "With Hotel / Without Hotel",
    advHotelSub: "Flexible accommodation choices",
    advSafe: "100% Safe Journey",
    advSafeSub: "Guaranteed by Aureon Travel",
    toursTag: "Aureon Travel Destinations",
    toursTitle: "Our Exclusive Tour Packages",
    toursDesc: "Choose your preferred destination. Click any card to explore detailed itineraries, monuments, and photo galleries.",
    perPerson: "Price per person:",
    startFrom: "starter package",
    btnDetails: "Details",
    btnSelect: "Select",
    bookingTag: "Aureon Travel Booking",
    bookingTitle: "Book Your Tour & Calculate Price",
    bookingDesc: "Select travelers, duration, hotel, and guide options. Your booking will be instantly received and confirmed by our manager.",
    step1Title: "Destination & Tour Duration",
    lblTour: "Select tour *",
    lblDuration: "Tour duration *",
    dur1: "1 Day",
    dur2: "2 Days / 1 Night",
    dur3: "3 Days / 2 Nights",
    dur4: "4 Days / 3 Nights",
    hotelTitle: "Hotel Accommodation Option",
    hotelHint: "For trips with 1 or more nights",
    hotelWith: "🏨 Including Hotel Stay",
    hotelWithDesc: "Comfortable hotel accommodation, delicious breakfast included",
    hotelWithout: "🚗 Without Hotel (Tour Only)",
    hotelWithoutDesc: "Book your own hotel; private transportation & route included",
    guideTitle: "Guide Service (Optional Choice)",
    guideHint: "Optional, tailored to your preference",
    guideWith: "🗣 Professional Guided Experience",
    guideWithDesc: "Licensed historian guide with you (+200,000 UZS/day)",
    guideWithout: "🚶 Self-Guided (Tour Only)",
    guideWithoutDesc: "No guide included, private vehicle & route only (No extra charge)",
    guideLangLbl: "Preferred guide language:",
    step2Title: "Guest Information & Number of Travelers",
    lblAdults: "Adults *",
    lblChildren: "Children (0-12 yrs)",
    lblStartDate: "Start Date *",
    lblStartTime: "Tour Start Time (Departure) *",
    lblPickupType: "Pickup Location (Where to start) *",
    pickupHint: "100% your choice: our comfortable private transfer will pick you up at your preferred location",
    pickupTypeHotel: "From Hotel",
    pickupTypeAirport: "From Airport (Meet & Greet)",
    pickupTypeStation: "From Railway Station",
    pickupTypeCustom: "Custom Address / Landmark",
    lblSelectAddress: "Select exact location or pickup point *",
    quickPicks: "Popular options:",
    lblSubDetail: "Room number or additional detail (optional)",
    phSubHotel: "E.g.: Room 412",
    phSubAirport: "E.g.: Flight HY-602 or Terminal 2",
    phSubStation: "E.g.: Afrosiyob 762, Coach 3",
    phSubCustom: "E.g.: Building 14, Apt 25 or landmark",
    optCustomOption: "✍️ Other address (Enter manually)",
    phPickupHotel: "Hotel name and room number (e.g.: Hyatt Regency, 412)",
    phPickupAirport: "Flight number and terminal (e.g.: HY-602, Terminal 2)",
    phPickupStation: "Train number and coach (e.g.: Afrosiyob 762, Coach 3)",
    phPickupCustom: "Exact street address, building or landmark (e.g.: Amir Timur Square)",
    valErrTime: "Please specify the tour start time",
    valErrPickup: "Please enter the pickup location (address, hotel or flight)",
    lblRoomSync: "Pickup location & room info *",
    lblName: "Full Name *",
    phName: "E.g.: John Smith",
    lblPhone: "Phone Number *",
    lblRoom: "Hotel or Room Number *",
    phRoom: "E.g.: Room 305 or Hyatt Regency",
    lblNote: "Special Requests or Notes *",
    phNote: "E.g.: No special requests or Airport pickup...",
    valErrName: "Please enter your full first and last name (at least 2 words)",
    valErrPhone: "Please enter a valid phone number (at least 9 digits)",
    valErrRoom: "Please specify your hotel or room number",
    valErrDate: "Please select a tour start date",
    valErrNote: "Please write your preferences or click one of the quick options below",
    valRemainingNotice: "{n} required fields remaining before booking",
    valReadyNotice: "All fields completed! Ready to submit your booking",
    valAlertBanner: "Attention! All information must be completed before submitting your booking. Missing fields are highlighted in red.",
    btnSubmitDisabled: "Please complete all fields ({n} remaining)",
    chipNoRequests: "No special requests (Standard)",
    chipAirport: "Airport pickup requested",
    chipMorning: "Start early at 08:00 AM",
    chipChildSeat: "Child safety seat required",
    chipRoom305: "Room 305",
    chipHyatt: "Hyatt Regency, 412",
    chipHilton: "Hilton Hotel, 308",
    chipArtResidence: "Art Residence",
    chipArtCity: "Art City Appartments",
    chipApartment: "Private apartment (Rental)",
    chipNotHotel: "Not staying in hotel",
    dateQuickTomorrow: "Tomorrow",
    dateQuickAfterTomorrow: "In 2 days",
    dateQuickWeekend: "This Saturday",
    calcTitle: "Estimated Total (Aureon Travel)",
    btnSubmit: "Book This Tour",
    modalActivities: "What will you do? (Daily Itinerary)",
    modalSights: "What sights and experiences await you?",
    modalIncluded: "Included in the tour:",
    modalTariffs: "Tariff Rates:",
    modalBase: "Base package:",
    modalHotel: "Hotel accommodation:",
    modalGuide: "Guide service (optional):",
    modalPerPerson: "/ person",
    modalPerNight: "/ night",
    modalPerDay: "/ day",
    modalBtnSelect: "Select and Book This Tour",
    successTitle: "Booking Successfully Received!",
    successDesc: "Your request has reached Aureon Travel. Our manager will contact you shortly to confirm all details.",
    successBtn: "Understood, Thank you!",
    footerDesc: "Premium travel and tour services across Uzbekistan",
    footerRights: "All rights reserved.",
    backHome: "← Back to Home",
    pageBookingTitle: "Tour Reservation & Booking",
    pageBookingDesc: "Select your preferred options — total price and package details calculate in real-time.",
    stepTour: "1. Select Destination",
    stepTourSelected: "1. Selected Tour Destination",
    btnChangeTour: "Change tour",
    btnCloseTourPicker: "Close",
    tourSelectedBadge: "Selected",
    stepDateDur: "2. Tour Start & Duration (100% Your Choice)",
    stepTravelers: "3. Number of Travelers",
    stepHotel: "4. Hotel Accommodation",
    stepGuide: "5. Tour Guide Option",
    stepGuest: "6. Guest Information",
    invoiceTitle: "Booking Summary",
    ctaTitle: "Ready for an Unforgettable Journey Across Uzbekistan?",
    ctaDesc: "Choose your tour package and reserve it in seconds with complete comfort.",
    ctaBtn: "Go to Booking Page ➔",
    hotelNotNeeded1Day: "ℹ️ Hotel accommodation not required for 1-day trip (automatically set to tour only)",
    adultsDesc: "ages 12+",
    childrenDesc: "ages 0 - 12 (discounted)",
    grandTotal: "TOTAL AMOUNT:",
    breakdownBase: "Base package:",
    breakdownHotel: "Hotel stay:",
    breakdownGuide: "Guide service:",
    instantConfirmationNotice: "🔒 Booking instantly sent to our concierge and Telegram bot.",
    allToursNotice: "Our 6 exclusive destinations:",
    currencyRate: "Exchange rate:"
  }
};

const DEFAULT_TOURS = [
  {
    id: "toshkent",
    title: {
      uz: "Toshkent shahri bo'ylab sayohat",
      ru: "Тур по городу Ташкент",
      en: "Tashkent City Discovery Tour"
    },
    subtitle: {
      uz: "Poytaxtning boy tarixi va zamonaviy qiyofasi",
      ru: "Богатая история и современный облик столицы",
      en: "Rich history and modern charm of the capital"
    },
    badge: {
      uz: "Ommabop",
      ru: "Популярный",
      en: "Popular"
    },
    badgeColor: "bg-emerald-500",
    location: {
      uz: "Toshkent shahri",
      ru: "Город Ташкент",
      en: "Tashkent City"
    },
    basePricePerPerson: 350000,
    hotelPricePerNight: 450000,
    guidePricePerDay: 200000,
    mainImage: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Khazrat_Imam_panorama.jpg",
    gallery: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e1/Khazrat_Imam_panorama.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/de/Minor_Mosque_Tashkent.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/47/Chorsu_Market_general_view.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/ba/Chorsu_Bazaar_in_Tashkent.jpg"
    ],
    durationDays: [1, 2, 3],
    highlights: {
      uz: [
        "Hazrati Imom me'moriy majmuasi va Usmon Qur'oni",
        "Sharqona Chorsu bozori va hunarmandlar rastalari",
        "Toshkentning oq marmarli Minor masjidi",
        "Magic City va Amir Temur xiyoboni",
        "Toshkent teleminorasi va Milliy Taomlar markazi"
      ],
      ru: [
        "Архитектурный комплекс Хазрати Имам и Коран Усмана",
        "Восточный базар Чорсу и ремесленные ряды",
        "Беломраморная мечеть Минор",
        "Парк Magic City и сквер Амира Темура",
        "Ташкентская телебашня и Центр плова"
      ],
      en: [
        "Hazrati Imam Complex and ancient Uthman Quran",
        "Chorsu Bazaar dome and authentic craft stalls",
        "White marble Minor Mosque",
        "Magic City Park & Amir Timur Square",
        "Tashkent TV Tower and National Pilaf Center"
      ]
    },
    activities: {
      uz: [
        "09:00 - Mehmonxonadan qulay konditsionerli transportda kutib olish",
        "10:00 - Hazrati Imom me'moriy majmuasi va qadimiy Usmon Qur'oni ziyorati",
        "12:00 - Chorsu bozorida sharqona shirinliklar, quruq mevalar va esdalik sovg'alar xaridi",
        "13:30 - Toshkent osh markazida mashhur to'y oshi va milliy taomlar degustatsiyasi",
        "15:00 - Oq marmarli go'zal Minor masjidi va Anhor bo'yida sayr",
        "17:00 - Amir Temur xiyoboni va zamonaviy Magic City bog'ida dam olish",
        "19:00 - Toshkent teleminorasi atrofida kechki shahar manzarasi va kechki ovqat"
      ],
      ru: [
        "09:00 - Встреча в отеле на комфортабельном автомобиле с кондиционером",
        "10:00 - Экскурсия по комплексу Хазрати Имам и священному Корану Усмана",
        "12:00 - Посещение базара Чорсу: восточные сладости, сухофрукты и сувениры",
        "13:30 - Обед в центре плова: дегустация настоящего свадебного плова",
        "15:00 - Прогулка у беломраморной мечети Минор вдоль набережной Анхора",
        "17:00 - Сквер Амира Темура и отдых в парке Magic City",
        "19:00 - Вечерняя панорама города у телебашни и ужин"
      ],
      en: [
        "09:00 - Hotel pickup in comfortable air-conditioned vehicle",
        "10:00 - Visit Hazrati Imam architectural complex & sacred Uthman Quran",
        "12:00 - Explore Chorsu Bazaar: Oriental spices, sweets & souvenirs",
        "13:30 - Lunch at National Pilaf Center: Authentic Tashkent wedding pilaf",
        "15:00 - Scenic walk along Minor Mosque and Ankhor canal embankment",
        "17:00 - Amir Timur Square and leisure time at Magic City park",
        "19:00 - Evening city panorama near Tashkent TV Tower and dinner"
      ]
    },
    sights: {
      uz: [
        "O'rta Osiyodagi eng boy va qadimiy islom madaniyati markazlari bilan tanishasiz",
        "Sharq bozori madaniyati, non turlari va milliy xaridlar muhitini his qilasiz",
        "Poytaxtning zamonaviy va qadimiy me'morchiligiga guvoh bo'lasiz"
      ],
      ru: [
        "Познакомитесь с богатейшими центрами исламской культуры Центральной Азии",
        "Окунетесь в колорит восточного базара и традиции национальной кухни",
        "Увидите гармоничное сочетание древней и современной архитектуры"
      ],
      en: [
        "Explore rich Islamic architectural heritage of Central Asia",
        "Experience vibrant atmosphere of traditional oriental bazaar",
        "Witness stunning contrast between ancient heritage and modern metropolis"
      ]
    },
    included: {
      uz: [
        "Shaxsiy konditsionerli transport / transfer",
        "Barcha muzey va obidalarga kirish chiptalari",
        "Salqin ichimliklar va milliy shirinliklar",
        "Sayohat xaritasi va yo'lboshlovchi ma'lumotnomalar"
      ],
      ru: [
        "Персональный кондиционированный транспорт",
        "Входные билеты во все музеи и памятники",
        "Прохладительные напитки и национальные угощения",
        "Карта маршрута и путеводитель"
      ],
      en: [
        "Private air-conditioned vehicle / transfer",
        "Entry tickets to all monuments and museums",
        "Bottled water, refreshments and national sweets",
        "City route map and traveler guide"
      ]
    },
    notIncluded: {
      uz: ["Shaxsiy esdalik sovg'alari xarajatlari", "Gid xizmati (ixtiyoriy, buyurtmada tanlanadi)"],
      ru: ["Личные сувениры и покупки", "Услуги гида (по выбору при бронировании)"],
      en: ["Personal souvenirs and shopping", "Guide service (optional upon booking)"]
    }
  },
  {
    id: "toglar",
    title: {
      uz: "Tog'li hududlar (Amirsoy, Chimyon, Chorvoq)",
      ru: "Горные курорты (Амирсой, Чимган, Чарвак)",
      en: "Mountain Resorts (Amirsoy, Chimgan, Charvak)"
    },
    subtitle: {
      uz: "Maftunkor tabiat, toza havo va tog' kurortlari",
      ru: "Живописная природа, чистый воздух и горный отдых",
      en: "Breathtaking nature, crisp mountain air & alpine resorts"
    },
    badge: {
      uz: "Tabiat & Dam olish",
      ru: "Природа и отдых",
      en: "Nature & Leisure"
    },
    badgeColor: "bg-cyan-500",
    location: {
      uz: "Bo'stonliq tumani, Toshkent viloyati",
      ru: "Бостанлыкский район, Ташкентская область",
      en: "Bostanlyk district, Tashkent region"
    },
    basePricePerPerson: 420000,
    hotelPricePerNight: 550000,
    guidePricePerDay: 200000,
    mainImage: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Charvak_Reservoir.jpg",
    gallery: [
      "https://upload.wikimedia.org/wikipedia/commons/e/ec/Charvak_Reservoir.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/be/Uzbekistan_Chimgan_Mountains.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/ac/Greater_Chimgan_Mountain.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/6/6e/Chimgan_ski.JPG"
    ],
    durationDays: [1, 2, 3, 4],
    highlights: {
      uz: [
        "Ko'm-ko'k Chorvoq suv ombori bo'yida dam olish",
        "Katta Chimyon tog' cho'qqilari va Beldersoy darasi",
        "Amirsoy Mountain Resort - zamonaviy osma gondolalar",
        "Tog' daryolari bo'yida xushmanzara milliy choyxonalar",
        "Paraplanda uchish, kater va otda sayr qilish imkoniyati"
      ],
      ru: [
        "Бирюзовые воды Чарвакского водохранилища",
        "Вершины Большого Чимгана и ущелье Бельдерсай",
        "Курорт Amirsoy - современные гондольные канатные дороги",
        "Аутентичные горные чайханы у кристальных рек",
        "Катание на катерах, квадроциклах и прогулки на лошадях"
      ],
      en: [
        "Turquoise waters of scenic Charvak Reservoir",
        "Majestic Greater Chimgan peaks and Beldersay valley",
        "Amirsoy Mountain Resort modern cable gondolas",
        "Traditional teahouses along mountain rivers",
        "Boating, paragliding and horseback riding activities"
      ]
    },
    activities: {
      uz: [
        "08:30 - Toshkentdan Bo'stonliq tog' tizmasiga yo'lga chiqish",
        "10:00 - Amirsoy kurortiga yetib kelish, osma yo'lda cho'qqiga ko'tarilish (2290 metr)",
        "12:00 - Tog' cho'qqisida foto-sessiya va musaffo tog' havosidan bahramand bo'lish",
        "13:30 - Chorvoq bo'yida milliy qovurma baliq va tandir go'shti bilan tushlik",
        "15:30 - Chorvoq suv omborida yaxta, kater va suv sportlari bilan tanishuv",
        "17:30 - Chimyon vodiysi bo'ylab otda sayr yoki sokin tabiat qo'ynida dam olish",
        "19:00 - Tog' oteliga joylashish yoki shahar sari qaytish"
      ],
      ru: [
        "08:30 - Выезд из Ташкента в сторону гор Бостанлыка",
        "10:00 - Прибытие на курорт Amirsoy, подъем на канатке на вершину (2290 м)",
        "12:00 - Фотосессия на вершине и наслаждение горным воздухом",
        "13:30 - Обед на берегу Чарвака: свежая форель и традиционное горное мясо",
        "15:30 - Прогулка на катере по Чарвакскому водохранилищу",
        "17:30 - Конная прогулка по урочищу Чимган или отдых на природе",
        "19:00 - Заселение в горный отель или возвращение в Ташкент"
      ],
      en: [
        "08:30 - Departure from hotel towards Bostanlyk mountain ranges",
        "10:00 - Arrive at Amirsoy Resort, scenic gondola ride to the summit (2290m)",
        "12:00 - Mountain peak panorama photoshoot and alpine air experience",
        "13:30 - Lakefront lunch: famous Charvak fried trout and tandoor meat",
        "15:30 - Boat cruise and leisure on Charvak lake",
        "17:30 - Horseback riding in Chimgan valley or relaxation in nature",
        "19:00 - Check-in at mountain lodge or return drive to Tashkent"
      ]
    },
    sights: {
      uz: [
        "Chotqol tog' tizmasining go'zal panoramalari",
        "Chorvoq suv omborining firuza rang suvlari va tog' archazorlari",
        "Xalqaro andozalardagi eng yirik tog'-chang'i kurorti infratuzilmasi"
      ],
      ru: [
        "Захватывающие панорамы Чаткальского хребта",
        "Бирюзовая гладь Чарвака и вековые реликтовые арчи",
        "Инфраструктура современного горнолыжного курорта международного класса"
      ],
      en: [
        "Stunning panoramas of the Chatkal mountain ridge",
        "Turquoise waters of Charvak lake and juniper forests",
        "World-class modern alpine resort amenities"
      ]
    },
    included: {
      uz: ["Barcha yo'l bo'ylab qulay transfer", "Amirsoy kanat yo'liga kirish chiptasi", "Mineral tog' suvlari va yengil tamaddi"],
      ru: ["Комфортабельный трансфер на весь маршрут", "Билет на канатную дорогу Amirsoy", "Горная минеральная вода и легкий перекус"],
      en: ["Comfortable transfer along whole route", "Amirsoy cable car ticket", "Mountain mineral water and light snacks"]
    },
    notIncluded: {
      uz: ["Paraplan va kater xizmatlari (ixtiyoriy)", "Gid xizmati (ixtiyoriy)"],
      ru: ["Катер и параплан (по желанию)", "Услуги гида (по желанию)"],
      en: ["Paragliding and speedboats (optional)", "Guide service (optional)"]
    }
  },
  {
    id: "zomin",
    title: {
      uz: "Zomin milliy tabiat bog'i",
      ru: "Национальный парк Заамин",
      en: "Zaamin National Park"
    },
    subtitle: {
      uz: "O'zbekiston Shveytsariyasi va shifobaxsh archazorlar",
      ru: "Узбекская Швейцария и целебные хвойные леса",
      en: "Uzbek Switzerland & healing alpine pine forests"
    },
    badge: {
      uz: "Ekoturizm",
      ru: "Экотуризм",
      en: "Ecotourism"
    },
    badgeColor: "bg-green-600",
    location: {
      uz: "Jizzax viloyati, Zomin",
      ru: "Джизакская область, Заамин",
      en: "Jizzakh region, Zaamin"
    },
    basePricePerPerson: 490000,
    hotelPricePerNight: 500000,
    guidePricePerDay: 200000,
    mainImage: "https://upload.wikimedia.org/wikipedia/commons/3/31/Zaamin_National_Park%2C_Uzbekistan.jpg",
    gallery: [
      "https://upload.wikimedia.org/wikipedia/commons/3/31/Zaamin_National_Park%2C_Uzbekistan.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/de/Zomin_mountain-forest_state_reserve_naturee.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/de/Zomin_1.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/63/Zaamin_National_Park_Entrance%2C_Uzbekistan.jpg"
    ],
    durationDays: [1, 2, 3],
    highlights: {
      uz: [
        "305 metr balandlikdagi mashhur Zomin osma shisha ko'prigi",
        "Ming yillik boboyong'oq va qadimiy archazorlar",
        "Shifobaxsh 'Sherbuloq' buloq suvlari",
        "Sufi platosi va Zomin sharsharasi",
        "Haqiqiy Zomin tandir go'shti tayyorlanish jarayoni"
      ],
      ru: [
        "Знаменитый стеклянный подвесной мост Заамина на высоте 305 метров",
        "Тысячелетние ореховые деревья и реликтовые арчовые леса",
        "Целебный горный источник 'Шербулок'",
        "Плато Суфи и Зааминский водопад",
        "Приготовление легендарного зааминского тандыр-кабоба"
      ],
      en: [
        "Famous 305-meter high Zaamin glass suspension bridge",
        "Centuries-old walnut trees and pristine juniper groves",
        "Healing natural spring waters of 'Sherbulok'",
        "Sufi plateau and picturesque Zaamin waterfall",
        "Authentic Zaamin tandoor roast meat culinary experience"
      ]
    },
    activities: {
      uz: [
        "07:30 - Toshkentdan Zomin tog'lari sari manzarali yo'l bo'ylab jo'nash",
        "10:30 - Zomin milliy bog'iga kirish, ignabargli toza archa havosidan nafas olish",
        "11:30 - Mashhur Zomin Shisha ko'prigidan o'tish (adrenalin va fotolakatsiyalar)",
        "13:30 - Zomin archazorlari ostida an'anaviy Zomin tandir kabobi bilan tushlik",
        "15:30 - Sufi platosi, Zomin kanyonlari va sharsharaga piyoda ekosayohat",
        "17:30 - Shifobaxsh Sherbuloq bulog'i va tog' asallari yarmarkasi",
        "19:00 - Tog' mehmonxonasiga joylashish yoki shahar sari qaytish"
      ],
      ru: [
        "07:30 - Выезд из Ташкента по живописной трассе в Заамин",
        "10:30 - Въезд в национальный парк, прогулка по хвойному лесу",
        "11:30 - Прогулка по захватывающему Зааминскому стеклянному мосту",
        "13:30 - Обед: знаменитый зааминский тандыр под сенью арчовых рощ",
        "15:30 - Пеший эко-поход по плато Суфи, каньонам и к водопаду",
        "17:30 - Посещение источника Шербулок и ярмарки горного меда",
        "19:00 - Заселение в эко-отель или обратная дорога"
      ],
      en: [
        "07:30 - Departure from Tashkent along scenic highway to Zaamin",
        "10:30 - Entry into national park, immerse in fresh alpine pine air",
        "11:30 - Thrilling walk across Zaamin Glass Suspension Bridge",
        "13:30 - Traditional lunch: famous Zaamin tandoor kebab under juniper shade",
        "15:30 - Eco-trekking around Sufi plateau, mountain canyons and waterfall",
        "17:30 - Visit healing Sherbulok mineral spring & local mountain honey market",
        "19:00 - Mountain resort check-in or return journey"
      ]
    },
    sights: {
      uz: [
        "Zomin tog'larining baland qoyalari va dara manzaralari",
        "Noyob dorivor tog' o'simliklari va shifobaxsh iqlim",
        "Markaziy Osiyodagi eng baland osma ko'priklardan biri"
      ],
      ru: [
        "Величественные скалы и глубокие каньоны Заамина",
        "Уникальный лечебный микроклимат и высокогорные травы",
        "Один из самых высоких подвесных мостов в Центральной Азии"
      ],
      en: [
        "Dramatic mountain gorges and alpine cliff panoramas",
        "Renowned therapeutic mountain climate and rare medicinal herbs",
        "One of Central Asia's highest architectural suspension bridges"
      ]
    },
    included: {
      uz: ["Komfort avtotransport", "Milliy parkka kirish to'lovlari", "Shisha ko'prikka chiptalar"],
      ru: ["Комфортный автотранспорт", "Экологические сборы парка", "Билеты на стеклянный мост"],
      en: ["Comfortable private vehicle", "National park entry fees", "Glass bridge admission tickets"]
    },
    notIncluded: {
      uz: ["Ot ijarasi va shaxsiy xaridlar", "Gid xizmati (ixtiyoriy)"],
      ru: ["Аренда лошадей и личные покупки", "Услуги гида (по желанию)"],
      en: ["Horse rental and personal expenses", "Guide service (optional)"]
    }
  },
  {
    id: "samarqand",
    title: {
      uz: "Samarqand - Sharq durdonasi",
      ru: "Самарканд - Жемчужина Востока",
      en: "Samarkand - Pearl of the Orient"
    },
    subtitle: {
      uz: "Buyuk ipak yo'lining yuragi va Temuriylar me'morchiligi",
      ru: "Сердце Великого шелкового пути и архитектура Тимуридов",
      en: "Heart of the Great Silk Road and Timurid Architecture"
    },
    badge: {
      uz: "Tarix & Madaniyat",
      ru: "История и культура",
      en: "History & Culture"
    },
    badgeColor: "bg-blue-600",
    location: {
      uz: "Samarqand viloyati",
      ru: "Самаркандская область",
      en: "Samarkand Region"
    },
    basePricePerPerson: 550000,
    hotelPricePerNight: 500000,
    guidePricePerDay: 200000,
    mainImage: "https://upload.wikimedia.org/wikipedia/commons/0/00/Registan_square_Samarkand.jpg",
    gallery: [
      "https://upload.wikimedia.org/wikipedia/commons/0/00/Registan_square_Samarkand.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/9d/Gur-e_Amir_03.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/b6/Registan_Samarkand_Uzbekistan.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/0/06/Gur-e_Amir_01.jpg"
    ],
    durationDays: [1, 2, 3],
    highlights: {
      uz: [
        "Afsonaviy Registon maydoni (Ulug'bek, Sherdor, Tillakori madrasalari)",
        "Sohibqiron Amir Temur va temuriylar maqbarasi (Go'ri Amir)",
        "Mo'jizakor moviy koshinli Shohi Zinda nekropoli",
        "Bibixonim masjidi va mashhur Siyob bozori",
        "Mirzo Ulug'bek rasadxonasi va Samarqand noni"
      ],
      ru: [
        "Легендарная площадь Регистан (медресе Улугбека, Шердор, Тилля-Кари)",
        "Мавзолей Амира Темура и династии Тимуридов (Гур-Эмир)",
        "Некрополь Шахи Зинда с бирюзовой мозаикой",
        "Мечеть Биби-Ханым и знаменитый Сиабский базар",
        "Обсерватория Улугбека и знаменитые самаркандские лепешки"
      ],
      en: [
        "Legendary Registan Square (Ulugbek, Sher-Dor, Tillya-Kori madrasahs)",
        "Mausoleum of Amir Timur and the Timurid dynasty (Gur-e-Amir)",
        "Shah-i Zinda necropolis with turquoise tilework",
        "Bibi-Khanym Mosque and lively Siab Bazaar",
        "Ulugbek Observatory and iconic golden Samarkand bread"
      ]
    },
    activities: {
      uz: [
        "08:00 - Afrosiyob tezyurar poyezdida yoki qulay transportda yetib kelish",
        "09:30 - Go'ri Amir maqbarasini ziyorat qilish, Temuriylar saltanati tarixi bilan tanishuv",
        "11:00 - Dunyoga mashhur Registon maydoniga ekskursiya va fotosessiya",
        "13:00 - Samarqandning mashhur to'y oshi va milliy somsalari tushligi",
        "14:30 - Shohi Zinda ziyoratgohi - moviy gumbazlar va qadimiy naqshlar siri",
        "16:30 - Bibixonim masjidi va qizg'in Siyob bozorida issiq Samarqand nonlari xaridi",
        "18:30 - Samarqand Boqiy Shahar (Silk Road Samarkand) majmuasida kechki sayr"
      ],
      ru: [
        "08:00 - Прибытие на скоростном поезде «Афросиаб» или комфортабельном транспорте",
        "09:30 - Посещение усыпальницы Гур-Эмир, рассказ о величии империи Тимуридов",
        "11:00 - Экскурсия и потрясающая фотосессия на площади Регистан",
        "13:00 - Обед: знаменитый самаркандский плов и тандырная самса",
        "14:30 - Мавзолейный комплекс Шахи Зинда — созвездие лазурных куполов",
        "16:30 - Мечеть Биби-Ханым и дегустация лепешек на Сиабском базаре",
        "18:30 - Вечерняя прогулка по комплексу «Вечный Город» (Silk Road Samarkand)"
      ],
      en: [
        "08:00 - Arrival via high-speed Afrosiyob train or comfortable vehicle",
        "09:30 - Visit Gur-e-Amir mausoleum and discover the grandeur of Timur's empire",
        "11:00 - Guided walking tour and photography at world-famous Registan Square",
        "13:00 - Lunch: renowned Samarkand wedding pilaf and crisp tandoor somsa",
        "14:30 - Shah-i Zinda necropolis — intricate cobalt mosaic masterpieces",
        "16:30 - Bibi-Khanym Mosque and sampling warm bread at vibrant Siab Bazaar",
        "18:30 - Evening leisure walk at 'Eternal City' (Silk Road Samarkand resort)"
      ]
    },
    sights: {
      uz: [
        "XIV-XV asr Temuriylar davri me'morchiligining cho'qqisi",
        "Dunyoda tengi yo'q ganchkorlik va koshinkorlik san'ati sirlari",
        "Sharqona non pishirish sirlari va qadimiy Konigil ipak qog'ozi ustaxonasi"
      ],
      ru: [
        "Вершина исламской архитектуры эпохи Тимуридов XIV–XV веков",
        "Уникальное искусство резного ганча, майолики и лазурной мозаики",
        "Традиции шелкоткачества и старинная фабрика шелковой бумаги Конигил"
      ],
      en: [
        "Pinnacle of 14th-15th century Timurid imperial architecture",
        "Incomparable majolica, gold gilding, and mosaic craftsmanship",
        "Ancient Konigil mulberry paper mill and silk carpet weaving workshops"
      ]
    },
    included: {
      uz: ["Barcha obidalarga kirish biletlari", "Shahar ichidagi qulay transport", "Samarqand choyi va shirinliklari"],
      ru: ["Входные билеты во все памятники", "Комфортабельный транспорт по городу", "Самаркандский чай и восточные сладости"],
      en: ["Admission tickets to all monuments", "Intra-city private transportation", "Samarkand herbal tea and local confections"]
    },
    notIncluded: {
      uz: ["Poyezd chiptalari (so'rovga ko'ra)", "Gid xizmati (ixtiyoriy)"],
      ru: ["Билеты на поезд (по запросу)", "Услуги гида (по желанию)"],
      en: ["Train tickets (available on request)", "Guide service (optional)"]
    }
  },
  {
    id: "buxoro",
    title: {
      uz: "Buxoroi Sharif - Qadimiy afsona",
      ru: "Благородная Бухара - Живая легенда",
      en: "Sacred Bukhara - Living Legend"
    },
    subtitle: {
      uz: "2500 yillik tirik tarix, minoralar va savdo toqlari",
      ru: "2500 лет живой истории, минареты и торговые купола",
      en: "2500 years of living history, minarets & trading domes"
    },
    badge: {
      uz: "UNESCO Merosi",
      ru: "Наследие ЮНЕСКО",
      en: "UNESCO Heritage"
    },
    badgeColor: "bg-amber-600",
    location: {
      uz: "Buxoro viloyati",
      ru: "Бухарская область",
      en: "Bukhara Region"
    },
    basePricePerPerson: 580000,
    hotelPricePerNight: 480000,
    guidePricePerDay: 200000,
    mainImage: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Bukhara_Kalyan_minaret_from_the_south.jpg",
    gallery: [
      "https://upload.wikimedia.org/wikipedia/commons/2/2a/Bukhara_Kalyan_minaret_from_the_south.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/be/Ark_fortress_in_Bukhara.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a2/Bujar%C3%A1%2C_Liab-i-Hauz_1.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/67/Ark.Bukhara.jpg"
    ],
    durationDays: [2, 3, 4],
    highlights: {
      uz: [
        "Minorai Kalon va Masjidi Kalon me'moriy ansambli",
        "Buxoro amirlarining qadimiy qarorgohi - Ark qal'asi",
        "Labi Hovuz ansambli va Nodir Devonbegi madrasasi",
        "Chor Minor va Somoniylar maqbarasi",
        "Qadimiy savdo toqlari (Toqi Zargaron, Toqi Telpakfurushon)"
      ],
      ru: [
        "Архитектурный ансамбль Пои-Калян и минарет Калян XII века",
        "Цитадель Арк — древняя резиденция бухарских эмиров",
        "Ансамбль Ляби-Хауз и медресе Нодир Диван-беги",
        "Медресе Чор-Минор и мавзолей Саманидов",
        "Старинные торговые купола (Токи Заргарон, Токи Саррофон)"
      ],
      en: [
        "Poi Kalyan complex and 12th-century Kalyan Minaret",
        "Ark Citadel — ancient majestic fortress of Bukhara emirs",
        "Lyabi-Khauz ensemble and centuries-old mulberry trees",
        "Chor Minor Madrasah and 10th-century Samanid Mausoleum",
        "Historic trading domes (Toqi Zargaron, Toqi Telpakfurushon)"
      ]
    },
    activities: {
      uz: [
        "09:00 - Labi Hovuz majmuasidan piyoda sayohatni boshlash, asriy chinorlar soyasida hordiq",
        "10:30 - Minorai Kalon va Mir Arab madrasasi bo'ylab chuqur me'moriy sayr",
        "12:30 - Ark qal'asi muzeylari va amirlik taxt xonalari bilan tanishuv",
        "14:00 - Buxoro an'anaviy palovi (Oshi so'fi) va gijduvon shashliklari bilan tushlik",
        "15:30 - Qadimiy gumbazli savdo toqlarida zardo'zlik, pichoqchilik va gilam to'qish ustalari ustaxonalari",
        "17:30 - Somoniylar maqbarasi va Chashmai Ayyub ziyoratgohi",
        "19:30 - Labi Hovuz bo'yida jonli milliy musiqa va kechki ovqat"
      ],
      ru: [
        "09:00 - Начало пешей экскурсии от исторического пруда Ляби-Хауз",
        "10:30 - Архитектурное величие ансамбля Пои-Калян и медресе Мири Араб",
        "12:30 - Цитадель Арк: тронный зал, музейные залы и монетный двор эмира",
        "14:00 - Обед: настоящий бухарский 'Оши Софи' и сочный гиждуванский шашлык",
        "15:30 - Мастерские золотого шитья, чеканки и шелковых ковров под куполами",
        "17:30 - Жемчужина кирпичного зодчества — мавзолей Саманидов",
        "19:30 - Ужин с живой музыкой у вечернего пруда Ляби-Хауз"
      ],
      en: [
        "09:00 - Start scenic walking journey from historic Lyabi-Khauz pond",
        "10:30 - Explore Poi-Kalyan ensemble and historic Mir-i Arab madrasah",
        "12:30 - Ark Fortress: Royal throne rooms, coronation court & mint museum",
        "14:00 - Traditional Bukharian lunch: 'Oshi Sofi' diet pilaf & Gijduvan kebabs",
        "15:30 - Explore gold embroidery, knife smithing and silk carpet looms in domes",
        "17:30 - Visit 10th-century Samanid brickwork mausoleum & Chashma Ayub spring",
        "19:30 - Dinner by illuminated Lyabi-Khauz with atmospheric live music"
      ]
    },
    sights: {
      uz: [
        "Islom olamining eng muqaddas va yaxlit saqlanib qolgan me'moriy ansambllari",
        "Qadimiy mudofaa devorlari va amirlar harbiy qudrati",
        "Zardo'zlik, kulolchilik va miniatyura san'atining tirik maktablari"
      ],
      ru: [
        "Один из наиболее полно сохранившихся средневековых городов Востока",
        "Древняя фортификация и многовековые легенды эмиров",
        "Живые школы бухарского золотого шитья, чеканки и миниатюры"
      ],
      en: [
        "One of the world's best-preserved authentic medieval Islamic cityscapes",
        "Ancient brick fortifications, minarets and royal palaces",
        "Living craft guilds: gold embroidery, ceramics and miniature painting"
      ]
    },
    included: {
      uz: ["Tarixiy obidalarga kirish biletlari", "Buxoro bo'ylab qulay transport", "Ziravorli an'anaviy Buxoro choyi"],
      ru: ["Входные билеты во все музеи и памятники", "Комфортабельный транспорт по городу", "Традиционный пряный бухарский чай"],
      en: ["Admission tickets to all monuments", "Private transport inside Bukhara", "Traditional Bukhara spiced herbal tea"]
    },
    notIncluded: {
      uz: ["Tarixiy hammom va shaxsiy xaridlar", "Gid xizmati (ixtiyoriy)"],
      ru: ["Посещение старинных бань и сувениры", "Услуги гида (по желанию)"],
      en: ["Historic hammam bathhouse and shopping", "Guide service (optional)"]
    }
  },
  {
    id: "xorazm",
    title: {
      uz: "Xorazm (Xiva) - Tirik Ochiq Osmon Muzeyi",
      ru: "Хорезм (Хива) - Музей под открытым небом",
      en: "Khorezm (Khiva) - Open-Air Museum"
    },
    subtitle: {
      uz: "Ertaknamo Ichan Qal'a va qadimiy Xorazm tamadduni",
      ru: "Сказочная Ичан-Кала и древняя цивилизация Хорезма",
      en: "Fairytale Ichan-Kala and ancient Khorezm civilization"
    },
    badge: {
      uz: "Ertaknamo Shahar",
      ru: "Город-сказка",
      en: "Fairytale City"
    },
    badgeColor: "bg-purple-600",
    location: {
      uz: "Xorazm viloyati, Xiva",
      ru: "Хорезмская область, Хива",
      en: "Khorezm Region, Khiva"
    },
    basePricePerPerson: 650000,
    hotelPricePerNight: 480000,
    guidePricePerDay: 200000,
    mainImage: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Kalta_Minor%2C_Khiva%2C_Uzbekistan.jpg",
    gallery: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c7/Kalta_Minor%2C_Khiva%2C_Uzbekistan.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/bb/Le_minaret_Islam_Khodja_%28Khiva%2C_Ouzb%C3%A9kistan%29_%285586414709%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/28/Kalta_Minor_Khiva_2012.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/74/Kalta_Minor.jpg"
    ],
    durationDays: [2, 3, 4],
    highlights: {
      uz: [
        "UNESCO ro'yxatidagi yaxlit qadimiy shahar - Ichan Qal'a",
        "Afsonaviy Kalta Minor va Islom Xo'ja minorasi",
        "Ko'hna Ark saroyi va Xiva xonlari zali",
        "218 ta o'ymakor yog'och ustunli Juma masjidi",
        "Xorazm lazgisi, mashhur Shivit oshi va Tuxumbarak taomlari"
      ],
      ru: [
        "Ичан-Кала — единственный полностью сохранившийся город-крепость ЮНЕСКО",
        "Изумрудный минарет Кальта-Минар и стройный минарет Ислам-Ходжа",
        "Дворец Куня-Арк и парадные покои хивинских ханов",
        "Джума-мечеть с 218 резными деревянными колоннами",
        "Зажигательный танец Лазги, суп Шивит Оши и блюдо Тухум Барак"
      ],
      en: [
        "UNESCO World Heritage living fortress city — Ichan-Kala",
        "Turquoise-tiled Kalta Minor and towering Islam Khodja minarets",
        "Kunya-Ark Citadel and royal state reception rooms of Khiva khans",
        "Juma Mosque featuring 218 unique hand-carved wooden pillars",
        "Enchanting Khorezm Lazgi dance, green dill pasta & Tukhum Barak delicacies"
      ]
    },
    activities: {
      uz: [
        "09:00 - Ichan Qal'aning Ota Darvozasidan kirib, ertaklar olamiga sayohat boshlanishi",
        "10:00 - Kalta Minor, Muhammad Aminxon madrasasi va Ko'hna Ark bo'ylab sayr",
        "12:00 - 218 ta betakror naqshli ustunlarga ega Juma masjidini ziyorat qilish",
        "13:30 - Xorazmning betakror taomlari: Shivit oshi, Tuxumbarak va qovurma baliq tushligi",
        "15:30 - Toshhovli saroyi, haramxona va Islom Xo'ja minorasining eng baland nuqtasiga chiqish",
        "17:30 - Xiva mudofaa devorlari ustida quyosh botishini tomosha qilish (eng ajoyib fotolokatsiya)",
        "19:30 - Ko'hna Ark maydonida jonli Xorazm Lazgisi va folklor kechasi"
      ],
      ru: [
        "09:00 - Вход через Ворота Ата-Дарваза: путешествие в восточную сказку",
        "10:00 - Знакомство с Кальта-Минар, медресе Мухаммад Амин-хана и Куня-Арк",
        "12:00 - Посещение уникальной Джума-мечети с резными колоннами",
        "13:30 - Аутентичный обед: хорезмский Шивит Оши, Тухум Барак и жареный судак",
        "15:30 - Дворец Таш-Хаули, гарем и подъем на смотровую минарета Ислам-Ходжа",
        "17:30 - Закат на глинобитных крепостных стенах Ичан-Калы (лучшие фото)",
        "19:30 - Фольклорный вечер и зажигательные танцы Лазги в ханском дворце"
      ],
      en: [
        "09:00 - Enter via Ata-Darvaza gate: step directly into a 1001 nights fairytale",
        "10:00 - Marvel at Kalta Minor, Muhammad Amin Khan madrasah & Kunya-Ark",
        "12:00 - Visit hypnotic Juma Mosque with its 218 unique carved wooden pillars",
        "13:30 - Authentic culinary lunch: emerald Shivit Oshi, Tukhum Barak dumplings",
        "15:30 - Tosh-Hovli stone palace, royal harem & climb Islam Khodja minaret",
        "17:30 - Watch breathtaking sunset from historic mudbrick ramparts of Ichan-Kala",
        "19:30 - Evening folklore performance and rhythmic Khorezm Lazgi dance"
      ]
    },
    sights: {
      uz: [
        "Ming yillar davomida asl holatini yo'qotmagan yagona shahar-qal'a",
        "Xorazm yog'och o'ymakorligi va ganch naqqoshligining yuksak durdonalari",
        "Qadimiy Xorazm xonlarining davlat boshqaruvi va maishiy hayoti"
      ],
      ru: [
        "Единственный полностью уцелевший средневековый город-крепость Востока",
        "Шедевры хорезмской резьбы по дереву, майолики и настенной росписи",
        "История древнего государства Хорезмшахов и быт хивинских ханов"
      ],
      en: [
        "The world's only completely intact ancient mudbrick fortress city",
        "Masterpieces of Khorezm wood carving, ceramic tiles and royal architecture",
        "Fascinating insights into the courtly life and traditions of Khiva Khans"
      ]
    },
    included: {
      uz: ["Ichan Qal'aning barcha 50 dan ortiq obidalariga kirish kartasi", "Konditsionerli qulay shaxsiy transport", "Folklor konsertiga maxsus joy"],
      ru: ["Единый билет на все 50+ музеев и памятников Ичан-Калы", "Комфортабельный транспорт с кондиционером", "Места на фольклорный концерт Лазги"],
      en: ["All-inclusive admission pass to all 50+ sites inside Ichan-Kala", "Air-conditioned private transport", "Reserved seating at evening folklore show"]
    },
    notIncluded: {
      uz: ["Minora cho'qqisiga alohida ko'tarilish chiptasi", "Gid xizmati (ixtiyoriy)"],
      ru: ["Отдельный подъем на вершину минарета", "Услуги гида (по желанию)"],
      en: ["Separate climb to minaret summit lookout", "Guide service (optional)"]
    }
  }
];

const STORAGE_KEYS = {
  TOURS: "aureon_travel_tours",
  BOOKINGS: "aureon_travel_bookings",
  TELEGRAM: "aureon_travel_telegram",
  SETTINGS: "aureon_travel_settings",
  VERSION: "aureon_data_version",
  LANG: "aureon_selected_language",
  BACKEND_URL: "aureon_backend_api_url"
};

// Backend API yordamchi funksiyalari
function getBackendBaseUrl() {
  try {
    return localStorage.getItem(STORAGE_KEYS.BACKEND_URL) || "";
  } catch (e) {
    return "";
  }
}

function setBackendBaseUrl(url) {
  try {
    if (url) localStorage.setItem(STORAGE_KEYS.BACKEND_URL, url);
    else localStorage.removeItem(STORAGE_KEYS.BACKEND_URL);
  } catch (e) {}
}

function getApiUrl(endpoint) {
  const customBase = getBackendBaseUrl();
  if (customBase) {
    return `${customBase.replace(/\/$/, '')}${endpoint}`;
  }
  if (typeof window !== "undefined" && window.location && window.location.protocol.startsWith('http')) {
    return endpoint;
  }
  return null;
}

const DEFAULT_TELEGRAM = {
  botToken: "",
  chatId: "",
  enabled: false,
  brandName: "Aureon Travel"
};

// Tilni olish va saqlash
function getSelectedLanguage() {
  try {
    const lang = localStorage.getItem(STORAGE_KEYS.LANG);
    if (lang && ["uz", "ru", "en"].includes(lang)) {
      return lang;
    }
  } catch (e) {
    console.error("Tilni yuklashda xatolik:", e);
  }
  return "uz"; // standart til: o'zbek tili
}

function saveSelectedLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  } catch (e) {
    console.error("Tilni saqlashda xatolik:", e);
  }
}

// Matnni tanlangan tilda olish uchun yordamchi funksiya
function getLocalized(fieldObj, lang = getSelectedLanguage()) {
  if (!fieldObj) return "";
  if (typeof fieldObj === "string") return fieldObj;
  return fieldObj[lang] || fieldObj["uz"] || fieldObj["ru"] || fieldObj["en"] || "";
}

function getStoredTours() {
  try {
    const currentVer = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (currentVer !== DATA_VERSION) {
      localStorage.setItem(STORAGE_KEYS.TOURS, JSON.stringify(DEFAULT_TOURS));
      localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION);
      return DEFAULT_TOURS;
    }

    const data = localStorage.getItem(STORAGE_KEYS.TOURS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Turlarni yuklashda xatolik:", e);
  }
  return DEFAULT_TOURS;
}

function saveTours(tours) {
  try {
    localStorage.setItem(STORAGE_KEYS.TOURS, JSON.stringify(tours));
  } catch (e) {
    console.error("Turlarni saqlashda xatolik:", e);
  }
}

function getStoredBookings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Buyurtmalarni yuklashda xatolik:", e);
  }
  return [];
}

function saveBookings(bookings) {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.error("Buyurtmalarni saqlashda xatolik:", e);
  }
}

// Global in-memory kesh
if (typeof window !== "undefined") {
  window._aureonTelegramCache = window._aureonTelegramCache || null;
}

function getTelegramConfig() {
  let botToken = "";
  let chatId = "";
  let enabled = false;
  let brandName = "Aureon Travel";

  // 1. In-memory kesh
  if (typeof window !== "undefined" && window._aureonTelegramCache) {
    if (window._aureonTelegramCache.botToken) botToken = window._aureonTelegramCache.botToken;
    if (window._aureonTelegramCache.chatId) chatId = window._aureonTelegramCache.chatId;
    if (window._aureonTelegramCache.enabled !== undefined) enabled = window._aureonTelegramCache.enabled;
  }

  // 2. Asosiy localStorage JSON
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TELEGRAM);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (!botToken && parsed.botToken) botToken = parsed.botToken;
        if (!chatId && parsed.chatId) chatId = parsed.chatId;
        if (parsed.enabled !== undefined) enabled = parsed.enabled;
      }
    }
  } catch (e) {}

  // 3. Fallback alohida localStorage kalitlari
  try {
    const directToken = localStorage.getItem("aureon_tg_token");
    if (!botToken && directToken) botToken = directToken;
    const directChat = localStorage.getItem("aureon_tg_chat_id");
    if (!chatId && directChat) chatId = directChat;

    const backupRaw = localStorage.getItem("aureon_telegram_config_backup");
    if (backupRaw) {
      const bParsed = JSON.parse(backupRaw);
      if (!botToken && bParsed?.botToken) botToken = bParsed.botToken;
      if (!chatId && bParsed?.chatId) chatId = bParsed.chatId;
    }
  } catch (e) {}

  // 4. sessionStorage fallback
  try {
    const sessionRaw = sessionStorage.getItem(STORAGE_KEYS.TELEGRAM);
    if (sessionRaw) {
      const sParsed = JSON.parse(sessionRaw);
      if (!botToken && sParsed?.botToken) botToken = sParsed.botToken;
      if (!chatId && sParsed?.chatId) chatId = sParsed.chatId;
    }
    const sToken = sessionStorage.getItem("aureon_tg_token");
    if (!botToken && sToken) botToken = sToken;
    const sChat = sessionStorage.getItem("aureon_tg_chat_id");
    if (!chatId && sChat) chatId = sChat;
  } catch (e) {}

  // 5. Cookie fallback (fayl / Safari protokol cheklovlari uchun)
  try {
    if (typeof document !== "undefined" && document.cookie) {
      const matchToken = document.cookie.match(/aureon_tg_token=([^;]+)/);
      if (!botToken && matchToken) botToken = decodeURIComponent(matchToken[1]);
      const matchChat = document.cookie.match(/aureon_tg_chat_id=([^;]+)/);
      if (!chatId && matchChat) chatId = decodeURIComponent(matchChat[1]);
    }
  } catch (e) {}

  const result = {
    botToken: (botToken || "").trim(),
    chatId: (chatId || "").trim(),
    enabled: !!((botToken || "").trim() && (chatId || "").trim()),
    brandName: brandName
  };

  if (typeof window !== "undefined") {
    window._aureonTelegramCache = result;
  }

  return result;
}

function saveTelegramConfig(config) {
  if (!config) return;

  const safeConfig = {
    botToken: (config.botToken || "").trim(),
    chatId: (config.chatId || "").trim(),
    enabled: config.enabled !== undefined ? config.enabled : !!((config.botToken || "").trim()),
    brandName: config.brandName || "Aureon Travel"
  };

  // 1. In-memory
  if (typeof window !== "undefined") {
    window._aureonTelegramCache = safeConfig;
  }

  // 2. Asosiy va qo'shimcha localStorage kalitlari
  try {
    localStorage.setItem(STORAGE_KEYS.TELEGRAM, JSON.stringify(safeConfig));
    if (safeConfig.botToken) localStorage.setItem("aureon_tg_token", safeConfig.botToken);
    if (safeConfig.chatId) localStorage.setItem("aureon_tg_chat_id", safeConfig.chatId);
    localStorage.setItem("aureon_telegram_config_backup", JSON.stringify(safeConfig));
  } catch (e) {
    console.error("Telegram sozlamalarini localStorage'ga saqlashda xatolik:", e);
  }

  // 3. sessionStorage
  try {
    sessionStorage.setItem(STORAGE_KEYS.TELEGRAM, JSON.stringify(safeConfig));
    if (safeConfig.botToken) sessionStorage.setItem("aureon_tg_token", safeConfig.botToken);
    if (safeConfig.chatId) sessionStorage.setItem("aureon_tg_chat_id", safeConfig.chatId);
  } catch (e) {}

  // 4. Cookie storage (1 yil muddatga)
  try {
    if (typeof document !== "undefined") {
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      if (safeConfig.botToken) {
        document.cookie = `aureon_tg_token=${encodeURIComponent(safeConfig.botToken)};expires=${exp.toUTCString()};path=/;SameSite=Lax`;
      }
      if (safeConfig.chatId) {
        document.cookie = `aureon_tg_chat_id=${encodeURIComponent(safeConfig.chatId)};expires=${exp.toUTCString()};path=/;SameSite=Lax`;
      }
    }
  } catch (e) {}
}

const DEFAULT_USD_RATE = 12800; // 1 USD = 12,800 UZS

function getExchangeRate() {
  try {
    const saved = localStorage.getItem("aureon_usd_rate");
    if (saved && !isNaN(Number(saved)) && Number(saved) > 0) {
      return Number(saved);
    }
  } catch (e) {}
  return DEFAULT_USD_RATE;
}

function saveExchangeRate(rate) {
  try {
    const num = Number(rate);
    if (num && !isNaN(num) && num > 0) {
      localStorage.setItem("aureon_usd_rate", String(num));
    }
  } catch (e) {}
}

async function persistExchangeRate(rate) {
  const num = Number(rate);
  if (!num || isNaN(num) || num <= 0) return;
  saveExchangeRate(num);

  const settingsApi = typeof getApiUrl === "function" ? getApiUrl('/api/settings') : null;
  if (settingsApi) {
    try {
      await fetch(settingsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeRate: num })
      });
    } catch (e) {
      console.warn("Backend rate saqlashda ogohlantirish:", e);
    }
  }
}

async function syncExchangeRateFromBackend() {
  const settingsApi = typeof getApiUrl === "function" ? getApiUrl('/api/settings') : null;
  if (settingsApi) {
    try {
      const res = await fetch(settingsApi);
      if (res.ok) {
        const s = await res.json();
        if (s && s.exchangeRate && Number(s.exchangeRate) > 0) {
          saveExchangeRate(Number(s.exchangeRate));
          return Number(s.exchangeRate);
        }
      }
    } catch (e) {}
  }
  return getExchangeRate();
}

function getTourTitle(tourId, lang = getSelectedLanguage()) {
  const tour = (typeof DEFAULT_TOURS !== "undefined" ? DEFAULT_TOURS : []).find(t => t.id === tourId);
  if (!tour) return "";
  return getLocalized(tour.title, lang);
}

function convertSomToUsd(amountSom) {
  const rate = getExchangeRate();
  return Math.max(1, Math.round(amountSom / rate));
}

function formatCurrency(amount, lang = getSelectedLanguage(), options = {}) {
  const somFormatted = new Intl.NumberFormat('uz-UZ').format(amount);
  const usdAmount = convertSomToUsd(amount);
  const usdFormatted = "$" + new Intl.NumberFormat('en-US').format(usdAmount);

  let somUnit = "so'm";
  if (lang === "ru") somUnit = "сум";
  if (lang === "en") somUnit = "UZS";

  if (options && options.currency === "usd") {
    return usdFormatted;
  }
  if (options && options.currency === "som") {
    return `${somFormatted} ${somUnit}`;
  }

  // Dual ko'rinish: Dollar va So'mda birgalikda
  if (lang === "en") {
    return `${usdFormatted} / ${somFormatted} UZS`;
  }
  return `${somFormatted} ${somUnit} (${usdFormatted})`;
}

function formatCurrencyUsd(amount) {
  const usdAmount = convertSomToUsd(amount);
  return "$" + new Intl.NumberFormat('en-US').format(usdAmount);
}

function formatCurrencySom(amount, lang = getSelectedLanguage()) {
  const somFormatted = new Intl.NumberFormat('uz-UZ').format(amount);
  let somUnit = "so'm";
  if (lang === "ru") somUnit = "сум";
  if (lang === "en") somUnit = "UZS";
  return `${somFormatted} ${somUnit}`;
}

// Olib ketish nuqtalari uchun oldindan belgilangan mashhur manzillar
const PICKUP_PRESETS = {
  hotel: [
    { id: "hyatt", name: { uz: "🏨 Hyatt Regency Tashkent (Navoiy shoh ko'chasi)", ru: "🏨 Hyatt Regency Tashkent (ул. Навои)", en: "🏨 Hyatt Regency Tashkent (Navoi Ave)" }, defaultVal: "Hyatt Regency Tashkent" },
    { id: "hilton", name: { uz: "🏨 Hilton Tashkent City (Toshkent Siti)", ru: "🏨 Hilton Tashkent City (Ташкент Сити)", en: "🏨 Hilton Tashkent City" }, defaultVal: "Hilton Tashkent City" },
    { id: "art_residence", name: { uz: "🏨 Art Residence", ru: "🏨 Art Residence", en: "🏨 Art Residence" }, defaultVal: "Art Residence" },
    { id: "art_city", name: { uz: "🏨 Art City Appartments", ru: "🏨 Art City Appartments", en: "🏨 Art City Appartments" }, defaultVal: "Art City Appartments" },
    { id: "intercontinental", name: { uz: "🏨 InterContinental Tashkent (Trilliant)", ru: "🏨 InterContinental Tashkent (Триллиант)", en: "🏨 InterContinental Tashkent" }, defaultVal: "InterContinental Tashkent" },
    { id: "city_palace", name: { uz: "🏨 City Palace Hotel (Amir Temur ko'chasi)", ru: "🏨 City Palace Hotel (ул. Амира Темура)", en: "🏨 City Palace Hotel Tashkent" }, defaultVal: "City Palace Hotel Tashkent" },
    { id: "wyndham", name: { uz: "🏨 Wyndham Tashkent (Amir Temur ko'chasi)", ru: "🏨 Wyndham Tashkent (ул. Амира Темура)", en: "🏨 Wyndham Tashkent" }, defaultVal: "Wyndham Tashkent Hotel" },
    { id: "lotte", name: { uz: "🏨 Lotte City Hotel Tashkent Palace", ru: "🏨 Lotte City Hotel Tashkent Palace", en: "🏨 Lotte City Hotel Tashkent Palace" }, defaultVal: "Lotte City Hotel Tashkent Palace" },
    { id: "uzbekistan", name: { uz: "🏨 Hotel Uzbekistan (Markaziy xiyobon)", ru: "🏨 Гостиница Узбекистан (Сквер)", en: "🏨 Hotel Uzbekistan (Central Square)" }, defaultVal: "Hotel Uzbekistan" },
    { id: "radisson", name: { uz: "🏨 Radisson Blu Hotel Tashkent", ru: "🏨 Radisson Blu Hotel Tashkent", en: "🏨 Radisson Blu Hotel Tashkent" }, defaultVal: "Radisson Blu Hotel Tashkent" },
    { id: "silk_road_sam", name: { uz: "🏨 Silk Road by Samarkand Regency (Samarqand)", ru: "🏨 Silk Road by Samarkand Regency (Самарканд)", en: "🏨 Silk Road by Samarkand Regency" }, defaultVal: "Silk Road Samarkand Regency" },
    { id: "custom_hotel", name: { uz: "✍️ Boshqa mehmonxona (O'zim yozaman)", ru: "✍️ Другой отель (Ввести вручную)", en: "✍️ Other Hotel (Enter manually)" }, isCustom: true }
  ],
  airport: [
    { id: "tas_t2", name: { uz: "✈️ Toshkent Xalqaro Aeroporti (Terminal 2 - Xalqaro)", ru: "✈️ Международный Аэропорт Ташкент (Терминал 2)", en: "✈️ Tashkent International Airport (Terminal 2)" }, defaultVal: "Toshkent Xalqaro Aeroporti (Terminal 2)" },
    { id: "tas_t3", name: { uz: "✈️ Toshkent Mahalliy Aeroport (Terminal 3 - Ichki reyslar)", ru: "✈️ Местный Аэропорт Ташкент (Терминал 3)", en: "✈️ Tashkent Domestic Airport (Terminal 3)" }, defaultVal: "Toshkent Mahalliy Aeroport (Terminal 3)" },
    { id: "skd", name: { uz: "✈️ Samarqand Xalqaro Aeroporti (SKD)", ru: "✈️ Международный Аэропорт Самарканд (SKD)", en: "✈️ Samarkand International Airport (SKD)" }, defaultVal: "Samarqand Xalqaro Aeroporti" },
    { id: "bhk", name: { uz: "✈️ Buxoro Xalqaro Aeroporti (BHK)", ru: "✈️ Международный Аэропорт Бухара (BHK)", en: "✈️ Bukhara International Airport (BHK)" }, defaultVal: "Buxoro Xalqaro Aeroporti" },
    { id: "ugc", name: { uz: "✈️ Urganch / Xiva Aeroporti (UGC)", ru: "✈️ Аэропорт Ургенч / Хива (UGC)", en: "✈️ Urgench / Khiva Airport (UGC)" }, defaultVal: "Urganch Xalqaro Aeroporti" },
    { id: "custom_airport", name: { uz: "✍️ Boshqa reys / aeroport (O'zim yozaman)", ru: "✍️ Другой рейс / аэропорт (Ввести вручную)", en: "✍️ Other flight / airport (Enter manually)" }, isCustom: true }
  ],
  station: [
    { id: "tas_north", name: { uz: "🚆 Toshkent Shimoliy Vokzali (Markaziy - Afrosiyob)", ru: "🚆 Северный Вокзал Ташкент (Центральный - Афросиаб)", en: "🚆 Tashkent North Railway Station (Central)" }, defaultVal: "Toshkent Shimoliy Vokzali (Markaziy)" },
    { id: "tas_south", name: { uz: "🚆 Toshkent Janubiy Vokzali (Janubiy)", ru: "🚆 Южный Вокзал Ташкент (Южный)", en: "🚆 Tashkent South Railway Station" }, defaultVal: "Toshkent Janubiy Vokzali" },
    { id: "sam_station", name: { uz: "🚆 Samarqand Temir Yo'l Vokzali", ru: "🚆 Железнодорожный Вокзал Самарканда", en: "🚆 Samarkand Railway Station" }, defaultVal: "Samarqand Temir Yo'l Vokzali" },
    { id: "bux_station", name: { uz: "🚆 Buxoro-1 (Kogon) Vokzali", ru: "🚆 Вокзал Бухара-1 (Каган)", en: "🚆 Bukhara-1 (Kagan) Railway Station" }, defaultVal: "Buxoro Temir Yo'l Vokzali" },
    { id: "khiva_station", name: { uz: "🚆 Xiva Temir Yo'l Vokzali", ru: "🚆 Железнодорожный Вокзал Хивы", en: "🚆 Khiva Railway Station" }, defaultVal: "Xiva Temir Yo'l Vokzali" },
    { id: "custom_station", name: { uz: "✍️ Boshqa poyezd / vokzal (O'zim yozaman)", ru: "✍️ Другой поезд / вокзал (Ввести вручную)", en: "✍️ Other train / station (Enter manually)" }, isCustom: true }
  ],
  custom: [
    { id: "spot_temur", name: { uz: "📍 Amir Temur xiyoboni (Hotel Uzbekistan oldi)", ru: "📍 Сквер Амира Темура (у гостиницы Узбекистан)", en: "📍 Amir Timur Square (Hotel Uzbekistan)" }, defaultVal: "Amir Temur xiyoboni (Hotel Uzbekistan oldi)" },
    { id: "spot_magic", name: { uz: "📍 Magic City asosiy kirish darvozasi", ru: "📍 Magic City (Главный вход)", en: "📍 Magic City Main Entrance" }, defaultVal: "Magic City asosiy kirish darvozasi" },
    { id: "spot_citymall", name: { uz: "📍 Tashkent City Mall asosiy kirish", ru: "📍 Tashkent City Mall (Главный вход)", en: "📍 Tashkent City Mall Entrance" }, defaultVal: "Tashkent City Mall asosiy kirish" },
    { id: "spot_mustaqillik", name: { uz: "📍 Mustaqillik maydoni (Markaziy favvora)", ru: "📍 Площадь Мустакиллик (Центральный фонтан)", en: "📍 Independence Square (Mustaqillik)" }, defaultVal: "Mustaqillik maydoni" },
    { id: "spot_registan", name: { uz: "📍 Registon maydoni kirish yo'lakchasi", ru: "📍 Площадь Регистан (Главный вход)", en: "📍 Registan Square Entrance" }, defaultVal: "Registon maydoni kirishi" },
    { id: "custom_location", name: { uz: "✍️ Boshqa shaxsiy manzil (O'zim yozaman)", ru: "✍️ Другой точный адрес (Ввести вручную)", en: "✍️ Other custom address (Enter manually)" }, isCustom: true }
  ]
};

// ==========================================
// AUREON TRAVEL - SHAHARLAR VA OB-HAVO KONSEPSIYASI
// ==========================================
const TOUR_DESTINATIONS = {
  toshkent: {
    lat: 41.3111,
    lon: 69.2797,
    name: { uz: "Toshkent shahri", ru: "Город Ташкент", en: "Tashkent City" },
    isMountain: false
  },
  amirsoy: {
    lat: 41.5167,
    lon: 70.0167,
    name: { uz: "Amirsoy va Chimyon tog'lari", ru: "Горы Амирсой и Чимган", en: "Amirsoy & Chimgan Mountains" },
    isMountain: true
  },
  toglar: {
    lat: 41.5167,
    lon: 70.0167,
    name: { uz: "Amirsoy va Chimyon tog'lari", ru: "Горы Амирсой и Чимган", en: "Amirsoy & Chimgan Mountains" },
    isMountain: true
  },
  zomin: {
    lat: 39.9608,
    lon: 68.3958,
    name: { uz: "Zomin tog' tabiati", ru: "Зааминский горный заповедник", en: "Zaamin Mountain Reserve" },
    isMountain: true
  },
  samarqand: {
    lat: 39.6542,
    lon: 66.9597,
    name: { uz: "Samarqand shahri", ru: "Город Самарканд", en: "Samarkand City" },
    isMountain: false
  },
  buxoro: {
    lat: 39.7747,
    lon: 64.4286,
    name: { uz: "Buxoro shahri", ru: "Город Бухара", en: "Bukhara City" },
    isMountain: false
  },
  xorazm: {
    lat: 41.3783,
    lon: 60.3639,
    name: { uz: "Xiva (Ichan-Qal'a)", ru: "Город Хива (Ичан-Кала)", en: "Khiva (Ichan-Kala)" },
    isMountain: false
  },
  xiva: {
    lat: 41.3783,
    lon: 60.3639,
    name: { uz: "Xiva (Ichan-Qal'a)", ru: "Город Хива (Ичан-Кала)", en: "Khiva (Ichan-Kala)" },
    isMountain: false
  }
};

function getWeatherConditionDetails(code, lang = getSelectedLanguage()) {
  const c = Number(code) || 0;
  if (c === 0) {
    return {
      icon: "☀️",
      faIcon: "fa-sun text-amber-500",
      isRain: false,
      isSnow: false,
      text: { uz: "Ochiq quyoshli", ru: "Ясно, солнечно", en: "Clear and sunny" }[lang] || "Ochiq quyoshli"
    };
  }
  if (c >= 1 && c <= 3) {
    return {
      icon: c === 1 ? "🌤" : (c === 2 ? "⛅" : "☁️"),
      faIcon: "fa-cloud-sun text-amber-400",
      isRain: false,
      isSnow: false,
      text: { uz: "Qisman bulutli, iliq", ru: "Переменная облачность", en: "Partly cloudy" }[lang] || "Qisman bulutli"
    };
  }
  if (c === 45 || c === 48) {
    return {
      icon: "🌫",
      faIcon: "fa-smog text-slate-400",
      isRain: false,
      isSnow: false,
      text: { uz: "Tumanli havo", ru: "Туман", en: "Foggy" }[lang] || "Tumanli"
    };
  }
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) {
    return {
      icon: "🌧",
      faIcon: "fa-cloud-showers-heavy text-sky-500",
      isRain: true,
      isSnow: false,
      text: { uz: "Yomg'irli ob-havo", ru: "Дождь / осадки", en: "Rain / showers" }[lang] || "Yomg'irli"
    };
  }
  if ((c >= 71 && c <= 77) || (c >= 85 && c <= 86)) {
    return {
      icon: "❄️",
      faIcon: "fa-snowflake text-sky-300",
      isRain: false,
      isSnow: true,
      text: { uz: "Qor yog'ishi kutilmoqda", ru: "Снегопад", en: "Snowfall" }[lang] || "Qor"
    };
  }
  if (c >= 95) {
    return {
      icon: "⛈",
      faIcon: "fa-cloud-bolt text-indigo-500",
      isRain: true,
      isSnow: false,
      text: { uz: "Momaqaldiroqli yomg'ir", ru: "Гроза и дождь", en: "Thunderstorm" }[lang] || "Momaqaldiroq"
    };
  }
  return {
    icon: "🌤",
    faIcon: "fa-cloud-sun text-amber-500",
    isRain: false,
    isSnow: false,
    text: { uz: "Mo'tadil havo", ru: "Умеренная погода", en: "Mild weather" }[lang] || "Mo'tadil"
  };
}

async function fetchTourWeather(tourId, targetDateStr) {
  const dest = TOUR_DESTINATIONS[tourId] || TOUR_DESTINATIONS.toshkent;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${dest.lat}&longitude=${dest.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Ob-havo serveriga ulanib bo'lmadi");
    const data = await res.json();

    if (!data || !data.daily || !data.daily.time || data.daily.time.length === 0) {
      throw new Error("Ma'lumot topilmadi");
    }

    let idx = -1;
    if (targetDateStr) {
      idx = data.daily.time.indexOf(targetDateStr);
    }
    if (idx === -1) {
      idx = 0;
    }

    const code = data.daily.weather_code[idx] || 0;
    const tempMax = Math.round(data.daily.temperature_2m_max[idx]);
    const tempMin = Math.round(data.daily.temperature_2m_min[idx]);
    const rainProb = data.daily.precipitation_probability_max ? Math.round(data.daily.precipitation_probability_max[idx]) : 0;
    const windSpeed = data.daily.wind_speed_10m_max ? Math.round(data.daily.wind_speed_10m_max[idx]) : 0;
    const date = data.daily.time[idx];

    return {
      success: true,
      destination: dest,
      date,
      wmoCode: code,
      tempMax,
      tempMin,
      rainProb,
      windSpeed,
      isMountain: dest.isMountain
    };
  } catch (err) {
    console.warn("Open-Meteo ob-havo xatolik:", err);
    return {
      success: true,
      destination: dest,
      date: targetDateStr || new Date().toISOString().split("T")[0],
      wmoCode: dest.isMountain ? 2 : 1,
      tempMax: dest.isMountain ? 18 : 25,
      tempMin: dest.isMountain ? 9 : 14,
      rainProb: 15,
      windSpeed: 10,
      isMountain: dest.isMountain
    };
  }
}

function getConciergeWeatherAdvice(weatherInfo, lang = getSelectedLanguage()) {
  const cond = getWeatherConditionDetails(weatherInfo.wmoCode, lang);
  const isRain = cond.isRain || (weatherInfo.rainProb >= 45);
  const isSnow = cond.isSnow;
  const isCold = isSnow || weatherInfo.tempMax <= 12 || (weatherInfo.isMountain && weatherInfo.tempMin <= 8);
  const isHot = weatherInfo.tempMax >= 30;

  if (isRain) {
    return {
      uz: "🌧 Sayohat kuni yomg'ir yog'ishi kutilmoqda. O'zingiz bilan albatta soyabon (zontik), yengil suv o'tkazmaydigan kurtka va sirpanmaydigan qulay poyabzal olishingizni tavsiya qilamiz.",
      ru: "🌧 В день поездки ожидаются осадки/дождь. Настоятельно рекомендуем взять с собой зонт, непромокаемую ветровку и удобную обувь для пеших прогулок.",
      en: "🌧 Rain or showers are expected on your tour day. We strongly recommend bringing an umbrella, a light waterproof jacket, and comfortable walking shoes."
    }[lang] || "";
  }

  if (isCold) {
    return {
      uz: "❄️ Tog'da havo ancha salqin/sovuq bo'lishi kutilmoqda. Qalinroq issiq kurtka, shamolga chidamli kiyim, qo'lqop va qulay issiq etik kiyib olishingizni maslahat beramiz.",
      ru: "❄️ В горной местности ожидается прохладная/холодная погода. Рекомендуем надеть теплую куртку, ветрозащитную одежду, перчатки и удобную нескользящую обувь.",
      en: "❄️ Cool or cold mountain weather is expected. We advise wearing a warm jacket, windbreaker, gloves, and sturdy comfortable boots."
    }[lang] || "";
  }

  if (isHot) {
    return {
      uz: "☀️ Havo juda quyoshli va issiq bo'ladi. Quyoshdan saqlovchi ko'zoynak, bosh kiyim (shlyapa yoki kepka), quyosh kremi olishingizni va yetarli miqdorda suv ichib yurishingizni tavsiya etamiz.",
      ru: "☀️ Ожидается солнечная и жаркая погода. Рекомендуем взять солнцезащитные очки, головной убор (панаму/кепку), крем с SPF и пить достаточное количество воды.",
      en: "☀️ Sunny and hot weather is expected. We recommend bringing sunglasses, a hat, sun protection cream, and staying well hydrated."
    }[lang] || "";
  }

  return {
    uz: "🌤 Havo ochiq va piyoda sayrlar uchun ajoyib qulay bo'ladi! Qulay sayr kiyimi va poyabzalda bo'lishingiz, unutilmas fotosuratlar uchun telefon/kamerangiz quvvatini to'ldirib olishingiz tavsiya etiladi.",
    ru: "🌤 Ожидается прекрасная ясная погода, идеальная для экскурсий и прогулок! Рекомендуем удобную одежду и обувь, а также зарядить телефон для ярких фото.",
    en: "🌤 Beautiful and pleasant weather expected, perfect for sightseeing! We suggest comfortable walking attire and charging your camera for memorable photos."
  }[lang] || "";
}
