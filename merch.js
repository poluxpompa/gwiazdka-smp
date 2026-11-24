// Merch: przymierzalnia z obracanym produktem, wybór produktu, filtr kategorii i koszyk.
// Dane produktów są w products.js. Z WebGL produkt jest siatką 3D (cloth3d.js): ubrania falują, światło chodzi po fałdach, dżety migocą.

const mod = (a, n) => ((a % n) + n) % n;

const show = document.getElementById('show');
const stage = document.getElementById('stage');
const spin = document.getElementById('spin');
const card = document.getElementById('card');
const shadow = document.getElementById('shadow');
const hintEl = document.getElementById('hint');
const info = document.getElementById('info');
const rail = document.getElementById('rail');
const soldEl = document.getElementById('stSold');

// ---------- karta produktu w 3D ----------
// Dwie ściany (przód i tył) i kilka przyciemnionych warstw między nimi,
// dzięki którym przy obrocie widać grubość, jak u przedmiotów w Minecrafcie.
const EDGES = 8, THICK = 10;
card.innerHTML =
  `<img class="face face--a" alt="" draggable="false"><img class="face face--b" alt="" draggable="false">` +
  Array.from({ length: EDGES }, (_, i) => `<img class="edge" alt="" draggable="false" style="--z:${(THICK / 2 - 0.5 - i * (THICK - 1) / (EDGES - 1)).toFixed(2)}px">`).join('');
const faceA = card.querySelector('.face--a'), faceB = card.querySelector('.face--b');
const edges = [...card.querySelectorAll('.edge')];

const st = { p: null, angle: 0, k: 0, amp: 1, drag: null, tween: null, demo: 0, n: 1, prev: 0, swing: 0, onScreen: true };

// 3D: płótno WebGL zamiast płaskiej karty, jeśli przeglądarka to obsługuje
const glCanvas = document.getElementById('gl');
// Gdy 3D nie zadziała (brak WebGL, zablokowane zdjęcie, utracony kontekst), wracamy do zwykłej karty.
let gl3d = null;
function noGL() {
  if (!gl3d) return;
  gl3d = null;
  spin.classList.remove('is-gl');
}
try { gl3d = typeof Cloth3D !== 'undefined' ? Cloth3D.create(glCanvas, noGL) : null; } catch (e) { gl3d = null; }
if (gl3d) {
  spin.classList.add('is-gl');
  // zabezpieczenie: jeśli po 4 s zdjęcie w 3D wciąż się nie wczytało, pokazujemy zwykłą kartę
  setTimeout(() => { if (gl3d && st.p && !gl3d.ready()) noGL(); }, 4000);
}
const isCloth = p => p.cat === 'bluzy' || p.cat === 'koszulki';
// liczymy klatki tylko, gdy scena jest widoczna
if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { st.onScreen = en.isIntersecting; }).observe(stage);

function showView(k) {
  const p = st.p, v = views(p), i = mod((p.start || 0) + k, v.length);
  const s = src(p, v[i][0]);
  (mod(k, 2) === 0 ? faceA : faceB).src = s;
  edges.forEach(e => { e.src = s; });
  if (gl3d) gl3d.setFace(mod(k, 2), s);
  // warstwy grubości nie są obrócone, więc przy widoku z tyłu odbijamy je, żeby pokrywały się z tylną ścianą
  card.classList.toggle('is-back', mod(k, 2) === 1);
  st.k = k;
}

const easeOutBack = x => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
function tweenTo(to, dur, ease = easeOutBack) {
  return new Promise(res => { st.tween = { from: st.angle, to, t0: performance.now(), dur, ease, res }; });
}

