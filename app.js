/**
 * app.js - Aureon Travel Mexmon Sayti Mantiqi (v3.5)
 * 3 ta tilda (UZ, RU, EN) to'liq ishlash: dinamik til almashtirish,
 * turlar kartochkalari, tur haqida modal oyna va buyurtmani tekshirish.
 * (Bron qilish formasi alohida sahifada: booking.html / booking.js)
 */

let activeTours = [];
let selectedTourId = null;
let currentLang = "uz";

document.addEventListener("DOMContentLoaded", async () => {
  currentLang = getSelectedLanguage();
  await syncExchangeRateFromBackend();
  activeTours = await loadTours();
  
  applyLanguage(currentLang);
  renderToursGrid(activeTours);
});

// 1. Tilni o'zgartirish funksiyasi
function setLanguage(lang) {
  if (!["uz", "ru", "en"].includes(lang)) return;
  currentLang = lang;
  saveSelectedLanguage(lang);

  applyLanguage(lang);
  renderToursGrid(activeTours);
  renderContactLinks();

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

async function searchGuestBooking() {
  const input = document.getElementById("lookup-search-input");
  const container = document.getElementById("lookup-results-container");
  if (!input || !container) return;

  const query = input.value.trim().toLowerCase();
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  if (!query) {
    container.innerHTML = `<p class="text-xs text-amber-600 font-medium p-3 bg-amber-50 rounded-xl border border-amber-200">${dict.phBookingSearch || "Iltimos, ID yoki telefon kiriting"}</p>`;
    return;
  }

  container.innerHTML = `<div class="text-center p-4 text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin text-amber-500 mr-2"></i> Qidirilmoqda...</div>`;

  let matched = [];
  const apiUrl = getApiUrl(`/api/bookings/lookup?query=${encodeURIComponent(query)}`);
  if (apiUrl) {
    try {
      const resp = await fetch(apiUrl);
      if (resp.ok) {
        matched = await resp.json();
      }
    } catch (e) {
      console.warn("Backend lookup offline, lokal qidirilmoqda:", e);
    }
  }

  if (!matched || matched.length === 0) {
    const cleanDigits = query.replace(/\D/g, "");
    const bookings = getStoredBookings();
    matched = bookings.filter(b => {
      const idMatch = (b.id || "").toLowerCase().includes(query);
      const phoneDigits = (b.guestPhone || "").replace(/\D/g, "");
      const phoneMatch = cleanDigits.length >= 7 && phoneDigits.includes(cleanDigits);
      return idMatch || phoneMatch;
    });
  }

  if (matched.length === 0) {
    container.innerHTML = `
      <div class="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
        <i class="fa-solid fa-circle-question text-3xl mb-2 text-slate-400"></i>
        <p class="text-xs font-bold text-slate-700">${dict.bookingNotFound || "Bunday buyurtma topilmadi"}</p>
        <p class="text-[11px] text-slate-400 mt-1">ID (masalan: BK-7KQ2M9XA) yoki to'liq telefon raqamni qayta tekshiring.</p>
      </div>
    `;
    return;
  }

  const weatherCards = await Promise.all(matched.map(async b => {
    let statusClass = "bg-amber-50 border-amber-200 text-amber-900";
    let statusIcon = "fa-clock text-amber-600";
    let statusText = dict.statusPending || "Kutilmoqda";
    let statusDesc = dict.statusPendingDesc || "Arizangiz qabul qilingan va administrator tomonidan ko'rib chiqilmoqda.";

    const st = (b.status || "").toLowerCase();
    const isConfirmed = st.includes("tasdiq") || st.includes("подтвержд") || st.includes("confirm");
    const isCancelled = st.includes("bekor") || st.includes("отмен") || st.includes("cancel");

    if (isConfirmed) {
      statusClass = "bg-emerald-50 border-emerald-300 text-emerald-900";
      statusIcon = "fa-circle-check text-emerald-600";
      statusText = dict.statusConfirmed || "Tasdiqlangan";
      statusDesc = dict.statusConfirmedDesc || "Arizangiz tasdiqlandi! Shaxsiy transportimiz belgilangan vaqtda xizmatingizga tayyor.";
    } else if (isCancelled) {
      statusClass = "bg-rose-50 border-rose-300 text-rose-900";
      statusIcon = "fa-circle-xmark text-rose-600";
      statusText = dict.statusCancelled || "Bekor qilingan";
      statusDesc = dict.statusCancelledDesc || "Afsuski, ushbu ariza ma'muriyat tomonidan bekor qilindi.";
    }

    const localizedTitle = (typeof getTourTitle === "function" ? getTourTitle(b.tourId, currentLang) : "") || b.tourTitleLocalized || b.tourTitle;

    let weatherBox = "";
    if (typeof fetchTourWeather === "function" && b.startDate) {
      try {
        const w = await fetchTourWeather(b.tourId, b.startDate);
        const cond = getWeatherConditionDetails(w.wmoCode, currentLang);
        const advice = getConciergeWeatherAdvice(w, currentLang);
        const wHeader = currentLang === "ru" ? "Прогноз погоды и советы консьержа" 
                      : currentLang === "en" ? "Tour day weather & concierge tips" 
                      : "Sayohat kuni ob-havo va konsyerj tavsiyasi";
        const tempText = `${w.tempMin > 0 ? '+' : ''}${w.tempMin}°C ... ${w.tempMax > 0 ? '+' : ''}${w.tempMax}°C`;

        weatherBox = `
          <div class="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-sky-50 via-blue-50/70 to-amber-50/60 border border-sky-200 text-xs space-y-1">
            <div class="flex items-center justify-between font-bold">
              <span class="flex items-center gap-1.5 text-sky-950 text-[11px]">
                <span class="text-sm">${cond.icon}</span>
                <span>${wHeader}:</span>
              </span>
              <span class="text-[10px] bg-white px-2 py-0.5 rounded-full border border-sky-200 shadow-xs font-black text-slate-800">
                ${tempText}
              </span>
            </div>
            <p class="text-[11px] text-slate-700 leading-relaxed font-medium">
              ${advice}
            </p>
          </div>
        `;
      } catch (err) {}
    }

    return `
      <div class="p-4 rounded-2xl border ${statusClass} space-y-2 text-xs">
        <div class="flex items-center justify-between pb-2 border-b border-black/10">
          <span class="font-mono font-black text-sm text-slate-900">${b.id}</span>
          <span class="font-bold px-2.5 py-0.5 rounded-full bg-white shadow-sm flex items-center gap-1 text-[11px]">
            <i class="fa-solid ${statusIcon}"></i> ${statusText}
          </span>
        </div>
        <div class="font-bold text-slate-900 text-sm">${localizedTitle}</div>
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
          <div>📅 ${dict.sumDate || 'Sana:'} <strong>${b.startDate}</strong></div>
          <div>⏳ ${b.durationDays} ${dict.daysLabel || 'kun'} (${b.nights || 0} ${dict.nightsLabel || 'kecha'})</div>
          <div>👤 ${b.guestName}</div>
          <div>💰 <strong>${formatCurrency(b.totalPrice, currentLang)}</strong></div>
        </div>
        <p class="text-[11px] leading-relaxed pt-2 border-t border-black/10 font-medium text-slate-600">
          ${statusDesc}
        </p>
        ${weatherBox}
      </div>
    `;
  }));

  container.innerHTML = weatherCards.join("");
}
