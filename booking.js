/**
 * booking.js - Aureon Travel Bron Qilish Sahifasi Mantiqi (v3.6)
 * Komfortli va qulay tanlov tizimi, ko'p tilli qo'llab-quvvatlash (UZ, RU, EN),
 * real-vaqtda jonli hisob-kitob va Telegram integratsiyasi
 */

let activeTours = [];
let currentLang = "uz";
let selectedTourId = "toshkent";
let selectedDuration = 2; // Default: 2 kun / 1 kecha
let adultsCount = 2;
let childrenCount = 0;
let hotelOption = "with-hotel"; // 'with-hotel' | 'without-hotel'
let guideOption = "with-guide"; // 'with-guide' | 'without-guide'
let guideLanguage = "uz";
let selectedPickupType = "hotel"; // 'hotel' | 'airport' | 'station' | 'custom'
let selectedStartTime = "09:00";
const REQUIRED_FIELDS = ["start-date", "start-time", "pickup-location", "guest-name", "guest-phone", "guest-email", "room-number", "guest-note"];

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Tanlangan tilni yuklash
  currentLang = getSelectedLanguage();
  guideLanguage = currentLang;

  // Dollar kursini backend serverdan sinxronlash
  await syncExchangeRateFromBackend();

  // 2. Turlarni yuklash
  activeTours = getStoredTours();

  // 3. URL'dan tour parametrini tekshirish (?tour=samarqand)
  const urlParams = new URLSearchParams(window.location.search);
  const tourParam = urlParams.get("tour");
  if (tourParam && activeTours.some(t => t.id === tourParam)) {
    selectedTourId = tourParam;
  } else if (activeTours.length > 0) {
    selectedTourId = activeTours[0].id;
  }

  // 4. Sanani va vaqt/manzilni boshlash
  initDatePicker();
  initTimeAndPickup();

  // 5. Interfeysni sozlash
  applyBookingLanguage(currentLang);
  renderTourCards();
  selectDuration(selectedDuration);
  selectGuideLanguage(guideLanguage);
  calculateBookingPrice();

  // 6. Qat'iy jonli validatsiya tinglovchilarini yoqish
  setupFormValidation();
  updateValidationSummary();
});

// Sanani boshlash (kamida bugungi sana, foydalanuvchi albatta tanlashi shart)
function initDatePicker() {
  const dateInput = document.getElementById("start-date");
  if (!dateInput) return;

  const today = new Date();
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  dateInput.min = formatDate(today);
  dateInput.value = ""; // Talabga binoan bo'sh turadi — chala qoldirishning oldini olish uchun
  
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  const dateBadge = document.getElementById("date-status-badge");
  if (dateBadge) {
    dateBadge.innerHTML = `<span class="text-rose-600 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-xmark text-xs"></i> ${dict.dateNotSelected || "Tanlanmagan"}</span>`;
  }
}

// Tezkor sana tanlash (Ertaga, Indinga, Shanba)
function setQuickDate(type) {
  const dateInput = document.getElementById("start-date");
  if (!dateInput) return;

  const today = new Date();
  let targetDate = new Date(today);

  if (type === 1) {
    targetDate.setDate(today.getDate() + 1);
  } else if (type === 2) {
    targetDate.setDate(today.getDate() + 2);
  } else if (type === 'weekend') {
    const dayOfWeek = today.getDay(); // 0: Yakshanba, 6: Shanba
    let daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
    if (daysUntilSaturday === 0) daysUntilSaturday = 7;
    targetDate.setDate(today.getDate() + daysUntilSaturday);
  }

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  dateInput.value = `${year}-${month}-${day}`;

  onDateOrOptionChange();
  validateField('start-date', true);
  updateValidationSummary();
}

// 100% MEHMON TANLOVI: JO'NASH SOATI (VAQTI) VA OLIB KETISH JOYI
// ==============================================================

// Tezkor jo'nash soatini belgilash
function setQuickTime(timeStr) {
  selectedStartTime = timeStr;
  const timeInput = document.getElementById("start-time");
  if (timeInput) {
    timeInput.value = timeStr;
  }
  updateTimeChipStyles(timeStr);
  onTimeChange();
}

function updateTimeChipStyles(activeTime) {
  document.querySelectorAll(".time-quick-chip").forEach(chip => {
    chip.className = "time-quick-chip px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50 text-slate-700 text-xs font-semibold transition-all shadow-sm";
  });
  const idMap = {
    "08:00": "time-chip-0800",
    "09:00": "time-chip-0900",
    "10:00": "time-chip-1000",
    "14:00": "time-chip-1400"
  };
  const activeEl = document.getElementById(idMap[activeTime]);
  if (activeEl) {
    activeEl.className = "time-quick-chip px-2.5 py-1 rounded-lg border-2 border-amber-500 bg-amber-50 text-amber-950 text-xs font-bold transition-all shadow-sm";
  }
}

function onTimeChange() {
  const timeInput = document.getElementById("start-time");
  if (timeInput) {
    selectedStartTime = timeInput.value || "09:00";
    updateTimeChipStyles(selectedStartTime);
  }
  validateField('start-time', true);
  updateValidationSummary();
  calculateBookingPrice();
}

// Olib ketish turini tanlash (Mehmonxona, Aeroport, Vokzal, Shaxsiy manzil)
function selectPickupType(type) {
  selectedPickupType = type;
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;

  // 1. Karta uslublarini yangilash
  const types = ['hotel', 'airport', 'station', 'custom'];
  types.forEach(t => {
    const card = document.getElementById(`pickup-type-${t}`);
    if (!card) return;
    const icon = card.querySelector("i");
    const label = card.querySelector("span:last-child");

    if (t === type) {
      card.className = "p-3 rounded-xl border-2 border-amber-500 bg-amber-50 text-left transition-all shadow-sm flex flex-col justify-between cursor-pointer";
      if (icon) icon.className = "fa-solid fa-circle-check text-amber-600 text-xs";
      if (label) label.className = "text-xs font-bold text-slate-900";
    } else {
      card.className = "p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 text-left transition-all flex flex-col justify-between cursor-pointer";
      if (icon) icon.className = "fa-regular fa-circle text-slate-300 text-xs";
      if (label) label.className = "text-xs font-bold text-slate-700";
    }
  });

  // 2. Preset dropdown va chiplarni chizish
  renderPickupPresets(type);
  renderPickupChips(type);

  // 3. Tanlangan birinchi preset bo'yicha qiymatni to'ldirish
  onPickupPresetChange();

  // 4. Validatsiya va xulosa
  validateField('pickup-location', true);
  updateValidationSummary();
  calculateBookingPrice();
}

function renderPickupPresets(type) {
  const select = document.getElementById("pickup-preset-select");
  if (!select) return;

  const presets = (typeof PICKUP_PRESETS !== "undefined" && PICKUP_PRESETS[type]) ? PICKUP_PRESETS[type] : [];
  const currentVal = select.value;

  select.innerHTML = presets.map((item) => {
    const name = (item.name && item.name[currentLang]) ? item.name[currentLang] : (item.name && item.name.uz ? item.name.uz : item.id);
    const defVal = item.defaultVal || "";
    return `<option value="${item.id}" data-custom="${item.isCustom ? 'true' : 'false'}" data-default="${defVal.replace(/"/g, '&quot;')}">${name}</option>`;
  }).join("");

  // Avval tanlangan element bo'lsa uni saqlab qolish, aks holda birinchisini tanlash
  if (currentVal && presets.some(p => p.id === currentVal)) {
    select.value = currentVal;
  } else if (presets.length > 0) {
    select.value = presets[0].id;
  }
}

