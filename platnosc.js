// Płatność: podsumowanie koszyka, dane, dostawa i sposób płatności.
// Dane nie są nigdzie wysyłane. Po sprawdzeniu formularza przycisk prowadzi do operatora płatności z LINKS.checkout.

const form = document.getElementById('payForm');
const grid = document.getElementById('payGrid');
const emptyEl = document.getElementById('payEmpty');
const itemsEl = document.getElementById('sumItems');
const hint = document.getElementById('payHint');

// ---------- dostawa ----------
const shipOpts = document.getElementById('shipOpts');
shipOpts.innerHTML = SHIPPING.map((s, i) => `
  <label class="opt"><input type="radio" name="ship" value="${s.id}"${i ? '' : ' checked'}>
    <span class="opt__name">${s.name}</span><span class="opt__note">${s.note}</span>
    ${s.price != null ? `<span class="opt__price">${price(s.price)}</span>` : ''}</label>`).join('');
const ship = () => SHIPPING.find(s => s.id === form.elements.ship.value);

// pola adresu tylko dla wybranej dostawy; ukryte pola nie biorą udziału w sprawdzaniu
function showShipFields() {
  const id = ship().id;
  form.querySelectorAll('[data-for]').forEach(box => {
    const on = box.dataset.for === id;
    box.hidden = !on;
    box.querySelectorAll('input').forEach(i => { i.disabled = !on; });
  });
  renderSum();
}
shipOpts.addEventListener('change', showShipFields);

// ---------- podsumowanie ----------
function renderSum() {
  const items = cart.items.filter(it => byId[it.id]);
  grid.hidden = !items.length;
  emptyEl.hidden = !!items.length;
  if (!items.length) return;
  itemsEl.innerHTML = items.map((it, i) => {
    const p = byId[it.id];
    return `<li class="pitem">
      <span class="pitem__pic"><img src="${img(p)}" alt=""></span>
      <div class="pitem__body"><b>${p.name}</b><small>${it.size ? 'Rozmiar ' + it.size : CATS[p.cat]}</small>
        <div class="qty"><button type="button" data-q="-1" data-i="${i}" aria-label="Mniej">−</button><span>${it.qty}</span><button type="button" data-q="1" data-i="${i}" aria-label="Więcej">+</button></div></div>
      <span class="pitem__price">${price(p.price * it.qty)}</span>
    </li>`;
  }).join('');
  const goods = items.reduce((s, it) => s + byId[it.id].price * it.qty, 0);
  const sh = ship();
  document.getElementById('sumGoods').textContent = price(goods);
  document.getElementById('sumShip').textContent = sh.price != null ? price(sh.price) : 'cena u przewoźnika';
  const total = goods + (sh.price || 0);
  document.getElementById('sumTotalLabel').textContent = sh.price != null ? 'Razem' : 'Razem bez dostawy';
  document.getElementById('sumTotal').textContent = price(total);
  document.getElementById('payBtn').innerHTML = `Zapłać <span>${price(total)}</span>`;
}
itemsEl.addEventListener('click', e => {
  const q = e.target.closest('[data-q]');
  if (!q) return;
  const it = cart.items[q.dataset.i];
  it.qty += +q.dataset.q;
  if (it.qty < 1) cart.items.splice(q.dataset.i, 1);
  cart.save();
  renderSum();
});

// ---------- sprawdzanie formularza ----------
const MSG = {
  name: 'Wpisz imię i nazwisko.',
  email: 'Wpisz poprawny adres e-mail.',
  phone: 'Wpisz numer telefonu, np. 600 100 200.',
  locker: 'Wpisz kod paczkomatu, np. WAW22A.',
  street: 'Wpisz ulicę i numer.',
  zip: 'Kod pocztowy w formacie 00-000.',
  city: 'Wpisz miejscowość.',
  agree: 'Zaznacz akceptację regulaminu.'
};
function mark(input) {
  const bad = !input.disabled && !input.checkValidity();
  const box = input.closest('.field, .agree');
  box.classList.toggle('is-bad', bad);
  let err = box.querySelector('.field__err');
  if (bad && !err) { err = document.createElement('span'); err.className = 'field__err'; box.appendChild(err); }
  if (err) err.textContent = bad ? MSG[input.name] : '';
  return !bad;
}
// błąd pokazujemy po wyjściu z pola, a znika już w trakcie poprawiania
form.addEventListener('focusout', e => { if (e.target.matches('input:not([type=radio])') && e.target.value) mark(e.target); });
form.addEventListener('input', e => { if (e.target.closest('.is-bad')) mark(e.target); });
form.addEventListener('change', e => { if (e.target.name === 'agree') mark(e.target); });
// kod pocztowy: myślnik dopisuje się sam
form.elements.zip.addEventListener('input', e => {
  const d = e.target.value.replace(/\D/g, '').slice(0, 5);
  e.target.value = d.length > 2 ? d.slice(0, 2) + '-' + d.slice(2) : d;
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const fields = [...form.querySelectorAll('input:not([type=radio])')];
  const bad = fields.filter(i => !mark(i));
  if (bad.length) {
    hint.textContent = bad.length === 1 ? 'Popraw jedno pole.' : `Popraw pola zaznaczone na czerwono (${bad.length}).`;
    bad[0].focus();
    return;
  }
  hint.textContent = '';
  if (LINKS.checkout) location.href = LINKS.checkout;
  else toast(MISSING.checkout);
});

showShipFields();
