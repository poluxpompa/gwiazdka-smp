// Ranking twórców: ile wpłacono podczas streama każdego z twórców.
// W podglądzie nazwy i kwoty są wymyślone, a wpłaty symulowane. Docelowo dane przyjdą ze zrzutek.

const creators = [
  ['Kubelkowy', 184280], ['ZorzaMC', 162400], ['MroznyMis', 142830], ['Bombka_PL', 118400],
  ['Reniferek', 97680], ['Sniezka', 88180], ['KometaOra', 76940], ['Piernikowy', 69300]
].map(([name, amt], id) => ({ id, name, amt }));

const renderCreators = makeRanking(document.getElementById('podium'), document.getElementById('list'));
renderCreators(creators);

// Wpłata trafia częściej do wyższych miejsc (więcej widzów), ale każdy twórca coś dostaje.
const AMOUNTS = [10, 20, 20, 50, 50, 100, 200, 500];
(function schedule() {
  setTimeout(() => {
    if (!document.hidden) {
      const sorted = [...creators].sort((a, b) => b.amt - a.amt);
      const d = sorted[Math.floor(Math.pow(Math.random(), 1.6) * sorted.length)];
      const amt = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
      d.amt += amt;
      renderCreators(creators, { d, amt });
    }
    schedule();
  }, 1600 + Math.random() * 2400);
})();
