'use strict';
const VERSION = '1.4.1';
const STORAGE_KEY = 'jimmy-apphub-v1';
const CONTEXT_KEY = 'jimmy-work-context-v1';
const LINK_MARKERS = ['jimmy-iceland-link-v1', 'jimmy-ak-link-v1', 'jimmy-vabok-added-v1'];
const defaults = [
  { id: 'iceland', name: 'Expeditie IJsland', url: 'https://jimmyvandenboom.github.io/Expeditie-ijsland-2027-/' },
  { id: 'ak', name: 'AK MASTER', url: 'https://jimmyvandenboom.github.io/AK-MASTER-app-/' },
  { id: 'dp', name: 'D&P beoordelen', url: '' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/' },
  { id: 'vabok', name: 'VABOK-project', url: 'https://jimmyvandenboom.github.io/VABOK-project-/' }
];
const ICONS = {
  mountain: 'M3 27 13 8l7 12 5-8 10 15H3Zm6-11 4-8 5 8-5-2-4 2Z',
  globe: 'M19 3a16 16 0 1 0 0 32 16 16 0 0 0 0-32Zm0 0c-10 10-10 22 0 32m0-32c10 10 10 22 0 32M3 19h32M6 10h26M6 28h26',
  check: 'M9 4h20v30H9V4Zm5 0V2h10v5H14V4Zm0 16 4 4 8-9',
  chat: 'M4 5h30v23H15L5 35v-7H4V5Zm7 8h16m-16 7h12',
  code: 'm13 10-9 9 9 9m12-18 9 9-9 9M22 5l-6 28',
  book: 'M19 9C13 3 7 3 3 4v27c6-2 11-1 16 3 5-4 10-5 16-3V4c-4-1-10-1-16 5Zm0 0v25',
  calendar: 'M5 8h28v27H5V8Zm6-5v10m16-10v10M5 16h28M12 23h2m5 0h2m5 0h2M12 29h2m5 0h2',
  tool: 'm8 30 14-14c-2-5 0-11 5-13l-1 8 6 1 4-6c2 7-3 13-9 12L12 34l-4-4Z',
  rocket: 'M14 23C13 13 20 5 34 3c-1 14-9 21-19 20Zm9-13a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM14 14l-8 1-3 9 11-1m10 0-1 9-9 3 1-12M11 27l-6 6m2-7-4 4m9 0-4 5',
  heart: 'M19 33 5 19C-4 10 8-3 19 9 30-3 42 10 33 19L19 33Z',
  star: 'm19 3 5 10 11 2-8 8 2 12-10-6-10 6 2-12-8-8 11-2 5-10Z',
  grip: 'M12 8h1m12 0h1M12 19h1m12 0h1M12 30h1m12 0h1'
};
const ICON_CHOICES = [['mountain','Bergen'],['globe','Wereld'],['check','Check'],['chat','Chat'],['code','Code'],['book','Boek'],['calendar','Rooster'],['tool','Tools'],['rocket','Raket'],['heart','Hart']];
const DEFAULT_ICONS = { iceland: 'mountain', ak: 'globe', dp: 'check', chatgpt: 'chat', github: 'code', vabok: 'book' };
const $ = id => document.getElementById(id);
function safeUrl(value) {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function validImage(value) {
  return typeof value === 'string' && value.length <= 180000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
function normalizeApps(parsed, strict = false) {
  if (!Array.isArray(parsed) || parsed.length > 200 || !parsed.every(app => app &&
      typeof app.id === 'string' && app.id.length > 0 && app.id.length <= 100 &&
      typeof app.name === 'string' && app.name.trim() && app.name.length <= 80 && typeof app.url === 'string' && app.url.length <= 2048) ||
      new Set(parsed.map(app => app.id)).size !== parsed.length) throw new Error('Ongeldige apps');
  return parsed.map(app => {
    if (strict && ((app.url && !safeUrl(app.url)) || (app.image && !validImage(app.image)) ||
        (app.icon && app.icon !== 'auto' && !Object.hasOwn(ICONS, app.icon)) ||
        (app.favorite !== undefined && typeof app.favorite !== 'boolean'))) throw new Error('Ongeldige appgegevens');
    return { id: app.id, name: app.name.trim(), url: safeUrl(app.url), favorite: app.favorite === true,
      icon: Object.hasOwn(ICONS, app.icon) ? app.icon : 'auto', image: validImage(app.image) ? app.image : '' };
  });
}
let apps = normalizeApps(defaults);
let workContext = '';
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) apps = normalizeApps(JSON.parse(stored));
  for (const [index, id] of ['iceland', 'ak'].entries()) {
    const marker = LINK_MARKERS[index];
    if (localStorage.getItem(marker) === 'done') continue;
    const app = apps.find(app => app.id === id);
    if (app && !app.url) { app.url = defaults.find(app => app.id === id).url; localStorage.setItem(STORAGE_KEY, JSON.stringify(apps)); }
    localStorage.setItem(marker, 'done');
  }
  // Add the new project once, without replacing custom apps or resurrecting deletions.
  if (localStorage.getItem(LINK_MARKERS[2]) !== 'done') {
    const project = defaults.find(app => app.id === 'vabok');
    const exists = apps.some(app => app.id === project.id || app.url === project.url);
    if (!exists && apps.length < 200) {
      apps = [...apps, ...normalizeApps([project])];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    }
    if (exists || apps.some(app => app.id === project.id)) localStorage.setItem(LINK_MARKERS[2], 'done');
  }
  workContext = (localStorage.getItem(CONTEXT_KEY) || '').slice(0, 10000);
} catch { $('status').textContent = 'Je opgeslagen apps konden niet worden geladen. De standaardapps worden getoond.'; }
function persist(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); apps = next; render(); $('status').textContent = 'Opgeslagen op dit apparaat.'; return true; }
  catch { $('status').textContent = 'Opslaan lukt niet. Controleer of je browser lokale opslag toestaat en voldoende ruimte heeft.'; return false; }
}
function element(tag, className, text = '') { const node = document.createElement(tag); node.className = className; node.textContent = text; return node; }
function graphic(kind) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 38 38', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(key, value);
  const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', ICONS[kind]); svg.append(path); return svg;
}
let reordering = false;
function visibleApps() { return [...apps.filter(app => app.favorite), ...apps.filter(app => !app.favorite)]; }
function render() {
  $('apps').replaceChildren();
  if (!apps.length) $('apps').append(element('p', 'empty', 'Nog geen apps. Voeg je eerste app toe met de knop hierboven.'));
  for (const app of visibleApps()) {
    const card = element('article', `card${app.favorite ? ' is-favorite' : ''}`); card.dataset.id = app.id;
    const head = element('div', 'card-head');
    const icon = element('div', 'app-icon'); icon.setAttribute('aria-hidden', 'true');
    if (app.image) { const img = document.createElement('img'); img.src = app.image; img.alt = ''; icon.append(img); }
    else if (app.icon !== 'auto' || DEFAULT_ICONS[app.id]) icon.append(graphic(app.icon === 'auto' ? DEFAULT_ICONS[app.id] : app.icon));
    else icon.textContent = app.name.split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();
    const tools = element('div', 'card-tools');
    const favorite = element('button', 'favorite'); favorite.append(graphic('star'));
    favorite.setAttribute('aria-label', `${app.name} favoriet`); favorite.setAttribute('aria-pressed', String(app.favorite));
    favorite.addEventListener('click', () => {
      if (persist(apps.map(old => old.id === app.id ? { ...old, favorite: !old.favorite } : old))) {
        const moved = [...$('apps').children].find(node => node.dataset.id === app.id); moved.querySelector('.favorite').focus();
      }
    });
    const remove = element('button', 'remove', '×'); remove.setAttribute('aria-label', `${app.name} verwijderen`); remove.addEventListener('click', () => askRemove(app));
    tools.append(favorite, remove); head.append(icon, tools);
    const actions = element('div', 'card-actions');
    let open;
    if (app.url) { open = element('a', 'open', 'Openen'); open.href = app.url; open.target = '_blank'; open.rel = 'noopener noreferrer'; open.setAttribute('aria-label', `${app.name} openen`); }
    else { open = element('button', 'primary', 'Link instellen'); open.addEventListener('click', () => editApp(app)); }
    const edit = element('button', 'edit', 'Link wijzigen'); edit.setAttribute('aria-label', `Link voor ${app.name} wijzigen`); edit.addEventListener('click', () => editApp(app));
    actions.append(open, edit);
    card.append(head, element('h2', '', app.name), element('p', 'link-label', app.url ? new URL(app.url).hostname : 'Link instellen'), actions);
    if (reordering) {
      const controls = element('div', 'reorder-controls');
      const handle = element('button', 'reorder-handle'); handle.append(graphic('grip')); handle.setAttribute('aria-label', `${app.name} verslepen`);
      handle.addEventListener('pointerdown', event => startDrag(event, app, card));
      const arrows = element('div', 'reorder-arrows');
      const group = visibleApps().filter(other => other.favorite === app.favorite); const index = group.findIndex(other => other.id === app.id);
      for (const [delta, label, text] of [[-1, 'eerder', '↑'], [1, 'later', '↓']]) {
        const button = element('button', '', text); button.setAttribute('aria-label', `${app.name} ${label}`);
        button.disabled = !group[index + delta]; button.addEventListener('click', () => moveApp(app.id, group[index + delta].id, delta < 0)); arrows.append(button);
      }
      controls.append(handle, arrows); card.append(controls);
    }
    $('apps').append(card);
  }
}
function moveApp(id, targetId, before) {
  const source = apps.find(app => app.id === id); const target = apps.find(app => app.id === targetId);
  if (!source || !target || id === targetId) return;
  if (source.favorite !== target.favorite) { $('status').textContent = 'Favorieten blijven bovenaan. Verplaats de tegel binnen dezelfde groep.'; return; }
  const next = apps.filter(app => app.id !== id); const index = next.findIndex(app => app.id === targetId);
  next.splice(index + (before ? 0 : 1), 0, source);
  if (persist(next)) {
    const moved = [...$('apps').children].find(node => node.dataset.id === id); moved?.querySelector('.reorder-handle')?.focus();
    $('status').textContent = `Volgorde opgeslagen. ${source.name} is verplaatst.`;
  }
}
function startDrag(event, app, card) {
  if (!event.isPrimary || event.button !== 0) return;
  const handle = event.currentTarget; handle.setPointerCapture(event.pointerId);
  const startX = event.clientX; const startY = event.clientY; let target = null; let before = false; let moved = false;
  const clear = () => document.querySelectorAll('.drop-target').forEach(node => node.classList.remove('drop-target'));
  function move(e) {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) < 8 && !moved) return;
    moved = true; card.classList.add('dragging'); clear();
    const candidate = document.elementFromPoint(e.clientX, e.clientY)?.closest('.card');
    target = candidate && candidate !== card ? candidate : null;
    if (target) { target.classList.add('drop-target'); const rect = target.getBoundingClientRect(); before = e.clientY < rect.top + rect.height / 2; }
    if (e.clientY < 70) window.scrollBy(0, -16); else if (e.clientY > innerHeight - 70) window.scrollBy(0, 16);
  }
  function finish(e) {
    handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', finish); handle.removeEventListener('pointercancel', finish);
    card.classList.remove('dragging'); clear();
    if (e.type === 'pointerup' && moved && target) moveApp(app.id, target.dataset.id, before);
  }
  handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', finish); handle.addEventListener('pointercancel', finish);
}
$('reorder-apps').addEventListener('click', () => { reordering = !reordering; $('reorder-apps').setAttribute('aria-pressed', String(reordering)); $('reorder-apps').textContent = reordering ? 'Volgorde klaar' : 'Volgorde wijzigen'; $('reorder-help').hidden = !reordering; render(); });
let editingId = null; let editingImage = ''; let imageBusy = false; let imageRequest = 0;
function showImage() {
  $('image-controls').hidden = !editingImage;
  if (editingImage) $('icon-preview').src = editingImage; else $('icon-preview').removeAttribute('src');
  for (const button of $('icon-options').children) button.setAttribute('aria-pressed', String(!editingImage && button.dataset.icon === $('app-icon').value));
}
for (const [kind, label] of ICON_CHOICES) {
  const button = element('button', 'icon-option'); button.type = 'button'; button.dataset.icon = kind;
  button.append(graphic(kind), element('span', '', label)); button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => { imageRequest++; imageBusy = false; editingImage = ''; $('icon-file').value = ''; $('app-icon').value = kind; showImage(); });
  $('icon-options').append(button);
}
function editApp(app = null) {
  editingId = app?.id ?? null; editingImage = app?.image ?? ''; imageRequest++; imageBusy = false;
  $('editor-title').textContent = app ? 'App wijzigen' : 'App toevoegen'; $('app-name').value = app?.name ?? ''; $('app-url').value = app?.url ?? '';
  $('app-icon').value = app?.icon && app.icon !== 'auto' ? app.icon : (DEFAULT_ICONS[app?.id] || 'tool'); $('icon-file').value = ''; $('form-error').textContent = ''; showImage(); $('editor').showModal(); $(app ? 'app-url' : 'app-name').focus();
}
$('add-app').addEventListener('click', () => editApp());
$('cancel-editor').addEventListener('click', () => $('editor').close());
$('clear-icon').addEventListener('click', () => { imageRequest++; imageBusy = false; editingImage = ''; $('icon-file').value = ''; showImage(); });
$('icon-file').addEventListener('change', async () => {
  const file = $('icon-file').files[0]; if (!file) return;
  const request = ++imageRequest; imageBusy = true; $('form-error').textContent = '';
  let objectUrl;
  try {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error('Kies een PNG, JPG of WebP van maximaal 2 MB.');
    objectUrl = URL.createObjectURL(file); const img = new Image(); img.src = objectUrl; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const size = Math.min(img.naturalWidth, img.naturalHeight); canvas.getContext('2d').drawImage(img, (img.naturalWidth - size) / 2, (img.naturalHeight - size) / 2, size, size, 0, 0, 128, 128);
    const image = canvas.toDataURL('image/png'); if (!validImage(image)) throw new Error('Deze afbeelding is te groot om op te slaan.');
    if (request === imageRequest) { editingImage = image; showImage(); }
  } catch (error) { if (request === imageRequest) $('form-error').textContent = error.message || 'De afbeelding kon niet worden gelezen.'; }
  finally { if (objectUrl) URL.revokeObjectURL(objectUrl); if (request === imageRequest) imageBusy = false; }
});
$('app-form').addEventListener('submit', event => {
  event.preventDefault(); const name = $('app-name').value.trim(); const inputUrl = $('app-url').value.trim(); const url = safeUrl(inputUrl);
  if (imageBusy) { $('form-error').textContent = 'De afbeelding wordt nog verwerkt. Probeer zo opnieuw.'; return; }
  if (!name || (inputUrl && !url)) { $('form-error').textContent = !name ? 'Vul een naam in.' : 'Gebruik een geldige http- of https-link.'; return; }
  if (!editingId && apps.length >= 200) { $('form-error').textContent = 'Je kunt maximaal 200 apps bewaren.'; return; }
  const old = apps.find(app => app.id === editingId);
  const app = { id: editingId ?? crypto.randomUUID(), favorite: old?.favorite ?? false, name, url, icon: $('app-icon').value, image: editingImage };
  const next = editingId ? apps.map(old => old.id === editingId ? app : old) : [...apps, app];
  if (persist(next)) $('editor').close(); else $('form-error').textContent = 'De wijziging kon niet worden opgeslagen. Probeer opnieuw.';
});
let removingId = null;
function askRemove(app) { removingId = app.id; $('remove-message').textContent = `Wil je ${app.name} uit je apphub verwijderen? De app zelf blijft bestaan.`; $('remover').showModal(); $('cancel-remove').focus(); }
$('cancel-remove').addEventListener('click', () => $('remover').close());
$('confirm-remove').addEventListener('click', () => { if (persist(apps.filter(app => app.id !== removingId))) $('remover').close(); });
$('export-backup').addEventListener('click', () => {
  const backup = { format: 'jimmy-apphub', schemaVersion: 1, exportedAt: new Date().toISOString(), apps, workContext };
  const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = objectUrl; link.download = 'jimmy-apphub-backup.json'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000); $('status').textContent = 'Back-up gedownload. Bewaar dit bestand veilig; het bevat je links en werkcontext.';
});
let pendingBackup = null;
$('import-backup').addEventListener('click', () => $('backup-file').click());
$('backup-file').addEventListener('change', async () => {
  const file = $('backup-file').files[0]; $('backup-file').value = ''; if (!file) return; pendingBackup = null; $('status').textContent = 'Back-up lezen…';
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Dit bestand is te groot (maximaal 5 MB).');
    const backup = JSON.parse(await file.text());
    if (backup.format !== 'jimmy-apphub' || backup.schemaVersion !== 1 || (backup.workContext !== undefined && (typeof backup.workContext !== 'string' || backup.workContext.length > 10000))) throw new Error('Dit is geen ondersteunde apphub-back-up.');
    pendingBackup = { apps: normalizeApps(backup.apps, true), workContext: backup.workContext || '' };
    $('restore-error').textContent = '';
    $('restore-message').textContent = `Deze back-up bevat ${pendingBackup.apps.length} apps, inclusief favorieten, iconen en volgorde.`; $('restore-dialog').showModal(); $('cancel-restore').focus();
  } catch (error) { $('status').textContent = `Herstellen lukt niet: ${error.message || 'ongeldig bestand'}`; }
});
$('cancel-restore').addEventListener('click', () => { pendingBackup = null; $('restore-dialog').close(); });
$('confirm-restore').addEventListener('click', () => {
  if (!pendingBackup) return;
  const keys = [STORAGE_KEY, CONTEXT_KEY, ...LINK_MARKERS]; const previous = new Map();
  try {
    for (const key of keys) previous.set(key, localStorage.getItem(key));
    localStorage.setItem(CONTEXT_KEY, pendingBackup.workContext);
    for (const marker of LINK_MARKERS) localStorage.setItem(marker, 'done');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingBackup.apps));
    apps = pendingBackup.apps; workContext = pendingBackup.workContext; pendingBackup = null; render(); $('restore-dialog').close(); $('status').textContent = 'Back-up hersteld op dit apparaat.';
  } catch {
    try { for (const [key, value] of previous) { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } } catch { /* Storage may be unavailable entirely. */ }
    $('restore-error').textContent = 'De back-up kon niet worden opgeslagen. Je getoonde apps zijn behouden.';
  }
});
$('open-assistant').addEventListener('click', () => { $('work-context').value = workContext; $('assistant-status').textContent = ''; $('assistant-dialog').showModal(); $('assistant-question').focus(); });
$('close-assistant').addEventListener('click', () => $('assistant-dialog').close());
$('save-work-context').addEventListener('click', () => {
  try { localStorage.setItem(CONTEXT_KEY, $('work-context').value.trim()); workContext = $('work-context').value.trim(); $('assistant-status').textContent = 'Werkcontext bewaard op dit apparaat.'; }
  catch { $('assistant-status').textContent = 'Werkcontext kon niet worden opgeslagen. Je kunt je vraag wel in ChatGPT openen.'; }
});
function assistantPrompt() {
  const question = $('assistant-question').value.trim();
  const context = $('work-context').value.trim();
  return `Je bent de werkassistent van Jimmy. Help met lessen, tools en projecten. Baseer je op de onderstaande context en vraag om verduidelijking als informatie ontbreekt.\n\nWerkcontext:\n${context || 'Nog geen aanvullende werkcontext ingevuld.'}\n\nMijn apps:\n${apps.slice(0, 30).map(app => app.name).join('\n')}\n\nMijn vraag:\n${question}`;
}
$('copy-assistant').addEventListener('click', async () => {
  if (!$('assistant-question').value.trim()) { $('assistant-status').textContent = 'Schrijf eerst je vraag.'; return; }
  try { await navigator.clipboard.writeText(assistantPrompt()); $('assistant-status').textContent = 'Vraag en context gekopieerd. Plak ze in ChatGPT.'; }
  catch { $('assistant-status').textContent = 'Kopiëren lukt niet. Selecteer je vraag en context en kopieer ze handmatig.'; }
});
$('assistant-form').addEventListener('submit', event => {
  event.preventDefault(); if (!$('assistant-question').value.trim()) return;
  const url = new URL('https://chatgpt.com/'); url.searchParams.set('q', assistantPrompt());
  if (url.href.length > 12000) { $('assistant-status').textContent = 'Deze vraag met context is te lang voor een link. Gebruik Vraag kopiëren en plak de tekst in ChatGPT.'; return; }
  const link = document.createElement('a'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; document.body.append(link); link.click(); link.remove();
  $('assistant-status').textContent = 'Je vraag en werkcontext zijn in ChatGPT geopend. Voer het gesprek daar verder.';
});
let installPrompt;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('install-app').hidden = false; });
$('install-app').addEventListener('click', async () => { if (!installPrompt) return; await installPrompt.prompt(); installPrompt = null; $('install-app').hidden = true; });
window.addEventListener('appinstalled', () => { $('install-app').hidden = true; $('install-help').textContent = 'Je apphub staat op je beginscherm.'; });
$('app-version').textContent = `Versie ${VERSION}`;
let updateAvailable = false;
let registrationPromise = Promise.resolve(null);
function showUpdate() { updateAvailable = true; $('check-update').textContent = 'Vernieuwen'; $('update-status').textContent = 'Een nieuwe versie is beschikbaar. Tik op Vernieuwen om die te openen.'; }
function watchRegistration(registration) {
  if (!registration) return;
  registration.addEventListener('updatefound', () => {
    const hadController = !!navigator.serviceWorker.controller;
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => { if (worker.state === 'activated' && hadController) showUpdate(); });
  });
}
$('check-update').addEventListener('click', async () => {
  if (updateAvailable) { location.reload(); return; }
  if (!navigator.onLine) { $('update-status').textContent = 'Verbind met internet om op updates te controleren.'; return; }
  $('check-update').disabled = true; $('update-status').textContent = 'Controleren op updates…';
  try {
    const registration = await registrationPromise;
    if (!registration) throw new Error('Geen service worker');
    await registration.update();
    if (!updateAvailable) $('update-status').textContent = registration.installing ? 'Een nieuwe versie wordt gedownload. De knop verandert zodra die klaar is.' : `Geen nieuwe versie gevonden. Je gebruikt versie ${VERSION}.`;
  } catch { $('update-status').textContent = 'Updates controleren lukt nu niet. Probeer opnieuw met internet.'; }
  finally { $('check-update').disabled = false; }
});
render();
if ('serviceWorker' in navigator) {
  const wasControlled = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (wasControlled) showUpdate(); });
  registrationPromise = navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(registration => { watchRegistration(registration); return registration; }).catch(() => {
    $('update-status').textContent = 'Offlinegebruik is nu niet beschikbaar. De apphub blijft online bruikbaar.'; return null;
  });
}
