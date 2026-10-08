// Run with: node tests/smoke.cjs (requires Playwright and Chromium).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml' };
(async () => {
  let legacyDeployment = false;
  const server = http.createServer(async (req,res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const relative = pathname.replace(/^\/hub\//,'');
      const filename = path.resolve(root,relative || 'index.html');
      if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      let contents = await fs.readFile(filename);
      if (legacyDeployment && relative === 'sw.js') contents = Buffer.from(`
        const CACHE='jimmy-apphub-legacy-test';
        self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./app.js','./style.css']))));
        self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
        self.addEventListener('fetch',e=>{if(new URL(e.request.url).origin===self.location.origin)e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});
      `);
      if (legacyDeployment && relative === 'app.js') contents = Buffer.concat([Buffer.from('window.__legacyApp = true;\n'),contents]);
      res.writeHead(200,{'Content-Type':types[path.extname(filename)] || 'application/octet-stream'}).end(contents);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url = `http://127.0.0.1:${server.address().port}/hub/`;
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page = await context.newPage();
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url);
    assert.equal(await page.locator('.card').count(),6);
    assert.equal(await page.locator('.card').filter({hasText:'ChatGPT'}).locator('a').getAttribute('href'),'https://chatgpt.com/');
    assert.equal(await page.getByRole('link',{name:'GitHub openen',exact:true}).getAttribute('href'),'https://github.com/');
    assert.equal(await page.getByRole('button',{name:'Link instellen',exact:true}).count(),1);
    assert.equal(await page.getByRole('link',{name:'AK MASTER openen',exact:true}).getAttribute('href'),'https://jimmyvandenboom.github.io/AK-MASTER-app-/');
    assert.equal(await page.getByRole('link',{name:'VABOK-project openen',exact:true}).getAttribute('href'),'https://jimmyvandenboom.github.io/VABOK-project-/');
    const iceland = page.locator('.card').filter({hasText:'Expeditie IJsland'});
    assert.equal(await iceland.locator('a').getAttribute('href'),'https://jimmyvandenboom.github.io/Expeditie-ijsland-2027-/');
    await iceland.getByRole('button',{name:/Link voor/}).click();
    await page.locator('#app-url').fill('https://example.com/iceland');
    await page.getByRole('button',{name:'Opslaan',exact:true}).click();
    assert.equal(await iceland.locator('a').getAttribute('href'),'https://example.com/iceland');
    await page.reload();
    assert.equal(await iceland.locator('a').getAttribute('href'),'https://example.com/iceland');
    await page.getByRole('button',{name:'App toevoegen'}).click();
    await page.locator('#app-name').fill('<img src=x onerror=alert(1)>');
    await page.locator('#app-url').fill('javascript:alert(1)');
    await page.getByRole('button',{name:'Opslaan',exact:true}).click();
    assert.equal(await page.locator('.card').count(),6);
    await page.locator('#app-url').fill('');
    await page.getByRole('button',{name:'Opslaan',exact:true}).click();
    assert.equal(await page.locator('.card').count(),7);
    assert.equal(await page.locator('.card img').count(),0);
    const added = page.locator('.card').last();
    await added.getByRole('button',{name:/verwijderen/}).click();
    await page.getByRole('button',{name:'Annuleren',exact:true}).last().click();
    assert.equal(await page.locator('.card').count(),7);
    await added.getByRole('button',{name:/verwijderen/}).click();
    await page.getByRole('button',{name:'Verwijderen',exact:true}).click();
    assert.equal(await page.locator('.card').count(),6);
    await iceland.getByRole('button',{name:/Link voor/}).click();
    await page.locator('#app-url').fill('');
    await page.getByRole('button',{name:'Opslaan',exact:true}).click();
    assert.equal(await iceland.locator('a').count(),0);
    await page.reload();
    assert.equal(await iceland.locator('a').count(),0); // Intentional clearing survives reload.
    for (const width of [320,390,768,1280]) {
      await page.setViewportSize({width,height:844});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
      assert(await page.locator('.card button').evaluateAll(buttons=>buttons.every(button=>button.getBoundingClientRect().height>=48)));
    }
    const manifest = await (await page.request.get(url+'manifest.webmanifest')).json();
    assert.equal(manifest.display,'standalone');
    for (const icon of manifest.icons) {
      const response=await page.request.get(url+icon.src); assert(response.ok());
      const png=await response.body(); const size=Number(icon.sizes.split('x')[0]);
      assert.equal(png.readUInt32BE(16),size); assert.equal(png.readUInt32BE(20),size);
    }
    await page.evaluate(async()=>{ await navigator.serviceWorker.ready; });
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();
    assert.equal(await page.locator('.card').count(),6);
    await page.getByRole('button',{name:'App toevoegen'}).click();
    await page.locator('#app-name').fill('Offline app');
    await page.getByRole('button',{name:'Opslaan',exact:true}).click();
    await page.reload();
    assert.equal(await page.locator('.card').count(),7);
    await context.setOffline(false);
    // AK migration fills old blanks, preserves custom links/deletions, and only runs once.
    for (const [saved, expected] of [
      [[{id:'ak',name:'Mijn AK',url:''}], 'https://jimmyvandenboom.github.io/AK-MASTER-app-/'],
      [[{id:'ak',name:'Mijn AK',url:'https://example.com/ak'}], 'https://example.com/ak'],
      [[], null]
    ]) {
      await page.evaluate(apps => {
        localStorage.removeItem('jimmy-ak-link-v1');
        localStorage.setItem('jimmy-apphub-v1',JSON.stringify(apps));
      },saved);
      await page.reload();
      assert.equal(await page.locator('.card').count(),saved.length);
      if (expected) assert.equal(await page.locator('.card a').getAttribute('href'),expected);
    }
    await page.evaluate(()=>{
      localStorage.setItem('jimmy-apphub-v1',JSON.stringify([{id:'ak',name:'AK',url:''}]));
    });
    await page.reload();
    assert.equal(await page.locator('.card a').count(),0);
    // Upgrade an existing user's empty tile without replacing their other tiles.
    await page.evaluate(() => {
      localStorage.removeItem('jimmy-iceland-link-v1');
      localStorage.setItem('jimmy-apphub-v1', JSON.stringify([
        {id:'iceland',name:'Mijn IJsland',url:''},
        {id:'custom',name:'Mijn tool',url:'https://example.com/tool'}
      ]));
    });
    await page.reload();
    assert.equal(await page.locator('.card').count(),2);
    assert.equal(await page.locator('.card').first().locator('a').getAttribute('href'),'https://jimmyvandenboom.github.io/Expeditie-ijsland-2027-/');
    assert.equal(await page.locator('.card').first().locator('h2').textContent(),'Mijn IJsland');
    for (const storedApps of [
      [{id:'iceland',name:'Custom IJsland',url:'https://example.com/custom'}],
      []
    ]) {
      await page.evaluate(apps => {
        localStorage.removeItem('jimmy-iceland-link-v1');
        localStorage.setItem('jimmy-apphub-v1',JSON.stringify(apps));
      },storedApps);
      await page.reload();
      assert.equal(await page.locator('.card').count(),storedApps.length);
      if (storedApps.length) assert.equal(await page.locator('.card a').getAttribute('href'),storedApps[0].url);
    }
    // A new release adds VABOK once while preserving the user's custom settings.
    for (const [saved, expectedCount] of [
      [[{id:'custom',name:'Mijn tool',url:'https://example.com/tool',favorite:true,icon:'tool'}],2],
      [[{id:'own-project',name:'Mijn VABOK',url:'https://jimmyvandenboom.github.io/VABOK-project-/'}],1]
    ]) {
      await page.evaluate(apps => {
        localStorage.removeItem('jimmy-vabok-added-v1');
        localStorage.setItem('jimmy-apphub-v1',JSON.stringify(apps));
      },saved);
      await page.reload();
      assert.equal(await page.locator('.card').count(),expectedCount);
      assert.equal(await page.locator('.card h2').first().textContent(),saved[0].name);
      await page.reload();
      assert.equal(await page.locator('.card').count(),expectedCount);
    }
    await page.evaluate(()=>localStorage.setItem('jimmy-apphub-v1','[]'));
    await page.reload();
    assert.equal(await page.locator('.card').count(),0); // Deleted tiles stay deleted.
    await page.evaluate(()=>localStorage.setItem('jimmy-apphub-v1','broken json'));
    await page.reload();
    assert.equal(await page.locator('.card').count(),6);
    assert.match(await page.locator('#status').textContent(),/niet worden geladen/);
    await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Denied','SecurityError')};});
    await page.getByRole('button',{name:'App toevoegen'}).click();
    await page.locator('#app-name').fill('Cannot save');
    await page.getByRole('button',{name:'Opslaan',exact:true}).click();
    assert.equal(await page.locator('.card').count(),6);
    assert.match(await page.locator('#form-error').textContent(),/niet worden opgeslagen/);
    await page.getByRole('button',{name:'Annuleren',exact:true}).first().click();
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'/tmp/jimmy-apphub-mobile.png',fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('PASS: default apps, working link targets, edit/add/remove/cancel, persistence, empty links, unsafe URL rejection, safe text, responsive layouts, touch targets, manifest/icons, subpath hosting, offline reload/edit, corrupt/blocked storage, no browser errors.');
    await context.close();
    const featureContext = await browser.newContext({viewport:{width:1280,height:1200},acceptDownloads:true,hasTouch:true});
    const featurePage = await featureContext.newPage();
    const featureErrors = []; featurePage.on('pageerror',error=>featureErrors.push(error.message));
    await featurePage.goto(url);
    await featurePage.evaluate(()=>navigator.serviceWorker.ready);
    await featurePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
    const names = () => featurePage.locator('.card h2').allTextContents();
    await featurePage.getByRole('button',{name:'GitHub favoriet',exact:true}).click();
    assert.equal((await names())[0],'GitHub');
    await featurePage.reload();
    assert.equal((await names())[0],'GitHub');
    await featurePage.getByRole('button',{name:'Volgorde wijzigen',exact:true}).click();
    await featurePage.getByRole('button',{name:'AK MASTER eerder',exact:true}).click();
    assert.deepEqual(await names(),['GitHub','AK MASTER','Expeditie IJsland','D&P beoordelen','ChatGPT','VABOK-project']);
    const handle = await featurePage.getByRole('button',{name:'Expeditie IJsland verslepen',exact:true}).boundingBox();
    const target = await featurePage.locator('.card').filter({has:featurePage.getByRole('heading',{name:'ChatGPT',exact:true})}).boundingBox();
    await featurePage.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);
    await featurePage.mouse.down();
    await featurePage.mouse.move(target.x+target.width/2,target.y+target.height*.7,{steps:15});
    await featurePage.mouse.up();
    assert.deepEqual(await names(),['GitHub','AK MASTER','D&P beoordelen','ChatGPT','Expeditie IJsland','VABOK-project']);
    await featurePage.reload();
    assert.deepEqual(await names(),['GitHub','AK MASTER','D&P beoordelen','ChatGPT','Expeditie IJsland','VABOK-project']);
    await featurePage.getByRole('button',{name:'Link voor AK MASTER wijzigen',exact:true}).click();
    await featurePage.locator('#app-icon').selectOption('book');
    await featurePage.getByRole('button',{name:'Opslaan',exact:true}).click();
    assert.equal(await featurePage.evaluate(()=>JSON.parse(localStorage.getItem('jimmy-apphub-v1')).find(app=>app.id==='ak').icon),'book');
    await featurePage.getByRole('button',{name:'Link voor GitHub wijzigen',exact:true}).click();
    await featurePage.locator('#icon-file').setInputFiles(path.join(root,'icons/icon-192.png'));
    await featurePage.locator('#image-controls').waitFor({state:'visible'});
    await featurePage.getByRole('button',{name:'Opslaan',exact:true}).click();
    assert.equal(await featurePage.locator('.card').first().locator('img').count(),1);
    await featurePage.reload();
    assert.equal(await featurePage.locator('.card').first().locator('img').count(),1);
    assert.equal(await featurePage.getByRole('button',{name:'GitHub favoriet',exact:true}).getAttribute('aria-pressed'),'true');
    await featurePage.getByRole('button',{name:'Werkassistent',exact:true}).click();
    await featurePage.locator('#work-context').fill('Jimmy geeft aardrijkskunde. Project: Expeditie IJsland.');
    await featurePage.getByRole('button',{name:'Werkcontext bewaren',exact:true}).click();
    assert.match(await featurePage.locator('#assistant-status').textContent(),/bewaard/);
    await featurePage.locator('#assistant-question').fill('Help mij een les over vulkanen voorbereiden.');
    await featureContext.route('https://chatgpt.com/**', route=>route.fulfill({status:200,body:'ChatGPT test destination'}));
    const popupPromise = featureContext.waitForEvent('page');
    await featurePage.getByRole('button',{name:'Bespreek in ChatGPT',exact:true}).click();
    const popup = await popupPromise; await popup.waitForLoadState();
    const prompt = new URL(popup.url()).searchParams.get('q');
    assert.match(prompt,/Jimmy geeft aardrijkskunde/); assert.match(prompt,/vulkanen/); assert.match(prompt,/AK MASTER/);
    assert.equal(await popup.evaluate(()=>window.opener),null);
    await popup.close();
    await featurePage.getByRole('button',{name:'Sluiten',exact:true}).click();
    const downloadPromise = featurePage.waitForEvent('download');
    await featurePage.getByRole('button',{name:'Back-up downloaden',exact:true}).click();
    const download = await downloadPromise;
    const backup = JSON.parse(await fs.readFile(await download.path(),'utf8'));
    assert.equal(backup.format,'jimmy-apphub'); assert.equal(backup.apps.length,6);
    assert.equal(backup.apps.find(app=>app.id==='github').favorite,true);
    assert.match(backup.apps.find(app=>app.id==='github').image,/^data:image\/png/);
    assert.match(backup.workContext,/aardrijkskunde/);
    const exported = JSON.stringify(backup);
    await featurePage.locator('#backup-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(exported)});
    await featurePage.getByRole('button',{name:'Annuleren',exact:true}).last().click();
    assert.equal(await featurePage.locator('.card').count(),6);
    for(const invalid of [
      {...backup,apps:[{id:'bad',name:'Bad',url:'javascript:alert(1)'}]},
      {...backup,apps:[backup.apps[0],backup.apps[0]]},
      {...backup,apps:[{id:'bad',name:'Bad',url:'',image:'data:image/svg+xml;base64,PHN2Zz4='}]}
    ]) {
      await featurePage.locator('#backup-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});
      await featurePage.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Herstellen lukt niet'));
      assert.match(await featurePage.locator('#status').textContent(),/Herstellen lukt niet/);
      assert.equal(await featurePage.locator('.card').count(),6);
    }
    // Restore exactly the exported favorites, custom icons, context and ordering.
    await featurePage.getByRole('button',{name:'GitHub favoriet',exact:true}).click();
    await featurePage.locator('#backup-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(exported)});
    await featurePage.getByRole('button',{name:'Herstellen',exact:true}).click();
    assert.equal((await names())[0],'GitHub');
    await featurePage.reload();
    assert.equal((await names())[0],'GitHub');
    assert.equal(await featurePage.locator('.card').first().locator('img').count(),1);
    await featurePage.getByRole('button',{name:'Controleer op updates',exact:true}).click();
    await featurePage.waitForFunction(()=>!document.getElementById('check-update').disabled);
    assert.match(await featurePage.locator('#update-status').textContent(),/Geen nieuwe versie/);
    await featureContext.setOffline(true);
    await featurePage.getByRole('button',{name:'Controleer op updates',exact:true}).click();
    assert.match(await featurePage.locator('#update-status').textContent(),/Verbind met internet/);
    await featureContext.setOffline(false);
    for (const width of [320,390,768,1280]) {
      await featurePage.setViewportSize({width,height:900});
      assert(await featurePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`feature overflow at ${width}`);
    }
    await featurePage.setViewportSize({width:390,height:2400});
    await featurePage.getByRole('button',{name:'Volgorde wijzigen',exact:true}).click();
    const touchHandle = await featurePage.getByRole('button',{name:'AK MASTER verslepen',exact:true}).boundingBox();
    const touchTarget = await featurePage.locator('.card').filter({has:featurePage.getByRole('heading',{name:'D&P beoordelen',exact:true})}).boundingBox();
    const cdp = await featureContext.newCDPSession(featurePage);
    const startTouch = {x:touchHandle.x+touchHandle.width/2,y:touchHandle.y+touchHandle.height/2};
    const endTouch = {x:touchTarget.x+touchTarget.width/2,y:touchTarget.y+touchTarget.height*.7};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[startTouch]});
    for (let step=1;step<=8;step++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:startTouch.x+(endTouch.x-startTouch.x)*step/8,y:startTouch.y+(endTouch.y-startTouch.y)*step/8}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.deepEqual(await names(),['GitHub','D&P beoordelen','AK MASTER','ChatGPT','Expeditie IJsland','VABOK-project']);
    await cdp.detach();
    await featurePage.getByRole('button',{name:'Volgorde klaar',exact:true}).click();
    await featurePage.setViewportSize({width:390,height:844});
    await featurePage.screenshot({path:'/tmp/jimmy-apphub-features.png',fullPage:true});
    assert.deepEqual(featureErrors,[]);
    await featureContext.close();
    console.log('PASS: favorites, persistent order, pointer dragging, arrow controls, custom icons/images, context and ChatGPT handoff, backup/export/restore/cancel, unsafe imports, update check, mobile layouts.');
    // An already active old worker must upgrade without closing every tab.
    legacyDeployment = true;
    const upgradeContext = await browser.newContext();
    const upgradePage = await upgradeContext.newPage();
    await upgradePage.goto(url);
    await upgradePage.evaluate(()=>navigator.serviceWorker.ready);
    await upgradePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
    assert.equal(await upgradePage.evaluate(()=>window.__legacyApp),true);
    await upgradePage.reload(); // Simulate reopening an already installed app.
    legacyDeployment = false;
    await upgradePage.evaluate(async()=>{
      window.__workerChanged = false;
      navigator.serviceWorker.addEventListener('controllerchange',()=>{window.__workerChanged=true;},{once:true});
      await (await navigator.serviceWorker.getRegistration()).update();
    });
    await upgradePage.waitForFunction(()=>window.__workerChanged);
    await upgradePage.getByRole('button',{name:'Vernieuwen',exact:true}).click();
    assert.equal(await upgradePage.evaluate(()=>window.__legacyApp),undefined);
    assert.equal(await upgradePage.getByRole('link',{name:'AK MASTER openen',exact:true}).getAttribute('href'),'https://jimmyvandenboom.github.io/AK-MASTER-app-/');
    await upgradeContext.setOffline(true);
    await upgradePage.reload();
    assert.equal(await upgradePage.evaluate(()=>window.__legacyApp),undefined);
    assert.equal(await upgradePage.getByRole('link',{name:'Expeditie IJsland openen',exact:true}).count(),1);
    console.log('PASS: active legacy worker upgrades, refresh button loads new app, updated offline cache retains both app links.');
    await upgradeContext.close();
  } finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
