// Mobile : compte dans les onglets, barre de titre, bouton retour, progressions, étape en cours.
// recette.js n'est pas modifié : il gère déjà l'affichage des panneaux et les cases cochées.
document.addEventListener('DOMContentLoaded', () => {
  const sheet = document.querySelector('.sheet');
  if (!sheet) return;
  const tabs = sheet.querySelector('.tabs'), steps = [...sheet.querySelectorAll('.steps li')], petit = matchMedia('(max-width:899.98px)');
  const retour = e => { if (history.length > 1 && document.referrer.startsWith(location.origin)) { e.preventDefault(); history.back(); } };
  const barre = () => { const d = document.createElement('div'); d.className = 'prog'; d.innerHTML = '<span class="prog__b"><i></i></span><span class="prog__t"></span>'; return d; };
  const rempli = (d, part, total, txt) => { d.querySelector('i').style.width = (total ? part / total * 100 : 0) + '%'; d.querySelector('.prog__t').textContent = txt; };

  // Onglets : « Ingrédients · 7 », et retour au début du panneau quand on change d'onglet
  if (tabs) {
    const n = { ing: sheet.querySelectorAll('#liste li').length, prep: steps.length };
    tabs.querySelectorAll('[data-tab]').forEach(b => { if (n[b.dataset.tab]) { const s = document.createElement('span'); s.textContent = ' · ' + n[b.dataset.tab]; b.append(s); } });
    tabs.addEventListener('click', e => {
      const b = e.target.closest('[data-tab]'), p = b && sheet.querySelector('.' + b.dataset.tab);
      if (!p) return;
      const y = p.getBoundingClientRect().top + scrollY - 76;   // sous la barre du haut (64 px)
      if (scrollY > y) scrollTo({ top: y, behavior: 'smooth' });
    });
  }

  // Bouton retour dans le bloc sombre
  const plate = sheet.querySelector('.plate');
  if (plate) { const a = document.createElement('a'); a.className = 'rback'; a.href = 'recettes.html'; a.setAttribute('aria-label', 'Retour aux recettes'); a.addEventListener('click', retour); plate.appendChild(a); }

  // Ingrédients : « 3 / 7 dans le panier » (la liste est redessinée quand on change les portions)
  const liste = sheet.querySelector('#liste');
  if (liste) {
    const ip = barre(), ref = sheet.querySelector('#pnote') || sheet.querySelector('.portions');
    if (ref) ref.after(ip);
    const majIng = () => { const t = liste.querySelectorAll('input').length, c = liste.querySelectorAll('input:checked').length; rempli(ip, c, t, `${c} / ${t} dans le panier`); };
    liste.addEventListener('change', majIng); new MutationObserver(majIng).observe(liste, { childList: true }); majIng();
  }

  // Étapes : progression + la première étape non faite devient la carte « en cours »
  const prep = sheet.querySelector('.prep');
  let sp = null;
  if (steps.length && prep) { sp = barre(); const ref = prep.querySelector('.cnt') || prep.querySelector('.tag'); if (ref) ref.after(sp); }
  const maj = () => {
    const faites = steps.filter(l => l.querySelector('input').checked).length, i = steps.findIndex(l => !l.querySelector('input').checked);
    steps.forEach((l, k) => l.classList.toggle('is-now', k === i));
    if (sp) rempli(sp, faites, steps.length, i < 0 ? 'Terminé' : `Étape ${i + 1} sur ${steps.length}`);
  };
  sheet.addEventListener('change', e => {
    if (!e.target.matches('[data-etape]')) return;
    maj();
    const now = sheet.querySelector('.steps li.is-now');
    if (now && petit.matches) { const r = now.getBoundingClientRect(); if (r.bottom > innerHeight - 12 || r.top < 140) now.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  });
  maj();

  // Barre du haut (mobile) : ← et les deux onglets, visible quand les onglets d'origine sont sortis de l'écran.
  // Ses boutons déclenchent les vrais onglets : une seule logique, un seul état « actif ».
  if (tabs && 'IntersectionObserver' in window) {
    const reels = [...tabs.querySelectorAll('[data-tab]')];
    const bar = document.createElement('div'); bar.className = 'tbar'; bar.setAttribute('inert', '');
    bar.innerHTML = '<a class="tbar__x" href="recettes.html" aria-label="Retour aux recettes">←</a><div class="tbar__t" role="group" aria-label="Sections de la recette"></div>';
    const groupe = bar.querySelector('.tbar__t');
    const miroirs = reels.map(r => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = r.innerHTML; b.addEventListener('click', () => r.click()); groupe.appendChild(b); return b; });
    const sync = () => reels.forEach((r, i) => miroirs[i].setAttribute('aria-pressed', r.getAttribute('aria-pressed')));
    new MutationObserver(sync).observe(tabs, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] }); sync();
    document.body.appendChild(bar);
    new IntersectionObserver(([e]) => { const on = !e.isIntersecting && e.boundingClientRect.bottom < 0; bar.classList.toggle('on', on); bar.toggleAttribute('inert', !on); }).observe(tabs);
    bar.querySelector('a').addEventListener('click', retour);
  }
});