function renderPickupChips(type) {
  const container = document.getElementById("pickup-chips-container");
  if (!container) return;

  const presets = (typeof PICKUP_PRESETS !== "undefined" && PICKUP_PRESETS[type]) ? PICKUP_PRESETS[type] : [];
  // Faqat tayyor manzillarni (maxsus "Boshqa manzil" dan tashqari) tezkor chiplar sifatida ko'rsatish
  const quickList = presets.filter(p => !p.isCustom).slice(0, 6);

  const select = document.getElementById("pickup-preset-select");
  const activeId = select ? select.value : (presets[0] ? presets[0].id : "");

  container.innerHTML = quickList.map(item => {
    const name = (item.name && item.name[currentLang]) ? item.name[currentLang] : item.id;
    const isSelected = item.id === activeId;
    const cls = isSelected 
      ? "px-2.5 py-1 rounded-lg text-[11px] font-bold border-2 border-amber-500 bg-amber-100 text-amber-900 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
      : "px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-400 text-slate-700 transition-all shadow-xs flex items-center gap-1 cursor-pointer";
    const checkIcon = isSelected ? `<i class="fa-solid fa-check text-[10px] text-amber-700"></i>` : "";
    return `
      <button type="button" onclick="setQuickPickupPreset('${item.id}')" class="${cls}">
        ${checkIcon} ${name}
      </button>
    `;
  }).join("");
}

function setQuickPickupPreset(presetId) {
  const select = document.getElementById("pickup-preset-select");
  if (select) {
    select.value = presetId;
    onPickupPresetChange();
  }
}

function onPickupPresetChange() {
  const select = document.getElementById("pickup-preset-select");
  if (!select) return;

  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  const selectedOpt = select.options[select.selectedIndex];
  if (!selectedOpt) return;

  const isCustom = selectedOpt.getAttribute("data-custom") === "true";
  const defVal = selectedOpt.getAttribute("data-default") || "";

  const customWrapper = document.getElementById("pickup-custom-manual-wrapper");
  const subWrapper = document.getElementById("pickup-sub-detail-wrapper");
  const subLabel = document.getElementById("pickup-sub-label");
  const subInput = document.getElementById("pickup-sub-detail");
  const customInput = document.getElementById("pickup-custom-input");
  const mainInput = document.getElementById("pickup-location");

  // Sub-detail label va placeholderini turiga qarab sozlash
  if (subLabel && subInput) {
    if (selectedPickupType === 'hotel') {
      subLabel.textContent = dict.lblSubDetail || "Xona raqami yoki qavat (ixtiyoriy):";
      subInput.placeholder = dict.phSubHotel || "Masalan: 412-xona";
    } else if (selectedPickupType === 'airport') {
      subLabel.textContent = dict.lblSubDetail || "Reys raqami yoki terminal (ixtiyoriy):";
      subInput.placeholder = dict.phSubAirport || "Masalan: Reys HY-602 yoki 2-terminal";
    } else if (selectedPickupType === 'station') {
      subLabel.textContent = dict.lblSubDetail || "Poyezd reysi va vagon (ixtiyoriy):";
      subInput.placeholder = dict.phSubStation || "Masalan: Afrosiyob 762, 3-vagon";
    } else {
      subLabel.textContent = dict.lblSubDetail || "Qo'shimcha eslatma yoki mo'ljal (ixtiyoriy):";
      subInput.placeholder = dict.phSubCustom || "Masalan: 14-uy yoki kirish darvozasi";
    }
  }

  if (isCustom) {
    if (customWrapper) customWrapper.classList.remove("hidden");
    const customVal = customInput ? customInput.value.trim() : "";
    if (mainInput) {
      mainInput.value = customVal;
      mainInput.placeholder = dict.phPickupCustom || "Aniq manzilni kiriting...";
    }
    if (customInput && !customVal) {
      customInput.focus();
    }
  } else {
    if (customWrapper) customWrapper.classList.add("hidden");
    const subVal = subInput ? subInput.value.trim() : "";
    const combined = subVal ? `${defVal}, ${subVal}` : defVal;
    if (mainInput) {
      mainInput.value = combined;
    }
  }

  // Tezkor chiplarni qayta belgilash (tanlanganini aks ettirish)
  renderPickupChips(selectedPickupType);

  // Room number bilan sinxronlash
  const roomInput = document.getElementById("room-number");
  if (roomInput && mainInput) {
    roomInput.value = mainInput.value;
  }

  // Validatsiya
  validateField('pickup-location', true);
  if (roomInput) validateField('room-number', false);
  updateValidationSummary();
  calculateBookingPrice();
}

function onPickupSubDetailChange() {
  const select = document.getElementById("pickup-preset-select");
  if (!select) return;
  const selectedOpt = select.options[select.selectedIndex];
  if (!selectedOpt) return;

  const isCustom = selectedOpt.getAttribute("data-custom") === "true";
  if (isCustom) return;

  const defVal = selectedOpt.getAttribute("data-default") || "";
  const subInput = document.getElementById("pickup-sub-detail");
  const subVal = subInput ? subInput.value.trim() : "";
  const mainInput = document.getElementById("pickup-location");

  if (mainInput) {
    mainInput.value = subVal ? `${defVal}, ${subVal}` : defVal;
  }

  const roomInput = document.getElementById("room-number");
  if (roomInput && mainInput) {
    roomInput.value = mainInput.value;
  }

  validateField('pickup-location', true);
  if (roomInput) validateField('room-number', false);
  updateValidationSummary();
  calculateBookingPrice();
}

function onPickupCustomInputChange() {
  const customInput = document.getElementById("pickup-custom-input");
  const mainInput = document.getElementById("pickup-location");
  if (!customInput || !mainInput) return;

  mainInput.value = customInput.value.trim();

  const roomInput = document.getElementById("room-number");
  if (roomInput) {
    roomInput.value = mainInput.value;
  }

  validateField('pickup-location', true);
  if (roomInput) validateField('room-number', false);
  updateValidationSummary();
  calculateBookingPrice();
}

function onPickupInputChange() {
  const input = document.getElementById("pickup-location");
  const roomInput = document.getElementById("room-number");
  if (input && roomInput) {
    roomInput.value = input.value;
  }
  validateField('pickup-location', true);
  if (roomInput) validateField('room-number', false);
  updateValidationSummary();
  calculateBookingPrice();
}

// Eski setQuickPickup funksiyasini ham qo'llab-quvvatlaymiz (agar biror joydan chaqirilsa)
function setQuickPickup(val) {
  const input = document.getElementById("pickup-location");
  if (input) input.value = val;
  const roomInput = document.getElementById("room-number");
  if (roomInput) roomInput.value = val;
  validateField('pickup-location', true);
  if (roomInput) validateField('room-number', false);
  updateValidationSummary();
  calculateBookingPrice();
}

function initTimeAndPickup() {
  selectPickupType('hotel');
  updateTimeChipStyles('09:00');
  const timeInput = document.getElementById("start-time");
  if (timeInput && !timeInput.value) {
    timeInput.value = "09:00";
  }
}

const ROOM_CHIP_MAP = {
  '305': 'chipRoom305',
  'hyatt': 'chipHyatt',
  'hilton': 'chipHilton',
  'artResidence': 'chipArtResidence',
  'artCity': 'chipArtCity',
  'apartment': 'chipApartment',
  'notHotel': 'chipNotHotel'
};

const NOTE_CHIP_MAP = {
  'standard': 'chipNoRequests',
  'airport': 'chipAirport',
  'morning': 'chipMorning',
  'childSeat': 'chipChildSeat'
};

// Tezkor xona raqamini to'ldirish (Tilga mos holda)
function setQuickRoom(valOrKey) {
  const input = document.getElementById("room-number");
  if (!input) return;
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  const i18nKey = ROOM_CHIP_MAP[valOrKey];
  input.value = i18nKey && dict[i18nKey] ? dict[i18nKey] : valOrKey;
  validateField('room-number', true);
  updateValidationSummary();
}

// Tezkor istaklar/izohni to'ldirish (Tilga mos holda)
function setQuickNote(valOrKey) {
  const input = document.getElementById("guest-note");
  if (!input) return;
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  const i18nKey = NOTE_CHIP_MAP[valOrKey];
  input.value = i18nKey && dict[i18nKey] ? dict[i18nKey] : valOrKey;
  validateField('guest-note', true);
  updateValidationSummary();
}

