/**
 * admin.js - Aureon Travel Admin Boshqaruv Markazi Mantiqi
 * Buyurtmalarni boshqarish, turlar, narxlar va rasmlarni tahrirlash, Telegram sozlamalari
 */

let allBookings = [];
let allTours = [];
let currentFilter = "all";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  setupTelegramConfig();
  setupEmailConfig();
  updateRateDisplay();

  // Oxirgi tanlangan tabni avtomatik ochish (sahifa yangilanganda ham shu tabda qoladi)
  try {
    const savedTab = localStorage.getItem("aureon_active_admin_tab");
    if (savedTab && document.getElementById(savedTab)) {
      switchTab(savedTab);
    }
  } catch (e) {}

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEYS.BOOKINGS || e.key === STORAGE_KEYS.TOURS || e.key === "aureon_usd_rate") {
      loadData();
      updateRateDisplay();
    }
    if (e.key === STORAGE_KEYS.TELEGRAM || e.key === "aureon_tg_token" || e.key === "aureon_tg_chat_id") {
      setupTelegramConfig();
    }
    if (e.key === "aureon_email_config") {
      setupEmailConfig();
    }
  });

  // Sahifa yangilanganda yoki yopilganda ma'lumotlar o'chib ketmasligi uchun
  window.addEventListener("beforeunload", () => {
    autoSaveTelegramInputs();
    autoSaveEmailInputs();
  });
  window.addEventListener("pagehide", () => {
    autoSaveTelegramInputs();
    autoSaveEmailInputs();
  });
});

function loadData() {
  allBookings = getStoredBookings();
  allTours = getStoredTours();

  updateStats();
  renderBookingsTable();
  renderAdminTours();

  // Markaziy backend server bilan sinxronlash
  syncDataWithBackend();
}

async function syncDataWithBackend() {
  const dot = document.getElementById("backend-dot");
  const txt = document.getElementById("backend-status-text");

  const bookingsApi = getApiUrl('/api/bookings');
  let isBackendOnline = false;
  if (bookingsApi) {
    try {
      const res = await fetch(bookingsApi);
      if (res.ok) {
        isBackendOnline = true;
        const remoteBookings = await res.json();
        if (Array.isArray(remoteBookings) && remoteBookings.length > 0) {
          allBookings = remoteBookings;
          saveBookings(allBookings);
          updateStats();
          renderBookingsTable();
        }
      }
    } catch (e) {
      console.log("Backend offline, lokal ma'lumotlar ishlatilmoqda");
    }
  }

  if (dot && txt) {
    if (isBackendOnline) {
      dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400";
      txt.textContent = "Backend: Ulangan (API)";
    } else {
      dot.className = "w-2.5 h-2.5 rounded-full bg-slate-400";
      txt.textContent = "Backend: Lokal (Offline)";
    }
  }

  // Turlarni backenddan sinxronlash
  const toursApi = getApiUrl('/api/tours');
  if (toursApi) {
    try {
      const res = await fetch(toursApi);
      if (res.ok) {
        const remoteTours = await res.json();
        if (Array.isArray(remoteTours) && remoteTours.length > 0) {
          allTours = remoteTours;
          saveTours(allTours);
          updateStats();
          renderAdminTours();
        }
      }
    } catch (e) {}
  }

  // Sozlamalarni backenddan sinxronlash
  const settingsApi = getApiUrl('/api/settings/admin');
  if (settingsApi) {
    try {
      const res = await fetch(settingsApi);
      if (res.ok) {
        const s = await res.json();
        if (s.exchangeRate) {
          saveExchangeRate(s.exchangeRate);
          updateRateDisplay();
        }
        if (s.telegram && (s.telegram.botToken || s.telegram.chatId)) {
          saveTelegramConfig(s.telegram);
          setupTelegramConfig();
        }
      }
    } catch (e) {}
  }
}

function updateStats() {
  const pendingCount = allBookings.filter(b => b.status === "Yangi").length;
  const confirmedCount = allBookings.filter(b => b.status === "Tasdiqlandi").length;

  document.getElementById("stat-pending-count").textContent = pendingCount;
  document.getElementById("stat-confirmed-count").textContent = confirmedCount;
  document.getElementById("stat-total-count").textContent = allBookings.length;
  document.getElementById("stat-tours-count").textContent = allTours.length;

  const tabBadge = document.getElementById("tab-badge-pending");
  if (tabBadge) {
    tabBadge.textContent = pendingCount;
    if (pendingCount > 0) {
      tabBadge.className = "bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black animate-pulse";
    } else {
      tabBadge.className = "bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold";
    }
  }
}

function switchTab(tabId) {
  const tabs = ["tab-bookings", "tab-tours", "tab-telegram", "tab-currency"];
  tabs.forEach(id => {
    const el = document.getElementById(id);
    const btn = document.getElementById(`btn-${id}`);
    if (!el || !btn) return;

    if (id === tabId) {
      el.classList.remove("hidden");
      btn.className = "px-5 py-2.5 rounded-t-xl font-bold text-sm transition-all flex items-center gap-2 border-b-2 border-amber-500 text-amber-600 bg-white";
    } else {
      el.classList.add("hidden");
      btn.className = "px-5 py-2.5 rounded-t-xl font-semibold text-sm transition-all flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-white/50";
    }
  });

  try {
    localStorage.setItem("aureon_active_admin_tab", tabId);
  } catch (e) {}

  if (tabId === "tab-telegram") {
    setupTelegramConfig();
  }
  if (tabId === "tab-currency") {
    updateCurrencyTab();
  }
}

// ==========================================
// 1. BUYURTMALAR (BOOKINGS) BO'LIMI
// ==========================================

