const etapesDe = r => (typeof recipePreparationSteps !== 'undefined' && recipePreparationSteps[r.id]) || [];
document.addEventListener('DOMContentLoaded', () => {
  renderLayout('recettes');
  if (!DATA_OK.recettes) return erreurDonnees();
  const root = $('#recette');
  const id = parseInt(new URLSearchParams(location.search).get('id'), 10);
  const r = allRecettes.find(x => x.id === id);
  if (!r) {
    document.title = 'Recette introuvable · Recettes Faciles';
    root.innerHTML = '<div class="intro"><h1 class="f" style="font-size:2.6rem">Cette recette est <i>introuvable</i></h1><p style="margin:14px 0 22px">Elle n’existe pas ou a changé d’adresse.</p><a class="btn" href="recettes.html">Voir toutes les recettes</a></div>';
    return;
  }
  const catTxt = catNom(r.categorie).replace(/\s*\(.*\)/, '');
  const principal = r.titre.replace(/\s*\(.*\)/, ''), complement = (r.titre.match(/\((.*)\)/) || [])[1];
  const mots = principal.split(' '), dernier = mots.pop();
  const titre = mots.length ? `${esc(mots.join(' '))} <i>${esc(dernier)}</i>` : `<i>${esc(dernier)}</i>`;
  const ings = r.ingredients.map(parseIng), etapes = etapesDe(r);
  const base = r.portions || 4;
  let portions = base;
  const t0 = parseInt(r.temps, 10), tt = formatTemps(r.temps).split(' ');
  // Recettes proches : même catégorie, durée la plus voisine
  const similaires = allRecettes.filter(x => x.categorie === r.categorie && x.id !== r.id)
    .sort((a, b) => Math.abs(parseInt(a.temps, 10) - t0) - Math.abs(parseInt(b.temps, 10) - t0)).slice(0, 4);

  document.title = `${r.titre} · Recettes Faciles`;
  $('meta[name=description]').content = r.description;
  // Données structurées : uniquement des données réelles (pas de note ni d'avis inventés)
  const ld = { '@context': 'https://schema.org', '@type': 'Recipe', name: r.titre, description: r.description, image: new URL(r.image, location.href).href,
    totalTime: 'PT' + t0 + 'M', recipeYield: base + ' personnes', recipeCategory: catTxt, recipeIngredient: r.ingredients,
    recipeInstructions: etapes.map(t => ({ '@type': 'HowToStep', text: t })) };
  const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld); document.head.appendChild(s);

  root.innerHTML = `
  <nav class="crumb" aria-label="Fil d’Ariane"><a href="recettes.html">Recettes</a> / <a href="recettes.html?cat=${esc(r.categorie)}">${esc(catTxt)}</a> / <span aria-current="page"><b>${esc(principal)}</b></span></nav>
  <p class="ct"><b>${esc(r.titre)}</b> · ${formatTemps(r.temps)}</p>
  <article class="sheet">
    <header class="sh">
      <a class="kick" href="recettes.html?cat=${esc(r.categorie)}">${esc(catTxt)}</a>
      <h1 class="script">${esc(principal)}</h1>${complement ? `<p class="sub">${esc(complement)}</p>` : ''}
      <p class="lead">${esc(r.description)}</p>
      <dl class="rmeta">
        <div><dt>Niveau</dt><dd>${esc(r.difficulte)}</dd></div>
        <div><dt>Pour</dt><dd id="pour"></dd></div>
        <div><dt>Étapes</dt><dd>${etapes.length || '–'}</dd></div>
      </dl>
      <div class="ract">
        <button class="btn" id="cuisine" aria-pressed="false">Mode cuisine</button>
        <button class="ghost" id="fav" aria-pressed="false">${HEART}<span>Favori</span></button>
        <button class="icb" id="print" aria-label="Imprimer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-8h16v8h-3M7 14h10v7H7z"/></svg></button>
        <button class="icb" id="share" aria-label="Partager"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v8h14v-8"/></svg></button>
      </div>
    </header>
    <figure class="plate">
      <img src="${esc(r.image)}" alt="${esc(r.titre)}" width="1200" height="900" fetchpriority="high" onerror="this.remove()">
      <figcaption class="stamp"><small>Prêt en</small><b>${tt[0]}</b><span>${esc(tt.slice(1).join(' '))}</span></figcaption>
    </figure>
    <div class="tabs" role="group" aria-label="Sections de la recette"><button data-tab="ing" aria-pressed="true">Ingrédients</button><button data-tab="prep" aria-pressed="false">Préparation</button></div>
    <section class="ing" aria-labelledby="t-ing">
      <h2 class="tag" id="t-ing"><span>Ingrédients</span></h2><p class="cnt">${ings.length} ingrédients · touchez pour barrer</p>
      <p class="portions"><span id="lbl">Pour</span><output id="nb" aria-live="polite" aria-labelledby="lbl"></output><span id="unit">personnes</span><button id="moins" aria-label="Moins de portions">−</button><button id="plus" aria-label="Plus de portions">+</button></p>
      <p class="pnote" id="pnote" hidden>Les quantités citées dans les étapes restent celles de la recette pour ${base} personnes.</p>
      <ul id="liste"></ul>
      <button class="ghost" id="courses">Copier la liste de courses</button>
    </section>
    <section class="prep" aria-labelledby="t-prep">
      <h2 class="tag" id="t-prep"><span>Préparation</span></h2>${etapes.length ? `<p class="cnt">Touchez une étape pour la barrer</p>` : ''}
      ${etapes.length ? `<ol class="steps">${etapes.map(t => `<li><label><input type="checkbox" data-etape><p>${esc(t)}</p></label></li>`).join('')}</ol>` : '<p style="margin-top:14px">Les étapes de cette recette arrivent bientôt.</p>'}
      ${r.astuce ? `<div class="astuce"><small>Astuce</small><p>${esc(r.astuce)}</p></div>` : ''}
    </section>
  </article>
  ${similaires.length ? `<section class="more" aria-labelledby="t-more"><h2 class="f" id="t-more">Dans le même <i>esprit</i></h2><div class="grid">${similaires.map(x => recetteCard(x)).join('')}</div></section>` : ''}
  <button class="btn" id="sortir">Quitter le mode cuisine</button>`;

  // Mobile : un seul panneau à la fois (ingrédients ou préparation)
  const sheet = root.querySelector('.sheet'); sheet.dataset.tab = 'ing';
  root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    sheet.dataset.tab = b.dataset.tab;
    root.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-pressed', x === b));
  }));
  const liste = $('#liste');
  const rendu = () => {
    const mult = portions / base;
    liste.innerHTML = ings.map(i => { const q = mise(i, mult); return `<li><label><input type="checkbox">${q ? `<b>${esc(q)}</b>` : ''}<span>${esc(i.nom)}</span></label></li>`; }).join('');
    $('#nb').textContent = portions;
    $('#unit').textContent = portions > 1 ? 'personnes' : 'personne';
    $('#pour').textContent = portions + ' pers.';
    $('#pnote').hidden = portions === base;
  };
  rendu();
  $('#moins').addEventListener('click', () => { if (portions > 1) { portions--; rendu(); } });
  $('#plus').addEventListener('click', () => { if (portions < 12) { portions++; rendu(); } });
  $('#courses').addEventListener('click', async () => {
    const mult = portions / base;
    const txt = `Courses · ${r.titre} (${portions} pers.)\n` + ings.map(i => '• ' + [mise(i, mult), i.nom].filter(Boolean).join(' ')).join('\n');
    try { await navigator.clipboard.writeText(txt); showToast('Liste de courses copiée'); } catch (e) { showToast('Copie impossible sur ce navigateur'); }
  });

  // Progression des étapes
  const maj = () => { const p = $('#prog'); if (!p) return; const n = root.querySelectorAll('[data-etape]:checked').length; p.textContent = `${n} / ${etapes.length} faites`; };
  root.addEventListener('change', e => { if (e.target.matches('[data-etape]')) maj(); });
  maj();

  // Mode cuisine : texte agrandi + écran qui reste allumé
  let lock = null;
  const veille = async on => { try { if (on && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen'); else if (lock) { await lock.release(); lock = null; } } catch (e) {} };
  const cuisine = on => { document.body.classList.toggle('cuisine', on); $('#cuisine').setAttribute('aria-pressed', on); veille(on); if (on) window.scrollTo(0, 0); };
  $('#cuisine').addEventListener('click', () => cuisine(!document.body.classList.contains('cuisine')));
  $('#sortir').addEventListener('click', () => cuisine(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('cuisine')) cuisine(false); });
  document.addEventListener('visibilitychange', () => { if (document.body.classList.contains('cuisine') && document.visibilityState === 'visible') veille(true); });

  const fav = $('#fav');
  const majFav = () => { const on = Favoris.has(r.id); fav.setAttribute('aria-pressed', on); fav.querySelector('span').textContent = on ? 'Enregistré' : 'Favori'; };
  majFav();
  fav.addEventListener('click', () => { const on = Favoris.toggle(r.id); majFav(); showToast(on ? 'Ajouté aux favoris' : 'Retiré des favoris'); });
  document.addEventListener('favoris:change', majFav);
  $('#print').addEventListener('click', () => window.print());
  $('#share').addEventListener('click', async () => {
    try { if (navigator.share) await navigator.share({ title: r.titre, url: location.href }); else { await navigator.clipboard.writeText(location.href); showToast('Lien copié'); } } catch (e) {}
  });
  initHearts();
});
