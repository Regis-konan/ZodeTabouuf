// Filtres mobile/tablette : pastilles de catégories + feuille niveau/durée. Ne modifie pas recettes.js :
// tout passe par ses boutons existants (clics délégués sur #liste).
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('liste'), side = document.getElementById('f-side'), compte = document.getElementById('compte');
  const mf = root && root.querySelector('.mf');
  if (!mf || !side || !compte) return;
  const summary = mf.querySelector('summary');

  // 1. Pastilles de catégories : copies des boutons de la barre latérale (mêmes data-cat, donc mêmes clics)
  const strip = document.createElement('div');
  strip.className = 'cats-strip'; strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', 'Catégories');
  side.querySelectorAll('.fcat').forEach(b => strip.appendChild(b.cloneNode(true)));
  mf.parentNode.insertBefore(strip, mf);
  const sync = () => {
    const on = side.querySelector('.fcat[aria-pressed="true"]'), id = on ? on.dataset.cat : '';
    strip.querySelectorAll('.fcat').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === id)));
    const a = strip.querySelector('[aria-pressed="true"]');
    if (a && strip.offsetParent) strip.scrollTo({ left: a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
  };
  new MutationObserver(sync).observe(side, { childList: true });
  sync();

  // 2. Feuille de filtres : fond, bouton « Voir N recettes »
  const bd = document.createElement('div'); bd.className = 'mf__bd';
  const foot = document.createElement('div'); foot.className = 'mf__foot';
  foot.innerHTML = '<button type="button" class="btn">Voir les recettes</button>';
  mf.append(bd, foot);
  const voir = foot.firstChild;
  const label = () => { const n = +(compte.textContent.match(/\d+/) || [0])[0]; voir.textContent = n ? `Voir ${n} recette${n > 1 ? 's' : ''}` : 'Voir les recettes'; };
  new MutationObserver(label).observe(compte, { childList: true, subtree: true });
  label();

  const behind = () => ['#app-header', '.lr__top', '.cats-strip', '#actifs', '.bar', '#res', '#app-footer'].map(s => document.querySelector(s)).filter(Boolean);
  const close = () => { mf.open = false; };
  mf.addEventListener('toggle', () => {
    document.body.classList.toggle('sheet-open', mf.open);
    behind().forEach(el => el.toggleAttribute('inert', mf.open));
    if (mf.open) { const f = mf.querySelector('.mf__in .fchip'); if (f) f.focus({ preventScroll: true }); }
    else summary.focus({ preventScroll: true });
  });
  bd.addEventListener('click', close);
  voir.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mf.open) close(); });
  matchMedia('(min-width:1024px)').addEventListener('change', e => { if (e.matches) close(); });
});