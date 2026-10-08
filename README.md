# Mijn apps · Jimmy

Een mobiele persoonlijke apphub, zonder framework, accounts, analytics of externe dependencies. De standaardtegels zijn Expeditie IJsland, AK MASTER, D&P beoordelen, ChatGPT en GitHub. De eerste drie hebben bewust geen link.

## Gebruik

- Tik op **Link instellen** of **Link wijzigen** om een link en eventueel de naam te wijzigen. Gebruik een volledige `https://`-link; leeg laten mag.
- **App toevoegen** maakt een nieuwe tegel. De **×** op een tegel verwijdert deze na bevestiging.
- Wijzigingen staan alleen in `localStorage` van deze browser/installatie en dit webadres. Ze synchroniseren niet tussen telefoons. Het wissen van websitegegevens verwijdert je wijzigingen. Een andere domeinnaam of browser heeft een eigen verzameling.
- Gebruik geen geheime tokens of wachtwoorden in app-links.
- De apphub werkt na een eerste online bezoek offline. De gekoppelde externe apps hebben hun eigen internetverbinding en toegangsregels.

## Lokaal starten

Open een terminal in deze repository:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://localhost:8080` op dezelfde computer. Open de HTML niet rechtstreeks als bestand: voor de service worker is localhost of HTTPS nodig. Er is geen build- of installatiestap. Gebruik de bestaande checkout; een aparte Git-worktree is niet nodig.

## Online zetten zonder je repository openbaar te maken

Er is door Codex niets gepusht, gedeployd of openbaar gemaakt. Je GitHub-repository kan privé blijven. **Een privérepository maakt een gehoste website niet automatisch privé.** Cloudflare Pages-websites zijn standaard toegankelijk voor iedereen die het adres kent. Kies zelf of dat gewenst is; configureer Cloudflare Access als alleen jij toegang mag hebben. Er worden geen gegevens uit localStorage naar de hosting gestuurd.

### 1. Zet deze commit in je privérepository

De code is lokaal gecommit op de huidige werkbranch. Controleer in GitHub dat de repository nog **Private** is. Push de commit via je gebruikelijke GitHub/Codex-workflow naar een branch en merge deze eventueel naar `main`. Maak de repository niet openbaar. Er is door deze taak geen push uitgevoerd.

### 2. Download de websitebestanden

Ga in GitHub naar de branch met de nieuwe commit, klik **Code → Download ZIP**, en pak de ZIP uit. Maak op je computer een map `jimmy-apphub` met uitsluitend:

```text
index.html
style.css
app.js
sw.js
manifest.webmanifest
icons/
  icon.svg
  icon-192.png
  icon-512.png
  icon-maskable-512.png
  apple-touch-icon.png
```

`index.html` moet direct in die map staan. Upload geen `.git`, credentials of persoonlijke bestanden. De hostingprovider hoeft geen toegang tot je privérepository te krijgen.

### 3. Kies toegang en upload via Cloudflare Pages

1. Log in bij Cloudflare en ga naar **Workers & Pages**.
2. Kies het aanmaken van een **Pages**-project en de optie **Direct Upload / Upload assets** (de exacte menutekst kan veranderen).
3. Kies een projectnaam, bijvoorbeeld `jimmy-apphub`. Cloudflare bepaalt het definitieve `*.pages.dev`-adres; de naam moet beschikbaar zijn.
4. Wil je een afgeschermde website? Configureer vóór de eerste productie-upload Cloudflare **Zero Trust → Access → Applications → Add application → Self-hosted** voor het definitieve productieadres. Voeg een **Allow**-beleid toe voor uitsluitend jouw e-mailadres en stel e-mailcodes als inlogmethode in. Bescherm ook eventuele previewadressen of gebruik die niet. De ingebouwde Pages-optie voor previewbeveiliging alleen beschermt het productieadres niet. Controleer de actuele Cloudflare-instructies voor productiebeveiliging van jouw Pages-domein; gebruik eventueel een eigen domein met Access. Publiceer pas wanneer het juiste adres beschermd is.
5. Upload de inhoud van `jimmy-apphub` via de uploadfunctie en bevestig de deployment. Er is geen build nodig.
6. Open het gegeven **HTTPS-adres**. Bij Access moet je eerst kunnen inloggen. Controleer in een privévenster dat onbevoegde bezoekers de app niet te zien krijgen wanneer je bescherming hebt ingesteld.
7. Controleer de vijf tegels, pas een link aan en herlaad de pagina om de opslag te controleren.