function renderBookingsTable() {
  const tbody = document.getElementById("bookings-table-body");
  const emptyState = document.getElementById("bookings-empty-state");
  if (!tbody) return;

  tbody.innerHTML = "";

  let filtered = allBookings.filter(b => {
    if (currentFilter !== "all" && b.status !== currentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (b.guestName || "").toLowerCase().includes(q);
      const phoneMatch = (b.guestPhone || "").toLowerCase().includes(q);
      const emailMatch = (b.guestEmail || "").toLowerCase().includes(q);
      const idMatch = (b.id || "").toLowerCase().includes(q);
      const tourMatch = (b.tourTitle || "").toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch || idMatch || tourMatch;
    }
    return true;
  });

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  filtered.forEach(b => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition-colors";

    let statusBadge = "";
    if (b.status === "Yangi") {
      statusBadge = `<span class="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> Yangi</span>`;
    } else if (b.status === "Tasdiqlandi") {
      statusBadge = `<span class="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-check text-xs"></i> Tasdiqlangan</span>`;
    } else {
      statusBadge = `<span class="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-xmark text-xs"></i> Bekor qilingan</span>`;
    }

    const hotelBadge = b.hotelOption === "Otel bilan" 
      ? `<span class="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">🏨 Otel bilan</span>`
      : `<span class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">🚗 Otelsiz</span>`;

    const guideBadge = b.guideOption === "Gid bilan"
      ? `<span class="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">🗣 Gid (${b.guideLanguage || 'uz'})</span>`
      : `<span class="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">🚶 Gidsiz</span>`;

    const langBadge = b.clientLang === 'ru' ? '<span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold border border-slate-200">🇷🇺 RU</span>'
                    : b.clientLang === 'en' ? '<span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold border border-slate-200">🇬🇧 EN</span>'
                    : '<span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold border border-slate-200">🇺🇿 UZ</span>';

    tr.innerHTML = `
      <td class="p-4">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="font-mono font-bold text-amber-700">${b.id}</span>
          ${langBadge}
        </div>
        <span class="text-[10px] text-slate-400 block">${b.timestamp || ''}</span>
      </td>

      <td class="p-4">
        <div class="font-bold text-slate-900">${b.guestName}</div>
        <div class="text-xs text-slate-500 flex items-center gap-1">
          <i class="fa-solid fa-phone text-slate-400 text-[10px]"></i>
          <a href="tel:${b.guestPhone}" class="hover:underline text-brand-600 font-semibold">${b.guestPhone}</a>
        </div>
        ${b.guestEmail ? `
        <div class="text-xs text-slate-500 flex items-center gap-1">
          <i class="fa-solid fa-envelope text-amber-500 text-[10px]"></i>
          <a href="mailto:${b.guestEmail}" class="hover:underline text-slate-600 truncate max-w-[170px]" title="${b.guestEmail}">${b.guestEmail}</a>
        </div>
        ` : ''}
        <div class="text-[11px] text-slate-500 truncate max-w-[200px]" title="${b.pickupLocation || b.roomNumber || ''}">
          <i class="fa-solid fa-location-dot text-amber-500 text-[10px]"></i> <strong class="text-slate-800">${b.pickupLocation || b.roomNumber || 'Ko\'rsatilmadi'}</strong>
        </div>
      </td>

      <td class="p-4">
        <div class="font-semibold text-slate-800">${b.tourTitleLocalized || b.tourTitle}</div>
        <div class="text-[11px] text-slate-600 font-medium">
          <i class="fa-solid fa-calendar text-[10px] text-amber-500"></i> ${b.startDate}
          <span class="inline-flex items-center gap-1 bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded font-bold text-[10px] ml-1">
            <i class="fa-solid fa-clock text-[9px] text-amber-600"></i> ${b.startTime || '09:00'}
          </span>
        </div>
      </td>

      <td class="p-4">
        <div class="font-medium text-slate-700">${b.durationDays} kun (${b.nights || 0} kecha)</div>
        <div class="mt-1">${hotelBadge}</div>
      </td>

      <td class="p-4">
        <div>${guideBadge}</div>
        <div class="text-[11px] text-slate-500 mt-1">
          ${b.adults} katta${b.children > 0 ? `, ${b.children} bola` : ''}
        </div>
      </td>

      <td class="p-4">
        <div class="font-black text-slate-900 text-sm">${formatCurrency(b.totalPrice)}</div>
      </td>

      <td class="p-4">
        ${statusBadge}
      </td>

      <td class="p-4 text-right space-x-1 whitespace-nowrap">
        <button onclick="viewBookingDetail('${b.id}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs" title="Batafsil ko'rish">
          <i class="fa-solid fa-eye"></i>
        </button>
        <button onclick="openEmailComposeModal('${b.id}')" class="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold" title="Email orqali bog'lanish / xat yozish">
          <i class="fa-solid fa-envelope text-amber-600"></i>
        </button>
        <button onclick="openWeatherAlertModal('${b.id}')" class="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold" title="Ob-havo va konsyerj eslatmasi">
          <i class="fa-solid fa-cloud-sun text-amber-500"></i>
        </button>
        ${b.status !== "Tasdiqlandi" ? `
          <button onclick="openStatusActionModal('${b.id}', 'Tasdiqlandi')" class="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold" title="Tasdiqlash va xabar yuborish">
            <i class="fa-solid fa-check"></i>
          </button>
        ` : ''}
        ${b.status !== "Bekor qilindi" ? `
          <button onclick="openStatusActionModal('${b.id}', 'Bekor qilindi')" class="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold" title="Bekor qilish va xabar yuborish">
            <i class="fa-solid fa-ban"></i>
          </button>
        ` : ''}
        <button onclick="deleteBooking('${b.id}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 text-xs" title="O'chirish">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function filterBookings(status) {
  currentFilter = status;
  document.querySelectorAll(".booking-filter-btn").forEach(btn => {
    if (btn.dataset.filter === status) {
      btn.className = "booking-filter-btn px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white";
    } else {
      btn.className = "booking-filter-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200";
    }
  });
  renderBookingsTable();
}

function handleBookingSearch() {
  searchQuery = document.getElementById("booking-search-input")?.value.trim() || "";
  renderBookingsTable();
}

// ==========================================
// STATUS CHANGE & GUEST NOTIFICATION SYSTEM
// ==========================================
let currentActionBookingId = null;
let currentActionTargetStatus = null;
let currentCancelReason = "O'rinlar to'lgan";

function openStatusActionModal(bookingId, targetStatus) {
  const b = allBookings.find(item => item.id === bookingId);
  if (!b) return;

  currentActionBookingId = bookingId;
  currentActionTargetStatus = targetStatus;
  currentCancelReason = "O'rinlar to'lgan";

  const modal = document.getElementById("status-action-modal");
  const modalTitle = document.getElementById("status-modal-title");
  const summaryBox = document.getElementById("status-modal-summary");
  const cancelBox = document.getElementById("cancel-reason-box");
  const cancelInput = document.getElementById("cancel-reason-input");
  const langBadge = document.getElementById("status-client-lang-badge");
  const btnSave = document.getElementById("btn-confirm-status-save");
  const btnSaveText = document.getElementById("btn-status-save-text");

  const clientLang = b.clientLang || "uz";
  const langNames = {
    uz: "🇺🇿 O'zbekcha",
    ru: "🇷🇺 Русский",
    en: "🇬🇧 English"
  };
  if (langBadge) {
    langBadge.textContent = langNames[clientLang] || "🇺🇿 O'zbekcha";
  }

  const isConfirmed = targetStatus === "Tasdiqlandi";

  if (modalTitle) {
    modalTitle.innerHTML = isConfirmed
      ? `<i class="fa-solid fa-circle-check text-emerald-600"></i> <span>Mijozga Xabarnoma Yuborish & Tasdiqlash</span>`
      : `<i class="fa-solid fa-circle-xmark text-rose-600"></i> <span>Mijozga Xabarnoma Yuborish & Bekor Qilish</span>`;
  }

  if (isConfirmed) {
    cancelBox?.classList.add("hidden");
    if (btnSave) btnSave.className = "px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2";
    if (btnSaveText) btnSaveText.textContent = "Tasdiqlash va Saqlash";
  } else {
    cancelBox?.classList.remove("hidden");
    if (cancelInput) cancelInput.value = currentCancelReason;
    if (btnSave) btnSave.className = "px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2";
    if (btnSaveText) btnSaveText.textContent = "Bekor Qilish va Saqlash";
  }

  const statusBadge = isConfirmed
    ? `<span class="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full"><i class="fa-solid fa-check"></i> Tasdiqlanmoqda</span>`
    : `<span class="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full"><i class="fa-solid fa-xmark"></i> Bekor qilinmoqda</span>`;

  summaryBox.innerHTML = `
    <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
      <span class="font-bold text-slate-900 text-sm">${b.guestName}</span>
      <span class="font-mono font-bold text-amber-700">${b.id}</span>
    </div>
    <div class="grid grid-cols-2 gap-2 text-slate-600 pt-1">
      <div>📞 Telefon: <a href="tel:${b.guestPhone}" class="text-brand-600 font-semibold underline">${b.guestPhone}</a></div>
      <div>🕒 Soati: <strong class="text-amber-700">${b.startTime || '09:00'}</strong></div>
      <div>📍 Joyi: <strong class="text-slate-800">${b.pickupLocation || b.roomNumber || 'Kiritilmagan'}</strong></div>
      <div>🗺 Yo'nalish: <strong>${b.tourTitleLocalized || b.tourTitle}</strong></div>
      <div>📅 Sana: <strong>${b.startDate}</strong></div>
      <div>⏳ Davomiyligi: <strong>${b.durationDays} kun (${b.nights || 0} kecha)</strong></div>
      <div>💰 Jami: <strong>${formatCurrency(b.totalPrice, "uz")}</strong></div>
    </div>
    <div class="flex items-center justify-between pt-1.5 border-t border-slate-200">
      <span class="text-slate-500 font-medium">Belgilanayotgan holat:</span>
      ${statusBadge}
    </div>
  `;

  updateStatusModalMessage();

  modal?.classList.remove("hidden");
}

function setCancelReason(reason) {
  currentCancelReason = reason;
  const input = document.getElementById("cancel-reason-input");
  if (input) input.value = reason;
  updateStatusModalMessage();
}

function formatLocalizedHotel(hotelOption, nights, lang) {
  const n = Number(nights) || 0;
  const str = String(hotelOption || "");
  const hasHotel = str.includes("with-hotel") || str.includes("Otel bilan") || str.includes("Включен") || str.includes("Included") || hotelOption === true;

  if (n <= 0) {
    if (lang === "ru") return "Не требуется (дневной тур)";
    if (lang === "en") return "Not required (day trip)";
    return "Talab etilmaydi (kunduzgi tur)";
  }
  if (hasHotel) {
    if (lang === "ru") return `Включен (проживание в отеле, ${n} ноч.)`;
    if (lang === "en") return `Included (hotel stay, ${n} night${n > 1 ? 's' : ''})`;
    return `Otel bilan birga (${n} kecha tunash)`;
  }
  if (lang === "ru") return "Без отеля (только трансфер и тур)";
  if (lang === "en") return "Tour only (no hotel)";
  return "Otelsiz (faqat transfer va marshrut)";
}

function formatLocalizedGuide(guideOption, guideLanguage, lang) {
  const str = String(guideOption || "");
  const hasGuide = str.includes("with-guide") || str.includes("Gid bilan") || str.includes("С гидом") || str.includes("With guide") || guideOption === true;

  const langNameMap = {
    uz: { uz: "O'zbek tilida", ru: "на узбекском языке", en: "in Uzbek" },
    ru: { uz: "Rus tilida", ru: "на русском языке", en: "in Russian" },
    en: { uz: "Ingliz tilida", ru: "на английском языке", en: "in English" }
  };
  const gLang = guideLanguage || "uz";
  const langText = (langNameMap[gLang] && langNameMap[gLang][lang]) ? langNameMap[gLang][lang] : (gLang === "ru" ? "на русском" : gLang === "en" ? "in English" : "o'zbek tilida");

  if (hasGuide) {
    if (lang === "ru") return `Профессиональный гид (${langText})`;
    if (lang === "en") return `Professional guide (${langText})`;
    return `Professional gid (${langText})`;
  }
  if (lang === "ru") return "Без гида (самостоятельный тур)";
  if (lang === "en") return "Self-guided (without guide)";
  return "Gidsiz (mustaqil sayr)";
}

function formatLocalizedDuration(days, nights, lang) {
  const d = Number(days) || 1;
  const n = Number(nights) || 0;
  if (d === 1) {
    if (lang === "ru") return "1 день (дневной тур)";
    if (lang === "en") return "1 day (day trip)";
    return "1 kunlik (kunduzgi sayr)";
  }
  if (lang === "ru") return `${d} дня (${n} ноч.)`;
  if (lang === "en") return `${d} days (${n} night${n > 1 ? 's' : ''})`;
  return `${d} kun (${n} kecha)`;
}

function formatLocalizedTravelers(adults, children, lang) {
  const a = Number(adults) || 1;
  const c = Number(children) || 0;
  if (lang === "ru") {
    let t = `${a} взросл.`;
    if (c > 0) t += `, ${c} дет.`;
    return t;
  }
  if (lang === "en") {
    let t = `${a} adult${a > 1 ? 's' : ''}`;
    if (c > 0) t += `, ${c} child${c > 1 ? 'ren' : ''}`;
    return t;
  }
  let t = `${a} katta`;
  if (c > 0) t += `, ${c} bola`;
  return t;
}

function updateStatusModalMessage() {
  const b = allBookings.find(item => item.id === currentActionBookingId);
  if (!b) return;

  const clientLang = b.clientLang || "uz";
  const isConfirmed = currentActionTargetStatus === "Tasdiqlandi";
  const reasonInput = document.getElementById("cancel-reason-input");
  const reasonText = reasonInput?.value.trim() || currentCancelReason || (clientLang === "ru" ? "Места заполнены" : clientLang === "en" ? "Fully booked" : "O'rinlar to'lgan");

  const tourTitle = (typeof getTourTitle === "function" ? getTourTitle(b.tourId, clientLang) : "") || b.tourTitleLocalized || b.tourTitle || "Aureon Travel";
  const hotelText = formatLocalizedHotel(b.hotelOption, b.nights, clientLang);
  const guideText = formatLocalizedGuide(b.guideOption, b.guideLanguage, clientLang);
  const durationText = formatLocalizedDuration(b.durationDays, b.nights, clientLang);
  const travelersText = formatLocalizedTravelers(b.adults, b.children, clientLang);
  const pickupText = b.pickupLocation || b.roomNumber || (clientLang === "ru" ? "По согласованию" : clientLang === "en" ? "As agreed" : "Kelishilgan manzil");

  let message = "";

  if (isConfirmed) {
    if (clientLang === "ru") {
      message = 
`Здравствуйте, Уважаемый(ая) ${b.guestName}!

Ваша заявка на тур "${tourTitle}" в Aureon Travel успешно ПОДТВЕРЖДЕНА! ✅

📋 Номер брони: ${b.id}
📅 Дата: ${b.startDate}
🕒 Время отправления: ${b.startTime || '09:00'}
📍 Место отправления: ${pickupText}
⏳ Длительность: ${durationText}
🏨 Отель: ${hotelText}
🗣 Гид: ${guideText}
👥 Путешественники: ${travelersText}
💰 Итоговая стоимость: ${formatCurrency(b.totalPrice, "ru")}

Наш представитель и комфортабельный персональный трансфер встретят вас в назначенное время в указанном месте.
По любым вопросам мы всегда на связи: +998 90 123 45 67

Aureon Travel — Ваш надежный спутник в путешествиях! ✈️`;
    } else if (clientLang === "en") {
      message = 
`Hello, Dear ${b.guestName}!

Your tour booking for "${tourTitle}" with Aureon Travel is CONFIRMED! ✅

📋 Booking ID: ${b.id}
📅 Start Date: ${b.startDate}
🕒 Departure Time: ${b.startTime || '09:00'}
📍 Pickup Location: ${pickupText}
⏳ Duration: ${durationText}
🏨 Hotel: ${hotelText}
🗣 Guide: ${guideText}
👥 Travelers: ${travelersText}
💰 Total Price: ${formatCurrency(b.totalPrice, "en")}

Our representative and comfortable private transfer will meet you at the scheduled time and location.
If you have any questions, feel free to contact us: +998 90 123 45 67

Aureon Travel — Your reliable travel companion! ✈️`;
    } else {
      message = 
`Assalomu alaykum, Hurmatli ${b.guestName}!

Aureon Travel orqali "${tourTitle}" turiga bergan arizangiz TASDIQLANDI! ✅

📋 Buyurtma ID: ${b.id}
📅 Sana: ${b.startDate}
🕒 Jo'nash vaqti: ${b.startTime || '09:00'}
📍 Olib ketish joyi: ${pickupText}
⏳ Davomiyligi: ${durationText}
🏨 Mehmonxona: ${hotelText}
🗣 Gid xizmati: ${guideText}
👥 Sayohatchilar: ${travelersText}
💰 Jami hisob: ${formatCurrency(b.totalPrice, "uz")}

Bizning vakilimiz va qulay shaxsiy transportimiz belgilangan vaqtda siz ko'rsatgan manzildan kutib oladi.
Savollaringiz bo'lsa, istalgan vaqtda yozishingiz mumkin: +998 90 123 45 67

Aureon Travel — Sayohatlaringizning ishonchli hamrohi! ✈️`;
    }
  } else {
    if (clientLang === "ru") {
      message = 
`Здравствуйте, Уважаемый(ая) ${b.guestName}!

Уведомляем вас о том, что ваша заявка на тур "${tourTitle}" (ID: ${b.id}) была отменена. ❌

Причина: ${reasonText}

Вы можете выбрать другие доступные даты или связаться с нашим оператором для подбора альтернативного маршрута.
Контакты: +998 90 123 45 67

С уважением, Aureon Travel ✈️`;
    } else if (clientLang === "en") {
      message = 
`Hello, Dear ${b.guestName}!

We regret to inform you that your booking for "${tourTitle}" (ID: ${b.id}) has been cancelled. ❌

Reason: ${reasonText}

You can choose other available dates or contact our manager for an alternative route.
Contact: +998 90 123 45 67

Best regards, Aureon Travel ✈️`;
    } else {
      message = 
`Assalomu alaykum, Hurmatli ${b.guestName}!

Aureon Travel orqali "${tourTitle}" turiga bergan arizangiz (${b.id}) afsuski bekor qilindi. ❌

Sabab: ${reasonText}

Boshqa qulay sanalar yoki muqobil turlarni tanlash uchun operatorimiz bilan bog'lanishingiz mumkin.
Bog'lanish uchun: +998 90 123 45 67

Hurmat bilan, Aureon Travel ✈️`;
    }
  }

  const preview = document.getElementById("status-message-preview");
  if (preview) preview.value = message;

  // Update 1-click links
  const statusSubject = isConfirmed 
    ? (clientLang === 'ru' ? 'Подтверждение бронирования - Aureon Travel' : clientLang === 'en' ? 'Booking Confirmation - Aureon Travel' : 'Broningiz tasdiqlandi - Aureon Travel')
    : (clientLang === 'ru' ? 'Отмена бронирования - Aureon Travel' : clientLang === 'en' ? 'Booking Cancellation - Aureon Travel' : 'Bron bekor qilindi - Aureon Travel');
  updateDispatchLinks(b.guestPhone, message, b.guestEmail, statusSubject);
}

function updateDispatchLinks(phone, message, email, subject) {
  const digits = (phone || "").replace(/\D/g, "");
  const encoded = encodeURIComponent(message);

  const tgBtn = document.getElementById("btn-dispatch-telegram");
  if (tgBtn) {
    tgBtn.href = digits ? `https://t.me/+${digits}?text=${encoded}` : `https://t.me/share/url?url=${encoded}`;
  }

  const waBtn = document.getElementById("btn-dispatch-whatsapp");
  if (waBtn) {
    waBtn.href = digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }

  const smsBtn = document.getElementById("btn-dispatch-sms");
  if (smsBtn) {
    smsBtn.href = `sms:${phone || ''}?body=${encoded}`;
  }

  const emailBtn = document.getElementById("btn-dispatch-email");
  if (emailBtn) {
    const encSub = encodeURIComponent(subject || "Aureon Travel - Xabar");
    emailBtn.href = email ? `mailto:${email}?subject=${encSub}&body=${encoded}` : `mailto:?subject=${encSub}&body=${encoded}`;
  }
}

