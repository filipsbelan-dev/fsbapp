# FSB · Tvoj osobný priestor

Čierno-zlatá webová appka v slovenčine pre GitHub Pages a plochu iPhonu. Bez závislostí, plateného servera alebo zostavovania.

## Nahraj na GitHub

1. Rozbaľ `FSB-app.zip`.
2. Vytvor repozitár, napríklad `fsb`. Pre jednoduché bezplatné Pages môžeš použiť verejný repozitár: verejný je kód, nie lokálne záznamy.
3. Nahraj **obsah priečinka `fsb-app`** do koreňa repozitára. `index.html` musí byť priamo v koreni. Nahraj aj priečinok `icons`, JS/CSS a manifest. ZIP samotný nenahrávaj ako web.
4. Otvor **Settings → Pages → Deploy from a branch → main → / (root)** a ulož.
5. Po publikovaní otvor adresu uvedenú v Pages, spravidla `https://TVOJE-MENO.github.io/fsb/`.
6. Na iPhone otvor adresu v Safari → **Zdieľať → Pridať na plochu**, názov FSB.
7. Otvor appku z ikony a až tam začni zadávať údaje. Vytvor vlastný 6-ciferný PIN; predvolený PIN neexistuje.

Názvy položiek GitHubu sa môžu líšiť. Projekt ešte nie je publikovaný; nasadenie robíš ty.

## Hotové funkcie

- Domov s dnešnými plánmi, úlohami, výdavkami a termínmi auta.
- Mesačný kalendár s farebnými názvami udalostí v políčkach, časmi, detailom dňa a rozšíreným pohľadom.
- Poznámky s pripnutím a priečinkom; úlohy s prioritou/termínom; nákupné položky s množstvom a názvom zoznamu.
- Vernostné karty s číslom a fotkou karty alebo kódu (bez generovania/skenovania kódu).
- Financie: príjmy, výdavky, pravidelné mesačné platby, úhrady a zostatok.
- Viac áut, EČV, VIN, kilometre, PZP, havarijné poistenie, STK/EK, diaľničná známka, plán servisu podľa dátumu/km.
- Servisná história s cenou, kilometrami a prílohou. Ceny sa automaticky započítajú do financií.
- Samostatný šifrovaný trezor na heslá, doklady a dokumenty/fotky. Doklad má prednú/zadnú prílohu a platnosť.
- Pridávanie, úpravy, mazanie, vyhľadávanie v sekciách, export/obnova, zmena PIN-u a automatický zámok.
- Ikony FSB pre iPhone a offline otvorenie po úspešnom načítaní appky do cache.

## Financie a zostatok

Pridaj príjem do vybraného mesiaca. Pre úver, paušál, nájom či predplatné nastav sumu, deň splatnosti, prvý a voliteľne posledný mesiac. Platby sa opakujú mesačne.

- **Už minuté** = bežné výdavky + servis auta + označené úhrady pravidelných platieb.
- **Teraz zostáva** = príjem − už minuté.
- **Ešte zaplatiť** = aktívne pravidelné platby bez zaznamenanej úhrady.
- **Zostáva po všetkých plánovaných platbách** = príjem − už minuté − ešte zaplatiť.

Príklad: príjem 1 500 €, výdavky 200 €, servis 100 €, nezaplatený úver 300 € → teraz zostáva 1 200 €, po úvere 900 €. Po označení úveru ako zaplateného zostane plánovaný zostatok 900 €.

„Zaplatiť“ len zaznamená úhradu, neposiela peniaze. Na zrušenie úhrady otvor „Zaplatené“ a vymaž záznam úhrady. Nezapisuj tú istú platbu aj ako bežný výdavok. Historická úhrada si zachová sumu aj po úprave šablóny.

Príjmy zadávaš každý mesiac. Zostatok sa neprenáša automaticky; môžeš pridať príjem „Prenos z minulého mesiaca“. Zostatok úveru je voliteľný ručne aktualizovaný údaj, nie výpočet istiny/úrokov. Pri zmene pravidelnej sumy ukonči pôvodnú šablónu a vytvor novú: úprava starej šablóny ovplyvní aj plán minulých mesiacov. Výpočet nie je bankový zostatok.

## Bezpečnosť a dáta

Toto je funkčná prvá verzia, **nie bezpečnostne auditovaný správca hesiel**. Pred vložením skutočných citlivých údajov treba nezávislé bezpečnostné posúdenie a overenie obnovy záloh na iPhone.