Dit is een handmatige publicatiestap door jou. Bij openbare hosting zijn de websitebestanden zichtbaar, maar je GitHub-repository blijft privé. Publiceer daarom alleen de genoemde bestanden. Met toegangsbeveiliging kan eerder geladen inhoud nog lokaal/offline beschikbaar blijven op een toegelaten apparaat; uitloggen wist die lokale cache niet automatisch.

### 4. Open en installeer op iPhone

1. Open het HTTPS-adres in **Safari**; log zo nodig in.
2. Tik op **Deel** (vierkant met pijl omhoog; eventueel in het menu).
3. Kies **Zet op beginscherm** en schakel **Open als webapp** in als die optie verschijnt.
4. Tik op **Voeg toe**. Het icoon heet **Mijn apps**.
5. Open via het icoon en stel je app-links in. Een nieuwe webapp-installatie kan een eigen opslag hebben: controleer je links in de geïnstalleerde app.

### 5. Open en installeer op Android

1. Open hetzelfde HTTPS-adres in **Chrome**; log zo nodig in.
2. Tik op **Installeer app** in de apphub als die knop verschijnt, of gebruik **⋮ → App installeren / Toevoegen aan startscherm**.
3. Bevestig en open **Mijn apps** via het nieuwe icoon.
4. Stel links in en controleer dat ze na opnieuw openen behouden blijven.

De installatieopties hangen af van OS/browser-versie en toegangsbeveiliging. Als een beveiligde site niet als volledige PWA aangeboden wordt, gebruik de beginschermsnelkoppeling. In-app browsers van bijvoorbeeld WhatsApp ondersteunen installatie vaak niet: open het adres in Safari of Chrome.

## Controleren

`tests/smoke.cjs` gebruikt Playwright en Chromium. Die zijn in de huidige cloudomgeving beschikbaar:

```sh
node tests/smoke.cjs
```

Op een andere ontwikkelmachine kun je Playwright buiten de repository installeren en `NODE_PATH` daarop instellen, en met `CHROMIUM_PATH` het Chromium-pad kiezen. De app zelf heeft deze testtools niet nodig. De test start en stopt een eigen lokale server en browser en gebruikt een geïsoleerd browserprofiel.

Getest: standaardtegels en linkdoelen, toevoegen/wijzigen/verwijderen en annuleren, opslag na herladen, lege links, onveilige URL's, tekstinjectie, schermbreedtes 320/390/768/1280, aanraakknoppen, manifest/PNG-iconen, hosting onder een subpad, offline herladen en bewerken, kapotte/geblokkeerde opslag en browserfouten. Werkelijke installatie op iPhone/Android moet op de apparaten worden gecontroleerd; de cloudtest draait in Chromium en bewijst geen Safari-compatibiliteit op een echte iPhone.

## Nieuwe versies

Upload bij een nieuwe versie dezelfde bestanden naar hetzelfde Pages-project. Verhoog bij wijzigingen aan offlinebestanden ook de `CACHE`-versie in `sw.js`. De service worker blijft tijdens gebruik van een oude versie wachten; sluit alle tabbladen en de geïnstalleerde app en open opnieuw met internet om de nieuwe versie te activeren. Lokaal opgeslagen app-links blijven behouden zolang het webadres en de opslagkey gelijk blijven. De offlinecache bevat alleen de apphubbestanden, geen gekoppelde apps.
