// Vérificateur du projet — à lancer à la racine du site :  node verifier.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.cwd(), IGNORE = /^(node_modules|\.git|images_originals|images_opt)$/;
let problemes = 0;
const ok = s => console.log('  ✔ ' + s), ko = s => { console.log('  ✖ ' + s); problemes++; }, info = s => console.log('  · ' + s);
const titre = s => console.log('\n' + s + '\n' + '─'.repeat(s.length));
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (IGNORE.test(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };
const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
const files = walk(ROOT).map(p => ({ p: rel(p), size: fs.statSync(p).size }));
const exact = new Set(files.map(f => f.p)), lower = new Map(files.map(f => [f.p.toLowerCase(), f.p]));
const ko_ = n => Math.round(n / 1024);

titre('1. FICHIERS VIDES');
const vides = files.filter(f => f.size === 0 && !f.p.startsWith('images/'));
vides.length ? vides.forEach(f => ko(f.p + '  (vide)')) : ok('aucun fichier vide');

titre('2. FICHIERS ATTENDUS');
const attendus = ['index.html', 'recettes.html', 'recette.html', 'favoris.html', 'categories.html', '404.html', 'favicon.svg',
  ...['tokens', 'base', 'components'].map(n => `assets/css/${n}.css`),
  ...['home', 'recettes', 'recette', 'favoris', 'categories', '404'].map(n => `assets/css/pages/${n}.css`),
  ...['utils', 'storage', 'layout'].map(n => `assets/js/core/${n}.js`),
  ...['toast', 'card-recette', 'card-categorie'].map(n => `assets/js/components/${n}.js`),
  ...['recettes', 'categories', 'etapes'].map(n => `assets/js/data/${n}.js`),
  ...['home', 'recettes', 'recette', 'favoris', 'categories', '404'].map(n => `assets/js/pages/${n}.js`)];
let manque = 0;
for (const a of attendus) { if (!exact.has(a)) { ko('MANQUANT  ' + a); manque++; } }
if (!manque) ok(attendus.length + ' fichiers présents');
const connus = new Set(attendus);
const autres = files.filter(f => !connus.has(f.p) && !/^(images|fonts)\//.test(f.p));
autres.length ? info('autres fichiers (anciens restes ?) : ' + autres.map(f => f.p).join(', ')) : 0;

titre('3. LIENS DANS LES PAGES HTML (scripts, styles, icône)');
let casses = 0;
for (const h of files.filter(f => f.p.endsWith('.html'))) {
  const src = fs.readFileSync(h.p, 'utf8');
  for (const m of src.matchAll(/(?:src|href)="([^"#?:]+)"/g)) {
    const l = m[1]; if (/^(https?|data|mailto|tel)/.test(l) || !/\.(js|css|svg|woff2|ico|png|webp|html)$/.test(l)) continue;
    if (!exact.has(l)) { ko(`${h.p} → ${l}  ${lower.has(l.toLowerCase()) ? '(existe mais avec une casse différente : ' + lower.get(l.toLowerCase()) + ')' : '(introuvable)'}`); casses++; }
  }
}
if (!casses) ok('toutes les références existent');

titre('4. DONNÉES');
let recettes = [], etapes = {};
try {
  const ctx = {}; vm.createContext(ctx);
  const lire = f => fs.readFileSync(f, 'utf8');
  vm.runInContext(lire('assets/js/data/recettes.js') + ';this.R=allRecettes', ctx); recettes = ctx.R;
  vm.runInContext(lire('assets/js/data/categories.js') + ';this.C=categories', ctx);
  vm.runInContext(lire('assets/js/data/etapes.js') + ';this.E=recipePreparationSteps', ctx); etapes = ctx.E;
  ok(recettes.length + ' recettes, ' + new Set(recettes.map(r => r.id)).size + ' identifiants uniques');
  const sans = recettes.filter(r => !etapes[r.id] || !etapes[r.id].length).map(r => r.id);
  sans.length ? ko('recettes sans étapes : ' + sans.join(', ')) : ok('chaque recette a ses étapes');
  for (const c of ctx.C.filter(Boolean)) { const n = recettes.filter(r => r.categorie === c.id).length; n !== c.count ? ko(`catégorie ${c.id} : ${c.count} annoncées, ${n} réelles`) : 0; }
  const cats = new Set(ctx.C.filter(Boolean).map(c => c.id)); const inc = recettes.filter(r => !cats.has(r.categorie)); inc.length ? ko('catégorie inconnue : ' + inc.map(r => r.id)) : ok('catégories cohérentes');
} catch (e) { ko('lecture des données impossible : ' + e.message); }

titre('5. IMAGES');
const imgs = files.filter(f => f.p.startsWith('images/') && /\.(webp|jpe?g|png|avif)$/i.test(f.p));
if (!imgs.length) ko('dossier images/ vide ou absent');
const utilises = new Set(); let absentes = 0;
for (const r of recettes) {
  utilises.add(r.image);
  if (exact.has(r.image)) continue;
  absentes++; const alt = lower.get((r.image || '').toLowerCase());
  ko(`#${r.id} ${r.titre} → ${r.image}  ${alt ? '(casse différente : ' + alt + ' → renomme le fichier)' : '(fichier introuvable)'}`);
}
if (imgs.length && !absentes) ok('les ' + recettes.length + ' images de la base existent');
const orph = imgs.filter(f => !utilises.has(f.p)); orph.length ? info('images non utilisées : ' + orph.map(f => f.p).join(', ')) : 0;
const total = imgs.reduce((s, f) => s + f.size, 0), lourdes = imgs.filter(f => f.size > 150 * 1024).sort((a, b) => b.size - a.size);
info('poids total des images : ' + (total / 1048576).toFixed(1) + ' Mo (' + imgs.length + ' fichiers)');
lourdes.length ? (ko(lourdes.length + ' images dépassent 150 Ko — les plus lourdes :'), lourdes.slice(0, 8).forEach(f => console.log('       ' + String(ko_(f.size)).padStart(6) + ' Ko  ' + f.p))) : imgs.length && ok('toutes les images font moins de 150 Ko');

titre('6. POLICES');
const pol = ['fraunces-400', 'fraunces-600', 'fraunces-400-italic', 'fraunces-600-italic', 'bricolage-400', 'bricolage-500', 'bricolage-700'].map(n => `fonts/${n}.woff2`);
const pm = pol.filter(p => !exact.has(p)); pm.length ? pm.forEach(p => ko('MANQUANT  ' + p)) : ok('7 polices présentes');

titre('RÉSULTAT');
console.log(problemes ? `  ✖ ${problemes} point(s) à corriger (voir ci-dessus)\n` : '  ✔ Tout est bon !\n');