// Tezkor email domenini to'ldirish
function appendEmailDomain(domain) {
  const input = document.getElementById("guest-email");
  if (!input) return;
  let val = input.value.trim();
  if (!val) {
    input.value = "";
    input.focus();
    return;
  }
  if (val.includes("@")) {
    val = val.split("@")[0];
  }
  input.value = val + domain;
  validateField('guest-email', true);
  updateValidationSummary();
}

// Telefon raqamini avtomatik formatlash (+998 ...)
function formatPhoneInput(e) {
  let val = e.target.value;
  if (e.inputType && e.inputType.startsWith('delete')) {
    validateField('guest-phone', true);
    updateValidationSummary();
    return;
  }

  const hasPlus = val.startsWith('+');
  let digits = val.replace(/\D/g, '');

  if (digits.startsWith('998')) {
    let formatted = '+998';
    const rest = digits.slice(3);
    if (rest.length > 0) formatted += ' ' + rest.slice(0, 2);
    if (rest.length > 2) formatted += ' ' + rest.slice(2, 5);
    if (rest.length > 5) formatted += ' ' + rest.slice(5, 7);
    if (rest.length > 7) formatted += ' ' + rest.slice(7, 9);
    e.target.value = formatted;
  } else if (!hasPlus && digits.length > 0 && digits[0] === '9') {
    let formatted = '+998 ' + digits.slice(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
    e.target.value = formatted;
  }

  validateField('guest-phone', true);
  updateValidationSummary();
}

// Formani real-vaqtda tekshirish tinglovchilarini sozlash
function setupFormValidation() {
  REQUIRED_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (id === "guest-phone") {
      el.addEventListener("input", (e) => formatPhoneInput(e));
    } else {
      el.addEventListener("input", () => {
        validateField(id, true);
        updateValidationSummary();
      });
    }

    el.addEventListener("blur", () => {
      validateField(id, true);
      updateValidationSummary();
    });

    el.addEventListener("change", () => {
      validateField(id, true);
      updateValidationSummary();
    });
  });
}

// Bitta maydonni tekshirish
function validateField(fieldId, showUi = true) {
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  let isValid = false;
  let errorMsg = "";

  const inputEl = document.getElementById(fieldId);
  const errEl = document.getElementById(`err-${fieldId}`);
  const badgeEl = document.getElementById(`badge-${fieldId}`);
  const iconEl = document.getElementById(`icon-${fieldId}`);

  if (!inputEl) return true;
  const val = inputEl.value ? inputEl.value.trim() : "";

  switch (fieldId) {
    case "start-date": {
      if (!val) {
        errorMsg = dict.valErrDate || "Iltimos, sayohat boshlanish sanasini belgilang";
        isValid = false;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const parts = val.split('-');
        const chosenDate = new Date(parts[0], parts[1] - 1, parts[2]);
        if (chosenDate < today) {
          errorMsg = dict.valErrDate || "Sana o'tib ketgan bo'lishi mumkin emas";
          isValid = false;
        } else {
          isValid = true;
        }
      }
      const dateBadge = document.getElementById("date-status-badge");
      if (dateBadge) {
        if (isValid) {
          dateBadge.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-check text-xs"></i> ${dict.dateSelected || "Tanlandi"}</span>`;
        } else {
          dateBadge.innerHTML = `<span class="text-rose-600 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-xmark text-xs"></i> ${dict.dateNotSelected || "Tanlanmagan"}</span>`;
        }
      }
      break;
    }
    case "start-time": {
      if (!val) {
        errorMsg = dict.valErrTime || "Iltimos, tur boshlanish vaqtini belgilang";
        isValid = false;
      } else {
        isValid = true;
      }
      break;
    }
    case "pickup-location": {
      if (!val || val.length < 2) {
        errorMsg = dict.valErrPickup || "Iltimos, sizni qayerdan olib ketish kerakligini (manzil yoki reysni) yozing";
        isValid = false;
      } else {
        isValid = true;
      }
      break;
    }
    case "guest-name": {
      if (!val) {
        errorMsg = dict.valErrName || "Iltimos, ism va familiyangizni to'liq kiriting";
        isValid = false;
      } else {
        const words = val.split(/\s+/).filter(w => w.length >= 2);
        if (val.length < 4 || words.length < 2) {
          errorMsg = dict.valErrName || "Iltimos, ism va familiyangizni to'liq kiriting (kamida 2 ta so'z)";
          isValid = false;
        } else {
          isValid = true;
        }
      }
      break;
    }
    case "guest-phone": {
      const digits = val.replace(/\D/g, '');
      if (!val || digits.length < 9) {
        errorMsg = dict.valErrPhone || "Iltimos, to'liq telefon raqam kiriting (kamida 9 ta raqam)";
        isValid = false;
      } else {
        isValid = true;
      }
      break;
    }
    case "guest-email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!val || !emailRegex.test(val)) {
        errorMsg = dict.valErrEmail || "Iltimos, to'g'ri elektron pochta manzilini kiriting (masalan: ismingiz@gmail.com)";
        isValid = false;
      } else {
        isValid = true;
      }
      break;
    }
    case "room-number": {
      const pickupVal = document.getElementById("pickup-location")?.value?.trim() || "";
      if (!val && pickupVal) {
        if (inputEl) inputEl.value = pickupVal;
        val = pickupVal;
      }
      if (!val || val.length < 2) {
        errorMsg = dict.valErrRoom || "Iltimos, mehmonxona yoki xona raqamingizni kiriting";
        isValid = false;
      } else {
        isValid = true;
      }
      break;
    }
    case "guest-note": {
      if (!val || val.length < 2) {
        errorMsg = dict.valErrNote || "Iltimos, istaklaringizni yozing yoki tayyor variantlardan birini bosing";
        isValid = false;
      } else {
        isValid = true;
      }
      break;
    }
  }

  if (showUi) {
    if (isValid) {
      inputEl.classList.remove("border-rose-400", "bg-rose-50/50", "ring-1", "ring-rose-400");
      inputEl.classList.add("border-emerald-400", "bg-emerald-50/20");
      if (errEl) errEl.classList.add("hidden");
      if (badgeEl) badgeEl.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-check text-xs"></i> ${dict.badgeCompleted || "To'ldirildi"}</span>`;
      if (iconEl) iconEl.className = "absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm pointer-events-none";
    } else {
      inputEl.classList.remove("border-emerald-400", "bg-emerald-50/20");
      inputEl.classList.add("border-rose-400", "bg-rose-50/50", "ring-1", "ring-rose-400");
      if (errEl) {
        const textSpan = errEl.querySelector("span");
        if (textSpan) textSpan.textContent = errorMsg;
        errEl.classList.remove("hidden");
      }
      if (badgeEl) badgeEl.innerHTML = `<span class="text-rose-600 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-xmark text-xs"></i> ${dict.badgeRequired || "Majburiy"}</span>`;
      if (iconEl) iconEl.className = "absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 text-sm pointer-events-none";
    }
  }

  return isValid;
}

// Barcha maydonlarni tekshirish
function validateAll(showUi = false) {
  let allValid = true;
  let missingCount = 0;
  let firstInvalidEl = null;

  REQUIRED_FIELDS.forEach(fieldId => {
    const valid = validateField(fieldId, showUi);
    if (!valid) {
      allValid = false;
      missingCount++;
      if (!firstInvalidEl) {
        firstInvalidEl = document.getElementById(fieldId);
      }
    }
  });

  return {
    isValid: allValid,
    missingCount,
    firstInvalidEl
  };
}

