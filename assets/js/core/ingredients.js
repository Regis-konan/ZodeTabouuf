// Lecture des ingrédients ("mascarpone 500g" -> quantité + unité), mise à l'échelle et liste de courses.
const UNITES = { cs: 'c. à s.' };
const DISCRET = ['', 'filets', 'tranches', 'gousses', 'boules', 'cs', 'feuilles'];
function parseIng(txt) {
  const m = txt.match(/^(.+?)\s+(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*([^\d\s]+)?$/);
  if (!m) return { nom: txt, qty: null, unit: '' };
  const q = m[2].includes('/') ? m[2].split('/').reduce((a, b) => a / b) : parseFloat(m[2].replace(',', '.'));
  return { nom: m[1], qty: q, unit: m[3] || '' };
}
function mise(ing, mult) {
  let { qty, unit } = ing;
  if (qty === null) return '';
  if (mult !== 1) {
    qty = DISCRET.includes(unit) ? Math.max(.5, Math.round(qty * mult * 2) / 2)
        : qty * mult >= 100 ? Math.round(qty * mult / 5) * 5 : Math.round(qty * mult * 10) / 10;
  }
  if (unit === 'g' && qty >= 1000) { qty /= 1000; unit = 'kg'; }
  if (unit === 'ml' && qty >= 1000) { qty /= 1000; unit = 'l'; }
  const n = String(Math.round(qty * 100) / 100).replace('.', ',');
  const u = UNITES[unit] || unit;
  return u ? n + (u.length <= 2 ? '\u202f' : ' ') + u : n;
}
const nomCle = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
// Fusionne les ingrédients de plusieurs recettes : mêmes nom + même unité = quantités additionnées.
function courses(recettes) {
  const map = new Map();
  recettes.forEach(r => r.ingredients.forEach(t => {
    const i = parseIng(t), k = nomCle(i.nom) + '|' + (i.qty === null ? '' : i.unit), e = map.get(k);
    if (e) { if (i.qty !== null) e.qty += i.qty; } else map.set(k, { nom: i.nom, unit: i.unit, qty: i.qty });
  }));
  const avec = new Set([...map.values()].filter(e => e.qty !== null).map(e => nomCle(e.nom)));
  return [...map.values()].filter(e => e.qty !== null || !avec.has(nomCle(e.nom)))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(e => ({ nom: e.nom, texte: mise(e, 1) }));
}