function copyStatusMessageToClipboard() {
  const preview = document.getElementById("status-message-preview");
  if (!preview) return;
  preview.select();
  navigator.clipboard.writeText(preview.value).then(() => {
    alert("Xabar matni nusxalandi! Endi uni Telegram, SMS yoki WhatsApp'ga qoyishingiz (Paste) mumkin.");
  }).catch(() => {
    alert("Xabar matni nusxalandi!");
  });
}

function closeStatusActionModal() {
  document.getElementById("status-action-modal")?.classList.add("hidden");
  currentActionBookingId = null;
  currentActionTargetStatus = null;
}

async function applyStatusChangeAndNotify() {
  if (!currentActionBookingId || !currentActionTargetStatus) return;

  const booking = allBookings.find(b => b.id === currentActionBookingId);
  if (!booking) return;

  const oldStatus = booking.status;
  booking.status = currentActionTargetStatus;
  saveBookings(allBookings);
  updateStats();
  renderBookingsTable();

  // Backend API ga status yangilanishini yuborish
  let sentToBackend = false;
  const statusApi = getApiUrl(`/api/bookings/${booking.id}/status`);
  if (statusApi) {
    try {
      const res = await fetch(statusApi, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: currentActionTargetStatus })
      });
      if (res.ok) sentToBackend = true;
    } catch (e) {
      console.warn("Backendga status yuborilmadi, brauzerdan yuboriladi:", e);
    }
  }

  // Agar server orqali Telegramga yuborilmagan bo'lsa, brauzerdan yuborish
  if (!sentToBackend) {
    await sendStatusChangeToTelegramBot(booking, oldStatus);
  }

  alert(`✅ Buyurtma holati "${currentActionTargetStatus}" deb saqlandi!\n\nMijoz ${booking.guestName} uchun xabarnoma tayyorlandi.`);

  closeStatusActionModal();
}

async function sendStatusChangeToTelegramBot(booking, oldStatus) {
  const config = getTelegramConfig();
  if (!config || !config.botToken || !config.chatId) return false;

  const statusEmoji = booking.status === "Tasdiqlandi" ? "✅" : "❌";
  const text = 
`🔔 *AUREON TRAVEL — BUYURTMA HOLATI O'ZGARDI!*
━━━━━━━━━━━━━━━━━━━━
🆔 *ID:* \`${booking.id}\`
👤 *Mehmon:* *${booking.guestName}* (${booking.guestPhone})
📍 *Yo'nalish:* *${booking.tourTitleLocalized || booking.tourTitle}*
📅 *Sana:* ${booking.startDate}
💰 *Hisob:* *${formatCurrency(booking.totalPrice, "uz")}*
━━━━━━━━━━━━━━━━━━━━
🔄 *Eski holat:* ${oldStatus}
${statusEmoji} *Yangi holat:* *${booking.status.toUpperCase()}*
⏱ *Vaqt:* ${new Date().toLocaleString("uz-UZ", { hour12: false })}`;

  try {
    const url = `https://api.telegram.org/bot${encodeURIComponent(config.botToken)}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: text,
        parse_mode: "Markdown"
      })
    });
    const data = await res.json();
    return data.ok;
  } catch (e) {
    console.error("Status change bot alert error:", e);
    return false;
  }
}

// Eski to'g'ridan-to'g'ri o'zgartirish o'rniga modal ochiladi
function changeBookingStatus(bookingId, newStatus) {
  openStatusActionModal(bookingId, newStatus);
}

function deleteBooking(bookingId) {
  if (confirm(`Rostdan ham ${bookingId} raqamli arizani o'chirmoqchimisiz?`)) {
    allBookings = allBookings.filter(b => b.id !== bookingId);
    saveBookings(allBookings);
    updateStats();
    renderBookingsTable();
  }
}

