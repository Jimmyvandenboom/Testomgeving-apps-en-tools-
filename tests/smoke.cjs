// Run with: node tests/smoke.cjs (requires Playwright and Chromium).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml' };
(async () => {
  const server = http.createServer(async (req,res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const relative = pathname.replace(/^\/hub\//,'');
      const filename = path.resolve(root,relative || 'index.html');
      if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      const contents = await fs.readFile(filename);
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
    assert.equal(await page.locator('.card').count(),5);
    assert.equal(await page.locator('.card').filter({hasText:'ChatGPT'}).locator('a').getAttribute('href'),'https://chatgpt.com/');
    assert.equal(await page.getByRole('link',{name:'GitHub openen',exact:true}).getAttribute('href'),'https://github.com/');
    assert.equal(await page.getByRole('button',{name:'Link instellen',exact:true}).count(),1);
    assert.equal(await page.getByRole('link',{name:'AK MASTER openen',exact:true}).getAttribute('href'),'https://jimmyvandenboom.github.io/AK-MASTER-app-/');
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
    assert.equal(await page.locator('.card').count(),5);
    await page.locator('#app-url').fill('');
    await page.getByRole('button',{name:'Opslaan',exact:true}).click();
    assert.equal(await page.locator('.card').count(),6);
    assert.equal(await page.locator('.card img').count(),0);
    const added = page.locator('.card').last();
    await added.getByRole('button',{name:/verwijderen/}).click();
    await page.getByRole('button',{name:'Annuleren',exact:true}).last().click();
    assert.equal(await page.locator('.card').count(),6);
    await added.getByRole('button',{name:/verwijderen/}).click();
    await page.getByRole('button',{name:'Verwijderen',exact:true}).click();
    assert.equal(await page.locator('.card').count(),5);
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
    assert.equal(await page.locator('.card').count(),5);
    await page.getByRole('button',{name:'App toevoegen'}).click();
    await page.locator('#app-name').fill('Offline app');
    await page.getByRole('button',{name:'Opslaan',exact:true}).click();
    await page.reload();
    assert.equal(await page.locator('.card').count(),6);
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
    await page.evaluate(()=>localStorage.setItem('jimmy-apphub-v1','broken json'));
    await page.reload();
    assert.equal(await page.locator('.card').count(),5);
    assert.match(await page.locator('#status').textContent(),/niet worden geladen/);
    await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Denied','SecurityError')};});
    await page.getByRole('button',{name:'App toevoegen'}).click();
    await page.locator('#app-name').fill('Cannot save');
    await page.getByRole('button',{name:'Opslaan',exact:true}).click();
    assert.equal(await page.locator('.card').count(),5);
    assert.match(await page.locator('#form-error').textContent(),/niet worden opgeslagen/);
    await page.getByRole('button',{name:'Annuleren',exact:true}).first().click();
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'/tmp/jimmy-apphub-mobile.png',fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('PASS: default apps, working link targets, edit/add/remove/cancel, persistence, empty links, unsafe URL rejection, safe text, responsive layouts, touch targets, manifest/icons, subpath hosting, offline reload/edit, corrupt/blocked storage, no browser errors.');
    await context.close();
  } finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
