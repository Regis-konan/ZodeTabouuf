document.addEventListener('DOMContentLoaded', () => {
  renderLayout('');
  const top = DATA_OK.recettes ? ['dessert', 'africain', 'petit-dejeuner'].map(c => allRecettes.find(r => r.id === VEDETTES[c])).filter(Boolean) : [];
  $('#erreur').innerHTML = `<div class="er__art" aria-hidden="true"><b>4<i>0</i>4</b></div>
    <h1 class="f">Cette recette est <i>partie en cuisine</i></h1><p>La page que vous cherchez n’existe pas ou a changé d’adresse.</p>
    <a class="btn" href="index.html">Retour à l’accueil</a>
    ${top.length ? `<div class="er__s"><h2>Ou essayez</h2>${top.map(r => `<a class="row" href="${recetteUrl(r)}"><span class="row__n"><b>${esc(r.titre)}</b></span><span class="arrow">${ARROW}</span></a>`).join('')}</div>` : ''}`;
});