// Xulosa va tugma holatini yangilash
function updateValidationSummary() {
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  const status = validateAll(false);

  const box = document.getElementById("booking-validation-box");
  const boxIcon = document.getElementById("validation-box-icon");
  const boxText = document.getElementById("validation-box-text");
  const btn = document.getElementById("booking-submit-btn");
  const btnIcon = document.getElementById("booking-btn-icon");
  const btnText = document.getElementById("booking-btn-text");

  if (!box || !btn) return;

  if (status.isValid) {
    box.className = "mb-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2.5 transition-all shadow-sm";
    if (boxIcon) boxIcon.className = "fa-solid fa-circle-check text-emerald-400 text-base shrink-0";
    if (boxText) boxText.textContent = dict.valReadyNotice || "Barcha ma'lumotlar to'liq! Turni bron qilishingiz mumkin";

    btn.className = "w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-600 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 text-base cursor-pointer";
    if (btnIcon) btnIcon.className = "fa-solid fa-paper-plane text-lg text-slate-950";
    if (btnText) btnText.textContent = dict.btnSubmit || "Turni Bron Qilish";
  } else {
    box.className = "mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2.5 transition-all";
    if (boxIcon) boxIcon.className = "fa-solid fa-triangle-exclamation text-amber-400 text-base shrink-0";
    
    let remainingMsg = dict.valRemainingNotice || "Ariza topshirish uchun yana {n} ta maydon to'ldirilishi kerak";
    remainingMsg = remainingMsg.replace("{n}", status.missingCount);
    if (boxText) boxText.textContent = remainingMsg;

    btn.className = "w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 text-base border border-slate-700 cursor-pointer";
    if (btnIcon) btnIcon.className = "fa-solid fa-lock text-sm text-amber-400";
    let btnMsg = dict.btnSubmitDisabled || "Barcha maydonlarni to'ldiring ({n} ta qoldi)";
    btnMsg = btnMsg.replace("{n}", status.missingCount);
    if (btnText) btnText.textContent = btnMsg;
  }
}

// Yuqori ogohlantirish banneri
let alertTimer = null;
function showFloatingAlert(title, message) {
  const banner = document.getElementById("floating-alert-banner");
  const titleEl = document.getElementById("floating-alert-title");
  const descEl = document.getElementById("floating-alert-desc");

  if (!banner) return;
  if (title && titleEl) titleEl.textContent = title;
  if (message && descEl) descEl.textContent = message;

  banner.classList.remove("hidden");

  if (alertTimer) clearTimeout(alertTimer);
  alertTimer = setTimeout(() => {
    hideFloatingAlert();
  }, 7000);
}

function hideFloatingAlert() {
  const banner = document.getElementById("floating-alert-banner");
  if (banner) banner.classList.add("hidden");
}

// 1. Tilni o'zgartirish
function setBookingLanguage(lang) {
  if (!["uz", "ru", "en"].includes(lang)) return;
  currentLang = lang;
  saveSelectedLanguage(lang);

  applyBookingLanguage(lang);
  renderTourCards();
  calculateBookingPrice();
}

function applyBookingLanguage(lang) {
  const dict = UI_STRINGS[lang] || UI_STRINGS.uz;

  // 1. Headerdagi til tugmalari
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

  // 2. data-i18n atributiga ega matnlar
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // 3. Form input placeholderlari
  const nameInput = document.getElementById("guest-name");
  if (nameInput && dict.phName) nameInput.placeholder = dict.phName;

  const emailInput = document.getElementById("guest-email");
  if (emailInput && dict.phEmail) emailInput.placeholder = dict.phEmail;

  const roomInput = document.getElementById("room-number");
  if (roomInput && dict.phRoom) roomInput.placeholder = dict.phRoom;

  const noteInput = document.getElementById("guest-note");
  if (noteInput && dict.phNote) noteInput.placeholder = dict.phNote;

  const pickupInput = document.getElementById("pickup-location");
  if (pickupInput) {
    if (selectedPickupType === 'hotel') pickupInput.placeholder = dict.phPickupHotel || "Mehmonxona nomi va xona raqami (masalan: Hyatt Regency, 412)";
    else if (selectedPickupType === 'airport') pickupInput.placeholder = dict.phPickupAirport || "Reys raqami va terminal (masalan: HY-602, 2-terminal)";
    else if (selectedPickupType === 'station') pickupInput.placeholder = dict.phPickupStation || "Poyezd reysi va vagon (masalan: Afrosiyob 762, 3-vagon)";
    else pickupInput.placeholder = dict.phPickupCustom || "Aniq ko'cha, uy raqami yoki taniqli mo'ljal (masalan: Amir Temur xiyoboni)";
  }

  renderPickupPresets(selectedPickupType);
  renderPickupChips(selectedPickupType);

  const subLabel = document.getElementById("pickup-sub-label");
  const subInput = document.getElementById("pickup-sub-detail");
  if (subLabel && subInput) {
    if (selectedPickupType === 'hotel') {
      subLabel.textContent = dict.lblSubDetail || "Xona raqami yoki qavat (ixtiyoriy):";
      subInput.placeholder = dict.phSubHotel || "Masalan: 412-xona";
    } else if (selectedPickupType === 'airport') {
      subLabel.textContent = dict.lblSubDetail || "Reys raqami yoki terminal (ixtiyoriy):";
      subInput.placeholder = dict.phSubAirport || "Masalan: Reys HY-602 yoki 2-terminal";
    } else if (selectedPickupType === 'station') {
      subLabel.textContent = dict.lblSubDetail || "Poyezd reysi va vagon (ixtiyoriy):";
      subInput.placeholder = dict.phSubStation || "Masalan: Afrosiyob 762, 3-vagon";
    } else {
      subLabel.textContent = dict.lblSubDetail || "Qo'shimcha eslatma yoki mo'ljal (ixtiyoriy):";
      subInput.placeholder = dict.phSubCustom || "Masalan: 14-uy yoki kirish darvozasi";
    }
  }

  const customLabel = document.getElementById("pickup-custom-label");
  if (customLabel) {
    customLabel.textContent = lang === "ru" ? "Укажите желаемый адрес вручную *" : lang === "en" ? "Enter your custom address *" : "O'zingiz istagan manzilni yozing *";
  }

  const presetIndicator = document.getElementById("preset-selected-indicator");
  if (presetIndicator) {
    presetIndicator.textContent = dict.dateSelected || "Tanlandi";
  }

  // 4. Davomiylik tugmalari matnlari
  updateDurationButtonLabels();

  // 5. Validatsiya matnlarini yangilash
  updateValidationSummary();
}

function updateDurationButtonLabels() {
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  
  const d1 = document.getElementById("dur-btn-1");
  if (d1) {
    d1.querySelector(".text-sm").textContent = currentLang === "ru" ? "1 День" : currentLang === "en" ? "1 Day" : "1 Kunlik";
    d1.querySelector(".text-\\[11px\\]").textContent = dict.dur1;
  }

  const d2 = document.getElementById("dur-btn-2");
  if (d2) {
    d2.querySelector(".text-sm").textContent = currentLang === "ru" ? "2 Дня / 1 Ночь" : currentLang === "en" ? "2 Days / 1 Night" : "2 Kun / 1 Kecha";
    d2.querySelector(".text-\\[11px\\]").textContent = dict.dur2;
  }

  const d3 = document.getElementById("dur-btn-3");
  if (d3) {
    d3.querySelector(".text-sm").textContent = currentLang === "ru" ? "3 Дня / 2 Ночи" : currentLang === "en" ? "3 Days / 2 Nights" : "3 Kun / 2 Kecha";
    d3.querySelector(".text-\\[11px\\]").textContent = dict.dur3;
  }

  const d4 = document.getElementById("dur-btn-4");
  if (d4) {
    d4.querySelector(".text-sm").textContent = currentLang === "ru" ? "4 Дня / 3 Ночи" : currentLang === "en" ? "4 Days / 3 Nights" : "4 Kun / 3 Kecha";
    d4.querySelector(".text-\\[11px\\]").textContent = dict.dur4;
  }
}

let isTourSelectorExpanded = false;

function toggleTourPicker() {
  isTourSelectorExpanded = !isTourSelectorExpanded;
  updateTourSelectorVisibility();
}

