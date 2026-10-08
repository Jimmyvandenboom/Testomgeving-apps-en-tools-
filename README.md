# Mijn apps · Jimmy

Een mobiele persoonlijke apphub zonder framework, analytics of installatie van dependencies. De standaardtegels zijn Expeditie IJsland, AK MASTER, D&P beoordelen, ChatGPT, GitHub en VABOK-project. IJsland en AK MASTER hebben hun links; D&P blijft leeg tot zijn link bekend is.

Apphub: https://jimmyvandenboom.github.io/Testomgeving-apps-en-tools-/

## Gebruik — versie 1.4.1

De startpagina toont de persoonlijke foto uit `jimmy.png`; deze is ook offline beschikbaar. De interface heeft een donkerblauwe kop, witte tegels en blauwe actieknoppen. De tien icoontjes staan als aanraakbare knoppen in het venster App wijzigen; je ziet meteen welke gekozen is.

- **Openen** opent de gekoppelde app. **Link instellen / Link wijzigen** past naam, link en icoon aan. Een lege link is toegestaan. Schooltools, lesmateriaal en roosters kun je zelf toevoegen via **App toevoegen**.
- De **ster** maakt een app favoriet; favorieten staan altijd bovenaan. De **×** verwijdert een tegel na bevestiging.
- **Volgorde wijzigen** toont sleephandgrepen en grote pijlknoppen. Sleep de handgreep met je vinger of muis, of gebruik de pijlen. Je verplaatst tegels binnen de favorieten of de overige apps; zet de ster aan/uit om van groep te veranderen. Scroll buiten de handgrepen door de pagina.
- IJsland, AK MASTER, D&P, ChatGPT en GitHub hebben herkenbare, lokaal getekende symbolen. Kies bij het wijzigen uit tien zichtbare symbolen (bergen, wereld, beoordelen, chat, code, lesmateriaal, rooster, gereedschap, raket en hart) of upload een eigen PNG/JPG/WebP van maximaal 2 MB. De afbeelding wordt lokaal bijgesneden en verkleind tot 128 × 128 pixels. Er worden geen afbeeldingen naar een server gestuurd.
- **Back-up downloaden** maakt een JSON-bestand met je apps, volgorde, favorieten, iconen en bewaarde werkcontext. **Back-up herstellen** leest het bestand en vraagt bevestiging voordat het je huidige tegels vervangt. Ongeldige back-ups en onveilige links worden geweigerd. Download eventueel eerst een back-up van je huidige gegevens.
- Onder aan de pagina staan het versienummer en **Controleer op updates**. Bij een nieuwe versie verandert de knop in **Vernieuwen**. Een open formulier wordt niet automatisch herladen. Updates vereisen internet en een afgeronde hostingdeployment.
- Je gegevens blijven in `localStorage` van deze browser/installatie en dit webadres. Ze synchroniseren niet vanzelf tussen telefoons. Gebruik een back-up voor overzetten. Het wissen van websitegegevens wist je wijzigingen; een andere browser of domeinnaam heeft zijn eigen gegevens.
- De apphub werkt na een eerste online bezoek offline. Externe apps en ChatGPT hebben hun eigen internetverbinding en toegangsregels. Gebruik geen wachtwoorden of geheime tokens in app-links.

## Werkassistent

**Werkassistent** opent een venster waarin je informatie over je werk en een vraag kunt invullen. **Werkcontext bewaren** slaat die context lokaal op en neemt hem mee in back-ups.

**Bespreek in ChatGPT** opent ChatGPT met je vraag, de ingevulde context en de namen van maximaal 30 apps. Je voert het AI-gesprek vervolgens in ChatGPT; de hub bevat geen eigen AI-model of backend. De assistent kent alleen wat je zelf meegeeft en heeft geen automatische toegang tot eerdere gesprekken, schooldocumenten of accounts. ChatGPT kan om inloggen vragen.

