const NIVEAUX = ['Très facile', 'Facile', 'Moyen', 'Difficile'];
const TRIS = { rapide: 'Les plus rapides', facile: 'Les plus faciles', az: 'De A à Z' };
const TEMPS = [15, 30, 60];
const tLabel = t => t === 60 ? '1 h max' : t + ' min max';
const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const propre = n => n.replace(/\s*\(.*\)/, '');

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('recettes');
  if (!DATA_OK.recettes) return erreurDonnees();
  const p = new URLSearchParams(location.search);
  const st = {
    q: p.get('q') || '',
    cat: CATS.some(c => c.id === p.get('cat')) ? p.get('cat') : '',
    niv: new Set((p.get('niveau') || '').split(',').filter(n => NIVEAUX.includes(n))),
    temps: TEMPS.includes(+p.get('temps')) ? +p.get('temps') : 0,
    tri: TRIS[p.get('tri')] ? p.get('tri') : 'rapide',
    n: 12
  };
  const root = $('#liste');
  const total = allRecettes.length;
  const cats = CATS.filter(Boolean);
  const compte = id => allRecettes.filter(r => r.categorie === id).length;
  // Sous 1024px : pastilles de catégories + feuille « Filtres » (niveau, durée) ; la barre latérale n'existe qu'au-dessus
  const mob = matchMedia('(max-width:1023.98px)');

  root.innerHTML = `
  <div class="lr__top">
    <div><p class="lr__k" id="kick"></p><h1 class="f" id="h1"></h1></div>
    <form class="search" id="form" role="search"><label class="sr-only" for="q">Rechercher une recette</label>
      <input id="q" type="search" placeholder="Un plat, un ingrédient…" autocomplete="off"><button class="btn" type="submit">Chercher</button></form>
  </div>
  <div class="lr__body">
    <aside class="filtres" id="f-side" aria-label="Filtres"></aside>
    <div class="lr__main">
      <details class="mf"><summary>Filtres<span id="nf"></span></summary><div class="mf__in" id="f-mob"></div></details>
      <div class="actifs" id="actifs"></div>
      <div class="bar"><span id="compte" role="status" aria-live="polite"></span>
        <label class="sr-only" for="tri">Trier par</label><select id="tri">${Object.entries(TRIS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div id="res"></div>
    </div>
  </div>`;
  $('#q').value = st.q; $('#tri').value = st.tri;

  const cp = over => ({ ...st, niv: new Set(st.niv), ...over });
  function filtrer(s) {
    const mots = norm(s.q).split(/\s+/).filter(Boolean);
    const l = allRecettes.filter(r => {
      if (s.cat && r.categorie !== s.cat) return false;
      if (s.niv.size && !s.niv.has(r.difficulte)) return false;
      if (s.temps && parseInt(r.temps, 10) > s.temps) return false;
      if (mots.length) { const h = norm([r.titre, r.description, ...r.ingredients].join(' ')); return mots.every(m => h.includes(m)); }
      return true;
    });
    const score = r => mots.reduce((a, m) => a + (norm(r.titre).includes(m) ? 1 : 0), 0);
    const t = r => parseInt(r.temps, 10);
    const cmp = s.tri === 'az' ? (a, b) => a.titre.localeCompare(b.titre, 'fr')
      : s.tri === 'facile' ? (a, b) => NIVEAUX.indexOf(a.difficulte) - NIVEAUX.indexOf(b.difficulte) || t(a) - t(b)
      : (a, b) => t(a) - t(b) || a.titre.localeCompare(b.titre, 'fr');
    return l.sort((a, b) => score(b) - score(a) || cmp(a, b));
  }
  const actifs = () => [
    ...(st.q ? [{ label: `« ${st.q} »`, rm: 'q' }] : []),
    ...(st.cat ? [{ label: propre(catNom(st.cat)), rm: 'cat' }] : []),
    ...[...st.niv].map(n => ({ label: n, rm: 'niv', v: n })),
    ...(st.temps ? [{ label: tLabel(st.temps), rm: 'temps' }] : [])
  ];
  const sans = f => filtrer(cp(f.rm === 'q' ? { q: '' } : f.rm === 'cat' ? { cat: '' } : f.rm === 'temps' ? { temps: 0 }
    : { niv: new Set([...st.niv].filter(x => x !== f.v)) })).length;
  const rmAttr = f => `data-rm="${f.rm}"${f.v ? ` data-v="${esc(f.v)}"` : ''}`;

  function url() {
    const u = new URLSearchParams();
    if (st.q) u.set('q', st.q); if (st.cat) u.set('cat', st.cat);
    if (st.niv.size) u.set('niveau', [...st.niv].join(',')); if (st.temps) u.set('temps', st.temps);
    if (st.tri !== 'rapide') u.set('tri', st.tri);
    history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
  }
  const pressed = on => `aria-pressed="${on}"`;
  const filtresHTML = () => `<h2>Catégories</h2>
    <button class="fcat" data-cat="" ${pressed(!st.cat)}>Toutes <span>${total}</span></button>` +
    cats.map(c => `<button class="fcat" data-cat="${esc(c.id)}" ${pressed(st.cat === c.id)}>${esc(propre(c.nom))} <span>${compte(c.id)}</span></button>`).join('') +
    `<h2>Niveau</h2><div class="fl">${NIVEAUX.map(n => `<button class="fchip fchip--o" data-niv="${esc(n)}" ${pressed(st.niv.has(n))}>${n}</button>`).join('')}</div>
     <h2>Temps</h2><div class="fl">${TEMPS.map(t => `<button class="fchip fchip--o" data-tm="${t}" ${pressed(st.temps === t)}>${tLabel(t)}</button>`).join('')}</div>`;

  // Garde le focus clavier sur le même contrôle après chaque rendu
  const cle = el => el && root.contains(el) && el.dataset && Object.keys(el.dataset).length
    ? '[' + Object.entries(el.dataset).map(([k, v]) => `data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${CSS.escape(v)}"`).join('][') + ']' : '';

  function render() {
    const k = cle(document.activeElement);
    const l = filtrer(st), vis = l.slice(0, st.n), act = actifs();
    const nom = st.cat ? propre(catNom(st.cat)) : 'Toutes les recettes';
    const mots = nom.split(' '), dernier = mots.pop();
    $('#h1').innerHTML = (mots.length ? esc(mots.join(' ')) + ' ' : '') + `<i>${esc(dernier)}</i>`;
    $('#kick').textContent = st.cat ? 'Catégorie' : `${total} recettes`;
    $('#f-side').innerHTML = filtresHTML(); $('#f-mob').innerHTML = filtresHTML();
    // Le bouton « Filtres » ne compte que ce que contient sa feuille (niveau, durée) : la catégorie est dans les pastilles, la recherche dans le champ
    const nbFeuille = st.niv.size + (st.temps ? 1 : 0);
    $('#nf').textContent = nbFeuille ? ` · ${nbFeuille}` : '';
    // Sous 1024px la catégorie active est déjà surlignée dans les pastilles : pas de doublon dans les filtres actifs
    const chips = mob.matches ? act.filter(f => f.rm !== 'cat') : act;
    $('#actifs').innerHTML = chips.map(f => `<button class="ghost" ${rmAttr(f)} aria-label="Retirer le filtre ${esc(f.label)}">${esc(f.label)} <span aria-hidden="true">×</span></button>`).join('')
      + (act.length > 1 ? '<button class="ghost ghost--q" data-reset>Tout effacer</button>' : '');
    $('#compte').innerHTML = `<b>${l.length} recette${l.length > 1 ? 's' : ''}</b>`;
    if (l.length) {
      $('#res').innerHTML = `<div class="grille">${vis.map((r, i) => recetteCard(r, false, i)).join('')}</div>` +
        (l.length > vis.length ? `<div class="plus"><button class="btn" data-plus>Afficher plus de recettes</button></div>` : '');
    } else {
      const sug = act.map(f => ({ f, n: sans(f) })).filter(x => x.n > 0);
      $('#res').innerHTML = `<div class="vide"><h2 class="f">Aucune recette <i>trouvée</i></h2><p>Rien ne correspond à tous vos critères à la fois.</p>
        <div class="vide__a">${sug.map(x => `<button class="ghost" ${rmAttr(x.f)}>Retirer « ${esc(x.f.label)} » : ${x.n} recette${x.n > 1 ? 's' : ''}</button>`).join('')}</div></div>`;
    }
    document.title = (st.cat ? propre(catNom(st.cat)) : 'Toutes les recettes') + ' · Zode Tabouuf';
    url();
    if (k) { const t = [...root.querySelectorAll(k)].find(x => x.offsetParent !== null); if (t) t.focus(); }
  }
  const maj = () => { st.n = 12; render(); };
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-cat],[data-niv],[data-tm],[data-rm],[data-reset],[data-plus]');
    if (!b) return;
    const d = b.dataset;
    if ('cat' in d) st.cat = d.cat;
    else if ('niv' in d) st.niv.has(d.niv) ? st.niv.delete(d.niv) : st.niv.add(d.niv);
    else if ('tm' in d) st.temps = st.temps === +d.tm ? 0 : +d.tm;
    else if ('rm' in d) { if (d.rm === 'q') { st.q = ''; $('#q').value = ''; } else if (d.rm === 'cat') st.cat = ''; else if (d.rm === 'niv') st.niv.delete(d.v); else st.temps = 0; }
    else if ('reset' in d) { st.q = ''; st.cat = ''; st.niv.clear(); st.temps = 0; $('#q').value = ''; }
    else if ('plus' in d) { st.n += 12; return render(); }
    maj();
  });
  root.addEventListener('change', e => { if (e.target.id === 'tri') { st.tri = e.target.value; maj(); } });
  let tm; $('#q').addEventListener('input', e => { clearTimeout(tm); tm = setTimeout(() => { st.q = e.target.value.trim(); maj(); }, 150); });
  $('#form').addEventListener('submit', e => { e.preventDefault(); st.q = $('#q').value.trim(); maj(); });
  mob.addEventListener('change', render);   // les filtres actifs changent quand on passe de mobile à ordinateur
  render(); initHearts();
});