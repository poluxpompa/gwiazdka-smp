// Dane produktów i dostawy, wspólne dla sklepu (merch.js) i płatności (platnosc.js).
// Zdjęcia z sagi.store. Plecy obu bluz i koszulki Carmel są wygenerowane z przodu (sklep ma tylko przód).

const SIZE_TABLES = {
  bluza: { cols: ['Długość', 'Szerokość', 'Rękaw'], rows: [['XXXS', 57, 49, 57], ['XXS', 59, 52, 59], ['XS', 61, 55, 61], ['S', 63, 57, 62], ['M', 65, 59, 63], ['L', 67, 62, 64]] },
  koszulka: { cols: ['Długość', 'Szerokość', 'Rękaw'], rows: [['XXXS', 62, 47, 18], ['XXS', 64, 49, 19], ['XS', 66, 51, 20], ['S', 68, 53, 21], ['M', 70, 55, 22], ['L', 72, 57, 23]] }
};
const CATS = { bluzy: 'Bluzy', koszulki: 'Koszulki', czapki: 'Czapki', breloki: 'Breloki' };

// views: [końcówka nazwy pliku, podpis]. Kolejność = kolejność przy obracaniu.
const PRODUCTS = [
  { id: 'bluza-polu', cat: 'bluzy', name: 'Granatowa bluza Polu', price: 259.99, sizes: 'bluza', sparkle: true,
    views: [['', 'Przód'], ['-tyl', 'Tył']],
    desc: 'Bluza szyta w Polsce, z nadrukiem wykonanym techniką dżetów.',
    specs: [['Materiał', '90% bawełna, 10% poliester'], ['Gramatura', '400 gsm'], ['Zdobienie', 'dżety'], ['Produkcja', 'Polska']] },
  { id: 'koszulka-graffiti', cat: 'koszulki', name: 'Biała koszulka Graffiti', price: 119.99, sizes: 'koszulka', badge: 'Ostatnie sztuki',
    views: [['', 'Przód'], ['-tyl', 'Tył']],
    desc: 'Bawełniana koszulka szyta w Polsce. Mały podpis z przodu, cała ściana graffiti na plecach. Nadruk DTF.',
    specs: [['Materiał', '100% bawełna'], ['Gramatura', '240 gsm'], ['Nadruk', 'DTF'], ['Produkcja', 'Polska']] },
  { id: 'jersey-d1', cat: 'koszulki', name: 'Koszulka Jersey D1', price: 109.99, sizes: 'koszulka',
    views: [['', 'Przód'], ['-tyl', 'Tył']],
    desc: 'Sportowa koszulka z dużym D1 z przodu i napisem District 1 na plecach. D1 to dystrykt Sagiego.',
    specs: [['Materiał', '100% poliester'], ['Gramatura', '180 gsm'], ['Nadruk', 'sublimacja'], ['Produkcja', 'Polska']] },
  { id: 'czapka-klarfi', cat: 'czapki', name: 'Czerwona czapka Klarfi', price: 69.99,
    views: [['-przod', 'Przód'], ['', 'Skos'], ['-bok', 'Bok'], ['-tyl', 'Tył']], start: 1,
    desc: 'Bawełniana czapka z haftem z przodu i z boku. Regulowane zapięcie z tyłu.',
    specs: [['Materiał', '100% bawełna'], ['Zdobienie', 'haft'], ['Rozmiar', 'uniwersalny']] },
  { id: 'koszulka-carmel', cat: 'koszulki', name: 'Czarna koszulka Carmel', price: 119.99, sizes: 'koszulka',
    views: [['', 'Przód'], ['-tyl', 'Tył']],
    desc: 'Koszulka z Carmelkiem, wielbłądem Sagiego z Anarchia SMP. Nadruk DTF.',
    specs: [['Materiał', '100% bawełna'], ['Gramatura', '240 gsm'], ['Nadruk', 'DTF'], ['Produkcja', 'Polska']] },
  { id: 'bluza-sagi', cat: 'bluzy', name: 'Brązowa bluza Sagi', price: 269.99, sizes: 'bluza', sold: true,
    views: [['', 'Przód'], ['-tyl', 'Tył']],
    desc: 'Bawełniana bluza szyta w Polsce, z haftem inspirowanym wycinanką z gazety.',
    specs: [['Materiał', '100% bawełna'], ['Gramatura', '380 gsm'], ['Zdobienie', 'haft'], ['Produkcja', 'Polska']] },
  { id: 'brelok-sagi', cat: 'breloki', name: 'Brelok Sagi', price: 29.99, sold: true,
    views: [['', 'Przód'], ['-tyl', 'Tył']],
    desc: 'Brelok z figurką Sagiego z trwałego PVC. Pasuje do kluczy i plecaka.',
    specs: [['Materiał', 'PVC'], ['Wymiary', '65 × 35 × 30 mm']] }
];
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const views = p => p.views || [['', 'Przód']];
const src = (p, suf = '') => `assets/merch/${p.id}${suf}.webp`;
const img = p => src(p);
const price = n => fmtPLN(n, 2);

// Dostawa jak na sagi.store (InPost, 1–2 dni). Sklep nie podaje cen dostawy:
// wpisz kwotę w price, a pojawi się w podsumowaniu płatności. null = cena nieustalona.
const SHIPPING = [
  { id: 'paczkomat', name: 'Paczkomat InPost 24/7', note: 'Odbierasz, kiedy chcesz. Dostawa 1–2 dni.', price: null },
  { id: 'kurier', name: 'Kurier InPost', note: 'Pod same drzwi. Dostawa 1–2 dni.', price: null }
];
