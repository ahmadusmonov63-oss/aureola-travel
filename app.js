/**
 * app.js - Aureon Travel Mexmon Sayti Mantiqi (v3.5)
 * 3 ta tilda (UZ, RU, EN) to'liq ishlash: dinamik til almashtirish,
 * turlar kartochkalari, modal oyna, real-vaqt narx kalkulyatori va Telegram xabarnoma
 */

let activeTours = [];
let selectedTourId = null;
let currentLang = "uz";

document.addEventListener("DOMContentLoaded", () => {
  currentLang = getSelectedLanguage();
  activeTours = getStoredTours();
  
  applyLanguage(currentLang);
  renderToursGrid(activeTours);
  initBookingForm();
  calculatePrice();
});

// 1. Tilni o'zgartirish funksiyasi
function setLanguage(lang) {
  if (!["uz", "ru", "en"].includes(lang)) return;
  currentLang = lang;
  saveSelectedLanguage(lang);

  applyLanguage(lang);
  renderToursGrid(activeTours);
  updateTourSelectOptions();
  calculatePrice();

  // Agar batafsil modal ochiq bo'lsa uni ham yangilash
  const modal = document.getElementById("tour-modal");
  if (modal && !modal.classList.contains("hidden") && selectedTourId) {
    openTourModal(selectedTourId);
  }
}

// Interfeys matnlarini tanlangan tilga o'tkazish
function applyLanguage(lang) {
  const dict = UI_STRINGS[lang] || UI_STRINGS.uz;

  // 1. Tugmalar holatini yangilash
  ["uz", "ru", "en"].forEach(l => {
    const btn = document.getElementById(`lang-btn-${l}`);
    if (btn) {
      if (l === lang) {
        btn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-white text-slate-900 shadow-sm flex items-center gap-1.5";
      } else {
        btn.className = "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1.5";
      }
    }
  });

  // 2. data-i18n atributiga ega barcha matnlarni almashtirish
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // 3. Form input placeholderlarini yangilash
  const nameInput = document.getElementById("guest-name");
  if (nameInput && dict.phName) nameInput.placeholder = dict.phName;

  const roomInput = document.getElementById("room-number");
  if (roomInput && dict.phRoom) roomInput.placeholder = dict.phRoom;

  const noteInput = document.getElementById("guest-note");
  if (noteInput && dict.phNote) noteInput.placeholder = dict.phNote;

  // 4. Davomiylik opsiyalari matnini yangilash
  const durationSelect = document.getElementById("duration-select");
  if (durationSelect && durationSelect.options.length >= 4) {
    durationSelect.options[0].text = dict.dur1;
    durationSelect.options[1].text = dict.dur2;
    durationSelect.options[2].text = dict.dur3;
    durationSelect.options[3].text = dict.dur4;
  }
}

