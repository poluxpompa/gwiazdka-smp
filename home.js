// Strona główna: licznik, ostatnie wpłaty, ranking wpłat i symulacja wpłat na żywo.
// Ranking sumuje wpłaty ze wszystkich zrzutek po nazwie wpłacającego (firma albo osoba).
// Nazwy w podglądzie są wymyślone. Docelowo dane przyjdą ze zrzutek.

// [nazwa, suma wpłat, firma?]
const donors = [
  ['Pixel Studio', 24500, true], ['Blokowo sp. z o.o.', 18200, true], ['Piekarnia u Zosi', 12750, true],
  ['Kacper_2011', 9800, false], ['Ola_mc', 8450, false], ['Marek W.', 7300, false],
  ['Serwis Kowalski', 6400, true], ['Kawiarnia Śnieżka', 5200, true], ['Zuza', 4800, false],
  ['Wiktor', 4100, false], ['Drukarnia Grafit', 3900, true], ['Bartek', 3500, false],
  ['Hania', 2950, false], ['Igor_PL', 2600, false], ['Natalia K.', 2400, false],
  ['Sklep Narożnik', 2100, true], ['Tymek', 1900, false], ['Pola', 1650, false],
  ['Oskar', 1400, false], ['Lena', 1200, false]
].map(([name, amt, co], id) => ({ id, name, amt, co }));
let total = 1312120;

// Twórcy na streamie: ile zebrano podczas ich transmisji (mały ranking obok rankingu wpłat).
const creators = [
  ['Kubelkowy', 184280], ['ZorzaMC', 162400], ['MroznyMis', 142830], ['Bombka_PL', 118400],
  ['Reniferek', 97680], ['Sniezka', 88180], ['KometaOra', 76940], ['Piernikowy', 69300]
].map(([name, amt], id) => ({ id, name, amt }));

const champsEl = document.getElementById('podium');
// Miejsca 1–3: lider na całą szerokość, pod nim 2. i 3. miejsce.
let champIds = '';
function renderChamps(top) {
  const ids = top.map(d => d.id).join();
  if (ids === champIds) {
    top.forEach((d, i) => { champsEl.querySelector(`.champ--${i + 1} .champ__amt`).textContent = fmtPLN(d.amt); });
    return;
  }
  champIds = ids;
  champsEl.innerHTML = top.map((d, i) => `
    <div class="champ champ--${i + 1}">
      <span class="champ__place">${i + 1}</span>
      <div class="champ__info">
        <div class="champ__name" title="${d.name}">${d.name}</div>
      </div>
      <div class="champ__amt">${fmtPLN(d.amt)}</div>
    </div>`).join('');
}
if (revealObs) revealObs.observe(champsEl); else champsEl.classList.add('in');