const t0 = performance.now();
let slow = 0, last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (!st.onScreen || document.hidden || !st.p) { last = 0; return; }
  // słabszy komputer: jeśli klatki są wyraźnie za wolne, zmniejszamy rozdzielczość 3D
  if (last && gl3d) { slow = (now - last > 26) ? slow + 1 : Math.max(0, slow - 1); if (slow > 40) { gl3d.lowPower(); slow = -1e9; } }
  last = now;
  if (st.tween) {
    const tw = st.tween, x = Math.min(1, (now - tw.t0) / tw.dur);
    st.angle = tw.from + (tw.to - tw.from) * tw.ease(x);
    if (x === 1) { st.tween = null; tw.res(); }
  }
  // W spoczynku produkt lekko się kołysze i unosi, jak przedmiot leżący na ziemi w grze.
  const idle = !st.drag && !st.tween;
  st.amp += ((idle && !reduceMotion ? 1 : 0) - st.amp) * 0.06;
  const t = reduceMotion ? 0 : (now - t0) / 1000;
  const a = st.angle + Math.sin(t * 0.9) * 9 * st.amp;
  const bob = (Math.sin(t * 1.9) * 0.5 + 0.5) * 8 * st.amp;
  const k = Math.round(a / 180);
  if (k !== st.k && st.n > 1) showView(k);
  const c = Math.abs(Math.cos(a * Math.PI / 180));
  shadow.style.transform = `scaleX(${(0.42 + 0.58 * c).toFixed(3)}) scale(${(1 - bob / 70).toFixed(3)})`;
  if (gl3d) {
    // przy szybkim obrocie materiał zostaje w tyle i odbija
    const cloth = isCloth(st.p) && !reduceMotion;
    st.swing += (Math.max(-1.4, Math.min(1.4, (a - st.prev) * 0.12)) - st.swing) * 0.12;
    st.prev = a;
    gl3d.draw({ angle: a, bob, time: t, wave: cloth ? 0.75 : 0, swing: cloth ? st.swing : 0,
      sparkle: st.p.sparkle ? 1 : 0, gray: st.p.sold ? 0.85 : 0, box: spin.clientWidth, bottom: GL_BOTTOM });
  } else {
    card.style.transform = `translateY(${(-bob).toFixed(2)}px) rotateY(${a.toFixed(2)}deg)`;
  }
}
const GL_BOTTOM = 14; // płótno wystaje 14 px poniżej pola produktu (zob. .spin__gl)
requestAnimationFrame(frame);

function stopDemo() { st.demo++; }
async function demo() {
  // Po wybraniu produktu z kilkoma zdjęciami pokazujemy raz wszystkie strony.
  const id = ++st.demo;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(1300);
  for (let i = 1; i <= st.n; i++) {
    if (id !== st.demo) return;
    await tweenTo(st.k * 180 + 180, 900, easeInOut);
    if (id !== st.demo) return;
    await wait(i === st.n ? 0 : 1000);
  }
}

function turn(delta) {
  stopDemo();
  if (st.n > 1) return tweenTo((Math.round(st.angle / 180) + delta) * 180, 520 + Math.abs(delta) * 180);
  // jedno zdjęcie: tylko wychylenie i powrót
  tweenTo(delta * 38, 300, easeInOut).then(() => tweenTo(0, 620));
}

// przeciąganie
stage.addEventListener('pointerdown', e => {
  if (e.button || e.target.closest('button')) return;
  stopDemo();
  st.tween = null;
  st.drag = { x: e.clientX, a: st.angle, last: e.clientX, lt: performance.now(), v: 0, id: e.pointerId };
  stage.classList.add('is-grab');
  hintEl.classList.add('is-gone');
});
stage.addEventListener('pointermove', e => {
  const d = st.drag;
  if (!d || e.pointerId !== d.id) return;
  if (!stage.hasPointerCapture(e.pointerId) && Math.abs(e.clientX - d.x) > 4) try { stage.setPointerCapture(e.pointerId); } catch {}
  const raw = d.a + (e.clientX - d.x) * 0.6;
  st.angle = st.n > 1 ? raw : 46 * Math.tanh(raw / 46);
  const now = performance.now();
  d.v = (e.clientX - d.last) / Math.max(1, now - d.lt);
  d.last = e.clientX; d.lt = now;
});
function release(e) {
  const d = st.drag;
  if (!d || e.pointerId !== d.id) return;
  st.drag = null;
  stage.classList.remove('is-grab');
  // rzut: szybki ruch dokręca najwyżej o pół obrotu
  if (st.n > 1) tweenTo(Math.round((st.angle + Math.max(-150, Math.min(150, d.v * 140))) / 180) * 180, 560);
  else tweenTo(0, 700);
}
stage.addEventListener('pointerup', release);
stage.addEventListener('pointercancel', release);
stage.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
});

// ---------- wybór produktu ----------
function visible() { return [...rail.children].filter(li => !li.hidden).map(li => byId[li.dataset.id]); }

