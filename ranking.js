// Ranking: miejsca 1–3 (pas lidera i dwie karty) oraz lista dalszych miejsc z paskami.
// Wspólny dla rankingu wpłat (home.js) i rankingu twórców (tworcy.js).
// items: [{ id, name, amt }]. Przy zmianie kolejności wiersze przesuwają się płynnie (FLIP).

function makeRanking(champsEl, listEl, limit = 20) {
  let champIds = '';
  const rows = new Map();

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
        <div class="champ__info"><div class="champ__name" title="${d.name}">${d.name}</div></div>
        <div class="champ__amt">${fmtPLN(d.amt)}</div>
      </div>`).join('');
  }

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

  if (revealObs) revealObs.observe(champsEl); else champsEl.classList.add('in');

  // hit: { d, amt } – wiersz, który właśnie dostał wpłatę, mignie i pokaże „+kwota”
  return function render(items, hit) {
    const sorted = [...items].sort((a, b) => b.amt - a.amt).slice(0, limit);
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
  };
}
