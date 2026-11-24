// Ranking twórców: podium z bloków dla miejsc 1–3 i kafelki dla miejsc 4–8.
// W podglądzie nazwy i kwoty są wymyślone, a wpłaty symulowane. Docelowo dane przyjdą ze zrzutek.

const creators = [
  ['Kubelkowy', 184280], ['ZorzaMC', 162400], ['MroznyMis', 142830], ['Bombka_PL', 118400],
  ['Reniferek', 97680], ['Sniezka', 88180], ['KometaOra', 76940], ['Piernikowy', 69300]
].map(([name, amt], id) => ({ id, name, amt }));

const podiumEl = document.getElementById('podium');
const restEl = document.getElementById('rest');
const tiles = new Map();
let podiumIds = '';

// Kolejność na podium od lewej: 2., 1., 3.
const PODIUM_ORDER = [1, 0, 2];

function renderPodium(top) {
  const ids = top.map(c => c.id).join();
  if (ids === podiumIds) {
    top.forEach((c, i) => { podiumEl.querySelector(`[data-place="${i + 1}"] .pod__amt`).textContent = fmtPLN(c.amt); });
    return;
  }
  podiumIds = ids;
  podiumEl.innerHTML = PODIUM_ORDER.map(i => {
    const c = top[i];
    return `<div class="pod" data-place="${i + 1}" data-id="${c.id}">
      <span class="pod__name" title="${c.name}">${c.name}</span>
      <span class="pod__amt">${fmtPLN(c.amt)}</span>
      <span class="pod__step"><span class="pod__place">${i + 1}</span></span>
    </div>`;
  }).join('');
  if (!reduceMotion) podiumEl.querySelectorAll('.pod').forEach((el, k) =>
    el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: k * 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
}

function renderRest(rest, max) {
  const before = new Map();
  if (!reduceMotion) tiles.forEach((el, id) => before.set(id, el.getBoundingClientRect()));
  const keep = new Set(rest.map(c => c.id));
  tiles.forEach((el, id) => { if (!keep.has(id)) { el.remove(); tiles.delete(id); } });
  rest.forEach((c, i) => {
    let el = tiles.get(c.id);
    if (!el) {
      el = document.createElement('li');
      el.className = 'rest';
      el.innerHTML = `<span class="rest__n"></span><span class="rest__name">${c.name}</span><span class="rest__amt"></span><span class="rest__track"><span class="rest__bar"></span></span>`;
      tiles.set(c.id, el);
    }
    el.querySelector('.rest__n').textContent = i + 4;
    el.querySelector('.rest__amt').textContent = fmtPLN(c.amt);
    el.querySelector('.rest__bar').style.width = (c.amt / max * 100).toFixed(1) + '%';
    restEl.appendChild(el);
  });
  tiles.forEach((el, id) => {
    const was = before.get(id);
    if (!was) return;
    const now = el.getBoundingClientRect(), dx = was.left - now.left, dy = was.top - now.top;
    if (dx || dy) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
}

function render(hit) {
  const sorted = [...creators].sort((a, b) => b.amt - a.amt);
  renderPodium(sorted.slice(0, 3));
  renderRest(sorted.slice(3), sorted[0].amt);
  if (!hit || reduceMotion) return;
  // „+kwota” przy twórcy, który właśnie dostał wpłatę
  const box = podiumEl.querySelector(`[data-id="${hit.d.id}"] .pod__amt`) || tiles.get(hit.d.id);
  if (!box) return;
  const p = document.createElement('span');
  p.className = 'crew__plus';
  p.textContent = '+' + fmtPLN(hit.amt);
  box.appendChild(p);
  setTimeout(() => p.remove(), 1500);
}
render();

// Wpłata trafia częściej do wyższych miejsc (więcej widzów), ale każdy twórca coś dostaje.
const AMOUNTS = [10, 20, 20, 50, 50, 100, 200, 500];
(function schedule() {
  setTimeout(() => {
    if (!document.hidden) {
      const sorted = [...creators].sort((a, b) => b.amt - a.amt);
      const d = sorted[Math.floor(Math.pow(Math.random(), 1.6) * sorted.length)];
      const amt = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
      d.amt += amt;
      render({ d, amt });
    }
    schedule();
  }, 1600 + Math.random() * 2400);
})();
