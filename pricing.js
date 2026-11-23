/**
 * pricing.js - Tur narxini hisoblash (yagona formula)
 *
 * Bir xil fayl ikki joyda ishlatiladi:
 *  - brauzerda (booking.html): mijozga jonli narxni ko'rsatish uchun -> window.AureonPricing
 *  - serverda (server.js): buyurtma narxini qayta hisoblash uchun   -> require('./pricing')
 * Shuning uchun mijoz ko'rgan narx va saqlangan narx hech qachon farq qilmaydi.
 * Formulani o'zgartirsangiz: npm test
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AureonPricing = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const DEFAULT_PRICES = {
    basePricePerPerson: 350000,
    hotelPricePerNight: 450000,
    guidePricePerDay: 200000
  };

  // Kunlar koeffitsiyenti: ko'p kunlik turda har kun biroz arzonroq
  const DAY_FACTORS = { 2: 1.85, 3: 2.65, 4: 3.4 };

  /**
   * @param {object} tour  basePricePerPerson, hotelPricePerNight, guidePricePerDay
   * @param {object} opts  { durationDays, adults, children, withHotel, withGuide }
   */
  function calculate(tour, opts) {
    const durationDays = opts.durationDays;
    const adults = opts.adults;
    const children = opts.children || 0;
    const nights = Math.max(0, durationDays - 1);

    // 1. Asosiy tur narxi: kattalar to'liq, bolalar 50%, kunlar koeffitsiyenti bilan
    const dayFactor = DAY_FACTORS[durationDays] || 1;
    const basePricePerPerson = tour.basePricePerPerson || DEFAULT_PRICES.basePricePerPerson;
    const personBase = (adults * basePricePerPerson) + (children * basePricePerPerson * 0.5);
    const baseTotal = Math.round(personBase * dayFactor);

    // 2. Mehmonxona: kechalar soni x xonalar (2 kishiga 1 xona)
    const hotelPricePerNight = tour.hotelPricePerNight || DEFAULT_PRICES.hotelPricePerNight;
    const roomsCount = Math.ceil((adults + children) / 2);
    const hotelTotal = (opts.withHotel && nights > 0) ? (hotelPricePerNight * nights * roomsCount) : 0;

    // 3. Gid xizmati: kunlar soni bo'yicha
    const guidePricePerDay = tour.guidePricePerDay || DEFAULT_PRICES.guidePricePerDay;
    const guideTotal = opts.withGuide ? (guidePricePerDay * durationDays) : 0;

    return {
      nights,
      dayFactor,
      roomsCount,
      basePricePerPerson,
      hotelPricePerNight,
      guidePricePerDay,
      baseTotal,
      hotelTotal,
      guideTotal,
      totalPrice: baseTotal + hotelTotal + guideTotal
    };
  }

  return { calculate, DEFAULT_PRICES, DAY_FACTORS };
});