function viewBookingDetail(bookingId) {
  const b = allBookings.find(item => item.id === bookingId);
  if (!b) return;

  const modal = document.getElementById("booking-detail-modal");
  const body = document.getElementById("bdetail-body");

  body.innerHTML = `
    <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-3">
      <div class="flex justify-between items-center">
        <span class="text-xs uppercase font-bold text-amber-800">Buyurtma ID:</span>
        <span class="font-mono font-bold text-amber-900 text-base">${b.id}</span>
      </div>
      <div class="flex justify-between items-center mt-1">
        <span class="text-xs text-slate-500">Holat:</span>
        <span class="font-bold text-xs">${b.status}</span>
      </div>
    </div>

    <div class="space-y-2">
      <div><strong>Mehmon:</strong> ${b.guestName}</div>
      <div><strong>Telefon:</strong> <a href="tel:${b.guestPhone}" class="text-brand-600 underline font-semibold">${b.guestPhone}</a></div>
      <div><strong>Email manzili:</strong> ${b.guestEmail ? `<a href="mailto:${b.guestEmail}" class="text-amber-700 underline font-semibold">${b.guestEmail}</a>` : '<span class="text-slate-400 italic">Kiritilmagan</span>'}</div>
      <div><strong>Olib ketish nuqtasi:</strong> <span class="font-bold text-slate-800">${b.pickupLocation || b.roomNumber || 'Ko\'rsatilmadi'}</span> <span class="text-xs text-slate-500">(${b.pickupType || 'Manzil'})</span></div>
      <hr class="border-slate-100">
      <div><strong>Yo'nalish:</strong> ${b.tourTitleLocalized || b.tourTitle} (${b.location || ''})</div>
      <div><strong>Boshlanish sanasi va vaqti:</strong> ${b.startDate} soat <span class="font-bold text-amber-600">${b.startTime || '09:00'}</span></div>
      <div><strong>Davomiyligi:</strong> ${b.durationDays} kun (${b.nights || 0} kecha)</div>
      <div><strong>Otel varianti:</strong> ${b.hotelOption}</div>
      <div><strong>Gid xizmati:</strong> ${b.guideOption} ${b.guideOption === 'Gid bilan' ? '(' + (b.guideLanguage || 'uz') + ')' : ''}</div>
      <div><strong>Sayohatchilar:</strong> ${b.adults} katta ${b.children > 0 ? `, ${b.children} bola` : ''}</div>
      <div><strong>Maxsus istaklar:</strong> <span class="italic text-slate-600">${b.note || 'Yo\'q'}</span></div>
      <hr class="border-slate-100">
      <div class="text-base flex justify-between font-bold text-slate-900 pt-1">
        <span>Jami to'lov:</span>
        <span class="text-amber-600">${formatCurrency(b.totalPrice)}</span>
      </div>
      <hr class="border-slate-100">
      <div class="flex flex-wrap items-center justify-end gap-2 pt-2">
        <button onclick="closeBookingDetailModal(); openEmailComposeModal('${b.id}')" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm">
          <i class="fa-solid fa-envelope"></i> Email xat yozish
        </button>
        ${b.status !== "Tasdiqlandi" ? `
          <button onclick="closeBookingDetailModal(); openStatusActionModal('${b.id}', 'Tasdiqlandi')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-check"></i> Tasdiqlash & Xabar yuborish
          </button>
        ` : ''}
        ${b.status !== "Bekor qilindi" ? `
          <button onclick="closeBookingDetailModal(); openStatusActionModal('${b.id}', 'Bekor qilindi')" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-ban"></i> Bekor qilish & Xabar yuborish
          </button>
        ` : ''}
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeBookingDetailModal() {
  document.getElementById("booking-detail-modal")?.classList.add("hidden");
}

function exportBookingsJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allBookings, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `aureon_travel_backup_${new Date().toISOString().slice(0,10)}.json`);
  dlAnchorElem.click();
}

// ==========================================
// 2. TURLAR VA NARXLARNI BOSHQARISH
// ==========================================

function renderAdminTours() {
  const grid = document.getElementById("admin-tours-grid");
  if (!grid) return;

  grid.innerHTML = "";

  allTours.forEach(tour => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between";

    const titleText = getLocalized(tour.title, "uz");
    const subtitleText = getLocalized(tour.subtitle, "uz");
    const locationText = getLocalized(tour.location, "uz");
    const badgeText = getLocalized(tour.badge, "uz");

    card.innerHTML = `
      <div>
        <div class="relative h-44 overflow-hidden bg-slate-900">
          <img src="${tour.mainImage}" alt="${titleText}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80'" class="w-full h-full object-cover">
          <span class="absolute top-3 left-3 ${tour.badgeColor || 'bg-amber-500'} text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            ${badgeText || 'Faol'}
          </span>
          <span class="absolute bottom-2 right-3 text-xs bg-slate-950/70 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
            ${locationText}
          </span>
        </div>

        <div class="p-4">
          <h4 class="font-bold text-slate-900 text-base leading-snug line-clamp-1 mb-1">${titleText}</h4>
          <p class="text-xs text-slate-500 line-clamp-2 mb-3">${subtitleText}</p>

          <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1.5 text-xs mb-3">
            <div class="flex justify-between">
              <span class="text-slate-600">Asosiy paket (1 kishi):</span>
              <strong class="text-amber-700">${formatCurrency(tour.basePricePerPerson, 'uz')}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Otel narxi (1 kecha):</span>
              <strong class="text-slate-800">${formatCurrency(tour.hotelPricePerNight, 'uz')}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Gid xizmati (1 kun):</span>
              <strong class="text-sky-700">${formatCurrency(tour.guidePricePerDay || 200000, 'uz')}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 pt-0">
        <button onclick="openEditTourModal('${tour.id}')" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          <i class="fa-solid fa-pen-to-square"></i>
          <span>Tahrirlash va Narx/Rasmlarni O'zgartirish</span>
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

function openEditTourModal(tourId) {
  const tour = allTours.find(t => t.id === tourId);
  if (!tour) return;

  const titleText = getLocalized(tour.title, "uz");
  const subtitleText = getLocalized(tour.subtitle, "uz");
  const locationText = getLocalized(tour.location, "uz");
  const badgeText = getLocalized(tour.badge, "uz");

  document.getElementById("tour-edit-modal-title").textContent = "Turni Tahrirlash: " + titleText;
  document.getElementById("edit-tour-id").value = tour.id;
  document.getElementById("edit-tour-title").value = titleText;
  document.getElementById("edit-tour-subtitle").value = subtitleText || "";
  document.getElementById("edit-tour-location").value = locationText || "";
  document.getElementById("edit-tour-badge").value = badgeText || "";
  document.getElementById("edit-tour-price-base").value = tour.basePricePerPerson;
  document.getElementById("edit-tour-price-hotel").value = tour.hotelPricePerNight;
  document.getElementById("edit-tour-price-guide").value = tour.guidePricePerDay || 200000;
  document.getElementById("edit-tour-main-image").value = tour.mainImage;
  document.getElementById("edit-tour-gallery").value = (tour.gallery || []).join("\n");
  document.getElementById("edit-tour-activities").value = (getLocalized(tour.activities, "uz") || []).join("\n");

  document.getElementById("tour-edit-modal").classList.remove("hidden");
}

function openNewTourModal() {
  document.getElementById("tour-edit-modal-title").textContent = "Yangi Tur Qo'shish";
  document.getElementById("edit-tour-id").value = "tour_" + Date.now();
  document.getElementById("edit-tour-title").value = "";
  document.getElementById("edit-tour-subtitle").value = "";
  document.getElementById("edit-tour-location").value = "";
  document.getElementById("edit-tour-badge").value = "Yangi";
  document.getElementById("edit-tour-price-base").value = 400000;
  document.getElementById("edit-tour-price-hotel").value = 450000;
  document.getElementById("edit-tour-price-guide").value = 200000;
  document.getElementById("edit-tour-main-image").value = "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80";
  document.getElementById("edit-tour-gallery").value = "";
  document.getElementById("edit-tour-activities").value = "09:00 - Sayohat boshlanishi\n13:00 - Tushlik\n18:00 - Qaytish";

  document.getElementById("tour-edit-modal").classList.remove("hidden");
}

function handleSaveTourEdit(e) {
  e.preventDefault();

  const id = document.getElementById("edit-tour-id").value;
  const title = document.getElementById("edit-tour-title").value.trim();
  const subtitle = document.getElementById("edit-tour-subtitle").value.trim();
  const location = document.getElementById("edit-tour-location").value.trim();
  const badge = document.getElementById("edit-tour-badge").value.trim();
  const basePrice = parseInt(document.getElementById("edit-tour-price-base").value);
  const hotelPrice = parseInt(document.getElementById("edit-tour-price-hotel").value);
  const guidePrice = parseInt(document.getElementById("edit-tour-price-guide").value);
  const mainImage = document.getElementById("edit-tour-main-image").value.trim();
  const gallery = document.getElementById("edit-tour-gallery").value.trim().split("\n").filter(Boolean);
  const activities = document.getElementById("edit-tour-activities").value.trim().split("\n").filter(Boolean);

  let existingIndex = allTours.findIndex(t => t.id === id);

  if (existingIndex >= 0) {
    allTours[existingIndex] = {
      ...allTours[existingIndex],
      title,
      subtitle,
      location,
      badge,
      basePricePerPerson: basePrice,
      hotelPricePerNight: hotelPrice,
      guidePricePerDay: guidePrice,
      mainImage,
      gallery: gallery.length > 0 ? gallery : [mainImage],
      activities: activities.length > 0 ? activities : allTours[existingIndex].activities
    };
  } else {
    allTours.push({
      id,
      title,
      subtitle,
      location,
      badge,
      badgeColor: "bg-blue-600",
      basePricePerPerson: basePrice,
      hotelPricePerNight: hotelPrice,
      guidePricePerDay: guidePrice,
      mainImage,
      gallery: gallery.length > 0 ? gallery : [mainImage],
      activities: activities,
      highlights: ["Maxsus individual marshrut", "Komfort shaxsiy transport"],
      sights: ["Tarixiy va me'moriy diqqatga sazovor joylar"],
      included: ["Shaxsiy transport", "Kirish chiptalari"]
    });
  }

  saveTours(allTours);
  closeTourEditModal();
  renderAdminTours();
  alert("Aureon Travel: Tur muvaffaqiyatli saqlandi!");
}

function closeTourEditModal() {
  document.getElementById("tour-edit-modal")?.classList.add("hidden");
}

function resetToursToDefault() {
  if (confirm("Haqiqatan ham barcha turlarni Aureon Travel standart holatiga va yangi haqiqiy fotosuratlarga qaytarmoqchimisiz?")) {
    localStorage.removeItem(STORAGE_KEYS.TOURS);
    localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION);
    allTours = DEFAULT_TOURS;
    saveTours(allTours);
    renderAdminTours();
    alert("Barcha turlar va haqiqiy fotosuratlar muvaffaqiyatli yangilandi!");
  }
}

// ==========================================
// 3. TELEGRAM BOT SOZLAMALARI
// ==========================================

let autosaveIndicatorTimer = null;

