document.addEventListener('DOMContentLoaded', () => {
  renderLayout('categories');
  if (!DATA_OK.recettes) return erreurDonnees();
  const ORDRE = ['africain', 'plat', 'dessert', 'petit-dejeuner', 'boisson', 'snack', 'rapide', 'vegetarien'];
  const cats = ORDRE.map(id => CATS.find(c => c.id === id)).filter(Boolean);
  // Vignette (-s.webp) si elle existe, sinon la grande image (même logique que l'accueil)
  const mini = p => (typeof vignette === 'function' ? vignette(p) : p);
  const meilleure = id => allRecettes.find(r => r.id === VEDETTES[id]) || allRecettes.find(r => r.categorie === id);

  // i = rang de la tuile : la première image (en haut de page) est chargée en priorité, les autres à la demande
  const tuile = (c, i) => {
    const liste = allRecettes.filter(r => r.categorie === c.id), r = meilleure(c.id);
    const mn = Math.min(...liste.map(x => parseInt(x.temps, 10)).filter(Number.isFinite));
    const nom = c.nom.replace(/\s*\(.*\)/, '');
    const nb = `${liste.length} recette${liste.length > 1 ? 's' : ''}`;
    // deux éléments : le CSS décide de les empiler (petites tuiles) ou de les relier par « · » (grande tuile)
    const dure = Number.isFinite(mn) ? `<span class="cg-c__d">dès ${esc(formatTemps(mn))}</span>` : '';
    const chargement = i === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
    return `<a class="cg-c cg-c--${esc(c.id)}" href="recettes.html?cat=${esc(c.id)}">
      <span class="cg-c__n"><span>${nb}</span>${dure}</span>
      <div class="cg-c__t"><h2 class="f">${esc(nom)}</h2>${c.description ? `<p>${esc(c.description)}</p>` : ''}</div>
      ${r ? `<span class="cg-c__p"><img src="${esc(mini(r.image))}" alt="" width="600" height="600" ${chargement} decoding="async" onerror="this.onerror=null;this.src='${esc(r.image)}'"></span>` : ''}
      <span class="arrow" aria-hidden="true">${ARROW}</span></a>`;
  };

  // Dernière tuile : une recette au hasard (choisie au moment du clic)
  const hasard = () => allRecettes[Math.floor(Math.random() * allRecettes.length)];
  const surprise = `<a class="cg-c cg-c--surprise" href="${recetteUrl(hasard())}" data-hasard>
      <span class="cg-c__n">Pas d’idée ?</span>
      <div class="cg-c__t"><h2 class="f">Surprends-moi</h2><p>Une recette au hasard parmi les ${allRecettes.length}.</p></div>
      <span class="cg-c__q f" aria-hidden="true">?</span>
      <span class="arrow" aria-hidden="true">${ARROW}</span></a>`;

  $('#categories').innerHTML = `<div class="cg__head"><h1 class="f">Les <i>catégories</i></h1><p class="cg__sub">${cats.length} façons de choisir ce soir.</p></div>
    <div class="cg__grid">${cats.map(tuile).join('')}${surprise}</div>`;
  const s = $('[data-hasard]');
  s.addEventListener('click', () => { s.href = recetteUrl(hasard()); });
});