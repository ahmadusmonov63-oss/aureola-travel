// Tailwind CSS sozlamalari. styles.css ni qayta yig'ish: npm run build:css
// (HTML yoki JS ga yangi Tailwind klass qo'shilganda shu buyruqni ishga tushirib, styles.css ni commit qiling.)
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './*.js',
    './data/db.json' // turlarning badgeColor klasslari
  ],
  // Admin paneldan yangi tur qo'shilganda ishlatilishi mumkin bo'lgan badge ranglari
  safelist: [
    { pattern: /^bg-(amber|blue|cyan|emerald|green|purple|rose|red|sky|indigo|teal|orange|slate)-(500|600)$/ }
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#051b2c'
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706'
        }
      }
    }
  }
};