function showAutosaveIndicator(text = "Avtomatik saqlandi") {
  const ind = document.getElementById("tg-autosave-indicator");
  if (!ind) return;
  const span = ind.querySelector("span");
  if (span) span.textContent = text;
  ind.classList.remove("opacity-0");
  ind.classList.add("opacity-100");

  if (autosaveIndicatorTimer) clearTimeout(autosaveIndicatorTimer);
  autosaveIndicatorTimer = setTimeout(() => {
    ind.classList.remove("opacity-100");
    ind.classList.add("opacity-0");
  }, 2500);
}

function autoSaveTelegramInputs() {
  const tokenInput = document.getElementById("tg-bot-token");
  const chatInput = document.getElementById("tg-chat-id");
  const rateInput = document.getElementById("usd-exchange-rate");
  if (!tokenInput && !chatInput) return;

  const botToken = tokenInput ? tokenInput.value.trim() : "";
  const chatId = chatInput ? chatInput.value.trim() : "";
  const rateVal = Number(rateInput?.value);

  if (rateVal && rateVal > 0) {
    persistExchangeRate(rateVal);
  }

  const existing = getTelegramConfig() || {};
  const config = {
    botToken: botToken !== "" ? botToken : (existing.botToken || ""),
    chatId: chatId !== "" ? chatId : (existing.chatId || ""),
    enabled: !!(botToken || existing.botToken),
    brandName: "Aureon Travel"
  };

  saveTelegramConfig(config);
  updateTelegramBadge(!!(config.botToken && config.chatId));

  // Backend API ga ham doimiy saqlash
  const settingsApi = getApiUrl('/api/settings');
  if (settingsApi) {
    fetch(settingsApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exchangeRate: (rateVal && rateVal > 0) ? rateVal : getExchangeRate(),
        telegram: config
      })
    }).catch(e => console.warn("Backend settings sync error:", e));
  }

  showAutosaveIndicator("Avtomatik saqlandi");
}

function onTelegramInputPaste() {
  setTimeout(() => autoSaveTelegramInputs(), 50);
}

function onRateInputChange() {
  const rateInput = document.getElementById("usd-exchange-rate");
  const val = Number(rateInput?.value);
  if (val && val > 0) {
    persistExchangeRate(val);
    updateRateDisplay();
  }
}

function setupTelegramConfig() {
  const config = getTelegramConfig();
  const tokenInput = document.getElementById("tg-bot-token");
  const chatInput = document.getElementById("tg-chat-id");
  const rateInput = document.getElementById("usd-exchange-rate");

  if (tokenInput) {
    tokenInput.value = config.botToken || "";
    tokenInput.removeEventListener("input", autoSaveTelegramInputs);
    tokenInput.addEventListener("input", autoSaveTelegramInputs);
    tokenInput.removeEventListener("change", autoSaveTelegramInputs);
    tokenInput.addEventListener("change", autoSaveTelegramInputs);
    tokenInput.removeEventListener("paste", onTelegramInputPaste);
    tokenInput.addEventListener("paste", onTelegramInputPaste);
  }

  if (chatInput) {
    chatInput.value = config.chatId || "";
    chatInput.removeEventListener("input", autoSaveTelegramInputs);
    chatInput.addEventListener("input", autoSaveTelegramInputs);
    chatInput.removeEventListener("change", autoSaveTelegramInputs);
    chatInput.addEventListener("change", autoSaveTelegramInputs);
    chatInput.removeEventListener("paste", onTelegramInputPaste);
    chatInput.addEventListener("paste", onTelegramInputPaste);
  }

  if (rateInput) {
    rateInput.value = getExchangeRate();
    rateInput.removeEventListener("input", onRateInputChange);
    rateInput.addEventListener("input", onRateInputChange);
  }

  updateTelegramBadge(!!(config.botToken && config.chatId));
}

function updateTelegramBadge(isConnected) {
  const dot = document.getElementById("telegram-dot");
  const text = document.getElementById("telegram-status-text");
  if (!dot || !text) return;

  if (isConnected) {
    dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400";
    text.textContent = "Bot: Ulangan";
    text.className = "text-emerald-400 font-bold";
  } else {
    dot.className = "w-2.5 h-2.5 rounded-full bg-rose-400";
    text.textContent = "Bot: Ulanmagan";
    text.className = "text-rose-400";
  }
}

function handleSaveTelegramConfig(e) {
  if (e) e.preventDefault();
  autoSaveTelegramInputs();

  renderBookingsTable();
  renderAdminTours();

  const resDiv = document.getElementById("telegram-test-result");
  if (resDiv) {
    resDiv.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800";
    resDiv.innerHTML = `<i class="fa-solid fa-circle-check"></i> Sozlamalar muvaffaqiyatli saqlandi! Sahifa yangilansa ham ma'lumotlar o'chib ketmaydi.`;
    resDiv.classList.remove("hidden");
  }
}

