const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>';
// i = position dans la liste : les 4 premières images se chargent tout de suite, les autres en différé.
function recetteCard(r, bare, i = 99) {
  const fav = Favoris.has(r.id);
  const isBare = bare === true;
  return `<article class="cr"><a class="cr__img" href="${recetteUrl(r)}" ${isBare ? `aria-label="${esc(r.titre)}"` : 'tabindex="-1" aria-hidden="true"'}><img src="${esc(r.image)}" alt="" width="600" height="600" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async"></a>
  <button class="heart" type="button" data-id="${r.id}" aria-pressed="${fav}" aria-label="Favori : ${esc(r.titre)}">${HEART}</button>
  ${isBare ? '' : `<a class="cr__t" href="${recetteUrl(r)}">${esc(r.titre)}</a><span class="cr__m">${formatTemps(r.temps)} · ${esc(r.difficulte)}</span>`}</article>`;
}
function rapideRow(r) {
  const t = formatTemps(r.temps).split(' ');
  return `<a class="row" href="${recetteUrl(r)}"><span class="row__t">${t[0]}<small> ${t.slice(1).join(' ')}</small></span><span class="row__n"><b>${esc(r.titre)}</b><span>${esc(catNom(r.categorie))}</span></span><span class="arrow">${ARROW}</span></a>`;
}
function initHearts() {
  document.addEventListener('click', e => {
    const b = e.target.closest('.heart'); if (!b) return;
    const on = Favoris.toggle(parseInt(b.dataset.id, 10));
    b.setAttribute('aria-pressed', on);
    showToast(on ? 'Ajouté aux favoris' : 'Retiré des favoris');
  });
}
