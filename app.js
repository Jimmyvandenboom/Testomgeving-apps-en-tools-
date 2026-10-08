'use strict';
const STORAGE_KEY = 'jimmy-apphub-v1';
const defaults = [
  { id: 'iceland', name: 'Expeditie IJsland', url: 'https://jimmyvandenboom.github.io/Expeditie-ijsland-2027-/' },
  { id: 'ak', name: 'AK MASTER', url: 'https://jimmyvandenboom.github.io/AK-MASTER-app-/' },
  { id: 'dp', name: 'D&P beoordelen', url: '' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/' }
];
const $ = (id) => document.getElementById(id);
function safeUrl(value) {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
let apps = defaults.map(app => ({ ...app }));
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(app => app && typeof app.id === 'string' && typeof app.name === 'string' && app.name.trim() && typeof app.url === 'string') || new Set(parsed.map(app => app.id)).size !== parsed.length) throw new Error('Invalid saved apps');
    apps = parsed.map(app => ({ id: app.id, name: app.name.slice(0, 80), url: safeUrl(app.url) }));
  }
  // Fill old empty defaults once; preserve custom links and removed tiles.
  for (const [id, marker] of [
    ['iceland', 'jimmy-iceland-link-v1'],
    ['ak', 'jimmy-ak-link-v1']
  ]) {
    if (localStorage.getItem(marker) === 'done') continue;
    const app = apps.find(app => app.id === id);
    if (app && !app.url) {
      app.url = defaults.find(app => app.id === id).url;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    }
    localStorage.setItem(marker, 'done');
  }
} catch { $('status').textContent = 'Je opgeslagen apps konden niet worden geladen. De standaardapps worden getoond.'; }
function persist(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); apps = next; render(); $('status').textContent = 'Opgeslagen op dit apparaat.'; return true; }
  catch { $('status').textContent = 'Opslaan lukt niet. Controleer of je browser lokale opslag toestaat en voldoende ruimte heeft.'; return false; }
}
function element(tag, className, text) { const node = document.createElement(tag); node.className = className; node.textContent = text; return node; }
function render() {
  $('apps').replaceChildren();
  if (!apps.length) $('apps').append(element('p', 'empty', 'Nog geen apps. Voeg je eerste app toe met de knop hierboven.'));
  for (const app of apps) {
    const card = element('article', 'card', '');
    const head = element('div', 'card-head', '');
    const icon = element('div', 'app-icon', app.name.split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase());
    icon.setAttribute('aria-hidden', 'true');
    const remove = element('button', 'remove', '×');
    remove.setAttribute('aria-label', `${app.name} verwijderen`);
    remove.addEventListener('click', () => askRemove(app));
    head.append(icon, remove);
    const actions = element('div', 'card-actions', '');
    let open;
    if (app.url) { open = element('a', 'open', 'Openen'); open.href = app.url; open.target = '_blank'; open.rel = 'noopener noreferrer'; open.setAttribute('aria-label', `${app.name} openen`); }
    else { open = element('button', 'primary', 'Link instellen'); open.addEventListener('click', () => editApp(app)); }
    const edit = element('button', 'edit', 'Link wijzigen');
    edit.setAttribute('aria-label', `Link voor ${app.name} wijzigen`);
    edit.addEventListener('click', () => editApp(app));
    actions.append(open, edit);
    card.append(head, element('h2', '', app.name), element('p', 'link-label', app.url ? new URL(app.url).hostname : 'Link instellen'), actions);
    $('apps').append(card);
  }
}
let editingId = null;
function editApp(app = null) {
  editingId = app?.id ?? null;
  $('editor-title').textContent = app ? 'App wijzigen' : 'App toevoegen';
  $('app-name').value = app?.name ?? '';
  $('app-url').value = app?.url ?? '';
  $('form-error').textContent = '';
  $('editor').showModal();
  $(app ? 'app-url' : 'app-name').focus();
}
$('add-app').addEventListener('click', () => editApp());
$('cancel-editor').addEventListener('click', () => $('editor').close());
$('app-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('app-name').value.trim();
  const inputUrl = $('app-url').value.trim();
  const url = safeUrl(inputUrl);
  if (!name || (inputUrl && !url)) { $('form-error').textContent = !name ? 'Vul een naam in.' : 'Gebruik een geldige http- of https-link.'; return; }
  const app = { id: editingId ?? crypto.randomUUID(), name, url };
  const next = editingId ? apps.map(old => old.id === editingId ? app : old) : [...apps, app];
  if (persist(next)) $('editor').close();
  else $('form-error').textContent = 'De wijziging kon niet worden opgeslagen. Probeer opnieuw.';
});
let removingId = null;
function askRemove(app) { removingId = app.id; $('remove-message').textContent = `Wil je ${app.name} uit je apphub verwijderen? De app zelf blijft bestaan.`; $('remover').showModal(); $('cancel-remove').focus(); }
$('cancel-remove').addEventListener('click', () => $('remover').close());
$('confirm-remove').addEventListener('click', () => { if (persist(apps.filter(app => app.id !== removingId))) $('remover').close(); });
let installPrompt;
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; $('install-app').hidden = false; });
$('install-app').addEventListener('click', async () => { if (!installPrompt) return; await installPrompt.prompt(); installPrompt = null; $('install-app').hidden = true; });
window.addEventListener('appinstalled', () => { $('install-app').hidden = true; $('install-help').textContent = 'Je apphub staat op je beginscherm.'; });
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => { $('status').textContent = 'Offlinegebruik is nu niet beschikbaar. De apphub blijft online bruikbaar.'; });
