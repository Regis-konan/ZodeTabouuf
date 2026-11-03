// Menu mobile sur mesure : remplace le burger d'origine après renderLayout(), sans toucher à layout.js.
(function () {
  if (!document.querySelector('link[href$="nav.css"]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'assets/css/nav.css'; document.head.appendChild(css);
  }
  const base = window.renderLayout;
  if (typeof base !== 'function') return;
  window.renderLayout = function (active) {
    base(active);
    const q = s => document.querySelector(s);
    const oldBtn = q('.menu-btn--open'), oldMenu = q('#menu');
    if (!oldBtn || !oldMenu) return;
    const bars = '<i></i><i></i>';
    const btn = document.createElement('button');
    btn.className = 'nv-burger nv-burger--open';
    btn.setAttribute('aria-label', 'Ouvrir le menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'menu');
    btn.innerHTML = bars;
    oldBtn.replaceWith(btn); oldMenu.remove();

    const nav = [['recettes', 'Recettes', 'recettes.html'], ['categories', 'Catégories', 'categories.html'], ['favoris', 'Favoris', 'favoris.html']];
    const fav = '<span class="badge" data-fav-count></span>';
    const arrow = typeof ARROW === 'string' ? ARROW : '→';
    const links = nav.map(([k, t, h], i) => `<a href="${h}" style="--i:${i}"><small>0${i + 1}</small><span>${t}</span>${k === 'favoris' ? fav : `<i class="arrow" aria-hidden="true">${arrow}</i>`}</a>`).join('');
    document.body.insertAdjacentHTML('beforeend', `<div class="nv" id="menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true" inert>
      <div class="nv__top"><a class="logo" href="index.html">Zode <i>Tabouuf</i></a><button class="nv-burger is-open" data-close aria-label="Fermer le menu">${bars}</button></div>
      <div class="nv__body"><nav class="nv__links" aria-label="Principal">${links}</nav>
        <div class="nv__lv"><a class="chip" href="recettes.html?niveau=Facile">Facile</a><a class="chip" href="recettes.html?niveau=Moyen">Moyen</a><a class="chip" href="recettes.html?niveau=Difficile">Difficile</a></div>
        <a class="btn btn--palme nv__cta" href="recettes.html">Rechercher une recette</a></div>
      <span class="nv__disc" aria-hidden="true"></span><img class="nv__mascot" src="assets/img/mascotte-hero.webp" alt="" width="667" height="1296" loading="lazy" decoding="async"></div>`);

    const menu = q('#menu'), closeBtn = q('[data-close]');

    // Plat du moment (le même que sur l'accueil) posé sur la paume de la mascotte.
    // La position est calculée à partir de la taille réelle de la mascotte : la paume est à ~11 % de sa largeur et ~42 % de sa hauteur.
    // Si les recettes ne sont pas chargées sur cette page, on n'affiche simplement pas le plat.
    const mascot = q('.nv__mascot');
    let place = () => {};
    const pick = (typeof allRecettes !== 'undefined' && allRecettes.length) ? allRecettes[Math.floor(Date.now() / 864e5) % allRecettes.length] : null;
    if (mascot && pick && typeof recetteUrl === 'function' && typeof esc === 'function') {
      const petit = typeof vignette === 'function' ? vignette(pick.image) : pick.image;
      const temps = typeof formatTemps === 'function' ? formatTemps(pick.temps) : pick.temps + ' min';
      const dish = document.createElement('a');
      dish.className = 'nv__dish';
      dish.href = recetteUrl(pick);
      dish.setAttribute('aria-label', 'Plat du moment : ' + pick.titre);
      dish.innerHTML = `<span class="nv__dish-img"><img src="${esc(petit)}" alt="" width="120" height="120" onerror="this.onerror=null;this.src='${esc(pick.image)}'"></span>
        <span class="nv__dish-txt"><small>Plat du moment</small><b>${esc(pick.titre.replace(/\s*\(.*\)/, ''))}</b><span>${esc(temps)} · ${esc(pick.difficulte)}</span></span>`;
      mascot.after(dish);   // même parent que la mascotte : mêmes coordonnées
      place = () => {
        const w = mascot.offsetWidth, h = mascot.offsetHeight;
        if (!w || !h) return;
        const p = Math.round(h * .18);                                   // diamètre du plat
        dish.style.setProperty('--p', p + 'px');
        dish.style.left = Math.round(mascot.offsetLeft + w * .108 + p / 2) + 'px';   // bord droit du plat : centré sur la paume
        dish.style.top = Math.round(mascot.offsetTop + h * .421) + 'px';             // bas du plat : posé sur la paume
      };
      mascot.addEventListener('load', place);
      addEventListener('resize', place);
    }

    const behind = () => [q('#app-header'), q('#main'), q('#app-footer')].filter(Boolean);
    const set = on => {
      menu.classList.toggle('is-on', on);
      menu.toggleAttribute('inert', !on);
      menu.setAttribute('aria-hidden', String(!on));
      behind().forEach(el => el.toggleAttribute('inert', on));
      btn.setAttribute('aria-expanded', String(on));
      btn.classList.toggle('is-open', on);
      document.body.classList.toggle('menu-open', on);
      (on ? closeBtn : btn).focus({ preventScroll: true });
      if (on) requestAnimationFrame(() => { place(); requestAnimationFrame(place); });
    };
    btn.addEventListener('click', () => set(true));
    closeBtn.addEventListener('click', () => set(false));
    menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-on')) set(false); });
    matchMedia('(min-width:768px)').addEventListener('change', e => { if (e.matches && menu.classList.contains('is-on')) set(false); });

    const count = () => document.querySelectorAll('[data-fav-count]').forEach(b => b.textContent = (typeof Favoris !== 'undefined' && Favoris.list().length) || '');
    count(); document.addEventListener('favoris:change', count);
  };
})();