function updateTourSelectorVisibility() {
  const selector = document.getElementById("tour-cards-selector");
  const btnText = document.getElementById("btn-toggle-tours-text");
  const btnIcon = document.getElementById("btn-toggle-icon");
  const titleEl = document.getElementById("step-tour-title");
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;

  if (isTourSelectorExpanded) {
    if (selector) selector.classList.remove("hidden");
    if (btnText) btnText.textContent = dict.btnCloseTourPicker || (currentLang === 'ru' ? "Закрыть" : currentLang === 'en' ? "Close" : "Yopish");
    if (btnIcon) btnIcon.className = "fa-solid fa-xmark text-amber-600 text-xs";
    if (titleEl) titleEl.textContent = dict.stepTour || (currentLang === 'ru' ? "1. Выберите тур" : currentLang === 'en' ? "1. Select Destination" : "1. Turni Tanlang");
  } else {
    if (selector) selector.classList.add("hidden");
    if (btnText) btnText.textContent = dict.btnChangeTour || (currentLang === 'ru' ? "Сменить тур" : currentLang === 'en' ? "Change tour" : "Turni almashtirish");
    if (btnIcon) btnIcon.className = "fa-solid fa-arrows-rotate text-amber-600 text-xs";
    if (titleEl) titleEl.textContent = dict.stepTourSelected || (currentLang === 'ru' ? "1. Выбранное Направление Тура" : currentLang === 'en' ? "1. Selected Tour Destination" : "1. Tanlangan Sayohat Yo'nalishi");
  }
}

