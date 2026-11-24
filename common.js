// Wspólne zachowania obu stron: menu mobilne, animacje pojawiania, koszyk, komunikaty, pikselowe dekoracje.
document.documentElement.classList.add('js');

// Docelowe adresy. Pusty adres = przycisk pokazuje komunikat.
const LINKS = { donate: '', how: '', checkout: '' };
const MISSING = {
  donate: 'Link do wpłat nie jest jeszcze dostępny.',
  how: 'Instrukcja wpłat nie jest jeszcze dostępna.',
  checkout: 'Płatności nie są jeszcze podpięte.'
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtPLN = (n, dec = 0) => n.toLocaleString('pl-PL', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: true }).replace(/\s/g, ' ') + ' zł';

const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

document.querySelectorAll('[data-link]').forEach(el => {
  const url = LINKS[el.dataset.link];
  if (url) { el.href = url; el.target = '_blank'; el.rel = 'noopener'; }
});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-link]');
  if (!el || LINKS[el.dataset.link]) return;
  e.preventDefault();
  toast(MISSING[el.dataset.link]);
});

const nav = document.getElementById('nav'), burger = document.getElementById('burger');
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', nav.classList.toggle('open')));
nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });

const revealObs = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); } });
}, { rootMargin: '0px 0px -8% 0px' });

// Koszyk w localStorage, wspólny dla obu stron.
const CART_KEY = 'gwiazdka-cart';
const cart = {
  items: JSON.parse(localStorage.getItem(CART_KEY) || '[]'),
  save() { localStorage.setItem(CART_KEY, JSON.stringify(this.items)); updateCartCount(true); },
  count() { return this.items.reduce((s, i) => s + i.qty, 0); }
};
function updateCartCount(bump) {
  const el = document.getElementById('cartCount');
  const n = cart.count();
  el.textContent = n;
  el.hidden = n === 0;
  if (bump && !reduceMotion) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'cubic-bezier(.3,1.6,.5,1)' });
}
updateCartCount(false);

// ---------- pikselowe dekoracje ----------
const rnd = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Kilka przygaszonych gwiazd na nocnym niebie (stałe, bez migania).
document.querySelectorAll('[data-stars]').forEach(sky => {
  const r = rnd(7);
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('i');
    s.className = 'st';
    s.style.cssText = `left:${(r() * 100).toFixed(1)}%;top:${(r() * 80).toFixed(1)}%`;
    sky.appendChild(s);
  }
});

// Bloki mają stały rozmiar w pikselach. Rysunek ma szerokość elementu (nie jest rozciągany),
// więc przy oddaleniu strony albo na szerokim monitorze bloki zostają kwadratowe i ostre.
const decoWidth = (el, step) => Math.ceil(Math.max(el.clientWidth, 320) / step) * step;
// W jasnym motywie granatowe warstwy terenu i krawędzie sekcji dostają jasne odpowiedniki.
const LIGHT = { '#0c1031': '#f3f6fc', '#161c4a': '#e4eaf7', '#10163e': '#e8edf8', '#131a47': '#d6deef' };
const tone = col => document.documentElement.dataset.theme === 'light' ? (LIGHT[col.toLowerCase()] || col) : col;
const decoSvg = (W, H, parts) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMax slice" shape-rendering="crispEdges">${parts}</svg>`;

