function categorieCard(c) {
  const nom = c.nom.replace(/\s*\(.*\)/, '');
  const mots = nom.split(' '), dernier = mots.pop();
  const titre = c.id === 'africain' && mots.length ? `${esc(mots.join(' '))} <i>${esc(dernier)}</i>` : esc(nom);
  const fleche = c.id === 'africain' ? `<span class="arrow">${ARROW}</span>` : '';
  return `<a class="cat cat--${esc(c.id)}" href="recettes.html?cat=${esc(c.id)}"><small>${c.count} recettes</small><h3 class="f">${titre}</h3>${fleche}</a>`;
}