function renderInfo(p) {
  const table = p.sizes && SIZE_TABLES[p.sizes];
  info.innerHTML = `
    ${p.badge ? `<span class="info__badge">${p.badge}</span>` : ''}
    <h3 class="info__name">${p.name}</h3>
    <div class="info__price${p.sold ? ' is-sold' : ''}">${price(p.price)}</div>
    <p class="info__desc">${p.desc}</p>
    <dl class="info__spec">${p.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    ${table ? `<div class="info__row"><span class="info__lab">Rozmiar</span><button class="info__tab" aria-expanded="false" aria-controls="stab">Tabela rozmiarów</button></div>
      <div class="sizes" role="group" aria-label="Rozmiar">${table.rows.map(r => `<button class="size" aria-pressed="false"${p.sold ? ' disabled' : ''}>${r[0]}</button>`).join('')}</div>
      <div class="stab" id="stab" aria-hidden="true"><div><table class="sizetab"><caption>Wymiary w cm</caption>
        <thead><tr><th>Rozmiar</th>${table.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${table.rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>` : ''}
    <div class="info__hint" id="hintSize" aria-live="polite"></div>
    ${p.sold ? '<button class="btn info__buy" disabled>Wyprzedane</button>' : `<button class="btn btn--blue info__buy" data-add="${p.id}">Dodaj do koszyka</button>`}`;
}

function setProduct(p) {
  st.p = p;
  st.n = views(p).length;
  st.angle = 0; st.tween = null; st.drag = null;
  faceA.alt = p.name;
  hintEl.textContent = st.n > 1 ? 'Przeciągnij, żeby obrócić' : 'Przeciągnij, żeby wychylić';
  hintEl.classList.remove('is-gone');
  showView(0);
  faceB.src = faceA.src;
  // wcześniejsze wczytanie pozostałych stron, żeby przy obrocie nie mignęło puste miejsce
  views(p).forEach(([s]) => { new Image().src = src(p, s); if (gl3d) gl3d.preload(src(p, s)); });
  if (gl3d && st.n > 1) gl3d.setFace(1, faceA.src);
  show.classList.toggle('is-sold', !!p.sold);
  soldEl.hidden = !p.sold;
  renderInfo(p);
  rail.querySelectorAll('.slot').forEach(s => s.setAttribute('aria-current', s.dataset.id === p.id));
}

let busy = false, pending = null;
function select(p, opts = {}) {
  if (busy) { pending = [p, opts]; return; }
  if (!p || (st.p === p && !opts.force)) return;
  stopDemo();
  const first = !st.p;
  if (reduceMotion) { setProduct(p); return; }
  busy = true;
  const outAnim = first ? null : spin.animate(
    [{ transform: 'none', opacity: 1 }, { transform: `translate(${opts.dir < 0 ? 60 : -60}px, 24px) scale(.7) rotate(${opts.dir < 0 ? 10 : -10}deg)`, opacity: 0 }],
    { duration: 200, easing: 'ease-in', fill: 'forwards' });
  info.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(6px)' }], { duration: 160, fill: 'forwards' });
  (outAnim ? outAnim.finished : Promise.resolve()).then(() => {
    setProduct(p);
    // animacje wyjścia zostawiają stan końcowy, więc zdejmujemy je przed wejściem nowego produktu
    if (outAnim) outAnim.cancel();
    info.getAnimations().forEach(a => a.cancel());
    // produkt opada na miejsce i lekko się odbija
    spin.animate([
      { transform: 'translateY(-170px) rotate(-6deg)', opacity: 0 },
      { transform: 'translateY(0) rotate(0)', opacity: 1, offset: .55, easing: 'ease-out' },
      { transform: 'translateY(-18px)', offset: .75, easing: 'ease-in-out' },
      { transform: 'none', opacity: 1 }
    ], { duration: first ? 900 : 620, delay: first ? 250 : 0, easing: 'ease-in', fill: 'backwards' }).finished.then(() => {
      busy = false;
      if (pending) { const [np, no] = pending; pending = null; if (np !== st.p) return select(np, no); }
      if (st.n > 1) demo();
    });
    info.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: first ? 350 : 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
  });
}

function step(dir) {
  const list = visible(), i = list.indexOf(st.p);
  select(list[mod(i + dir, list.length)], { dir });
}
document.getElementById('prev').addEventListener('click', () => step(-1));
document.getElementById('next').addEventListener('click', () => step(1));

rail.innerHTML = PRODUCTS.map((p, i) => `
  <li data-id="${p.id}" data-cat="${p.cat}" style="--i:${i}">
    <button class="slot${p.sold ? ' slot--sold' : ''}" data-id="${p.id}" aria-current="false">
      <span class="slot__pic"><img src="${img(p)}" alt="" loading="lazy"></span>
      <span class="slot__name">${p.name}</span>
      <span class="slot__price">${p.sold ? 'Wyprzedane' : price(p.price)}</span>
    </button>
  </li>`).join('');
rail.addEventListener('click', e => {
  const s = e.target.closest('.slot');
  if (!s) return;
  const list = visible();
  select(byId[s.dataset.id], { dir: list.indexOf(byId[s.dataset.id]) < list.indexOf(st.p) ? -1 : 1 });
  history.replaceState(null, '', '#p-' + s.dataset.id);
  if (show.getBoundingClientRect().top < 0) show.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
});

// ---------- rozmiar, tabela rozmiarów, koszyk ----------
info.addEventListener('click', e => {
  const s = e.target.closest('.size');
  if (s && !s.disabled) {
    info.querySelectorAll('.size').forEach(x => x.setAttribute('aria-pressed', x === s));
    document.getElementById('hintSize').textContent = '';
    return;
  }
  const tab = e.target.closest('.info__tab');
  if (tab) {
    // tabela rozwija się płynnie (animacja wysokości w CSS)
    const open = document.getElementById('stab').classList.toggle('is-open');
    document.getElementById('stab').setAttribute('aria-hidden', !open);
    tab.setAttribute('aria-expanded', open);
    return;
  }
  const add = e.target.closest('[data-add]');
  if (!add) return;
  const p = byId[add.dataset.add];
  let size = null;
  if (p.sizes) {
    const sel = info.querySelector('.size[aria-pressed="true"]');
    if (!sel) {
      document.getElementById('hintSize').textContent = 'Najpierw wybierz rozmiar.';
      const g = info.querySelector('.sizes');
      if (!reduceMotion) g.animate([{ transform: 'none' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 300 });
      return;
    }
    size = sel.textContent;
  }
  addToCart(p.id, size);
  toast(`Dodano do koszyka: ${p.name}${size ? ', ' + size : ''}`);
});

// ---------- filtr kategorii ----------
const filters = [...document.querySelectorAll('.filter')];
function applyFilter(cat, animate) {
  filters.forEach(f => f.setAttribute('aria-pressed', f.dataset.cat === cat));
  let i = 0;
  [...rail.children].forEach(li => {
    li.hidden = !(cat === 'all' || li.dataset.cat === cat);
    if (!li.hidden && animate && !reduceMotion) li.animate([{ opacity: 0, transform: 'translateY(14px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: i++ * 50, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'backwards' });
  });
  const list = visible();
  if (st.p && !list.includes(st.p)) select(list[0], { force: true });
}
filters.forEach(f => f.addEventListener('click', () => {
  applyFilter(f.dataset.cat, true);
  history.replaceState(null, '', f.dataset.cat === 'all' ? location.pathname : '#' + f.dataset.cat);
}));

// ---------- koszyk ----------
const drawer = document.getElementById('drawer');
const cartItems = document.getElementById('cartItems'), cartSum = document.getElementById('cartSum');
function addToCart(id, size) {
  const found = cart.items.find(i => i.id === id && i.size === size);
  if (found) found.qty++; else cart.items.push({ id, size, qty: 1 });
  cart.save();
  renderCart();
}
function renderCart() {
  if (!cart.items.length) {
    cartItems.innerHTML = '<li class="drawer__empty">Koszyk jest pusty.</li>';
  } else {
    cartItems.innerHTML = cart.items.map((it, i) => {
      const p = byId[it.id];
      return `<li class="ci">
        <img src="${img(p)}" alt="">
        <div><b>${p.name}</b><small>${it.size ? 'Rozmiar ' + it.size : CATS[p.cat]}</small>
          <div class="qty"><button data-q="-1" data-i="${i}" aria-label="Mniej">−</button><span>${it.qty}</span><button data-q="1" data-i="${i}" aria-label="Więcej">+</button></div></div>
        <div><div class="ci__price">${price(p.price * it.qty)}</div><button class="ci__rm" data-rm="${i}">Usuń</button></div>
      </li>`;
    }).join('');
  }
  cartSum.textContent = price(cart.items.reduce((s, it) => s + byId[it.id].price * it.qty, 0));
}
cartItems.addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
  if (q) {
    const it = cart.items[q.dataset.i];
    it.qty += +q.dataset.q;
    if (it.qty < 1) cart.items.splice(q.dataset.i, 1);
  } else if (rm) cart.items.splice(rm.dataset.rm, 1);
  else return;
  cart.save();
  renderCart();
});
function openCart() { renderCart(); drawer.showModal(); }
document.getElementById('cartBtn').addEventListener('click', openCart);
drawer.addEventListener('click', e => { if (e.target === drawer || e.target.closest('[data-close]')) drawer.close(); });

// ---------- adres strony: #bluzy, #p-produkt, #koszyk ----------
function fromHash(animate) {
  const h = decodeURIComponent(location.hash.slice(1));
  const p = h.startsWith('p-') && byId[h.slice(2)];
  applyFilter(CATS[h] ? h : 'all', animate && !!CATS[h]);
  if (!st.p) select(p || visible()[0]);
  else if (p) select(p);
  if ((p || CATS[h]) && animate) show.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  if (h === 'koszyk') openCart();
}
fromHash(false);
if (location.hash.startsWith('#p-')) requestAnimationFrame(() => show.scrollIntoView({ block: 'start' }));
addEventListener('hashchange', () => fromHash(true));