// ---------- miejsca 4–20 ----------
const listEl = document.getElementById('list');
const rows = new Map();
function renderList(rest, max) {
  const before = new Map();
  if (!reduceMotion) rows.forEach((el, id) => before.set(id, el.getBoundingClientRect()));
  const keep = new Set(rest.map(d => d.id));
  rows.forEach((el, id) => { if (!keep.has(id)) { el.remove(); rows.delete(id); } });

  rest.forEach((d, i) => {
    let el = rows.get(d.id);
    if (!el) {
      el = document.createElement('li');
      el.className = 'row';
      el.innerHTML = `<span class="row__n"></span>
        <div class="row__mid"><div class="row__name">${d.name}</div><div class="row__track"><div class="row__bar"></div></div></div>
        <span class="row__amt"></span>`;
      rows.set(d.id, el);
    }
    el.querySelector('.row__n').textContent = i + 4;
    el.querySelector('.row__amt').textContent = fmtPLN(d.amt);
    el.querySelector('.row__bar').style.width = (d.amt / max * 100).toFixed(2) + '%';
    listEl.appendChild(el);
  });

  rows.forEach((el, id) => {
    const was = before.get(id);
    if (!was) return;
    const now = el.getBoundingClientRect(), dx = was.left - now.left, dy = was.top - now.top;
    if (dx || dy) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
}

const creatorsEl = document.getElementById('creators');
function renderCreators() {
  const sorted = [...creators].sort((a, b) => b.amt - a.amt);
  creatorsEl.innerHTML = sorted.map((c, i) => `<li><span class="cr__n">${i + 1}</span><span class="cr__name">${c.name}</span><span class="cr__amt">${fmtPLN(c.amt)}</span></li>`).join('');
}

function render(hit) {
  renderCreators();
  const sorted = [...donors].sort((a, b) => b.amt - a.amt).slice(0, 20);
  renderChamps(sorted.slice(0, 3));
  renderList(sorted.slice(3), sorted[0].amt);
  const row = hit && rows.get(hit.d.id);
  if (!row || reduceMotion) return;
  row.classList.remove('hit'); void row.offsetWidth; row.classList.add('hit');
  const p = document.createElement('span');
  p.className = 'plus';
  p.textContent = '+' + fmtPLN(hit.amt);
  row.appendChild(p);
  setTimeout(() => p.remove(), 1500);
}
render();

// ---------- licznik ----------
const totalEl = document.getElementById('total');
const counterEl = document.getElementById('counter');
let shown = total, anim;
function countTo(target) {
  cancelAnimationFrame(anim);
  if (reduceMotion) { shown = target; totalEl.textContent = fmtPLN(target); return; }
  const from = shown, t0 = performance.now(), dur = 1100;
  const step = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    shown = Math.round(from + (target - from) * e);
    totalEl.textContent = fmtPLN(shown);
    if (p < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
  totalEl.classList.remove('bump'); void totalEl.offsetWidth; totalEl.classList.add('bump');
}

// „+20 zł” z serduszkiem wpada z góry do tablicy w lekko losowym miejscu.
function burst(amt) {
  if (reduceMotion) return;
  const b = document.createElement('span');
  b.className = 'burst';
  b.innerHTML = `+${fmtPLN(amt)}<svg aria-hidden="true"><use href="#heart"/></svg>`;
  b.style.setProperty('--bx', `calc(-50% + ${Math.round((Math.random() - .5) * 260)}px)`);
  b.style.setProperty('--br', `${Math.round((Math.random() - .5) * 14)}deg`);
  counterEl.appendChild(b);
  setTimeout(() => b.remove(), 1700);
}

// ---------- ostatnie wpłaty ----------
const feedEl = document.getElementById('feed');
const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 5 ? 'teraz' : s < 60 ? `${s} s temu` : `${Math.floor(s / 60)} min temu`; };
function pushFeed(d, amt, t, animate) {
  const li = document.createElement('li');
  if (animate && !reduceMotion) li.className = 'new';
  li.dataset.t = t;
  const tier = amt >= 500 ? ' amt--big' : amt >= 100 ? ' amt--mid' : '';
  li.innerHTML = `<span class="amt${tier}">+${fmtPLN(amt)}</span><span class="who">${d.name}<small>${ago(t)}</small></span>`;
  feedEl.prepend(li);
  while (feedEl.children.length > 5) feedEl.lastElementChild.remove();
}
setInterval(() => feedEl.querySelectorAll('li').forEach(li => { li.querySelector('small').textContent = ago(+li.dataset.t); }), 1000);
[[3, 10, 95], [9, 50, 70], [0, 500, 51], [4, 20, 33], [12, 100, 20], [5, 50, 8]]
  .forEach(([i, amt, s]) => pushFeed(donors[i], amt, Date.now() - s * 1000, false));

// ---------- statystyki w oknie z kwotą ----------
const stats = { count: 8214, people: 3427, max: 2000 };
const stEls = { count: document.getElementById('stCount'), people: document.getElementById('stPeople'), max: document.getElementById('stMax') };
function setStat(key, text) {
  const el = stEls[key];
  el.textContent = text;
  if (reduceMotion) return;
  el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
}
const fmtInt = n => n.toLocaleString('pl-PL', { useGrouping: true }).replace(/\s/g, '\u00a0');

// ---------- symulacja wpłat ----------
const PEOPLE_AMOUNTS = [5, 10, 10, 20, 20, 20, 25, 50, 50, 50, 100, 100, 200];
const COMPANY_AMOUNTS = [200, 300, 500, 500, 1000, 2000];
const NEW_PEOPLE = ['Antek_PL', 'Maja', 'Szymon', 'Filip_gra', 'Nikola', 'Kuba', 'Julka', 'Franek', 'Amelia', 'Staś'];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function donate() {
  let d;
  if (Math.random() < .12 && NEW_PEOPLE.length) {
    // Nowa osoba wpłaca pierwszy raz.
    const id = donors.length;
    d = { id, name: NEW_PEOPLE.splice(Math.floor(Math.random() * NEW_PEOPLE.length), 1)[0], amt: 0, co: false };
    donors.push(d);
  } else {
    d = pick(donors);
  }
  const amt = pick(d.co ? COMPANY_AMOUNTS : PEOPLE_AMOUNTS);
  d.amt += amt;
  creators[Math.floor(Math.pow(Math.random(), 1.4) * creators.length)].amt += amt;
  total += amt;
  burst(amt);
  pushFeed(d, amt, Date.now(), true);
  setStat('count', fmtInt(++stats.count));
  if (d.amt === amt) setStat('people', fmtInt(++stats.people));
  if (amt > stats.max) { stats.max = amt; setStat('max', fmtPLN(amt)); }
  // Suma rośnie w chwili, gdy wpłata „wpada” do licznika.
  const target = total;
  setTimeout(() => countTo(target), reduceMotion ? 0 : 900);
  render({ d, amt });
}

(function schedule() {
  setTimeout(() => { if (!document.hidden) donate(); schedule(); }, 1800 + Math.random() * 2600);
})();

// ---------- merch: produkt wjeżdża z prawej, rośnie na środku, odjeżdża w lewo i maleje ----------
const MERCH = [
  ['bluza-polu', 'Granatowa bluza Polu', '259,99 zł'], ['koszulka-graffiti', 'Biała koszulka Graffiti', '119,99 zł'],
  ['koszulka-carmel', 'Czarna koszulka Carmel', '119,99 zł'], ['jersey-d1', 'Koszulka Jersey D1', '109,99 zł'],
  ['czapka-klarfi', 'Czerwona czapka Klarfi', '69,99 zł'], ['bluza-sagi', 'Brązowa bluza Sagi', '269,99 zł'],
  ['brelok-sagi', 'Brelok Sagi', '29,99 zł']
];
const stageEl = document.getElementById('flowStage');
const flowName = document.getElementById('flowName'), flowPrice = document.getElementById('flowPrice');
stageEl.innerHTML = MERCH.map(([id]) => `<img class="flow__item" src="assets/merch/${id}.webp" alt="" loading="lazy">`).join('');
const flowItems = [...stageEl.children];
let flowAt = 0, flowPaused = false;
function placeFlow() {
  const n = flowItems.length;
  flowItems.forEach((el, i) => {
    let pos = (i - flowAt) % n;
    if (pos > n / 2) pos -= n;
    if (pos < -n / 2) pos += n;
    el.dataset.pos = Math.max(-2, Math.min(2, pos));
  });
  const [id, name, cost] = MERCH[flowAt];
  flowEl.href = 'merch.html#p-' + id;
  flowName.textContent = name;
  flowPrice.textContent = cost;
  if (!reduceMotion) for (const el of [flowName, flowPrice]) { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
}
const flowEl = stageEl.closest('.flow');
placeFlow();
flowEl.addEventListener('mouseenter', () => { flowPaused = true; });
flowEl.addEventListener('mouseleave', () => { flowPaused = false; });
setInterval(() => { if (!flowPaused && !document.hidden) { flowAt = (flowAt + 1) % flowItems.length; placeFlow(); } }, 2800);

// ---------- aktywna sekcja w menu ----------
const secLinks = [...document.querySelectorAll('.nav a[data-sec]')];
const secObs = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) secLinks.forEach(a => a.classList.toggle('active', a.dataset.sec === en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['start', 'informacje', 'ranking', 'merch', 'wesprzyj'].forEach(id => secObs.observe(document.getElementById(id)));