De overdracht gebruikt de `q`-parameter in een ChatGPT-link. Ondersteuning daarvan kan door ChatGPT veranderen. Gebruik **Vraag kopiëren** en **ChatGPT openen** als de vraag niet automatisch verschijnt, of als de context te lang is voor een link. Werkcontext wordt uitsluitend naar ChatGPT gestuurd wanneer je daar zelf voor kiest; bewaren of back-ups maken verstuurt niets. De vraag/context kunnen in browsergeschiedenis en bij ChatGPT terechtkomen. Voeg geen vertrouwelijke leerlinggegevens toe. Een rechtstreeks geïntegreerde AI-chat met documentkoppelingen vereist later een beveiligde backend; zet nooit een API-sleutel in de openbare websitecode.

## Lokaal starten

Open een terminal in de bestaande checkout (geen aparte Git-worktree nodig):

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://localhost:8080` op dezelfde computer. Open HTML niet rechtstreeks als bestand: de service worker vereist localhost of HTTPS. Er is geen build- of installatiestap.

## Online bijwerken via GitHub Pages

De code wordt op verzoek naar `main` gepusht. GitHub Pages publiceert vanuit **Settings → Pages → Deploy from a branch → main → / (root)**. Wacht tot de Pages-deployment op GitHub is afgerond en open daarna het apphubadres. Gebruik **Controleer op updates** en zo nodig **Vernieuwen**. Bij een oudere installatie zonder updateknop: herlaad online, sluit de app en open opnieuw.

Het wijzigen van broncode verandert de zichtbaarheid van je repository niet. De Pages-website is openbaar toegankelijk volgens je GitHub-instellingen. Er is voor de hub geen aparte hostingdienst nodig. Op sommige GitHub-abonnementen vereist Pages een openbare repository; pas de zichtbaarheid alleen bewust zelf aan. Upload of commit geen persoonlijke back-ups of credentials.

## Installeren op je telefoon

**iPhone:** open het HTTPS-adres in Safari → Deel → Zet op beginscherm → schakel Open als webapp in als die optie verschijnt → Voeg toe.

**Android:** open het HTTPS-adres in Chrome → Installeer app in de hub, of ⋮ → App installeren / Toevoegen aan startscherm → bevestig.

Open daarna via het icoon. Een webapp-installatie kan eigen opslag hebben; controleer je instellingen of herstel je back-up. Installatieopties hangen af van OS/browser-versie. Open de link in Safari of Chrome in plaats van een ingebouwde browser van bijvoorbeeld WhatsApp.

## Controleren

De bestaande cloudomgeving heeft Playwright en Chromium:

```sh
node tests/smoke.cjs
```

Op een andere ontwikkelmachine kun je Playwright buiten de repository installeren, `NODE_PATH` daarop instellen en `CHROMIUM_PATH` naar Chromium laten wijzen. De website heeft deze testtools niet nodig. De test start en stopt zijn eigen server en browser en gebruikt geïsoleerde browserprofielen.

De browsercontrole test appbeheer, linkmigraties voor bestaande gebruikers, veilige links/tekst, opslag, favorieten, volgorde met pijlen/muis/touch, eigen symbolen en geüploade afbeeldingen, back-up/download/herstellen/annuleren en onveilige bestanden, werkcontext en ChatGPT-overdracht, updates en een oude service worker, offlinegebruik, manifest/PNG-iconen, subpadhosting en schermbreedtes 320/390/768/1280. De ChatGPT-bestemming wordt in de test nagebootst; die controle bewijst de overdracht van de vraag, niet de werking van het externe AI-model of inloggen. Werkelijke Safari/iPhone- en Android-installatie moet op de apparaten gecontroleerd worden.

## Ontwikkelen

Verhoog bij nieuwe releases `VERSION` in `app.js` en de `CACHE`-versie in `sw.js`. De worker haalt de appbestanden opnieuw op, wordt direct actief na een succesvolle installatie en bewaart ze voor offlinegebruik. Bestaande appinstellingen blijven behouden zolang domein en opslagkey gelijk blijven. De cache bevat alleen de apphub, geen externe apps. Eigen iconen, favorieten en volgorde worden in de bestaande appopslag opgenomen, zodat oudere gebruikers hun links behouden.
