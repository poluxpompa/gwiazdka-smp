// Ranking twórców: każdy twórca buduje wieżę z bloków. Im więcej wpłacono podczas jego streama, tym wyższa wieża.
// W podglądzie nazwy i kwoty są wymyślone, a wpłaty symulowane. Docelowo dane przyjdą ze zrzutek.

const creators = [
  ['Kubelkowy', 184280], ['ZorzaMC', 162400], ['MroznyMis', 142830], ['Bombka_PL', 118400],
  ['Reniferek', 97680], ['Sniezka', 88180], ['KometaOra', 76940], ['Piernikowy', 69300]
].map(([name, amt], id) => ({ id, name, amt }));

const BLOCK = 24, MAX_BLOCKS = 14; // wysokość wieży zawsze w pełnych blokach
const towersEl = document.getElementById('towers');
const items = new Map();

function render(hit) {
  const sorted = [...creators].sort((a, b) => b.amt - a.amt);
  const max = sorted[0].amt;
  const before = new Map();
  if (!reduceMotion) items.forEach((el, id) => before.set(id, el.getBoundingClientRect()));

  sorted.forEach((c, i) => {
    let el = items.get(c.id);
    if (!el) {
      el = document.createElement('li');
      el.className = 'tw';
      el.innerHTML = `<span class="tw__amt"></span>
        <span class="tw__col"><span class="tw__bar"></span></span>
        <span class="tw__n"></span><span class="tw__name">${c.name}</span>`;
      items.set(c.id, el);
    }
    const blocks = Math.max(1, Math.round(c.amt / max * MAX_BLOCKS));
    el.style.setProperty('--h', blocks * BLOCK + 'px');
    el.style.setProperty('--w', (c.amt / max * 100).toFixed(1) + '%');
    el.dataset.place = i + 1;
    el.querySelector('.tw__n').textContent = i + 1;
    el.querySelector('.tw__amt').textContent = fmtPLN(c.amt);
    towersEl.appendChild(el);
  });

  // wieże zamieniają się miejscami płynnie (FLIP)
  items.forEach((el, id) => {
    const was = before.get(id);
    if (!was) return;
    const now = el.getBoundingClientRect(), dx = was.left - now.left, dy = was.top - now.top;
    if (dx || dy) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });

  const el = hit && items.get(hit.d.id);
  if (!el || reduceMotion) return;
  const p = document.createElement('span');
  p.className = 'tw__plus';
  p.textContent = '+' + fmtPLN(hit.amt);
  el.appendChild(p);
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
