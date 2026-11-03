const ORDRE = ['africain', 'plat', 'dessert', 'petit-dejeuner', 'boisson', 'snack', 'rapide', 'vegetarien'];
const ASTUCES_JOUR = [
  'Sortez les ingrédients du frigo 30 minutes avant : ils se mélangent mieux.',
  'Laissez reposer le plat 5 minutes avant de servir : les saveurs se répartissent.',
  'Goûtez en cours de cuisson, et ajustez le piment et le sel à la fin.',
  'Préparez tous vos ingrédients avant d’allumer le feu : tout ira plus vite.',
  'Des légumes saisis ou rôtis ont bien plus de goût que des légumes bouillis.',
  'Servez bien frais : une boisson froide paraît toujours moins sucrée.'
];
// Les listes utilisent la vignette (-s.webp) si elle existe, sinon la grande image.
const mini = p => (typeof vignette === 'function' ? vignette(p) : p);
const imgMini = r => `<img src="${esc(mini(r.image))}" alt="" width="600" height="600" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${esc(r.image)}'">`;
// Recette mise en avant par catégorie : VEDETTES (fin de data/recettes.js) ; à défaut, la première de la catégorie.
const meilleure = id => allRecettes.find(r => r.id === VEDETTES[id]) || allRecettes.find(r => r.categorie === id);

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('accueil');
  if (!DATA_OK.recettes) return erreurDonnees();
  $('#nb').textContent = allRecettes.length;
  const jour = Math.floor(Date.now() / 864e5);

  // 0. Ticket « phrase à compléter » : les catégories viennent des données, puis on envoie vers recettes.html
  $('#f-cat').innerHTML = '<option value="">n’importe quoi</option>' + ORDRE.map(id => CATS.find(c => c.id === id)).filter(Boolean)
    .map(c => `<option value="${esc(c.id)}">${esc(c.nom.replace(/\s*\(.*\)/, ''))}</option>`).join('');

  // Surligneur : le texte affiché est un <span> dessiné par le CSS, le vrai <select> reste actif mais invisible par-dessus
  document.querySelectorAll('.hx__sel').forEach(w => {
    const s = w.querySelector('select'), v = w.querySelector('.hx__val');
    const maj = () => { v.textContent = s.selectedOptions[0].text; };
    s.addEventListener('change', maj);
    maj();
  });

  $('#search').addEventListener('submit', e => {
    e.preventDefault();
    const p = new URLSearchParams();
    [['cat', '#f-cat'], ['temps', '#f-temps'], ['niveau', '#f-niv']].forEach(([cle, sel]) => { const v = $(sel).value; if (v) p.set(cle, v); });
    location.href = 'recettes.html' + (p.toString() ? '?' + p : '');
  });

  // 1. Le plat du moment : une recette différente chaque jour, parmi toutes — photo posée sur la main de la mascotte, étiquette à côté
  const pick = allRecettes[jour % allRecettes.length];
  $('#plate').innerHTML = `<a class="hx-dish" href="${recetteUrl(pick)}" aria-label="Plat du moment : ${esc(pick.titre)}">
    <span class="hx-dish__img"><img src="${esc(mini(pick.image))}" alt="" width="248" height="248" onerror="this.onerror=null;this.src='${esc(pick.image)}'"></span>
    <span class="hx-dish__txt"><small>Plat du moment</small><b>${esc(pick.titre.replace(/\s*\(.*\)/, ''))}</b><span class="hx-dish__meta">${esc(formatTemps(pick.temps))} · ${esc(pick.difficulte)}</span></span></a>`;

  // 2. Catégories, chacune avec son assiette (la mieux notée)
  $('#cats').innerHTML = ORDRE.map(id => CATS.find(c => c.id === id)).filter(Boolean).map(c => {
    const r = meilleure(c.id), nom = c.nom.replace(/\s*\(.*\)/, '');
    const mots = nom.split(' '), dernier = mots.pop();
    const titre = c.id === 'africain' && mots.length ? `${esc(mots.join(' '))} <i>${esc(dernier)}</i>` : esc(nom);
    return `<a class="h-cat h-cat--${esc(c.id)}" href="recettes.html?cat=${esc(c.id)}"><small>${allRecettes.filter(x => x.categorie === c.id).length} recettes</small><h3 class="f">${titre}</h3>${r ? `<span class="h-cat__p">${imgMini(r)}</span>` : ''}</a>`;
  }).join('');

  // 3. En moins de 30 min (avec miniatures rondes) + astuce du jour
  $('#rapide').innerHTML = allRecettes.filter(r => parseInt(r.temps, 10) <= 30)
    .sort((a, b) => a.temps - b.temps || a.id - b.id).slice(0, 5).map(r => {
      const x = formatTemps(r.temps).split(' ');
      return `<a class="h-row" href="${recetteUrl(r)}"><span class="h-row__t">${x[0]}<small> ${x.slice(1).join(' ')}</small></span><span class="h-row__i">${imgMini(r)}</span>
        <span class="h-row__n"><b>${esc(r.titre.replace(/\s*\(.*\)/, ''))}</b><span>${esc(catNom(r.categorie).replace(/\s*\(.*\)/, ''))}</span></span><span class="arrow">${ARROW}</span></a>`;
    }).join('');
  $('#astuce').textContent = ASTUCES_JOUR[jour % ASTUCES_JOUR.length];

  // 4. À découvrir : 4 recettes de catégories différentes, qui changent chaque jour (on avance de 11 en 11 : 11 est premier avec 83, donc toute la liste est parcourue)
  const vues = new Set([pick.categorie]), aimees = [];
  for (let i = 0; i < allRecettes.length && aimees.length < 4; i++) {
    const r = allRecettes[(jour + i * 11) % allRecettes.length];
    if (r.id !== pick.id && !vues.has(r.categorie)) { vues.add(r.categorie); aimees.push(r); }
  }
  $('#aimees').innerHTML = aimees.map(r => `<a class="h-pc" href="${recetteUrl(r)}"><span class="h-pc__i">${imgMini(r)}</span><b>${esc(r.titre.replace(/\s*\(.*\)/, ''))}</b><span>${esc(formatTemps(r.temps))} · ${esc(r.difficulte)}</span></a>`).join('');
});