function renderSelectedTourBanner(tour) {
  if (!tour) return "";
  const titleText = getLocalized(tour.title, currentLang);
  const subtitleText = getLocalized(tour.subtitle, currentLang);
  const locationText = getLocalized(tour.location, currentLang);
  const badgeText = getLocalized(tour.badge, currentLang);
  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;

  const rawHighlights = (tour.highlights && tour.highlights[currentLang]) || (tour.highlights && tour.highlights.uz) || [];
  const topHighlights = rawHighlights.slice(0, 3);
  const selectedBadgeLbl = dict.tourSelectedBadge || (currentLang === 'ru' ? "Выбрано" : currentLang === 'en' ? "Selected" : "Tanlangan");

  return `
    <div class="rounded-2xl border-2 border-amber-500/80 bg-gradient-to-br from-amber-50/70 via-white to-sky-50/40 p-3.5 sm:p-5 shadow-sm transition-all">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        
        <!-- Rasm -->
        <div class="relative w-full sm:w-44 h-36 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 shadow-xs">
          <img src="${tour.mainImage}" alt="${titleText}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80'" class="w-full h-full object-cover">
          <span class="absolute top-2 left-2 ${tour.badgeColor || 'bg-amber-500'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            ${badgeText || 'Tavsiya'}
          </span>
          <span class="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <i class="fa-solid fa-circle-check text-[10px]"></i> ${selectedBadgeLbl}
          </span>
        </div>

        <!-- Ma'lumotlar -->
        <div class="flex-1 min-w-0 w-full space-y-1">
          <div class="flex flex-wrap items-center justify-between gap-1">
            <h3 class="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
              ${titleText}
            </h3>
            <span class="text-xs font-black text-amber-600 bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 rounded-lg shrink-0">
              ${formatCurrency(tour.basePricePerPerson, currentLang)} <span class="text-[10px] font-normal text-slate-600">/${dict.perPerson || 'kishi'}</span>
            </span>
          </div>

          <p class="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <i class="fa-solid fa-location-dot text-amber-500 text-xs"></i>
            <span>${locationText}</span>
          </p>

          ${subtitleText ? `
            <p class="text-xs text-slate-600 leading-relaxed font-normal line-clamp-2 pt-0.5">
              ${subtitleText}
            </p>
          ` : ''}

          <!-- Qisqa afzalliklar / teglari -->
          ${topHighlights.length > 0 ? `
            <div class="flex flex-wrap gap-1.5 pt-1">
              ${topHighlights.map(h => `
                <span class="text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg font-medium flex items-center gap-1 shadow-2xs">
                  <i class="fa-solid fa-check text-[9px] text-emerald-600"></i> ${h}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>

      </div>
    </div>
  `;
}

// 2. Turlar kartochkalarini chiqarish (Katta qulay vizual selector)
function renderTourCards() {
  const selectedDisplay = document.getElementById("selected-tour-display");
  const gridContainer = document.getElementById("tour-cards-selector");

  const currentTour = activeTours.find(t => t.id === selectedTourId) || activeTours[0];
  if (selectedDisplay && currentTour) {
    selectedDisplay.innerHTML = renderSelectedTourBanner(currentTour);
  }

  updateTourSelectorVisibility();

  if (!gridContainer) return;

  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  gridContainer.innerHTML = "";

  activeTours.forEach(tour => {
    const isSelected = tour.id === selectedTourId;
    const titleText = getLocalized(tour.title, currentLang);
    const locationText = getLocalized(tour.location, currentLang);
    const badgeText = getLocalized(tour.badge, currentLang);

    const card = document.createElement("div");
    card.onclick = () => selectTour(tour.id, true);
    
    if (isSelected) {
      card.className = "cursor-pointer rounded-2xl p-3 border-2 border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20 transition-all flex flex-col justify-between relative overflow-hidden group";
    } else {
      card.className = "cursor-pointer rounded-2xl p-3 border border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50 transition-all flex flex-col justify-between relative overflow-hidden group";
    }

    card.innerHTML = `
      <div>
        <div class="relative h-28 w-full rounded-xl overflow-hidden mb-2.5 bg-slate-100">
          <img src="${tour.mainImage}" alt="${titleText}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <span class="absolute top-2 left-2 ${tour.badgeColor || 'bg-amber-500'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            ${badgeText || 'Tavsiya'}
          </span>
          ${isSelected ? `
            <div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md">
              <i class="fa-solid fa-check"></i>
            </div>
          ` : `
            <div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center text-xs backdrop-blur-sm opacity-60 group-hover:opacity-100">
              <i class="fa-regular fa-circle"></i>
            </div>
          `}
        </div>

        <h4 class="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1 mb-0.5">
          ${titleText}
        </h4>
        <p class="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
          <i class="fa-solid fa-location-dot text-amber-500 text-[10px]"></i>
          <span>${locationText}</span>
        </p>
      </div>

      <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span class="text-[10px] text-slate-400">${dict.perPerson}</span>
        <span class="text-xs font-black text-amber-600">${formatCurrency(tour.basePricePerPerson, currentLang)}</span>
      </div>
    `;

    gridContainer.appendChild(card);
  });
}

function selectTour(tourId, userClicked = false) {
  selectedTourId = tourId;
  isTourSelectorExpanded = false;
  renderTourCards();
  calculateBookingPrice();

  if (userClicked) {
    const step2El = document.getElementById("start-date") || document.getElementById("start-time");
    if (step2El) {
      step2El.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

// 3. Davomiylikni tanlash
function selectDuration(days) {
  selectedDuration = days;
  const nights = Math.max(0, days - 1);

  // Tugmalar dizaynini yangilash
  for (let i = 1; i <= 4; i++) {
    const btn = document.getElementById(`dur-btn-${i}`);
    if (!btn) continue;

    if (i === days) {
      btn.className = "p-3 rounded-xl border-2 border-amber-500 bg-amber-50 text-left transition-all shadow-sm";
      const title = btn.querySelector(".text-sm");
      if (title) title.className = "text-sm font-bold text-amber-950";
    } else {
      btn.className = "p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all";
      const title = btn.querySelector(".text-sm");
      if (title) title.className = "text-sm font-bold text-slate-900";
    }
  }

  // Mehmonxona bo'limi shartlari
  const hotelNotice = document.getElementById("hotel-1day-notice");
  const hotelGrid = document.getElementById("hotel-options-grid");
  const hotelNightsBadge = document.getElementById("hotel-nights-badge");

  if (days === 1) {
    if (hotelNotice) hotelNotice.classList.remove("hidden");
    if (hotelGrid) hotelGrid.classList.add("hidden");
    if (hotelNightsBadge) {
      hotelNightsBadge.textContent = currentLang === "ru" ? "0 ночей" : currentLang === "en" ? "0 nights" : "0 kecha";
      hotelNightsBadge.className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600";
    }
    hotelOption = "without-hotel";
  } else {
    if (hotelNotice) hotelNotice.classList.add("hidden");
    if (hotelGrid) hotelGrid.classList.remove("hidden");
    if (hotelNightsBadge) {
      const lbl = currentLang === "ru" ? `${nights} ноч.` : currentLang === "en" ? `${nights} night${nights > 1 ? 's' : ''}` : `${nights} kecha`;
      hotelNightsBadge.textContent = lbl;
      hotelNightsBadge.className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900";
    }
  }

  updateHotelRadioSelection();
  calculateBookingPrice();
}

// 4. Kattalar va Bolalar sonini o'zgartirish (Stepper)
function changeAdults(delta) {
  adultsCount = Math.max(1, Math.min(30, adultsCount + delta));
  const el = document.getElementById("adults-count-display");
  if (el) el.textContent = adultsCount;
  calculateBookingPrice();
}

function changeChildren(delta) {
  childrenCount = Math.max(0, Math.min(20, childrenCount + delta));
  const el = document.getElementById("children-count-display");
  if (el) el.textContent = childrenCount;
  calculateBookingPrice();
}

// 5. Mehmonxona tanlovi
function selectHotelOption(opt) {
  if (selectedDuration === 1) {
    hotelOption = "without-hotel";
    return;
  }
  hotelOption = opt;
  updateHotelRadioSelection();
  calculateBookingPrice();
}

function updateHotelRadioSelection() {
  const cardWith = document.getElementById("hotel-card-with");
  const cardWithout = document.getElementById("hotel-card-without");

  if (cardWith && cardWithout) {
    const radioWith = cardWith.querySelector('input[type="radio"]');
    const radioWithout = cardWithout.querySelector('input[type="radio"]');

    if (hotelOption === "with-hotel") {
      if (radioWith) radioWith.checked = true;
      if (radioWithout) radioWithout.checked = false;
      cardWith.className = "cursor-pointer p-4 rounded-xl border-2 border-amber-500 bg-amber-50/40 hover:bg-amber-50 transition-all flex items-start gap-3 shadow-sm";
      cardWithout.className = "cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-start gap-3";
    } else {
      if (radioWith) radioWith.checked = false;
      if (radioWithout) radioWithout.checked = true;
      cardWith.className = "cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-start gap-3";
      cardWithout.className = "cursor-pointer p-4 rounded-xl border-2 border-amber-500 bg-amber-50/40 hover:bg-amber-50 transition-all flex items-start gap-3 shadow-sm";
    }
  }
}

// 6. Gid xizmati tanlovi
function selectGuideOption(opt) {
  guideOption = opt;
  const cardWith = document.getElementById("guide-card-with");
  const cardWithout = document.getElementById("guide-card-without");
  const langBox = document.getElementById("guide-language-box");

  const radioWith = cardWith?.querySelector('input[type="radio"]');
  const radioWithout = cardWithout?.querySelector('input[type="radio"]');

  if (opt === "with-guide") {
    if (radioWith) radioWith.checked = true;
    if (radioWithout) radioWithout.checked = false;
    if (cardWith) cardWith.className = "cursor-pointer p-4 rounded-xl border-2 border-brand-500 bg-brand-50/40 hover:bg-brand-50 transition-all flex items-start gap-3 shadow-sm";
    if (cardWithout) cardWithout.className = "cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-start gap-3";
    if (langBox) langBox.classList.remove("hidden");
  } else {
    if (radioWith) radioWith.checked = false;
    if (radioWithout) radioWithout.checked = true;
    if (cardWith) cardWith.className = "cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-start gap-3";
    if (cardWithout) cardWithout.className = "cursor-pointer p-4 rounded-xl border-2 border-brand-500 bg-brand-50/40 hover:bg-brand-50 transition-all flex items-start gap-3 shadow-sm";
    if (langBox) langBox.classList.add("hidden");
  }

  calculateBookingPrice();
}

function selectGuideLanguage(langCode) {
  guideLanguage = langCode;
  ["uz", "ru", "en"].forEach(code => {
    const btn = document.getElementById(`guide-lang-${code}`);
    if (btn) {
      if (code === langCode) {
        btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold border-2 border-brand-600 bg-brand-600 text-white shadow-sm flex items-center gap-1.5 transition-all";
      } else {
        btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm";
      }
    }
  });

  calculateBookingPrice();
}

function onDateOrOptionChange() {
  calculateBookingPrice();
  validateField('start-date', true);
  updateValidationSummary();
}

// 7. Jonli Narx Hisob-Kitobi va Xulosa Yangilanishi
function calculateBookingPrice() {
  const tour = activeTours.find(t => t.id === selectedTourId) || activeTours[0];
  if (!tour) return;

  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  const nights = Math.max(0, selectedDuration - 1);

  // 1. Asosiy tur narxi (Kattalar to'liq, bolalar 50% narxda, kunlar koeffitsiyenti bilan)
  let dayFactor = 1;
  if (selectedDuration === 2) dayFactor = 1.85;
  if (selectedDuration === 3) dayFactor = 2.65;
  if (selectedDuration === 4) dayFactor = 3.4;

  const basePricePerPerson = tour.basePricePerPerson || 350000;
  const personBase = (adultsCount * basePricePerPerson) + (childrenCount * basePricePerPerson * 0.5);
  const baseTotal = Math.round(personBase * dayFactor);

  // 2. Mehmonxona narxi (Kechalar soni va xonalar hisobi: 2 kishiga 1 xona)
  const hotelPricePerNight = tour.hotelPricePerNight || 450000;
  const roomsCount = Math.ceil((adultsCount + childrenCount) / 2);
  const hotelTotal = (hotelOption === "with-hotel" && nights > 0)
    ? (hotelPricePerNight * nights * roomsCount)
    : 0;

  // 3. Gid xizmati narxi (Kunlar soni bo'yicha)
  const guidePricePerDay = tour.guidePricePerDay || 200000;
  const guideTotal = (guideOption === "with-guide")
    ? (guidePricePerDay * selectedDuration)
    : 0;

  // 4. Jami
  const grandTotal = baseTotal + hotelTotal + guideTotal;

  // Xulosa kartochkasini yangilash
  const imgEl = document.getElementById("summary-tour-img");
  if (imgEl) imgEl.src = tour.mainImage;

  const badgeEl = document.getElementById("summary-tour-badge");
  if (badgeEl) {
    badgeEl.textContent = getLocalized(tour.badge, currentLang) || "Aureon";
    badgeEl.className = `text-[9px] font-bold px-2 py-0.5 rounded-full ${tour.badgeColor || 'bg-amber-500'} text-white inline-block mb-1`;
  }

  const titleEl = document.getElementById("summary-tour-title");
  if (titleEl) titleEl.textContent = getLocalized(tour.title, currentLang);

  const locEl = document.getElementById("summary-tour-location");
  if (locEl) locEl.textContent = getLocalized(tour.location, currentLang);

  // Sana
  const dateInput = document.getElementById("start-date");
  const dateEl = document.getElementById("summary-date");
  if (dateEl) {
    dateEl.textContent = dateInput && dateInput.value ? dateInput.value : (dict.dateNotSelected || "Belgilanmagan");
  }

  // Boshlanish vaqti (Soati)
  const timeInput = document.getElementById("start-time");
  const timeEl = document.getElementById("summary-start-time");
  if (timeEl) {
    timeEl.textContent = timeInput && timeInput.value ? timeInput.value : (selectedStartTime || "09:00");
  }

  // Olib ketish nuqtasi
  const pickupInput = document.getElementById("pickup-location");
  const pickupEl = document.getElementById("summary-pickup");
  if (pickupEl) {
    if (pickupInput && pickupInput.value && pickupInput.value.trim().length > 0) {
      pickupEl.textContent = pickupInput.value.trim();
      pickupEl.title = pickupInput.value.trim();
      pickupEl.className = "font-semibold text-amber-300 truncate max-w-[150px] text-right";
    } else {
      pickupEl.textContent = dict.dateNotSelected || "Belgilanmagan";
      pickupEl.className = "font-semibold text-slate-400 truncate max-w-[150px] text-right";
    }
  }

  // Davomiyligi
  const durEl = document.getElementById("summary-duration");
  if (durEl) {
    if (selectedDuration === 1) {
      durEl.textContent = currentLang === "ru" ? "1 День (Дневной тур)" : currentLang === "en" ? "1 Day (Day trip)" : "1 Kunlik (Kunduzgi)";
    } else {
      const daysLbl = currentLang === "ru" ? "Дня" : currentLang === "en" ? "Days" : "Kun";
      const nightsLbl = currentLang === "ru" ? "Ноч." : currentLang === "en" ? (nights > 1 ? "Nights" : "Night") : "Kecha";
      durEl.textContent = `${selectedDuration} ${daysLbl} / ${nights} ${nightsLbl}`;
    }
  }

  // Sayohatchilar
  const guestsEl = document.getElementById("summary-guests");
  if (guestsEl) {
    let text = `${adultsCount} ` + (dict.adultsLabel || (currentLang === "ru" ? "взр." : currentLang === "en" ? "adults" : "katta"));
    if (childrenCount > 0) {
      text += `, ${childrenCount} ` + (dict.childrenLabel || (currentLang === "ru" ? "детей" : currentLang === "en" ? "children" : "bola"));
    }
    guestsEl.textContent = text;
  }

  // Otel
  const hotelEl = document.getElementById("summary-hotel");
  if (hotelEl) {
    if (hotelOption === "with-hotel" && nights > 0) {
      const withLbl = dict.withHotelLabel || (currentLang === "ru" ? "С отелем" : currentLang === "en" ? "With hotel" : "Otel bilan");
      const nLbl = dict.nightsLabel || (currentLang === "ru" ? "ноч." : currentLang === "en" ? "n." : "kecha");
      hotelEl.textContent = `${withLbl} (${nights} ${nLbl})`;
      hotelEl.className = "font-semibold text-amber-300";
    } else {
      hotelEl.textContent = dict.withoutHotelLabel || (currentLang === "ru" ? "Без отеля (только тур)" : currentLang === "en" ? "Tour only (No hotel)" : "Otelsiz (Faqat tur)");
      hotelEl.className = "font-semibold text-slate-400";
    }
  }

  // Gid
  const guideEl = document.getElementById("summary-guide");
  const guideLangLabels = {
    uz: currentLang === "ru" ? "Узбекский" : currentLang === "en" ? "Uzbek" : "O'zbek",
    ru: currentLang === "ru" ? "Русский" : currentLang === "en" ? "Russian" : "Rus tili",
    en: currentLang === "ru" ? "Английский" : currentLang === "en" ? "English" : "Ingliz tili"
  };
  if (guideEl) {
    if (guideOption === "with-guide") {
      const withLbl = dict.withGuideLabel || (currentLang === "ru" ? "С гидом" : currentLang === "en" ? "With guide" : "Gid bilan");
      guideEl.textContent = `${withLbl} (${guideLangLabels[guideLanguage] || guideLanguage})`;
      guideEl.className = "font-semibold text-sky-300";
    } else {
      guideEl.textContent = dict.withoutGuideLabel || (currentLang === "ru" ? "Без гида (самостоятельно)" : currentLang === "en" ? "Self-guided (No guide)" : "Gidsiz (Mustaqil)");
      guideEl.className = "font-semibold text-slate-400";
    }
  }

  // Narx bo'linishi
  const basePriceEl = document.getElementById("breakdown-base-price");
  if (basePriceEl) basePriceEl.textContent = formatCurrency(baseTotal, currentLang);

  const hotelPriceEl = document.getElementById("breakdown-hotel-price");
  if (hotelPriceEl) hotelPriceEl.textContent = formatCurrency(hotelTotal, currentLang);

  const guidePriceEl = document.getElementById("breakdown-guide-price");
  if (guidePriceEl) guidePriceEl.textContent = formatCurrency(guideTotal, currentLang);

  // Jami hisob (So'm va Dollar ko'rinishida)
  const grandTotalEl = document.getElementById("grand-total-display");
  const grandTotalUsdEl = document.getElementById("grand-total-usd-display");
  const rateBadgeEl = document.getElementById("currency-rate-badge");

  if (grandTotalEl) {
    grandTotalEl.textContent = formatCurrencySom(grandTotal, currentLang);
  }
  if (grandTotalUsdEl) {
    grandTotalUsdEl.textContent = `≈ ${formatCurrencyUsd(grandTotal)} USD`;
  }
  if (rateBadgeEl) {
    rateBadgeEl.textContent = `1 USD ≈ ${new Intl.NumberFormat('uz-UZ').format(getExchangeRate())} UZS`;
  }

  // Mobil ekran pastki qismidagi suzuvchi narx paneli
  const mobileBottomTotal = document.getElementById("mobile-bottom-total");
  const mobileBottomUsd = document.getElementById("mobile-bottom-usd");
  if (mobileBottomTotal) {
    mobileBottomTotal.textContent = formatCurrencySom(grandTotal, currentLang);
  }
  if (mobileBottomUsd) {
    mobileBottomUsd.textContent = `≈ ${formatCurrencyUsd(grandTotal)} USD`;
  }

  // Karta ichidagi narx nishonlarini yangilash
  const hotelBadge = document.getElementById("hotel-price-badge");
  if (hotelBadge) {
    hotelBadge.textContent = `+${formatCurrency(hotelPricePerNight, currentLang)} / ` + (currentLang === "ru" ? "ночь" : currentLang === "en" ? "night" : "kecha");
  }

  const guideBadge = document.getElementById("guide-price-badge");
  if (guideBadge) {
    guideBadge.textContent = `+${formatCurrency(guidePricePerDay, currentLang)} / ` + (currentLang === "ru" ? "день" : currentLang === "en" ? "day" : "kun");
  }

  return {
    tour,
    baseTotal,
    hotelTotal,
    guideTotal,
    grandTotal,
    nights
  };
}

// 8. Formani topshirish (Submit & Telegram Notification)
async function handleBookingSubmit(event) {
  event.preventDefault();

  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  const status = validateAll(true);

  // Agar 1 ta bo'lsa ham maydon xom yoki to'ldirilmagan bo'lsa — ariza QAT'IYAN QABUL QILINMAYDI!
  if (!status.isValid) {
    // 1. Barcha to'ldirilmagan maydonlarga silkinish (shake) animatsiyasini berish
    REQUIRED_FIELDS.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el && !validateField(fieldId, false)) {
        el.classList.add("shake-field");
        setTimeout(() => el.classList.remove("shake-field"), 450);
      }
    });

    // 2. Yuqorida yorqin qizil ogohlantirish bannerini chiqarish
    showFloatingAlert(
      currentLang === "ru" ? "Внимание! Заполнены не все поля" : currentLang === "en" ? "Attention! Incomplete Form" : "Diqqat! Maydonlar to'liq to'ldirilmadi",
      dict.valAlertBanner || "Ariza qabul qilinishi uchun barcha ma'lumotlarni to'liq to'ldirishingiz shart. To'ldirilmagan joylar qizil rangda ko'rsatildi."
    );

    // 3. Birinchi to'ldirilmagan maydonga silliq siljish va kursor qo'yish
    if (status.firstInvalidEl) {
      status.firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      status.firstInvalidEl.focus();
    }

    updateValidationSummary();
    return false; // STOP! Hech qanday buyurtma saqlanmaydi va qabul qilinmaydi!
  }

  const calc = calculateBookingPrice();
  if (!calc || !calc.tour) return;

  const guestName = document.getElementById("guest-name")?.value.trim();
  const guestPhone = document.getElementById("guest-phone")?.value.trim();
  const guestEmail = document.getElementById("guest-email")?.value.trim().toLowerCase() || "";
  const pickupLocation = document.getElementById("pickup-location")?.value.trim() || document.getElementById("room-number")?.value.trim() || "";
  const roomNumber = pickupLocation;
  const startTime = document.getElementById("start-time")?.value || selectedStartTime || "09:00";
  const guestNote = document.getElementById("guest-note")?.value.trim();
  const startDate = document.getElementById("start-date")?.value;

  const submitBtn = document.getElementById("booking-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-lg"></i> <span>Yuborilmoqda...</span>`;
  }

  const newBooking = {
    id: "BK-" + Date.now().toString().slice(-6),
    timestamp: new Date().toLocaleString("uz-UZ", { hour12: false }),
    tourId: calc.tour.id,
    tourTitle: calc.tour.title.uz || calc.tour.title,
    tourTitleLocalized: getLocalized(calc.tour.title, currentLang),
    guestName: guestName,
    guestPhone: guestPhone,
    guestEmail: guestEmail,
    roomNumber: roomNumber,
    pickupLocation: pickupLocation,
    pickupType: selectedPickupType,
    startTime: startTime,
    startDate: startDate,
    durationDays: selectedDuration,
    hotelOption: hotelOption === "with-hotel" ? "Otel bilan" : "Otelsiz",
    guideOption: guideOption === "with-guide" ? "Gid bilan" : "Gidsiz",
    nights: calc.nights,
    adults: adultsCount,
    children: childrenCount,
    guideLanguage: guideOption === "with-guide" ? guideLanguage : "Gidsiz",
    clientLang: currentLang,
    note: guestNote,
    totalPrice: calc.grandTotal,
    status: "Yangi"
  };

  // 1. Backend API mavjud bo'lsa, avval markaziy bazaga yuborish
  let sentToBackend = false;
  try {
    const apiUrl = getApiUrl('/api/bookings');
    if (apiUrl) {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.booking && json.booking.id) {
          newBooking.id = json.booking.id;
        }
        sentToBackend = true;
      }
    }
  } catch (apiErr) {
    console.warn("Backend API ulanmadi, lokal saqlanmoqda:", apiErr);
  }

  // 2. Lokal keshga ham saqlash
  const bookings = getStoredBookings();
  bookings.unshift(newBooking);
  saveBookings(bookings);

  // 3. Telegramga yuborish (agar serverdan yuborilmagan bo'lsa)
  if (!sentToBackend) {
    await sendTelegramNotification(newBooking);
  }

  // 3. Muvaffaqiyat modalini ochish
  showBookingSuccessModal(newBooking);

  // 4. Tugmani tiklash
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane text-lg"></i> <span data-i18n="btnSubmit">${UI_STRINGS[currentLang]?.btnSubmit || "Turni Bron Qilish"}</span>`;
  }
}

// Telegram Bot xabarnomasi
async function sendTelegramNotification(booking) {
  const config = getTelegramConfig();
  if (!config || !config.botToken || !config.chatId) {
    console.log("Telegram sozlamalari yo'q. Buyurtma faqat admin panelda saqlandi.");
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
    "Gidsiz": "Gidsiz (Mustaqil)"
  };

  const pickupTypeLabels = {
    hotel: "🏨 Mehmonxona",
    airport: "✈️ Aeroport (Kutib olish)",
    station: "🚆 Vokzal",
    custom: "📍 Shaxsiy manzil"
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
📧 *Email:* \`${booking.guestEmail || 'Kiritilmagan'}\`
━━━━━━━━━━━━━━━━━━━━
📍 *Yo'nalish:* *${booking.tourTitleLocalized || booking.tourTitle}*
📅 *Boshlanish sanasi:* ${booking.startDate}
🕒 *Boshlanish vaqti:* *${booking.startTime || '09:00'}*
🚗 *Olib ketish joyi:* *${booking.pickupLocation || booking.roomNumber}* (${pickupTypeLabels[booking.pickupType] || 'Manzil'})
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

// Muvaffaqiyat modalini chiqarish
function showBookingSuccessModal(booking) {
  const modal = document.getElementById("success-modal");
  const details = document.getElementById("success-modal-details");
  if (!modal || !details) return;

  const dict = UI_STRINGS[currentLang] || UI_STRINGS.uz;
  const lblId = currentLang === "ru" ? "Номер брони:" : currentLang === "en" ? "Booking ID:" : "Buyurtma ID:";
  const lblTour = currentLang === "ru" ? "Направление:" : currentLang === "en" ? "Tour:" : "Yo'nalish:";
  const lblGuest = currentLang === "ru" ? "Гость:" : currentLang === "en" ? "Guest:" : "Mehmon:";
  const lblTime = currentLang === "ru" ? "Время отправления:" : currentLang === "en" ? "Departure Time:" : "Boshlanish vaqti:";
  const lblPickup = currentLang === "ru" ? "Место встречи:" : currentLang === "en" ? "Pickup Point:" : "Olib ketish joyi:";
  const lblPhone = currentLang === "ru" ? "Телефон:" : currentLang === "en" ? "Phone:" : "Telefon:";
  const lblEmail = currentLang === "ru" ? "Эл. почта:" : currentLang === "en" ? "Email:" : "Email:";
  const lblGuide = currentLang === "ru" ? "Гид:" : currentLang === "en" ? "Guide:" : "Gid xizmati:";
  const lblDate = currentLang === "ru" ? "Дата начала:" : currentLang === "en" ? "Start Date:" : "Sana:";
  const lblTotal = currentLang === "ru" ? "Итого:" : currentLang === "en" ? "Total:" : "Jami hisob:";

  const daysSuffix = currentLang === "ru" ? "дн." : currentLang === "en" ? "days" : "kun";
  const guideText = booking.guideOption === "Gid bilan"
    ? (dict.withGuideLabel || "Gid bilan")
    : (dict.withoutGuideLabel || "Gidsiz");
  const hotelText = booking.hotelOption === "Otel bilan"
    ? (dict.withHotelLabel || "Otel bilan")
    : (dict.withoutHotelLabel || "Otelsiz");

  details.innerHTML = `
    <div><strong>${lblId}</strong> <span class="text-amber-600 font-bold font-mono">${booking.id}</span></div>
    <div><strong>${lblTour}</strong> ${booking.tourTitleLocalized || booking.tourTitle}</div>
    <div><strong>${lblGuest}</strong> ${booking.guestName}</div>
    <div><strong>${lblPhone}</strong> ${booking.guestPhone}</div>
    <div><strong>${lblEmail}</strong> <span class="text-amber-700 font-semibold">${booking.guestEmail || '-'}</span></div>
    <div><strong>${lblDate}</strong> ${booking.startDate} (🕒 <strong>${booking.startTime || '09:00'}</strong>)</div>
    <div><strong>${lblPickup}</strong> ${booking.pickupLocation || booking.roomNumber}</div>
    <div><strong>${lblGuide}</strong> ${guideText}</div>
    <div><strong>${dict.sumDuration || "Davomiyligi:"}</strong> ${booking.durationDays} ${daysSuffix}, ${hotelText}</div>
    <div><strong>${lblTotal}</strong> <span class="font-bold text-slate-900">${formatCurrency(booking.totalPrice, currentLang)}</span></div>
  `;

  modal.classList.remove("hidden");
}

function closeSuccessModal() {
  const modal = document.getElementById("success-modal");
  if (modal) modal.classList.add("hidden");
  document.getElementById("booking-form")?.reset();
  initDatePicker();
  initTimeAndPickup();
  selectDuration(2);
  adultsCount = 2;
  childrenCount = 0;
  document.getElementById("adults-count-display").textContent = "2";
  document.getElementById("children-count-display").textContent = "0";
  calculateBookingPrice();

  // Barcha maydonlar vizual ko'rinishini tozalash
  REQUIRED_FIELDS.forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.classList.remove("border-rose-400", "bg-rose-50/50", "ring-1", "ring-rose-400", "border-emerald-400", "bg-emerald-50/20");
    }
    const err = document.getElementById(`err-${fieldId}`);
    if (err) err.classList.add("hidden");
    const badge = document.getElementById(`badge-${fieldId}`);
    if (badge) badge.innerHTML = "";
    const icon = document.getElementById(`icon-${fieldId}`);
    if (icon) {
      if (fieldId === "guest-name") icon.className = "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none";
      if (fieldId === "guest-phone") icon.className = "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none";
      if (fieldId === "room-number") icon.className = "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none";
      if (fieldId === "pickup-location") icon.className = "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none";
      if (fieldId === "guest-note") icon.className = "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none";
    }
  });

  updateValidationSummary();
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
        <p class="text-[11px] text-slate-400 mt-1">ID (masalan: BK-123456) yoki to'liq telefon raqamni qayta tekshiring.</p>
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