function drawDeco() {
  // Przygaszony pikselowy krajobraz w hero: dalekie wzgórza, bliższe wzgórza z sylwetkami choinek.
  // Najbliższa warstwa ma kolor następnej sekcji, więc płynnie w nią przechodzi.
  document.querySelectorAll('[data-land]').forEach(el => {
    const B = 16, H = 190, W = decoWidth(el, B * 12), r = rnd(11);
    const hills = (fill, base, amp, step) => {
      let h = base, out = '';
      for (let x = 0; x < W; x += B * step) {
        h = Math.max(base - amp, Math.min(base + amp, h + Math.round(r() * 2 - 1) * B));
        out += `<rect x="${x}" y="${H - h}" width="${B * step}" height="${h}" fill="${tone(fill)}"/>`;
      }
      return out;
    };
    const pine = (x, ground, size, fill) => {
      let t = '';
      for (let i = 0; i < size; i++) {
        const w = (size - i) * 2 * B, y = ground - (i + 1) * B * 1.5;
        t += `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${B * 1.5}" fill="${tone(fill)}"/>`;
      }
      return t + `<rect x="${x - B / 2}" y="${ground - B}" width="${B}" height="${B}" fill="${tone(fill)}"/>`;
    };
    let parts = hills('#10163e', 112, 32, 3);
    // choinki co 1440 px w tym samym układzie, żeby szeroki ekran nie był pusty
    for (let off = 0; off < W; off += 1440) {
      [[120, 3], [260, 2], [640, 2], [1180, 3], [1320, 2]].forEach(([x, n]) => { if (off + x < W) parts += pine(off + x, H - 96, n, '#131a47'); });
    }
    parts += hills('#161c4a', 56, 16, 4);
    el.innerHTML = decoSvg(W, H, parts);
  });

  // Schodkowa linia z bloków na dole sekcji (jak teren w Minecrafcie), w kolorze następnej sekcji.
  document.querySelectorAll('[data-ground]').forEach(el => {
    const fill = tone(el.dataset.ground), B = 24, H = 56, W = decoWidth(el, B * 2), r = rnd(42);
    let h = 1, parts = '';
    for (let c = 0; c < W / B; c += 2) {
      h = Math.max(0, Math.min(2, h + Math.round(r() * 2 - 1)));
      parts += `<rect x="${c * B}" y="${H - 8 - h * B}" width="${B * 2}" height="${h * B + 8}" fill="${fill}"/>`;
    }
    el.innerHTML = decoSvg(W, H, parts);
  });

  // Schodkowa krawędź z bloków u góry sekcji, w kolorze sekcji powyżej.
  document.querySelectorAll('[data-cap]').forEach((el, k) => {
    const fill = tone(el.dataset.cap), B = 24, W = decoWidth(el, B * 2), r = rnd(97 + k * 131);
    let parts = '';
    for (let c = 0; c < W / B; c += 2) parts += `<rect x="${c * B}" y="0" width="${B * 2}" height="${[4, 12, 20, 28][Math.floor(r() * 4)]}" fill="${fill}"/>`;
    el.innerHTML = decoSvg(W, 28, parts).replace('xMinYMax', 'xMinYMin');
  });
}
drawDeco();
// po zmianie szerokości okna (także po oddaleniu strony) rysujemy od nowa
let decoW = innerWidth, decoT;
addEventListener('resize', () => {
  clearTimeout(decoT);
  decoT = setTimeout(() => { if (Math.abs(innerWidth - decoW) > 30) { decoW = innerWidth; drawDeco(); } }, 150);
});

// ---------- przełącznik motywu (ciemny / biały) ----------
const themeBtn = document.getElementById('themeBtn');
function syncThemeBtn() {
  const light = document.documentElement.dataset.theme === 'light';
  themeBtn.setAttribute('aria-pressed', light);
  themeBtn.setAttribute('aria-label', light ? 'Ciemny motyw' : 'Jasny motyw');
}
if (themeBtn) {
  syncThemeBtn();
  themeBtn.addEventListener('click', () => {
    const light = document.documentElement.dataset.theme !== 'light';
    if (light) document.documentElement.dataset.theme = 'light'; else delete document.documentElement.dataset.theme;
    localStorage.setItem('gwiazdka-theme', light ? 'light' : 'dark');
    syncThemeBtn();
    drawDeco();
  });
}

// ---------- przejście między stronami ----------
// Przy przejściu na drugą stronę ekran zakrywają pikselowe bloki (po przekątnej), a na nowej stronie znikają.
(() => {
  const html = document.documentElement;
  const entering = html.classList.contains('wipe-in');
  if (reduceMotion) { html.classList.remove('wipe-in'); return; }
  const STEP = 14, RAND = 50, DUR = 200;
  function build(full) {
    const cols = innerWidth < 640 ? 7 : 12, size = Math.ceil(innerWidth / cols), rows = Math.ceil(innerHeight / size);
    const w = document.createElement('div');
    w.className = 'wipe' + (full ? ' wipe--full' : '');
    w.setAttribute('aria-hidden', 'true');
    w.style.setProperty('--cols', cols);
    w.style.setProperty('--size', size + 'px');
    const r = rnd(5), shades = document.documentElement.dataset.theme === 'light' ? ['#e4eaf7', '#f3f6fc', '#d6deef'] : ['#161c4a', '#0c1031', '#1b2257'];
    let max = 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const b = document.createElement('i'), d = Math.round((x + y) * STEP + r() * RAND);
      max = Math.max(max, d);
      b.style.cssText = `--d:${d}ms;background:${shades[Math.floor(r() * 3)]}`;
      w.appendChild(b);
    }
    document.body.appendChild(w);
    w.total = max + DUR;
    return w;
  }
  if (entering) {
    const w = build(true);
    html.classList.remove('wipe-in');
    requestAnimationFrame(() => requestAnimationFrame(() => w.classList.remove('wipe--full')));
    setTimeout(() => w.remove(), w.total + 100);
  }
  const page = p => p.replace(/index\.html$/, '');
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || page(url.pathname) === page(location.pathname)) return;
    e.preventDefault();
    sessionStorage.setItem('wipe', '1');
    const w = build(false);
    requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('wipe--in')));
    setTimeout(() => { location.href = url.href; }, w.total + 40);
  });
  // powrót przyciskiem „wstecz” z pamięci przeglądarki: zdejmujemy zasłonę
  addEventListener('pageshow', e => { if (e.persisted) document.querySelectorAll('.wipe').forEach(w => w.remove()); });
})();
