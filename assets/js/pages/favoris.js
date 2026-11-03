document.addEventListener('DOMContentLoaded', () => {
  renderLayout('favoris');
  if (!DATA_OK.recettes) return erreurDonnees();
  const root = $('#favoris');
  const CLE = 'recettes_courses_v1';
  // La liste de courses est mémorisée : recettes ajoutées + articles déjà dans le panier
  const charger = () => { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; } };
  const sv = charger();
  const st = { cat: '', sel: new Set(sv.sel || []), coches: new Set(sv.coches || []), undo: null, confirmer: false };
  const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify({ sel: [...st.sel], coches: [...st.coches] })); } catch (e) {} };
  let tUndo, tConf, obs;
  const barre = document.createElement('div'); barre.className = 'undo'; barre.hidden = true; barre.setAttribute('role', 'status'); document.body.appendChild(barre);
  const fab = document.createElement('button'); fab.className = 'tk__fab'; fab.hidden = true; fab.dataset.goto = ''; document.body.appendChild(fab);
  const liste = () => Favoris.list().map(id => allRecettes.find(r => r.id === id)).filter(Boolean).reverse();
  const nom = id => catNom(id).replace(/\s*\(.*\)/, '');
  const mini = p => (typeof vignette === 'function' ? vignette(p) : p);
  const pl = n => (n > 1 ? 's' : '');
  const cle = i => i.nom + '|' + i.texte;
  const COEUR = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  const majUndo = () => {
    barre.hidden = !st.undo;
    barre.innerHTML = st.undo ? `<span>« ${esc(st.undo.titre)} » retiré</span><button class="ghost" data-undo>Annuler</button>` : '';
  };
  const pilule = (b, on) => { b.setAttribute('aria-pressed', on); b.textContent = on ? '✓ Dans la liste' : '+ Liste'; };

  // Une « fiche » de recette : photo type polaroid, titre, catégorie, temps, bouton liste, cœur
  const ligne = (r, mode) => {
    const t = formatTemps(r.temps).split(' '), titre = r.titre.replace(/\s*\(.*\)/, '');
    const note = '';
    const actions = mode === 'add'
      ? `<button class="fvr__x fvr__x--add" data-add="${r.id}" aria-label="Ajouter aux favoris : ${esc(titre)}">${COEUR}</button>`
      : `<button class="fvr__s" data-sel="${r.id}" aria-pressed="${st.sel.has(r.id)}" aria-label="Liste de courses : ${esc(titre)}">${st.sel.has(r.id) ? '✓ Dans la liste' : '+ Liste'}</button>
         <button class="fvr__x" data-rm="${r.id}" aria-label="Retirer des favoris : ${esc(titre)}">${COEUR}</button>`;
    return `<article class="fvr"><a class="fvr__a" href="${recetteUrl(r)}">
      <span class="fvr__i"><img src="${esc(mini(r.image))}" alt="" width="200" height="200" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${esc(r.image)}'"></span>
      <span class="fvr__t"><b class="f">${esc(titre)}</b><span>${esc(nom(r.categorie))}${note}</span></span>
      <span class="fvr__m"><b class="f">${esc(t[0])}<small> ${esc(t.slice(1).join(' '))}</small></b><small>${esc(r.difficulte || '')}</small></span></a>
      <span class="fvr__act">${actions}</span></article>`;
  };
  function depart() {
    const t = r => parseInt(r.temps, 10), vus = new Set();
    return [...allRecettes].sort((a, b) => t(a) - t(b) || a.titre.localeCompare(b.titre, 'fr')).filter(r => !vus.has(r.categorie) && vus.add(r.categorie)).slice(0, 4);
  }

  // Ticket de courses : on choisit les recettes sur les fiches (« + Liste »), ici on ne fait que les courses
  const choisies = l => l.filter(r => st.sel.has(r.id));
  const texteListe = items => 'Liste de courses\n' + items.map(i => '• ' + [i.texte, i.nom].filter(Boolean).join(' ')).join('\n');
  function ticket(l) {
    const ch = choisies(l), items = courses(ch);
    const prises = items.filter(i => st.coches.has(cle(i))), restes = items.filter(i => !st.coches.has(cle(i)));
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const lig = (i, on) => `<li><label class="tk__i"><input type="checkbox" data-co="${esc(cle(i))}" ${on ? 'checked' : ''}><span class="tk__c" aria-hidden="true"></span><span class="tk__n">${esc(i.nom)}</span><i class="tk__d" aria-hidden="true"></i><span class="tk__q">${esc(i.texte)}</span></label></li>`;
    const pct = items.length ? Math.round(prises.length / items.length * 100) : 0;
    const aReste = restes.length ? restes : items;
    return `<div class="tk__top"><p class="tk__k"><span>Liste de courses</span><span>${esc(date)}</span></p>
        <p class="tk__s"><b class="f">${ch.length}</b> recette${pl(ch.length)} · <b class="f">${items.length}</b> ingrédient${pl(items.length)}</p>
        <div class="tk__bar"><button class="tk__lnk" data-allsel>Tout ajouter</button>${ch.length ? '<button class="tk__lnk" data-clearsel>Vider la liste</button>' : ''}</div>
        ${items.length ? `<div class="tk__pg" role="progressbar" aria-label="Articles dans le panier" aria-valuemin="0" aria-valuemax="${items.length}" aria-valuenow="${prises.length}"><i style="width:${pct}%"></i></div>
        <p class="tk__pgt">${prises.length} / ${items.length} dans le panier</p>` : ''}</div>
      <div class="tk__perf" aria-hidden="true"></div>
      <div class="tk__body">${items.length
        ? `<ul class="tk__l">${restes.map(i => lig(i, false)).join('')}</ul>${prises.length ? `<p class="tk__sec">Dans le panier</p><ul class="tk__l tk__l--ok">${prises.map(i => lig(i, true)).join('')}</ul>` : ''}`
        : '<p class="tk__vide">Appuyez sur <b>+ Liste</b> sur une recette : ses ingrédients arrivent ici, regroupés.</p>'}</div>
      ${items.length ? `<div class="tk__foot"><button class="tk__b" data-copier>Copier</button>
        <a class="tk__b tk__b--wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(texteListe(aReste))}">WhatsApp</a></div>` : ''}`;
  }
  const majTicket = () => {
    const l = liste(), t = $('#tk'); if (!t) return;
    t.innerHTML = ticket(l);
    const n = courses(choisies(l)).length;
    fab.hidden = !n; fab.textContent = `Ma liste · ${n} article${pl(n)}`;
  };
  const surveiller = () => {
    if (obs) obs.disconnect();
    const t = $('#tk'); if (!t || !('IntersectionObserver' in window)) return;
    obs = new IntersectionObserver(([e]) => fab.classList.toggle('is-off', e.isIntersecting));
    obs.observe(t);
  };

  function render() {
    const l = liste();
    document.title = (l.length ? `Mes favoris (${l.length})` : 'Mes favoris') + ' · Recettes Faciles';
    if (!l.length) {
      fab.hidden = true;
      root.innerHTML = `<section class="fv-vide" aria-labelledby="t-vide">
          <div><p class="fv__k">Mon carnet</p><h1 class="f" id="t-vide">Aucun <i>favori</i></h1>
            <p class="fv-vide__p">Touchez le cœur d’une recette pour la retrouver ici. Vos favoris sont enregistrés sur cet appareil.</p>
            <a class="btn" href="recettes.html">Parcourir les recettes</a></div>
          <div class="fv-vide__g" aria-hidden="true">${'<div class="fvr fvr--ghost"><span class="fvr__i"></span><span class="fvr__t"><i></i><i></i></span><span class="fvr__x fvr__x--add">' + COEUR + '</span></div>'.repeat(3)}</div>
        </section>
        <section class="dem" aria-labelledby="t-dem"><h2 class="f" id="t-dem">Les plus <i>rapides</i>, pour commencer</h2><div class="fv__list">${depart().map(r => ligne(r, 'add')).join('')}</div></section>`;
      return;
    }
    const cats = [...new Set(l.map(r => r.categorie))];
    if (st.cat && !cats.includes(st.cat)) st.cat = '';
    const vis = st.cat ? l.filter(r => r.categorie === st.cat) : l;
    root.innerHTML = `<header class="fv__head"><div><p class="fv__k">Mon carnet</p><h1 class="f">Mes <i>favoris</i></h1></div>
        <div class="fv__tools"><p class="fv__n" role="status"><b class="f">${l.length}</b> recette${pl(l.length)} · sur cet appareil</p>
          <button class="ghost" data-tout>${st.confirmer ? 'Confirmer : tout retirer' : 'Tout retirer'}</button></div></header>
      ${cats.length > 1 ? `<div class="chips" role="group" aria-label="Filtrer par catégorie"><button class="fchip" data-cat="" aria-pressed="${!st.cat}">Tout</button>${cats.map(c => `<button class="fchip" data-cat="${esc(c)}" aria-pressed="${st.cat === c}">${esc(nom(c))}</button>`).join('')}</div>` : ''}
      <div class="fv__cols"><div class="fv__list">${vis.map(r => ligne(r, 'rm')).join('')}</div>
        <aside class="tk" id="tk" aria-label="Liste de courses"></aside></div>`;
    majTicket(); surveiller();
  }
  barre.addEventListener('click', e => {
    if (!e.target.closest('[data-undo]') || !st.undo) return;
    if (!Favoris.has(st.undo.id)) Favoris.toggle(st.undo.id);
    st.undo = null; majUndo();
  });
  fab.addEventListener('click', () => { const t = $('#tk'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  root.addEventListener('click', e => {
    const q = s => e.target.closest(s);
    const rm = q('[data-rm]'), add = q('[data-add]'), sel = q('[data-sel]'), cat = q('[data-cat]'), tout = q('[data-tout]');
    if (rm) { // retrait avec possibilité d'annuler
      const id = parseInt(rm.dataset.rm, 10), r = allRecettes.find(x => x.id === id);
      if (r) { st.undo = { id, titre: r.titre }; majUndo(); clearTimeout(tUndo); tUndo = setTimeout(() => { st.undo = null; majUndo(); }, 6000); }
      Favoris.toggle(id);
    }
    if (add) Favoris.toggle(parseInt(add.dataset.add, 10));
    if (sel) { // « + Liste » : on met à jour la fiche et le ticket sans tout redessiner
      const id = parseInt(sel.dataset.sel, 10), on = !st.sel.has(id);
      on ? st.sel.add(id) : st.sel.delete(id);
      pilule(sel, on); sauver(); majTicket();
    }
    if (q('[data-allsel]') || q('[data-clearsel]')) {
      const tous = !!q('[data-allsel]');
      st.sel = tous ? new Set(liste().map(r => r.id)) : new Set();
      root.querySelectorAll('[data-sel]').forEach(b => pilule(b, st.sel.has(parseInt(b.dataset.sel, 10))));
      sauver(); majTicket();
    }
    if (q('[data-copier]')) {
      const items = courses(choisies(liste())), restes = items.filter(i => !st.coches.has(cle(i)));
      navigator.clipboard.writeText(texteListe(restes.length ? restes : items))
        .then(() => showToast('Liste copiée'), () => showToast('Copie impossible sur ce navigateur'));
    }
    if (cat) { st.cat = cat.dataset.cat; render(); }
    if (tout) {
      if (!st.confirmer) { st.confirmer = true; render(); clearTimeout(tConf); tConf = setTimeout(() => { st.confirmer = false; render(); }, 4000); return; }
      st.confirmer = false; Favoris.list().forEach(id => Favoris.toggle(id)); showToast('Favoris vidés');
    }
  });
  root.addEventListener('change', e => {
    const co = e.target.dataset.co; if (!co) return;
    e.target.checked ? st.coches.add(co) : st.coches.delete(co);
    sauver(); majTicket();
  });
  document.addEventListener('favoris:change', render);
  render();
});