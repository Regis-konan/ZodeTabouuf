const KEY = 'recettes_favoris';
const Favoris = {
  list() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } },
  has(id) { return this.list().includes(id); },
  toggle(id) {
    const l = this.list(), i = l.indexOf(id);
    i > -1 ? l.splice(i, 1) : l.push(id);
    try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('favoris:change'));
    return i === -1;
  }
};