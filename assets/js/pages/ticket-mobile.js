// Mobile/tablette : le ticket de courses est replié en haut de page ; il s'ouvre en feuille depuis le bouton
// ou depuis l'annonce « Ma liste · N articles » qui apparaît après un « + Liste ». favoris.js n'est pas modifié.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('favoris');
  if (!root) return;
  const grand = matchMedia('(min-width:960px)');
  let ouvert = false, defil = 0, tSnack, spacer = null;
  const bd = Object.assign(document.createElement('div'), { className: 'tk-bd', hidden: true });
  const snack = Object.assign(document.createElement('div'), { className: 'tk-snack', hidden: true });
  snack.setAttribute('role', 'status');
  document.body.append(bd, snack);
  const derriere = () => ['#app-header', '.fv__head', '.chips', '.fv__list', '#app-footer'].map(s => document.querySelector(s)).filter(Boolean);

  const ensure = () => {
    const tk = root.querySelector('#tk'), top = tk && tk.querySelector('.tk__top');
    if (!tk || !top) return;
    const liste = tk.parentNode.querySelector(':scope > .fv__list');
    if (liste) { // ticket avant les fiches sur petit écran (ordre visuel = ordre clavier), à droite sur grand écran
      const avant = tk.compareDocumentPosition(liste) & Node.DOCUMENT_POSITION_FOLLOWING;
      if (!grand.matches && !avant) liste.parentNode.insertBefore(tk, liste);
      else if (grand.matches && avant) liste.after(tk);
    }
    tk.classList.add('is-js');
    const corps = tk.querySelector('.tk__body');
    if (corps) { corps.id = 'tk-corps'; if (ouvert && corps.scrollTop !== defil) corps.scrollTop = defil; }
    let b = top.querySelector('.tk__tg');
    if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'tk__tg'; b.setAttribute('aria-controls', 'tk-corps'); top.appendChild(b); }
    const txt = ouvert ? 'Fermer la liste' : 'Voir ma liste';
    if (b.textContent !== txt) b.textContent = txt;
    b.setAttribute('aria-expanded', String(ouvert));
    const feuille = ouvert && !grand.matches;
    tk.classList.toggle('is-open', feuille);
    bd.hidden = !feuille;
    document.body.classList.toggle('sheet-open', feuille);
    derriere().forEach(el => el.toggleAttribute('inert', feuille));
  };
  const ouvrir = v => {
    const tk = root.querySelector('#tk'); if (!tk) return;
    if (v && !ouvert) { // la feuille quitte le flux : une cale garde la page à sa place
      spacer = document.createElement('div'); spacer.className = 'tk-spacer'; spacer.style.height = tk.offsetHeight + 'px'; tk.before(spacer);
      snack.hidden = true;
    }
    if (!v) { defil = 0; if (spacer) { spacer.remove(); spacer = null; } }
    ouvert = v; ensure();
    if (v) { const b = tk.querySelector('.tk__tg'); if (b) b.focus({ preventScroll: true }); }
    else requestAnimationFrame(() => { const b = root.querySelector('.tk__tg'); if (b) b.focus({ preventScroll: true }); });
  };

  root.addEventListener('click', e => {
    if (e.target.closest('.tk__tg')) return ouvrir(!ouvert);
    const s = e.target.closest('[data-sel]');
    if (s && s.getAttribute('aria-pressed') === 'true' && !grand.matches) { // favoris.js a déjà mis à jour le ticket
      const tk = root.querySelector('#tk'), r = tk && tk.getBoundingClientRect();
      const visible = r && Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) > 80;   // ticket déjà à l'écran : pas d'annonce
      const b = root.querySelectorAll('#tk .tk__s b'), n = +((b[1] && b[1].textContent) || 0);
      if (n && !visible) {
        snack.innerHTML = `<span>Ma liste · ${n} article${n > 1 ? 's' : ''}</span><button type="button" class="ghost">Voir</button>`;
        snack.hidden = false; clearTimeout(tSnack); tSnack = setTimeout(() => { snack.hidden = true; }, 5000);
      }
    }
  });
  snack.addEventListener('click', e => { if (e.target.closest('button')) ouvrir(true); });
  bd.addEventListener('click', () => ouvrir(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ouvert) ouvrir(false); });
  root.addEventListener('scroll', e => { if (e.target.classList && e.target.classList.contains('tk__body')) defil = e.target.scrollTop; }, true);
  grand.addEventListener('change', () => { if (grand.matches && ouvert) ouvrir(false); else ensure(); });
  new MutationObserver(ensure).observe(root, { childList: true, subtree: true });
  ensure();
});