async function testTelegramConnection() {
  // Avval kiritilgan ma'lumotlarni darhol saqlab olamiz!
  autoSaveTelegramInputs();

  const config = getTelegramConfig();
  const botToken = config.botToken || document.getElementById("tg-bot-token")?.value.trim();
  const chatId = config.chatId || document.getElementById("tg-chat-id")?.value.trim();
  const resDiv = document.getElementById("telegram-test-result");
  const btn = document.getElementById("btn-test-telegram");

  if (!botToken || !chatId) {
    alert("Iltimos, avval Bot Token va Chat ID-ni kiriting!");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Tekshirilmoqda...`;
  resDiv.classList.add("hidden");

  const testMessage = `✈️ *AUREON TRAVEL ADMIN: TEST XABAR*
━━━━━━━━━━━━━━━━━━━━
✅ Telegram botingiz muvaffaqiyatli ulandi!
Sayt orqali har bir yangi buyurtma kelganda ma'lumotlar avtomatik shu yerga yetib keladi.
⏱ *Vaqt:* ${new Date().toLocaleString('uz-UZ')}`;

  try {
    const url = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        parse_mode: "Markdown"
      })
    });

    const data = await response.json();

    if (data.ok) {
      resDiv.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800";
      resDiv.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Ajoyib!</strong> Test xabar Telegramingizga muvaffaqiyatli yuborildi. Telegramingizni tekshiring!`;
      updateTelegramBadge(true);
    } else {
      resDiv.className = "p-3 rounded-xl text-xs font-semibold bg-rose-100 text-rose-800";
      resDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Xatolik:</strong> ${data.description || 'Bot token yoki Chat ID xato'}. Qaytadan tekshiring.`;
      updateTelegramBadge(false);
    }
  } catch (err) {
    resDiv.className = "p-3 rounded-xl text-xs font-semibold bg-rose-100 text-rose-800";
    resDiv.innerHTML = `<i class="fa-solid fa-wifi"></i> <strong>Internet xatoligi:</strong> Telegram serveriga ulanib bo'lmadi: ${err.message}`;
    updateTelegramBadge(false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane text-sky-500"></i> <span>Test Xabar Yuborish</span>`;
    resDiv.classList.remove("hidden");
  }
}

// ==========================================
// 4. VALYUTA KURSI BOSHQARUVI (DOLLAR / SO'M)
// ==========================================

function updateRateDisplay() {
  const rate = getExchangeRate();
  const formatted = new Intl.NumberFormat('uz-UZ').format(rate);

  // Header badge
  const headerEl = document.getElementById("header-rate-display");
  if (headerEl) headerEl.textContent = formatted;

  // Telegram settings input
  const tgRateInput = document.getElementById("usd-exchange-rate");
  if (tgRateInput) tgRateInput.value = rate;

  // Currency Tab elements
  const currentRateText = document.getElementById("current-active-rate-text");
  if (currentRateText) currentRateText.textContent = formatted;

  const tabRateInput = document.getElementById("currency-tab-rate-input");
  if (tabRateInput) tabRateInput.value = rate;

  // Modal input
  const modalInput = document.getElementById("modal-rate-input");
  if (modalInput) modalInput.value = rate;

  // Preview elements
  updateRatePreviews(rate);
}

function updateRatePreviews(rate) {
  const r = rate || getExchangeRate();
  const tashkentUsd = Math.round(350000 / r);
  const hotelUsd = Math.round(450000 / r);
  const guideUsd = Math.round(200000 / r);
  const grandUsd = Math.round(1500000 / r);

  const pt = document.getElementById("preview-tashkent");
  if (pt) pt.textContent = "$" + tashkentUsd;

  const ph = document.getElementById("preview-hotel");
  if (ph) ph.textContent = "$" + hotelUsd;

  const pg = document.getElementById("preview-guide");
  if (pg) pg.textContent = "$" + guideUsd;

  const pgr = document.getElementById("preview-grand");
  if (pgr) pgr.textContent = "$" + grandUsd;
}

function updateCurrencyTab() {
  updateRateDisplay();
}

function setQuickRate(val) {
  const input = document.getElementById("currency-tab-rate-input");
  if (input) {
    input.value = val;
    updateRatePreviews(val);
  }
}

function adjustRateBy(delta) {
  const input = document.getElementById("currency-tab-rate-input");
  if (input) {
    const cur = Number(input.value) || getExchangeRate();
    const next = Math.max(1000, cur + delta);
    input.value = next;
    updateRatePreviews(next);
  }
}

function handleUpdateExchangeRate(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("currency-tab-rate-input");
  const val = Number(input?.value);

  if (!val || isNaN(val) || val < 1000) {
    alert("Iltimos, to'g'ri dollar kursini kiriting (masalan: 12800)!");
    return;
  }

  persistExchangeRate(val);
  const rateInput = document.getElementById("usd-exchange-rate");
  if (rateInput) rateInput.value = val;
  updateRateDisplay();
  renderBookingsTable();
  renderAdminTours();

  const statusEl = document.getElementById("currency-save-status");
  if (statusEl) {
    statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Kurs 1 USD = ${new Intl.NumberFormat('uz-UZ').format(val)} UZS deb saqlandi!`;
    statusEl.classList.remove("hidden");
    setTimeout(() => {
      statusEl.classList.add("hidden");
    }, 4000);
  }
}

// Tezkor modal funksiyalari
function openRateModal() {
  const modal = document.getElementById("rate-edit-modal");
  const input = document.getElementById("modal-rate-input");
  if (input) input.value = getExchangeRate();
  if (modal) modal.classList.remove("hidden");
}

function closeRateModal() {
  const modal = document.getElementById("rate-edit-modal");
  if (modal) modal.classList.add("hidden");
}

function setModalQuickRate(val) {
  const input = document.getElementById("modal-rate-input");
  if (input) input.value = val;
}

function handleQuickRateModalSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("modal-rate-input");
  const val = Number(input?.value);

  if (!val || isNaN(val) || val < 1000) {
    alert("Iltimos, to'g'ri kurs kiriting!");
    return;
  }

  persistExchangeRate(val);
  const rateInput = document.getElementById("usd-exchange-rate");
  if (rateInput) rateInput.value = val;
  const tabInput = document.getElementById("currency-tab-rate-input");
  if (tabInput) tabInput.value = val;
  updateRateDisplay();
  renderBookingsTable();
  renderAdminTours();
  closeRateModal();
}

// Markaziy Bank kursini avtomatik tortib olish
async function fetchLiveCbuRate() {
  const btn = document.getElementById("btn-cbu-fetch");
  const origHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Olinmoqda...`;
  }

  try {
    const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/");
    const data = await res.json();
    const usd = data.find(item => item.Ccy === "USD");

    if (usd && usd.Rate) {
      const liveRate = Math.round(parseFloat(usd.Rate));
      setQuickRate(liveRate);
      persistExchangeRate(liveRate);
      updateRateDisplay();
      renderBookingsTable();
      renderAdminTours();
      alert(`O'zbekiston Markaziy Banki rasmiy kursi olindi:\n1 USD = ${new Intl.NumberFormat('uz-UZ').format(liveRate)} UZS\n\nKurs muvaffaqiyatli saqlandi!`);
    } else {
      throw new Error("USD kursi topilmadi");
    }
  } catch (err) {
    console.warn("CBU API fetch xatolik:", err);
    alert("Markaziy Bank serveriga ulanishda vaqtinchalik to'siq bo'ldi. Kursni qo'lda kiritishingiz mumkin.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
}

// ==========================================
// 4. OB-HAVO VA KONSYERJ XABARNOMALARI
// ==========================================
let currentActiveWeatherBooking = null;
let currentActiveWeatherInfo = null;
let currentWeatherLang = "uz";

async function openWeatherAlertModal(bookingId) {
  const b = allBookings.find(item => item.id === bookingId);
  if (!b) return;

  currentActiveWeatherBooking = b;
  currentWeatherLang = b.clientLang || "uz";

  const modal = document.getElementById("weather-alert-modal");
  if (modal) modal.classList.remove("hidden");

  // Loading holati
  document.getElementById("weather-city-display").textContent = "Ob-havo aniqlanmoqda...";
  document.getElementById("weather-date-display").textContent = b.startDate;
  document.getElementById("weather-temp-display").textContent = "...";
  document.getElementById("weather-cond-badge").textContent = "Yuklanmoqda...";
  document.getElementById("weather-message-preview").value = "Ob-havo ma'lumotlari yuklanmoqda...";

  // Ob-havoni tortib olish
  const weatherInfo = await fetchTourWeather(b.tourId, b.startDate);
  currentActiveWeatherInfo = weatherInfo;

  renderWeatherModalData(b, weatherInfo, currentWeatherLang);
}

function renderWeatherModalData(b, w, lang) {
  const cond = getWeatherConditionDetails(w.wmoCode, lang);
  const destName = (w.destination && w.destination.name) ? getLocalized(w.destination.name, lang) : "O'zbekiston";

  document.getElementById("weather-icon-display").textContent = cond.icon;
  document.getElementById("weather-city-display").textContent = destName;
  document.getElementById("weather-date-display").textContent = `${w.date} (${b.startTime || '09:00'})`;
  document.getElementById("weather-temp-display").textContent = `${w.tempMin > 0 ? '+' : ''}${w.tempMin}°C ... ${w.tempMax > 0 ? '+' : ''}${w.tempMax}°C`;
  
  const badgeEl = document.getElementById("weather-cond-badge");
  badgeEl.textContent = cond.text;
  if (cond.isRain) {
    badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300";
  } else if (cond.isSnow) {
    badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300";
  } else {
    badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300";
  }

  document.getElementById("weather-rain-prob").textContent = `${w.rainProb}%`;
  document.getElementById("weather-wind-speed").textContent = `${w.windSpeed} km/soat`;

  const mBadge = document.getElementById("weather-mountain-badge");
  if (mBadge) {
    if (w.isMountain) mBadge.classList.remove("hidden");
    else mBadge.classList.add("hidden");
  }

  // Til tugmalarini yangilash
  ["uz", "ru", "en"].forEach(l => {
    const btn = document.getElementById(`wlang-btn-${l}`);
    if (btn) {
      if (l === lang) {
        btn.className = "px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950";
      } else {
        btn.className = "px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200";
      }
    }
  });

  // Konsyerj xabari matnini shakllantirish
  const message = generateConciergeWeatherMessage(b, w, lang);
  const textarea = document.getElementById("weather-message-preview");
  if (textarea) textarea.value = message;

  // 1-Click jo'natish havolalarini yangilash
  updateWeatherDispatchLinks(b, message);
}

function switchWeatherAlertLang(lang) {
  if (!currentActiveWeatherBooking || !currentActiveWeatherInfo) return;
  currentWeatherLang = lang;
  renderWeatherModalData(currentActiveWeatherBooking, currentActiveWeatherInfo, lang);
}

function generateConciergeWeatherMessage(b, w, lang) {
  const tourTitle = (typeof getTourTitle === "function" ? getTourTitle(b.tourId, lang) : "") || b.tourTitleLocalized || b.tourTitle;
  const cond = getWeatherConditionDetails(w.wmoCode, lang);
  const advice = getConciergeWeatherAdvice(w, lang);
  const destName = (w.destination && w.destination.name) ? getLocalized(w.destination.name, lang) : "O'zbekiston";
  const tempStr = `${w.tempMin > 0 ? '+' : ''}${w.tempMin}°C ... ${w.tempMax > 0 ? '+' : ''}${w.tempMax}°C`;
  const pickup = b.pickupLocation || b.roomNumber || (lang === 'ru' ? 'Указанное место' : lang === 'en' ? 'Pickup spot' : 'Belgilangan manzil');

  if (lang === "ru") {
    return `Здравствуйте, Уважаемый(ая) ${b.guestName}!

Команда консьерж-сервиса Aureon Travel готовится к проведению вашего тура "${tourTitle}"! ✈️

📅 Дата поездки: ${b.startDate}
🕒 Время отправления: ${b.startTime || '09:00'}
📍 Место отправления: ${pickup}

⛅ ПРОГНОЗ ПОГОДЫ НА ДЕНЬ ВАШЕЙ ПОЕЗДКИ:
📍 Локация: ${destName}
🌡 Температура: ${tempStr} (${cond.text} ${cond.icon})
🌧 Вероятность осадков: ${w.rainProb}%

💡 РЕКОМЕНДАЦИИ КОНСЬЕРЖА:
${advice}

Наш представитель и персональный комфортный трансфер встретят вас в назначенное время.
По любым вопросам мы всегда на связи: +998 90 123 45 67

Aureon Travel — Ваш надежный спутник в путешествиях! ✈️`;
  }

  if (lang === "en") {
    return `Hello, Dear ${b.guestName}!

The Aureon Travel concierge team is preparing for your upcoming "${tourTitle}" tour! ✈️

📅 Tour Date: ${b.startDate}
🕒 Departure Time: ${b.startTime || '09:00'}
📍 Pickup Location: ${pickup}

⛅ WEATHER FORECAST FOR YOUR TOUR DAY:
📍 Destination: ${destName}
🌡 Temperature: ${tempStr} (${cond.text} ${cond.icon})
🌧 Precipitation chance: ${w.rainProb}%

💡 CONCIERGE RECOMMENDATIONS:
${advice}

Our comfortable private transfer will meet you at the scheduled time and location.
If you have any questions, feel free to contact us: +998 90 123 45 67

Aureon Travel — Your reliable travel companion! ✈️`;
  }

  // O'zbek tili
  return `Assalomu alaykum, Hurmatli ${b.guestName}!

Aureon Travel konsyerj jamoasi sizning "${tourTitle}" turingizga tayyorgarlik ko'rmoqda! ✈️

📅 Sayohat sanasi: ${b.startDate}
🕒 Jo'nash vaqti: ${b.startTime || '09:00'}
📍 Olib ketish manzili: ${pickup}

⛅ SAYOHAT KUNINGIZDAGI OB-HAVO MA'LUMOTI:
📍 Manzil: ${destName}
🌡 Kutilayotgan harorat: ${tempStr} (${cond.text} ${cond.icon})
🌧 Yog'ingarchilik ehtimoli: ${w.rainProb}%

💡 AUREON TRAVEL KONSYERJ TAVSIYASI:
${advice}

Bizning qulay shaxsiy transportimiz belgilangan vaqtda eshigingiz oldida tayyor bo'ladi.
Barcha savollar bo'yicha biz har doim aloqadamiz: +998 90 123 45 67

Aureon Travel — Sayohatlaringizning ishonchli hamrohi! ✈️`;
}

function updateWeatherDispatchLinks(b, message) {
  const cleanPhone = (b.guestPhone || "").replace(/\D/g, "");
  const encodedText = encodeURIComponent(message);

  const tgBtn = document.getElementById("btn-weather-telegram");
  if (tgBtn) {
    tgBtn.href = `https://t.me/+${cleanPhone}?text=${encodedText}`;
  }

  const waBtn = document.getElementById("btn-weather-whatsapp");
  if (waBtn) {
    waBtn.href = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }

  const smsBtn = document.getElementById("btn-weather-sms");
  if (smsBtn) {
    smsBtn.href = `sms:${cleanPhone}?body=${encodedText}`;
  }

  const emailBtn = document.getElementById("btn-weather-email");
  if (emailBtn) {
    const encSubject = encodeURIComponent(`Aureon Travel - Ob-havo va sayohat eslatmasi`);
    emailBtn.href = b.guestEmail ? `mailto:${b.guestEmail}?subject=${encSubject}&body=${encodedText}` : `mailto:?subject=${encSubject}&body=${encodedText}`;
  }
}

function copyWeatherMessageToClipboard() {
  const text = document.getElementById("weather-message-preview")?.value || "";
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    alert("Xabar matni nusxalandi! Endi Telegram yoki WhatsApp orqali mijozga yuborishingiz mumkin.");
  }).catch(() => {
    alert("Nusxalandi!");
  });
}

function closeWeatherAlertModal() {
  const modal = document.getElementById("weather-alert-modal");
  if (modal) modal.classList.add("hidden");
}

/* ==========================================================================
   EMAIL DISPATCH & SMTP CONFIGURATION SYSTEM
   ========================================================================== */

let currentEmailBooking = null;
let currentEmailLang = 'uz';
let emailConfig = {
  host: '',
  port: 465,
  user: '',
  pass: '',
  senderName: 'Aureon Travel',
  testEmail: ''
};

function setupEmailConfig() {
  try {
    const raw = localStorage.getItem("aureon_email_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      emailConfig = { ...emailConfig, ...parsed };
    }
  } catch (e) {
    console.error("Failed to parse email config", e);
  }

  // Populate inputs in settings tab
  const hostInp = document.getElementById("smtp-host");
  const portInp = document.getElementById("smtp-port");
  const userInp = document.getElementById("smtp-user");
  const passInp = document.getElementById("smtp-pass");
  const senderInp = document.getElementById("smtp-sender-name");
  const testInp = document.getElementById("smtp-test-email");

  if (hostInp && emailConfig.host) hostInp.value = emailConfig.host;
  if (portInp && emailConfig.port) portInp.value = emailConfig.port;
  if (userInp && emailConfig.user) userInp.value = emailConfig.user;
  if (passInp && emailConfig.pass) passInp.value = emailConfig.pass;
  if (senderInp && emailConfig.senderName) senderInp.value = emailConfig.senderName;
  if (testInp && emailConfig.testEmail) testInp.value = emailConfig.testEmail;

  // Realtime autosave listeners
  [hostInp, portInp, userInp, passInp, senderInp, testInp].forEach(el => {
    if (el) {
      el.addEventListener("input", autoSaveEmailInputs);
    }
  });

  // Attach compose live update listeners
  const compTo = document.getElementById("email-compose-to");
  const compSub = document.getElementById("email-compose-subject");
  const compBody = document.getElementById("email-compose-body");
  [compTo, compSub, compBody].forEach(el => {
    if (el) {
      el.addEventListener("input", updateEmailMailtoLink);
    }
  });
}

function autoSaveEmailInputs() {
  const host = document.getElementById("smtp-host")?.value.trim() || "";
  const port = parseInt(document.getElementById("smtp-port")?.value.trim() || "465", 10);
  const user = document.getElementById("smtp-user")?.value.trim() || "";
  const pass = document.getElementById("smtp-pass")?.value.trim() || "";
  const senderName = document.getElementById("smtp-sender-name")?.value.trim() || "Aureon Travel";
  const testEmail = document.getElementById("smtp-test-email")?.value.trim() || "";

  emailConfig = { host, port, user, pass, senderName, testEmail };
  try {
    localStorage.setItem("aureon_email_config", JSON.stringify(emailConfig));
  } catch (e) {}

  const indicator = document.getElementById("email-autosave-indicator");
  if (indicator) {
    indicator.classList.remove("opacity-0");
    indicator.classList.add("opacity-100");
    setTimeout(() => {
      indicator.classList.remove("opacity-100");
      indicator.classList.add("opacity-0");
    }, 2000);
  }
}

function handleSaveEmailConfig(e) {
  if (e) e.preventDefault();
  autoSaveEmailInputs();

  const resDiv = document.getElementById("email-test-result");
  if (resDiv) {
    resDiv.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block";
    resDiv.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i> Email (SMTP) sozlamalari muvaffaqiyatli saqlandi!';
    setTimeout(() => { resDiv.classList.add("hidden"); }, 4000);
  }
}

async function testEmailConnection() {
  autoSaveEmailInputs();
  const btn = document.getElementById("btn-test-email");
  const resDiv = document.getElementById("email-test-result");

  const testEmail = emailConfig.testEmail || emailConfig.user;
  if (!testEmail) {
    if (resDiv) {
      resDiv.className = "p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 block";
      resDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation text-rose-600 mr-1.5"></i> Iltimos, sinov uchun email manzilini yoki foydalanuvchi emailini kiriting!';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-amber-600"></i> Yuborilmoqda...';
  }
  if (resDiv) {
    resDiv.className = "p-3 rounded-xl text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 block";
    resDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> SMTP serveri bilan bog\'lanish va sinov xati yuborilmoqda...';
  }

  try {
    const res = await fetch("/api/email/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtpConfig: emailConfig,
        testEmail: testEmail
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (resDiv) {
        resDiv.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block";
        resDiv.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i> Sinov xati <strong>${testEmail}</strong> manziliga muvaffaqiyatli yetkazildi! SMTP server to'g'ri sozlangan.`;
      }
    } else {
      if (resDiv) {
        resDiv.className = "p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 block";
        resDiv.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-600 mr-1.5"></i> <strong>Xatolik:</strong> ${data.error || "SMTP ulanishda xatolik yuz berdi. Server, port yoki maxsus parolni tekshiring."}`;
      }
    }
  } catch (err) {
    if (resDiv) {
      resDiv.className = "p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 block";
      resDiv.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-600 mr-1.5"></i> Serverga so'rov yuborishda tarmoq xatosi: ${err.message}`;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane text-amber-600"></i> Test Email Yuborish';
    }
  }
}

// EMAIL COMPOSE MODAL LOGIC
function openEmailComposeModal(bookingId) {
  const b = allBookings.find(item => item.id === bookingId);
  if (!b) return;

  currentEmailBooking = b;
  currentEmailLang = b.clientLang || 'uz';

  const modal = document.getElementById("email-compose-modal");
  const nameEl = document.getElementById("email-guest-name");
  const idEl = document.getElementById("email-booking-id");
  const tourEl = document.getElementById("email-tour-badge");
  const phoneEl = document.getElementById("email-guest-phone");
  const dateEl = document.getElementById("email-guest-date");
  const toEl = document.getElementById("email-compose-to");
  const alertEl = document.getElementById("email-compose-alert");

  if (alertEl) {
    alertEl.className = "hidden";
    alertEl.innerHTML = "";
  }

  const tourTitle = (typeof getTourTitle === "function" ? getTourTitle(b.tourId, currentEmailLang) : "") || b.tourTitleLocalized || b.tourTitle || "Tur";

  if (nameEl) nameEl.textContent = b.guestName || "Mehmon";
  if (idEl) idEl.textContent = b.id || "";
  if (tourEl) tourEl.textContent = tourTitle;
  if (phoneEl) phoneEl.textContent = b.guestPhone || "Ko'rsatilmadi";
  if (dateEl) dateEl.textContent = `${b.startDate || ''} (${b.startTime || '09:00'})`;
  if (toEl) toEl.value = b.guestEmail || "";

  switchEmailComposeLang(currentEmailLang, false);
  applyEmailTemplate("contact_fallback");

  if (modal) modal.classList.remove("hidden");
}

function closeEmailComposeModal() {
  const modal = document.getElementById("email-compose-modal");
  if (modal) modal.classList.add("hidden");
  currentEmailBooking = null;
}

function switchEmailComposeLang(lang, reapplyTemplate = true) {
  currentEmailLang = lang;
  ['uz', 'ru', 'en'].forEach(l => {
    const btn = document.getElementById(`elang-btn-${l}`);
    if (btn) {
      if (l === lang) {
        btn.className = "px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950";
      } else {
        btn.className = "px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700";
      }
    }
  });

  if (reapplyTemplate && currentEmailBooking) {
    applyEmailTemplate("contact_fallback");
  }
}

function applyEmailTemplate(type) {
  if (!currentEmailBooking) return;
  const b = currentEmailBooking;
  const lang = currentEmailLang;
  const tourTitle = (typeof getTourTitle === "function" ? getTourTitle(b.tourId, lang) : "") || b.tourTitleLocalized || b.tourTitle || "Aureon Travel";
  const pickup = b.pickupLocation || b.roomNumber || (lang === 'ru' ? 'По согласованию' : lang === 'en' ? 'As agreed' : 'Kelishilgan manzil');

  let subject = "";
  let body = "";

  if (type === "contact_fallback") {
    if (lang === "ru") {
      subject = `Aureon Travel - Не удалось связаться с вами (Тур: ${tourTitle})`;
      body = `Здравствуйте, Уважаемый(ая) ${b.guestName}!

Мы пытались связаться с вами по телефону (${b.guestPhone}) и через Telegram касательно вашей брони, но, к сожалению, не смогли дозвониться.

Информация о бронировании:
- Номер брони: ${b.id}
- Тур: ${tourTitle}
- Дата отправления: ${b.startDate} (в ${b.startTime || '09:00'})
- Место встречи: ${pickup}

Пожалуйста, ответьте на это письмо или напишите нам в Telegram / WhatsApp, чтобы подтвердить ваше участие и детали поездки:
📞 Телефон / WhatsApp: +998 90 123 45 67
✈️ Telegram: @aureon_travel

С наилучшими пожеланиями,
Команда Aureon Travel ✈️`;
    } else if (lang === "en") {
      subject = `Aureon Travel - Urgent: We could not reach you (Tour: ${tourTitle})`;
      body = `Dear ${b.guestName},

We attempted to reach you via phone (${b.guestPhone}) and Telegram regarding your upcoming tour reservation, but were unable to connect.

Booking Details:
- Booking ID: ${b.id}
- Tour: ${tourTitle}
- Date: ${b.startDate} (at ${b.startTime || '09:00'})
- Pickup Location: ${pickup}

Please reply to this email or reach out to us so we can finalize your itinerary and pickup arrangements:
📞 Phone / WhatsApp: +998 90 123 45 67
✈️ Telegram: @aureon_travel

Best regards,
Aureon Travel Concierge Team ✈️`;
    } else {
      subject = `Aureon Travel - Siz bilan bog'lana olmadik (Tur: ${tourTitle})`;
      body = `Assalomu alaykum, Hurmatli ${b.guestName}!

Biz Aureon Travel jamoasidan siz bilan ko'rsatilgan telefon (${b.guestPhone}) va Telegram orqali bog'lanishga harakat qildik, ammo aloqa o'rnatish imkoni bo'lmadi.

Sizning buyurtma tafsilotlaringiz:
- Buyurtma ID: ${b.id}
- Tanlangan tur: ${tourTitle}
- Boshlanish sanasi: ${b.startDate} (soat ${b.startTime || '09:00'})
- Olib ketish manzili: ${pickup}

Sayohatni to'liq tasdiqlash va transport hamda gid xizmatini muvofiqlashtirish uchun ushbu xatga javob yozishingizni yoki quyidagi aloqa vositalari orqali bizga xabar berishingizni so'raymiz:
📞 Telefon / WhatsApp: +998 90 123 45 67
✈️ Telegram: @aureon_travel

Sizga unutilmas sayohat tilaymiz!
Hurmat bilan, Aureon Travel jamoasi ✈️`;
    }
  } else if (type === "confirmed") {
    if (lang === "ru") {
      subject = `Aureon Travel - Ваша бронь подтверждена! ✅ (${tourTitle})`;
      body = `Здравствуйте, Уважаемый(ая) ${b.guestName}!

Ваша заявка на тур "${tourTitle}" (ID: ${b.id}) успешно ПОДТВЕРЖДЕНА! ✅

Детали поездки:
- Дата отправления: ${b.startDate} (в ${b.startTime || '09:00'})
- Место встречи: ${pickup}
- Длительность: ${b.durationDays} дн. (${b.nights || 0} ноч.)
- Итоговая стоимость: ${formatCurrency(b.totalPrice, "ru")}

Наш представитель и трансфер прибудут вовремя.
Контакты: +998 90 123 45 67

С уважением, Aureon Travel ✈️`;
    } else if (lang === "en") {
      subject = `Aureon Travel - Booking Confirmed! ✅ (${tourTitle})`;
      body = `Dear ${b.guestName},

We are pleased to inform you that your booking for "${tourTitle}" (ID: ${b.id}) has been CONFIRMED! ✅

Trip Information:
- Departure: ${b.startDate} at ${b.startTime || '09:00'}
- Pickup Location: ${pickup}
- Duration: ${b.durationDays} day(s) (${b.nights || 0} night(s))
- Total Price: ${formatCurrency(b.totalPrice, "en")}

Our private transfer and guide will be waiting for you at the appointed time.
Contact: +998 90 123 45 67

Best regards, Aureon Travel ✈️`;
    } else {
      subject = `Aureon Travel - Buyurtmangiz tasdiqlandi! ✅ (${tourTitle})`;
      body = `Assalomu alaykum, Hurmatli ${b.guestName}!

"${tourTitle}" turiga bergan arizangiz (ID: ${b.id}) muvaffaqiyatli TASDIQLANDI! ✅

Sayohat ma'lumotlari:
- Sana: ${b.startDate} (soat ${b.startTime || '09:00'})
- Olib ketish joyi: ${pickup}
- Davomiyligi: ${b.durationDays} kun (${b.nights || 0} kecha)
- Jami to'lov: ${formatCurrency(b.totalPrice, "uz")}

Qulay transportimiz va mas'ul xodimimiz belgilangan vaqtda sizni kutib oladi.
Bog'lanish: +998 90 123 45 67

Hurmat bilan, Aureon Travel ✈️`;
    }
  } else if (type === "tour_reminder") {
    if (lang === "ru") {
      subject = `Aureon Travel - Напоминание и подготовка к поездке 🎒 (${tourTitle})`;
      body = `Здравствуйте, Уважаемый(ая) ${b.guestName}!

Напоминаем, что ваша поездка в рамках тура "${tourTitle}" состоится уже скоро (${b.startDate} в ${b.startTime || '09:00'}).

Рекомендации перед выездом:
1. Возьмите с собой паспорт или удостоверение личности.
2. Одевайтесь по погоде и наденьте удобную обувь для прогулок.
3. Не забудьте зарядные устройства и солнцезащитные очки.

Место сбора: ${pickup}
По любым вопросам звоните: +998 90 123 45 67

Aureon Travel ✈️`;
    } else if (lang === "en") {
      subject = `Aureon Travel - Tour Reminder & Preparation 🎒 (${tourTitle})`;
      body = `Dear ${b.guestName},

This is a friendly reminder that your tour "${tourTitle}" is scheduled for ${b.startDate} at ${b.startTime || '09:00'}.

Before Departure Tips:
1. Please bring your valid passport or ID card.
2. Wear comfortable walking shoes and weather-appropriate attire.
3. Bring your camera/smartphone charger and sunglasses.

Meeting location: ${pickup}
Direct line: +998 90 123 45 67

Aureon Travel ✈️`;
    } else {
      subject = `Aureon Travel - Sayohat oldidan eslatma va tavsiyalar 🎒 (${tourTitle})`;
      body = `Assalomu alaykum, Hurmatli ${b.guestName}!

"${tourTitle}" bo'yicha sayohatingiz ${b.startDate} kuni soat ${b.startTime || '09:00'}da boshlanishini eslatib o'tamiz.

Sayohat uchun foydali maslahatlar:
1. Shaxsingizni tasdiqlovchi hujjatni (pasport) yoningizda olib oling.
2. Harakatlanish uchun qulay kiyim va poyabzal kiyish tavsiya etiladi.
3. Telefon quvvatlagichi va quyoshdan saqlovchi ko'zoynakni unutmang.

Kutib olish manzili: ${pickup}
Aloqa: +998 90 123 45 67

Aureon Travel ✈️`;
    }
  } else if (type === "cancelled") {
    if (lang === "ru") {
      subject = `Aureon Travel - Уведомление об отмене бронирования ❌ (${tourTitle})`;
      body = `Здравствуйте, Уважаемый(ая) ${b.guestName}!

Сообщаем, что ваша заявка на тур "${tourTitle}" (ID: ${b.id}) была отменена.

Если у вас возникли вопросы или вы хотите подобрать другие доступные даты, пожалуйста, свяжитесь с нашим отделом бронирования:
📞 Телефон: +998 90 123 45 67
✈️ Telegram: @aureon_travel

С уважением, Aureon Travel ✈️`;
    } else if (lang === "en") {
      subject = `Aureon Travel - Tour Booking Cancellation ❌ (${tourTitle})`;
      body = `Dear ${b.guestName},

We regret to inform you that your reservation for "${tourTitle}" (ID: ${b.id}) has been cancelled.

If you would like to reschedule or explore other tour dates, please feel free to reach out to us:
📞 Phone: +998 90 123 45 67
✈️ Telegram: @aureon_travel

Best regards, Aureon Travel ✈️`;
    } else {
      subject = `Aureon Travel - Buyurtma bekor qilindi ❌ (${tourTitle})`;
      body = `Assalomu alaykum, Hurmatli ${b.guestName}!

Afsuski, "${tourTitle}" turiga bergan arizangiz (ID: ${b.id}) bekor qilindi.

Boshqa qulay sanalarga ko'chirish yoki muqobil turlarni tanlash uchun operatorimizga murojaat qilishingiz mumkin:
📞 Telefon: +998 90 123 45 67
✈️ Telegram: @aureon_travel

Hurmat bilan, Aureon Travel ✈️`;
    }
  } else {
    subject = `Aureon Travel - ${tourTitle}`;
    body = `Assalomu alaykum, Hurmatli ${b.guestName}!

`;
  }

  const subInput = document.getElementById("email-compose-subject");
  const bodyTextarea = document.getElementById("email-compose-body");
  if (subInput) subInput.value = subject;
  if (bodyTextarea) bodyTextarea.value = body;

  updateEmailMailtoLink();
}

function updateEmailMailtoLink() {
  const to = document.getElementById("email-compose-to")?.value.trim() || "";
  const sub = document.getElementById("email-compose-subject")?.value || "";
  const body = document.getElementById("email-compose-body")?.value || "";

  const link = document.getElementById("btn-email-mailto-launch");
  if (link) {
    const encSub = encodeURIComponent(sub);
    const encBody = encodeURIComponent(body);
    link.href = to ? `mailto:${to}?subject=${encSub}&body=${encBody}` : `mailto:?subject=${encSub}&body=${encBody}`;
  }
}

async function handleSendEmailSubmit() {
  const to = document.getElementById("email-compose-to")?.value.trim();
  const subject = document.getElementById("email-compose-subject")?.value.trim();
  const body = document.getElementById("email-compose-body")?.value.trim();
  const alertEl = document.getElementById("email-compose-alert");
  const btn = document.getElementById("btn-email-server-send");
  const btnText = document.getElementById("btn-email-server-send-text");

  if (!to) {
    if (alertEl) {
      alertEl.className = "p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 block";
      alertEl.innerHTML = '<i class="fa-solid fa-circle-exclamation text-rose-600 mr-1.5"></i> Qabul qiluvchi email manzilini kiriting!';
    }
    return;
  }

  if (!subject || !body) {
    if (alertEl) {
      alertEl.className = "p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 block";
      alertEl.innerHTML = '<i class="fa-solid fa-circle-exclamation text-rose-600 mr-1.5"></i> Xat mavzusi va matnini to\'ldiring!';
    }
    return;
  }

  // If booking's email was not set or changed, update booking record
  if (currentEmailBooking && to !== currentEmailBooking.guestEmail) {
    currentEmailBooking.guestEmail = to;
    saveBookings(allBookings);
    renderBookingsTable();
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = "Jo'natilmoqda...";
  if (alertEl) {
    alertEl.className = "p-3 rounded-xl text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 block";
    alertEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Server orqali email jo\'natilmoqda...';
  }

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: to,
        subject: subject,
        message: body,
        smtpConfig: emailConfig
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (alertEl) {
        alertEl.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block";
        alertEl.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i> Email <strong>${to}</strong> manziliga muvaffaqiyatli jo'natildi!`;
      }
      setTimeout(() => {
        closeEmailComposeModal();
      }, 2500);
    } else {
      if (alertEl) {
        alertEl.className = "p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 block";
        alertEl.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-600 mr-1.5"></i> <strong>Xatolik:</strong> ${data.error || "Xat yuborishda xatolik yuz berdi. SMTP sozlamalarini tekshiring yoki 'Mail dasturida ochish' tugmasidan foydalaning."}`;
      }
    }
  } catch (err) {
    if (alertEl) {
      alertEl.className = "p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 block";
      alertEl.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-600 mr-1.5"></i> Tarmoq xatosi: ${err.message}. Pochta dasturida ochish orqali ham jo'nata olasiz.`;
    }
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = "Server Orqali Jo'natish";
  }
}