// 2. Turlar kartochkalarini chiqarish (Grid)
function renderToursGrid(tours) {
  const grid = document.getElementById("tours-grid");
  if (!grid) return;

  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  grid.innerHTML = "";

  tours.forEach(tour => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col justify-between group";

    const titleText = getLocalized(tour.title, currentLang);
    const subtitleText = getLocalized(tour.subtitle, currentLang);
    const badgeText = getLocalized(tour.badge, currentLang);
    const locationText = getLocalized(tour.location, currentLang);

    const highlightsArray = getLocalized(tour.highlights, currentLang) || [];
    const highlightsHtml = highlightsArray.slice(0, 3).map(h => 
      `<li class="flex items-center gap-2 text-xs text-slate-600"><i class="fa-solid fa-check text-emerald-500 text-xs"></i> <span>${h}</span></li>`
    ).join("");

    card.innerHTML = `
      <!-- Rasm va Badge -->
      <div>
        <div class="relative h-56 overflow-hidden cursor-pointer" onclick="openTourModal('${tour.id}')">
          <img src="${tour.mainImage}" alt="${titleText}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
          <span class="absolute top-4 left-4 ${tour.badgeColor || 'bg-amber-500'} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            ${badgeText || 'Tavsiya'}
          </span>
          <div class="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
            <span class="text-xs font-medium flex items-center gap-1.5"><i class="fa-solid fa-location-dot text-amber-400"></i> ${locationText}</span>
            <span class="text-xs bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20"><i class="fa-solid fa-images"></i> (${tour.gallery ? tour.gallery.length : 1})</span>
          </div>
        </div>

        <!-- Matn va Ma'lumot -->
        <div class="p-5">
          <h3 class="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-1 cursor-pointer" onclick="openTourModal('${tour.id}')">
            ${titleText}
          </h3>
          <p class="text-xs text-slate-500 mb-4 line-clamp-2">${subtitleText}</p>

          <ul class="space-y-1.5 mb-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            ${highlightsHtml}
          </ul>
        </div>
      </div>

      <div class="p-5 pt-0">
        <!-- Narx -->
        <div class="flex items-baseline justify-between py-2 border-t border-slate-100 mb-4">
          <span class="text-xs text-slate-500">${dict.perPerson}</span>
          <div class="text-right">
            <span class="text-base font-extrabold text-amber-600">${formatCurrency(tour.basePricePerPerson, currentLang)}</span>
            <span class="text-[10px] text-slate-400 block">${dict.startFrom}</span>
          </div>
        </div>

        <!-- Tugmalar -->
        <div class="grid grid-cols-2 gap-2">
          <button onclick="openTourModal('${tour.id}')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-circle-info text-brand-600"></i>
            <span>${dict.btnDetails}</span>
          </button>
          <button onclick="selectTourForBooking('${tour.id}')" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-check"></i>
            <span>${dict.btnSelect}</span>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// 3. Batafsil modalni ochish
function openTourModal(tourId) {
  selectedTourId = tourId;
  const tour = activeTours.find(t => t.id === tourId);
  if (!tour) return;

  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  const modal = document.getElementById("tour-modal");
  const content = document.getElementById("modal-content");

  const titleText = getLocalized(tour.title, currentLang);
  const badgeText = getLocalized(tour.badge, currentLang);
  const locationText = getLocalized(tour.location, currentLang);

  // Galereya miniatyuralari
  const galleryThumbnails = (tour.gallery || [tour.mainImage]).map((img, idx) => `
    <img src="${img}" alt="Foto ${idx+1}" referrerpolicy="no-referrer" onclick="changeModalHeroImage('${img}')" class="w-20 h-14 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-amber-500 transition-all">
  `).join("");

  // Reja (Activities)
  const activitiesArray = getLocalized(tour.activities, currentLang) || [];
  const activitiesHtml = activitiesArray.map(act => `
    <div class="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
      <div class="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
      <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">${act}</p>
    </div>
  `).join("");

  // Nimalar bilan tanishadi (Sights)
  const sightsArray = getLocalized(tour.sights, currentLang) || [];
  const sightsHtml = sightsArray.map(s => `
    <li class="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
      <i class="fa-solid fa-landmark text-brand-600 mt-1 shrink-0"></i>
      <span>${s}</span>
    </li>
  `).join("");

  // Kiritilgan xizmatlar (Included)
  const includedArray = getLocalized(tour.included, currentLang) || [];
  const includedHtml = includedArray.map(inc => `
    <div class="flex items-center gap-2 text-xs text-emerald-700 font-medium">
      <i class="fa-solid fa-circle-check text-emerald-500"></i>
      <span>${inc}</span>
    </div>
  `).join("");

  content.innerHTML = `
    <!-- Modal Hero Image -->
    <div class="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900 rounded-t-3xl">
      <img id="modal-hero-img" src="${tour.mainImage}" alt="${titleText}" referrerpolicy="no-referrer" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30"></div>
      
      <div class="absolute bottom-5 left-5 right-5 text-white">
        <span class="inline-block ${tour.badgeColor || 'bg-amber-500'} text-xs font-bold px-3 py-1 rounded-full mb-2">
          ${badgeText || 'Yo\'nalish'}
        </span>
        <h2 class="text-xl sm:text-3xl font-black">${titleText}</h2>
        <p class="text-xs sm:text-sm text-slate-200 mt-1 flex items-center gap-2">
          <i class="fa-solid fa-location-dot text-amber-400"></i> ${locationText}
        </p>
      </div>
    </div>

    <!-- Rasmlar Galereyasi -->
    <div class="px-6 py-3 bg-slate-100 flex items-center gap-3 overflow-x-auto border-b border-slate-200">
      <span class="text-xs font-bold text-slate-500 uppercase shrink-0"><i class="fa-solid fa-images"></i> <span data-i18n="modalGallery">${dict.modalGallery || "Galereya:"}</span></span>
      ${galleryThumbnails}
    </div>

    <!-- Modal Matn Qismi -->
    <div class="p-6 sm:p-8 space-y-6">
      
      <!-- 1. Sayohat rejasi -->
      <div>
        <h4 class="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <i class="fa-solid fa-calendar-day text-amber-500"></i>
          <span>${dict.modalActivities}</span>
        </h4>
        <div class="space-y-2">
          ${activitiesHtml}
        </div>
      </div>

      <!-- 2. Nimalar bilan tanishadi -->
      <div>
        <h4 class="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <i class="fa-solid fa-compass text-brand-600"></i>
          <span>${dict.modalSights}</span>
        </h4>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
          ${sightsHtml}
        </ul>
      </div>

      <!-- 3. Kiritilgan xizmatlar va narxlar -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div class="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
          <h5 class="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">${dict.modalIncluded}</h5>
          <div class="space-y-1.5">
            ${includedHtml}
          </div>
        </div>

        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">${dict.modalTariffs}</h5>
            <div class="text-sm text-slate-600">
              ${dict.modalBase} <strong class="text-slate-900">${formatCurrency(tour.basePricePerPerson, currentLang)}</strong> ${dict.modalPerPerson}
            </div>
            <div class="text-sm text-slate-600 mt-1">
              ${dict.modalHotel} <strong class="text-slate-900">${formatCurrency(tour.hotelPricePerNight, currentLang)}</strong> ${dict.modalPerNight}
            </div>
            <div class="text-sm text-slate-600 mt-1">
              ${dict.modalGuide} <strong class="text-sky-700">${formatCurrency(tour.guidePricePerDay || 200000, currentLang)}</strong> ${dict.modalPerDay}
            </div>
          </div>
          
          <button onclick="selectTourForBooking('${tour.id}'); closeTourModal();" class="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
            <i class="fa-solid fa-calendar-check"></i>
            <span>${dict.modalBtnSelect}</span>
          </button>
        </div>
      </div>

    </div>
  `;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function changeModalHeroImage(src) {
  const hero = document.getElementById("modal-hero-img");
  if (hero) hero.src = src;
}

function closeTourModal() {
  const modal = document.getElementById("tour-modal");
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

// 4. Turni alohida bron qilish sahifasiga yo'naltirish
function selectTourForBooking(tourId) {
  if (tourId) {
    window.location.href = `booking.html?tour=${encodeURIComponent(tourId)}`;
  } else {
    window.location.href = "booking.html";
  }
}

function updateTourSelectOptions() {
  const tourSelect = document.getElementById("tour-select");
  if (!tourSelect) return;

  const currentVal = tourSelect.value || selectedTourId;
  tourSelect.innerHTML = activeTours.map(t => `<option value="${t.id}">${getLocalized(t.title, currentLang)}</option>`).join("");
  
  if (currentVal && activeTours.some(t => t.id === currentVal)) {
    tourSelect.value = currentVal;
  }
}

// 5. Bron formasini boshlash (agar mavjud bo'lsa)
function initBookingForm() {
  const bookingForm = document.getElementById("booking-form");
  if (!bookingForm) return;

  const tourSelect = document.getElementById("tour-select");
  const durationSelect = document.getElementById("duration-select");
  const adultsInput = document.getElementById("adults-count");
  const childrenInput = document.getElementById("children-count");
  const startDateInput = document.getElementById("start-date");
  const hotelOptionRadios = document.querySelectorAll('input[name="hotel-option"]');
  const guideOptionRadios = document.querySelectorAll('input[name="guide-option"]');

  updateTourSelectOptions();

  if (tourSelect) {
    if (activeTours.length > 0 && !selectedTourId) {
      tourSelect.value = activeTours[0].id;
      selectedTourId = activeTours[0].id;
    }

    tourSelect.addEventListener("change", (e) => {
      selectedTourId = e.target.value;
      calculatePrice();
    });
  }

  if (startDateInput) {
    const today = new Date().toISOString().split("T")[0];
    startDateInput.min = today;
    startDateInput.value = today;
    startDateInput.addEventListener("change", calculatePrice);
  }

  if (durationSelect) {
    durationSelect.addEventListener("change", () => {
      handleDurationChange();
      calculatePrice();
    });
  }

  if (adultsInput) adultsInput.addEventListener("input", calculatePrice);
  if (childrenInput) childrenInput.addEventListener("input", calculatePrice);

  hotelOptionRadios.forEach(radio => {
    radio.addEventListener("change", calculatePrice);
  });

  guideOptionRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      handleGuideOptionChange();
      calculatePrice();
    });
  });

  if (bookingForm) {
    bookingForm.addEventListener("submit", handleBookingSubmit);
  }

  handleDurationChange();
  handleGuideOptionChange();
}

function handleDurationChange() {
  const duration = parseInt(document.getElementById("duration-select")?.value || "1");
  const hotelContainer = document.getElementById("hotel-option-container");
  const hotelHint = document.getElementById("hotel-hint");

  if (!hotelContainer) return;

  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;

  if (duration === 1) {
    hotelContainer.classList.add("opacity-50", "pointer-events-none");
    if (hotelHint) {
      hotelHint.textContent = currentLang === "ru" ? "1-дневный тур проходит только днем (без отеля)" 
                            : currentLang === "en" ? "1-day tour is a day trip only (no hotel needed)"
                            : "1 kunlik tur faqat kunduzi o'tkaziladi (otelsiz)";
    }
    const withoutHotelRadio = document.querySelector('input[name="hotel-option"][value="without-hotel"]');
    if (withoutHotelRadio) withoutHotelRadio.checked = true;
  } else {
    hotelContainer.classList.remove("opacity-50", "pointer-events-none");
    const nights = duration - 1;
    if (hotelHint) {
      hotelHint.textContent = currentLang === "ru" ? `Выберите вариант отеля для ${nights} ноч.` 
                            : currentLang === "en" ? `Select hotel option for ${nights} night(s)`
                            : `${nights} kecha uchun otel variantini tanlang`;
    }
  }
}

function handleGuideOptionChange() {
  const guideOption = document.querySelector('input[name="guide-option"]:checked')?.value || "with-guide";
  const guideLangBox = document.getElementById("guide-lang-box");
  const guideLangSelect = document.getElementById("guide-language");

  if (!guideLangBox) return;

  if (guideOption === "without-guide") {
    guideLangBox.classList.add("opacity-40", "pointer-events-none");
    if (guideLangSelect) guideLangSelect.disabled = true;
  } else {
    guideLangBox.classList.remove("opacity-40", "pointer-events-none");
    if (guideLangSelect) guideLangSelect.disabled = false;
  }
}

// 6. Narxni hisoblash (Kalkulyator)
function calculatePrice() {
  const priceDisplay = document.getElementById("total-price-display");
  if (!priceDisplay) return;

  const tourSelect = document.getElementById("tour-select");
  const durationSelect = document.getElementById("duration-select");
  const adultsInput = document.getElementById("adults-count");
  const childrenInput = document.getElementById("children-count");
  const hotelOption = document.querySelector('input[name="hotel-option"]:checked')?.value || "without-hotel";
  const guideOption = document.querySelector('input[name="guide-option"]:checked')?.value || "with-guide";
  const breakdownDisplay = document.getElementById("price-breakdown-text");

  const tourId = tourSelect?.value || selectedTourId;
  const tour = activeTours.find(t => t.id === tourId);

  if (!tour) return;

  const durationDays = parseInt(durationSelect?.value || "1");
  const adults = Math.max(1, parseInt(adultsInput?.value || "1"));
  const children = Math.max(0, parseInt(childrenInput?.value || "0"));

  let dayFactor = 1;
  if (durationDays === 2) dayFactor = 1.85;
  if (durationDays === 3) dayFactor = 2.65;
  if (durationDays === 4) dayFactor = 3.4;

  const personBase = (adults * tour.basePricePerPerson) + (children * tour.basePricePerPerson * 0.5);
  const totalBaseTourCost = Math.round(personBase * dayFactor);

  let hotelTotalCost = 0;
  const nights = durationDays > 1 ? durationDays - 1 : 0;
  const roomsNeeded = Math.ceil(adults / 2);

  if (nights > 0 && hotelOption === "with-hotel") {
    hotelTotalCost = nights * roomsNeeded * tour.hotelPricePerNight;
  }

  let guideTotalCost = 0;
  const guidePerDay = tour.guidePricePerDay || 200000;
  if (guideOption === "with-guide") {
    guideTotalCost = durationDays * guidePerDay;
  }

  const grandTotal = totalBaseTourCost + hotelTotalCost + guideTotalCost;

  if (priceDisplay) {
    priceDisplay.textContent = formatCurrency(grandTotal, currentLang);
  }

  if (breakdownDisplay) {
    let breakdownText = "";
    if (currentLang === "ru") {
      const hotelText = (nights > 0 && hotelOption === "with-hotel") ? ` | С отелем (${nights} ноч.)` : ` | Без отеля`;
      const guideText = guideOption === "with-guide" ? ` | С гидом` : ` | Без гида`;
      breakdownText = `${adults} взр.${children > 0 ? `, ${children} дет.` : ''} | ${durationDays} дн.${guideText}${hotelText}`;
    } else if (currentLang === "en") {
      const hotelText = (nights > 0 && hotelOption === "with-hotel") ? ` | With hotel (${nights} nts)` : ` | No hotel`;
      const guideText = guideOption === "with-guide" ? ` | With guide` : ` | Self-guided`;
      breakdownText = `${adults} adult(s)${children > 0 ? `, ${children} child` : ''} | ${durationDays} day(s)${guideText}${hotelText}`;
    } else {
      const hotelText = (nights > 0 && hotelOption === "with-hotel") ? ` | Otel bilan (${nights} kecha)` : ` | Otelsiz`;
      const guideText = guideOption === "with-guide" ? ` | Gid bilan` : ` | Gidsiz`;
      breakdownText = `${adults} katta${children > 0 ? `, ${children} bola` : ''} | ${durationDays} kunlik${guideText}${hotelText}`;
    }
    breakdownDisplay.textContent = breakdownText;
  }

  return { grandTotal, durationDays, adults, children, hotelOption, guideOption, nights, roomsNeeded, tour };
}

// 7. Bron arizasini yuborish
async function handleBookingSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submit-booking-btn");
  const calc = calculatePrice();
  if (!calc || !calc.tour) return;

  const guestName = document.getElementById("guest-name")?.value.trim();
  const guestPhone = document.getElementById("guest-phone")?.value.trim();
  const roomNumber = document.getElementById("room-number")?.value.trim() || (currentLang === "ru" ? "Не указана" : currentLang === "en" ? "Not specified" : "Ko'rsatilmadi");
  const startDate = document.getElementById("start-date")?.value;
  const guideLanguage = calc.guideOption === "with-guide" 
    ? (document.getElementById("guide-language")?.value || currentLang) 
    : "Gidsiz";
  const guestNote = document.getElementById("guest-note")?.value.trim() || (currentLang === "ru" ? "Нет" : currentLang === "en" ? "None" : "Yo'q");

  if (!guestName || !guestPhone || !startDate) {
    alert(currentLang === "ru" ? "Пожалуйста, заполните ваше имя, номер телефона и дату!" 
        : currentLang === "en" ? "Please fill in your name, phone number, and start date!"
        : "Iltimos, ismingiz, telefon raqamingiz va sanani to'liq kiriting!");
    return;
  }

  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${dict.submitting || 'Yuborilmoqda...'}</span>`;
  }

  const bookingId = "AT-" + Math.floor(100000 + Math.random() * 900000);
  const now = new Date();
  const timestamp = now.toLocaleString(currentLang === "ru" ? "ru-RU" : currentLang === "en" ? "en-US" : "uz-UZ");

  const newBooking = {
    id: bookingId,
    timestamp: timestamp,
    tourId: calc.tour.id,
    tourTitle: getLocalized(calc.tour.title, "uz"), // saqlash uchun
    tourTitleLocalized: getLocalized(calc.tour.title, currentLang),
    location: getLocalized(calc.tour.location, currentLang),
    guestName: guestName,
    guestPhone: guestPhone,
    roomNumber: roomNumber,
    startDate: startDate,
    durationDays: calc.durationDays,
    hotelOption: calc.hotelOption === "with-hotel" ? "Otel bilan" : "Otelsiz",
    guideOption: calc.guideOption === "with-guide" ? "Gid bilan" : "Gidsiz",
    nights: calc.nights,
    adults: calc.adults,
    children: calc.children,
    guideLanguage: guideLanguage,
    clientLang: currentLang,
    note: guestNote,
    totalPrice: calc.grandTotal,
    status: "Yangi"
  };

  // 1. Saqlash
  const bookings = getStoredBookings();
  bookings.unshift(newBooking);
  saveBookings(bookings);

  // 2. Telegram Botga xabar yuborish
  await sendTelegramNotification(newBooking);

  // 3. Muvaffaqiyatli modalni ochish
  showSuccessModal(newBooking);

  // 4. Formani tiklash
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane text-lg"></i> <span>${dict.btnSubmit}</span>`;
  }
}

