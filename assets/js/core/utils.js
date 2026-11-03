const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Vérifie que les données sont bien chargées (sinon on affiche un message au lieu d'une page vide)
const DATA_OK = { recettes: typeof allRecettes !== 'undefined', categories: typeof categories !== 'undefined' };
const CATS_DEFAUT = [
  { id: 'dessert', nom: 'Desserts', count: 10, description: 'Douceurs sucrées' },
  { id: 'plat', nom: 'Plats Principaux', count: 15, description: 'Repas complets' },
  { id: 'snack', nom: 'Snacks & Apéros', count: 8, description: 'Petites bouchées' },
  { id: 'petit-dejeuner', nom: 'Petit-déjeuner', count: 10, description: 'Énergie matinale' },
  { id: 'africain', nom: 'Plats Africains', count: 10, description: 'Saveurs authentiques' },
  { id: 'rapide', nom: 'Rapide (<30min)', count: 10, description: 'Quand on est pressé' },
  { id: 'vegetarien', nom: 'Végétarien', count: 5, description: 'Sans viande' },
  { id: 'boisson', nom: 'Boissons', count: 15, description: 'Cocktails et jus' }
];
if (!DATA_OK.categories) console.warn('categories.js introuvable ou vide : liste par défaut utilisée.');
const CATS = (DATA_OK.categories ? categories : CATS_DEFAUT).filter(Boolean);
function erreurDonnees() {
  $('#main').insertAdjacentHTML('afterbegin', '<p class="erreur" role="alert"><b>Les recettes ne se chargent pas.</b> Vérifie que <code>assets/js/data/recettes.js</code> existe et contient <code>const allRecettes = [ ... ]</code>.</p>');
}
const catNom = id => (CATS.find(c => c.id === id) || {}).nom || id;
const recetteUrl = r => 'recette.html?id=' + r.id;
function formatTemps(m) {
  m = parseInt(m, 10);
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60), r = m % 60;
  return r ? h + ' h ' + String(r).padStart(2, '0') : h + ' h';
}