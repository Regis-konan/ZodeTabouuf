const ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
function renderLayout(active) {
  // Feuille de style du footer chargée ici : une seule modification pour toutes les pages
  if (!document.querySelector('link[href$="footer.css"]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'assets/css/footer.css'; document.head.appendChild(css);
  }
  const nav = [['recettes', 'Recettes', 'recettes.html'], ['categories', 'Catégories', 'categories.html'], ['favoris', 'Favoris', 'favoris.html']];
  const links = nav.map(([k, t, h]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ''}>${t}${k === 'favoris' ? '<span class="badge" data-fav-count></span>' : ''}</a>`).join('');
  $('#app-header').innerHTML = `<a class="skip" href="#main">Aller au contenu</a>
  <div class="hdr"><a class="logo" href="index.html">Zode <i>Tabouuf</i></a>
  <nav class="nav" aria-label="Principal">${links}</nav>
  <button class="menu-btn menu-btn--open" aria-expanded="false" aria-controls="menu">Menu</button></div>
  <div class="menu" id="menu" hidden><div class="menu__top"><a class="logo" href="index.html">Zode <i style="color:var(--lime)">Tabouuf</i></a><button class="menu-btn" data-close>Fermer</button></div>
  <div style="padding-top:24px">${nav.map(([k, t, h]) => `<a class="big" href="${h}">${t}${k === 'favoris' ? '<span class="badge" data-fav-count></span>' : ARROW}</a>`).join('')}
  <div style="border-top:1.5px solid rgba(246,239,228,.25);padding-top:24px"><div class="niveaux"><a class="chip" href="recettes.html?niveau=Facile">Facile</a><a class="chip" href="recettes.html?niveau=Moyen">Moyen</a><a class="chip" href="recettes.html?niveau=Difficile">Difficile</a></div>
  <a class="btn btn--palme" href="recettes.html" style="width:100%">Rechercher une recette</a></div></div></div>`;

  // Footer « le dessus du gâteau » : chantilly (ombre + crème) et ustensiles (CSS)
  const ORD = ['africain', 'plat', 'dessert', 'petit-dejeuner', 'boisson', 'snack', 'rapide', 'vegetarien'];
  const cats = ORD.map(id => CATS.find(c => c.id === id)).filter(Boolean);
  const nb = (typeof allRecettes !== 'undefined' && allRecettes.length) ? allRecettes.length : 0;
  const desc = nb ? `${nb} recettes, recettes à découvrir.` : 'Des recettes modernes aux classiques.';
  $('#app-footer').innerHTML = `<footer class="ft">
  <div class="ft__shadow" aria-hidden="true"></div>
  <div class="ft__cream" aria-hidden="true"></div>
  <div class="ft__main"><div class="wrap ft__in">
    <div class="ft__brand"><a class="logo" href="index.html">Zode<br><i>Tabouuf</i></a><p class="ft__desc">${desc}</p>
      <a class="ft__surp" href="recettes.html" data-hasard>Surprends-moi ${ARROW}</a></div>
    <nav class="ft__nav" aria-label="Pied de page">
      <div><h2>Recettes</h2><ul><li><a href="recettes.html">Toutes</a></li><li><a href="categories.html">Catégories</a></li><li><a href="favoris.html">Favoris</a></li></ul></div>
      <div class="ft__cats"><h2>Catégories</h2><ul>${cats.map(c => `<li><a href="recettes.html?cat=${esc(c.id)}">${esc(c.nom.replace(/\s*\(.*\)/, ''))}</a></li>`).join('')}</ul></div>
      <div><h2>Niveaux</h2><ul><li><a href="recettes.html?niveau=Facile">Facile</a></li><li><a href="recettes.html?niveau=Moyen">Moyen</a></li><li><a href="recettes.html?niveau=Difficile">Difficile</a></li></ul></div>
    </nav>
  </div></div>
    <div class="ft__end"><div class="wrap ft__bar"><div class="ft__bar-in"><p>© ${new Date().getFullYear()} Zode Tabouuf · Cuisinez simple, mangez bien.</p><a class="ft__top" href="#main">Retour en haut <span aria-hidden="true">${ARROW}</span></a></div></div></div>
  </footer>`;
  // « Surprends-moi » : une recette au hasard, choisie au moment du clic
  const surp = $('[data-hasard]');
  if (surp && typeof allRecettes !== 'undefined' && allRecettes.length && typeof recetteUrl === 'function') {
    surp.addEventListener('click', () => { surp.href = recetteUrl(allRecettes[Math.floor(Math.random() * allRecettes.length)]); });
  }

  const menu = $('#menu'), open = $('.menu-btn--open');
  const set = on => { menu.hidden = !on; open.setAttribute('aria-expanded', on); document.body.classList.toggle('menu-open', on); (on ? $('[data-close]') : open).focus(); };
  open.addEventListener('click', () => set(true));
  $('[data-close]').addEventListener('click', () => set(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) set(false); });
  const count = () => document.querySelectorAll('[data-fav-count]').forEach(b => b.textContent = Favoris.list().length || '');
  count(); document.addEventListener('favoris:change', count);
}