// 8. Telegram Bot orqali menejerga xabar yuborish
async function sendTelegramNotification(booking) {
  const config = getTelegramConfig();
  if (!config || !config.botToken || !config.chatId) {
    console.log("Telegram sozlamalari kiritilmagan. Buyurtma admin panelda saqlandi.");
    return false;
  }

  const langFlags = {
    uz: "🇺🇿 O'zbekcha",
    ru: "🇷🇺 Русский",
    en: "🇬🇧 English"
  };

  const guideLangLabels = {
    uz: "O'zbek tili",
    ru: "Rus tili",
    en: "Ingliz tili",
    tr: "Turk tili",
    "Gidsiz": "Gidsiz (Mustaqil)"
  };

  const guideInfo = booking.guideOption === "Gid bilan"
    ? `Ha (${guideLangLabels[booking.guideLanguage] || booking.guideLanguage})`
    : `Yo'q (Mustaqil sayohat)`;

  const messageText = 
`✈️ *AUREON TRAVEL - YANGI TUR BUYURTMASI!*
━━━━━━━━━━━━━━━━━━━━
🆔 *ID:* \`${booking.id}\`
🌐 *Mijoz tili:* *${langFlags[booking.clientLang] || booking.clientLang}*
👤 *Mehmon:* *${booking.guestName}*
📞 *Telefon:* *${booking.guestPhone}*
🚪 *Xona:* ${booking.roomNumber}
━━━━━━━━━━━━━━━━━━━━
📍 *Yo'nalish:* *${booking.tourTitleLocalized || booking.tourTitle}*
📅 *Sana:* ${booking.startDate}
⏳ *Davomiyligi:* ${booking.durationDays} kun (${booking.nights} kecha)
🏨 *Otel:* *${booking.hotelOption}*
🗣 *Gid xizmati:* *${guideInfo}*
👥 *Sayohatchilar:* ${booking.adults} katta${booking.children > 0 ? `, ${booking.children} bola` : ''}
💰 *Jami hisob:* *${formatCurrency(booking.totalPrice, "uz")}*
💱 *Valyuta kursi:* 1 USD ≈ ${new Intl.NumberFormat('uz-UZ').format(getExchangeRate())} UZS
📝 *Izoh:* ${booking.note}
━━━━━━━━━━━━━━━━━━━━
⏱ *Qabul vaqti:* ${booking.timestamp}`;

  try {
    const url = `https://api.telegram.org/bot${encodeURIComponent(config.botToken)}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: messageText,
        parse_mode: "Markdown"
      })
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error("Telegramga yuborishda xatolik:", err);
    return false;
  }
}

// 9. Muvaffaqiyat modalini ko'rsatish
function showSuccessModal(booking) {
  const modal = document.getElementById("success-modal");
  const details = document.getElementById("success-modal-details");
  if (!modal || !details) return;

  const lblId = currentLang === "ru" ? "Номер брони:" : currentLang === "en" ? "Booking ID:" : "Buyurtma ID:";
  const lblTour = currentLang === "ru" ? "Направление:" : currentLang === "en" ? "Tour:" : "Yo'nalish:";
  const lblGuest = currentLang === "ru" ? "Гость:" : currentLang === "en" ? "Guest:" : "Mehmon:";
  const lblRoom = currentLang === "ru" ? "Комната:" : currentLang === "en" ? "Room:" : "Xona:";
  const lblPhone = currentLang === "ru" ? "Телефон:" : currentLang === "en" ? "Phone:" : "Telefon:";
  const lblGuide = currentLang === "ru" ? "Гид:" : currentLang === "en" ? "Guide:" : "Gid xizmati:";
  const lblDate = currentLang === "ru" ? "Дата начала:" : currentLang === "en" ? "Start Date:" : "Sana:";
  const lblTotal = currentLang === "ru" ? "Итого:" : currentLang === "en" ? "Total:" : "Jami hisob:";

  details.innerHTML = `
    <div><strong>${lblId}</strong> <span class="text-amber-600 font-bold">${booking.id}</span></div>
    <div><strong>${lblTour}</strong> ${booking.tourTitleLocalized || booking.tourTitle}</div>
    <div><strong>${lblGuest}</strong> ${booking.guestName} (${lblRoom} ${booking.roomNumber})</div>
    <div><strong>${lblPhone}</strong> ${booking.guestPhone}</div>
    <div><strong>${lblGuide}</strong> ${booking.guideOption}</div>
    <div><strong>${lblDate}</strong> ${booking.startDate} (${booking.durationDays} kun/дн/days, ${booking.hotelOption})</div>
    <div><strong>${lblTotal}</strong> <span class="font-bold text-slate-900">${formatCurrency(booking.totalPrice, currentLang)}</span></div>
  `;

  modal.classList.remove("hidden");
}

function closeSuccessModal() {
  const modal = document.getElementById("success-modal");
  if (modal) modal.classList.add("hidden");
  document.getElementById("booking-form")?.reset();
  calculatePrice();
}

// GUEST BOOKING LOOKUP MODAL
function openBookingLookupModal() {
  const modal = document.getElementById("booking-lookup-modal");
  const input = document.getElementById("lookup-search-input");
  const container = document.getElementById("lookup-results-container");
  if (!modal) return;
  if (container) container.innerHTML = "";
  if (input) {
    const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
    if (dict.phBookingSearch) input.placeholder = dict.phBookingSearch;
    input.value = "";
  }
  modal.classList.remove("hidden");
  setTimeout(() => input?.focus(), 100);
}

function closeBookingLookupModal() {
  const modal = document.getElementById("booking-lookup-modal");
  if (modal) modal.classList.add("hidden");
}

function searchGuestBooking() {
  const input = document.getElementById("lookup-search-input");
  const container = document.getElementById("lookup-results-container");
  if (!input || !container) return;

  const query = input.value.trim().toLowerCase();
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  if (!query) {
    container.innerHTML = `<p class="text-xs text-amber-600 font-medium p-3 bg-amber-50 rounded-xl border border-amber-200">${dict.phBookingSearch || "Iltimos, ID yoki telefon kiriting"}</p>`;
    return;
  }

  const cleanDigits = query.replace(/\D/g, "");
  const bookings = getStoredBookings();
  const matched = bookings.filter(b => {
    const idMatch = (b.id || "").toLowerCase().includes(query);
    const phoneDigits = (b.guestPhone || "").replace(/\D/g, "");
    const phoneMatch = cleanDigits.length >= 7 && phoneDigits.includes(cleanDigits);
    return idMatch || phoneMatch;
  });

  if (matched.length === 0) {
    container.innerHTML = `
      <div class="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
        <i class="fa-solid fa-circle-question text-3xl mb-2 text-slate-400"></i>
        <p class="text-xs font-bold text-slate-700">${dict.bookingNotFound || "Bunday buyurtma topilmadi"}</p>
        <p class="text-[11px] text-slate-400 mt-1">ID (masalan: BK-123456) yoki to'liq telefon raqamni qayta tekshiring.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = matched.map(b => {
    let statusClass = "bg-amber-50 border-amber-200 text-amber-900";
    let statusIcon = "fa-clock text-amber-600";
    let statusText = dict.statusPending || "Kutilmoqda";
    let statusDesc = dict.statusPendingDesc || "Arizangiz qabul qilingan va administrator tomonidan ko'rib chiqilmoqda.";

    if (b.status === "Tasdiqlandi") {
      statusClass = "bg-emerald-50 border-emerald-300 text-emerald-900";
      statusIcon = "fa-circle-check text-emerald-600";
      statusText = dict.statusConfirmed || "Tasdiqlandi";
      statusDesc = dict.statusConfirmedDesc || "Arizangiz tasdiqlandi! Tez orada qulay transfer sizni kutib oladi.";
    } else if (b.status === "Bekor qilindi") {
      statusClass = "bg-rose-50 border-rose-300 text-rose-900";
      statusIcon = "fa-circle-xmark text-rose-600";
      statusText = dict.statusCancelled || "Bekor qilindi";
      statusDesc = dict.statusCancelledDesc || "Afsuski, ushbu ariza bekor qilingan.";
    }

    return `
      <div class="p-4 rounded-2xl border ${statusClass} space-y-2 text-xs">
        <div class="flex items-center justify-between pb-2 border-b border-black/10">
          <span class="font-mono font-black text-sm text-slate-900">${b.id}</span>
          <span class="font-bold px-2.5 py-0.5 rounded-full bg-white shadow-sm flex items-center gap-1 text-[11px]">
            <i class="fa-solid ${statusIcon}"></i> ${statusText}
          </span>
        </div>
        <div class="font-bold text-slate-900 text-sm">${b.tourTitleLocalized || b.tourTitle}</div>
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
          <div>📅 ${dict.sumDate || 'Sana:'} <strong>${b.startDate}</strong></div>
          <div>⏳ ${b.durationDays} ${dict.daysLabel || 'kun'} (${b.nights || 0} ${dict.nightsLabel || 'kecha'})</div>
          <div>👤 ${b.guestName}</div>
          <div>💰 <strong>${formatCurrency(b.totalPrice, currentLang)}</strong></div>
        </div>
        <p class="text-[11px] leading-relaxed pt-2 border-t border-black/10 font-medium text-slate-600">
          ${statusDesc}
        </p>
      </div>
    `;
  }).join("");
}