- Údaje sú iba v IndexedDB daného prehliadača, zašifrované AES-256-GCM. Každý zápis má nový náhodný 12-bajtový IV.
- Odvodenie kľúča: PBKDF2-SHA-256, 600 000 iterácií, náhodná 16-bajtová soľ. Šesťciferný PIN má iba milión kombinácií a slabú ochranu proti offline útoku na skopírované dáta.
- Heslá, doklady a dokumenty majú ďalšiu vrstvu šifrovania so samostatným heslom s aspoň 12 znakmi. Použi dlhú jedinečnú frázu. Tieto tri sekcie zdieľajú jeden trezor.
- Poznámky, financie, karty, auto aj servisné prílohy chráni iba PIN. Citlivé skeny patria do trezoru.
- PIN ani heslo nie sú uložené v otvorenom tvare. Odomknuté dáta a kľúče sú v pamäti; JavaScript nezaručuje fyzické vymazanie všetkých pamäťových kópií.
- Appka sa zamkne pri prepnutí do pozadia alebo po 5 minútach nečinnosti. Neuložené formuláre sa stratia. Môže sa to prejaviť aj pri systémovom výbere súboru.
- Nie je reset zabudnutého PIN-u/hesla, cloud, synchronizácia ani vzdialené vymazanie. Záloha potrebuje pôvodný PIN a na trezor aj jeho heslo.
- Pravidelne exportuj zálohu v Nastaveniach. Vymazanie dát Safari, odstránenie appky alebo zmena adresy môže zneprístupniť údaje. Používaj jedno prostredie (najlepšie ikonu na ploche); Safari a samostatná appka môžu ukladať dáta odlišne.
- Limit prílohy 8 MB; celkové dáta približne 60 MB vrátane base64 reprezentácie. Nie je to archív celej fotogalérie.
- Formáty: JPG, PNG, WebP, HEIC/HEIF a PDF. Náhľad pre JPG/PNG/WebP, ostatné cez stiahnutie.
- Bez analytiky, cudzích knižníc a odosielania osobných dát. Zabezpeč GitHub účet: škodlivá zmena kódu na tej istej adrese môže čítať odomknuté dáta.
- **Zálohy, doklady a skutočné osobné údaje nikdy nenahrávaj do repozitára.**

## Face ID / prístupový kľúč (verzia 1.1)

V Nastaveniach zvoľ **Nastaviť Face ID**. Vytvor systémový prístupový kľúč FSB, zadaj aktuálny PIN a potom potvrď aktiváciu. Na zamknutej obrazovke pribudne tlačidlo **Odomknúť cez Face ID**. iOS rozhoduje, či použije tvár alebo kód zariadenia; web nevynúti iba biometrické overenie.

Podmienkou je HTTPS, platformový prístupový kľúč a podpora rozšírenia WebAuthn PRF v prehliadači aj správcovi kľúčov. Bez tejto podpory sa nastavenie odmietne a ostáva PIN. Funkčnosť na konkrétnom iPhone treba vyskúšať; fyzický iPhone nebol v testovacom prostredí dostupný.

PRF vytvorí tajný materiál pre AES-GCM, ktorým sa zašifruje PIN. Úspešné systémové okno samo o sebe nestačí: appka potrebuje získať rovnaký PRF výsledok, dešifrovať PIN a ním dešifrovať údaje. Overuje aj identifikátor kľúča, challenge, origin, RP hash a príznak overenia používateľa. Nejde o serverové prihlásenie ani auditovanú autentifikačnú službu.

V databáze sa uchová iba zašifrovaný PIN a metadáta, nie otvorený PIN ani PRF kľúč. Väzba zahŕňa adresu appky a soľ jej šifrovania. Trezor sa týmto neodomyká. Zmena PIN-u alebo obnova zálohy Face ID v appke vypne; treba ho nastaviť znova. Vypnutie v appke odstráni lokálnu väzbu, nie systémový passkey — ten možno odstrániť v Heslách na iPhone. Pri neúspešnom nastavení môže ostať nepoužívaný passkey, ktorý tiež možno zmazať v systémových Heslách. Zálohy neobsahujú nastavenie Face ID. Poskytovateľ passkey ho môže synchronizovať podľa svojich nastavení, ale appka nesynchronizuje osobné dáta.

Pri systémovom potvrdení je appka zamknutá; neobchádza sa automatický zámok. Používaj dôveryhodný správca prístupových kľúčov a ponechaj si PIN ako záložný spôsob.

Dokumentácia API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/WebAuthn_extensions#prf

## Zatiaľ nezapojené

Synchronizácia, automatické zálohy, push upozornenia pri zatvorenej appke, Apple kalendár, skenovanie, univerzálne vyhľadávanie a svetlý režim. Termíny auta sa zobrazujú v appke; automatické pripomienky dokladov ešte nie. Fotky dokladov nie sú oficiálne digitálne doklady. Pravidelné platby podporujú mesačnú frekvenciu.

## Úpravy a kontrola

Hlavné súbory: `index.html`, `style.css`, `app.js`, `core.js`, `sw.js`, `passkey.js`, `manifest.webmanifest`, `icons/`. Relatívne cesty fungujú aj v podpriečinku GitHub Pages.

Lokálne: `python3 -m http.server 8080`, potom `http://localhost:8080`. Nepoužívaj otvorenie cez `file://`: kryptografia a service worker potrebujú HTTPS alebo localhost.

Testy: moderný Node.js s Web Crypto (napr. Node 22+), potom `npm test`. Netreba inštalovať balíky.

Prešlo 8 automatických testov (vrátane simulovaných PRF odpovedí, odmietnutia nesprávneho kľúča, zrušenia, chýbajúcej podpory a poškodeného ciphertextu): kryptografický round-trip, nesprávny PIN, poškodené dáta, oddelený trezor, prestupný rok a hranice kalendára, validácia zálohy, finančné výpočty bez dvojitého účtovania, generované obrazovky a escapovanie textu. Jeden test môže obsahovať viac scenárov.

**Vizuálna kontrola v prehliadači a test na fyzickom iPhone neboli vykonané:** služba náhľadu bola nedostupná. Testy obrazoviek kontrolujú generované HTML, nie rozloženie či dotykové interakcie. Po nahratí over PIN, formuláre, trezor, prílohy, platby, export/obnovu, zamknutie pri prepnutí a offline otvorenie.

Pri aktualizácii zvýš verziu cache v `sw.js` (napr. `fsb-shell-v2`) a nahraj všetky súbory spolu. Nemeň názov databázy ani kryptografický formát bez migrácie. Pred aktualizáciou zálohuj.
