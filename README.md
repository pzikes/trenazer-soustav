# Trenažér číselných soustav 2.1

Jednoduchá vzdělávací webová aplikace pro procvičování převodů mezi desítkovou a dvojkovou soustavou. Je určena zejména žákům základních škol a je vytvořena pomocí HTML, CSS a JavaScriptu bez frameworku a dalších závislostí. Toto je aktualizovaný popis.

## Spuštění

Aplikace používá JavaScriptové moduly, proto ji spusť přes místní webový server, ne otevřením souboru `index.html` přímo z disku.

Například v kořenové složce projektu spusť:

```powershell
python -m http.server 8000
```

Poté otevři v prohlížeči adresu [http://localhost:8000](http://localhost:8000). Server ukončíš klávesami `Ctrl+C`.

Alternativně můžeš ve Visual Studio Code použít rozšíření Live Server a otevřít přes něj soubor `index.html`.

## Jak aplikace funguje

1. Vyber obtížnost, počet otázek (5, 10 nebo 20), časový limit a zastoupení směrů převodu.
2. Zvol **Vygenerovat test**. Test vždy obsahuje úlohy v obou směrech převodu; jejich zastoupení může být rovnoměrné nebo s přibližně 60% převahou jednoho směru. Stejná číselná hodnota se může objevit jednou v každém směru, ale totožná úloha se neopakuje.
3. Před spuštěním můžeš vytisknout samotné zadání nebo samostatný list řešení s postupy.
4. Zvol **Spustit test**. Při nastaveném limitu se po jeho vypršení test automaticky ukončí a nezodpovězené otázky se započítají jako chybné.
5. U každé úlohy zadej odpověď v cílové soustavě a zvol **Zkontrolovat**.
6. Aplikace ověří povolené znaky, zobrazí výsledek, správnou odpověď a postup řešení. Správnou hodnotu uzná i tehdy, když je zapsaná s úvodními nulami.
7. Po vyhodnocení přejdi na další otázku. Odpověď jedné otázky se vyhodnocuje pouze jednou.
8. V průběhu testu se zobrazuje skóre. Po poslední otázce aplikace zobrazí celkový počet správných odpovědí, procentuální úspěšnost a seznam chybných nebo nezodpovězených úloh.

Během probíhajícího testu nelze vygenerovat nový ani změnit jeho nastavení. Po dokončení může učitel připravit další test.

Dokončené testy se ukládají do místního úložiště prohlížeče. Historie zobrazuje posledních deset výsledků také ve sloupcovém grafu úspěšnosti, seřazených od nejstaršího po nejnovější test. Historii lze smazat tlačítkem **Smazat historii** po potvrzení. Historie je vázaná na konkrétní prohlížeč a zařízení. Pokud je úložiště nedostupné nebo jsou uložená data poškozená, aplikace zobrazí upozornění a průběh testu zůstane funkční.

### Obtížnosti a směry převodu

- **Lehká:** čísla od 0 do 15
- **Střední:** čísla od 0 do 255
- **Těžká:** čísla od 0 do 1023
- **DEC → BIN:** převod z desítkové do dvojkové soustavy
- **BIN → DEC:** převod z dvojkové do desítkové soustavy
- Každý test obsahuje oba směry převodu; učitel volí rovnoměrné zastoupení nebo přibližně 60% převahu jednoho z nich.

### Ovládání klávesnicí

- V poli odpovědi stiskni `Enter` pro kontrolu.
- Po vyhodnocení stiskni `Enter` na tlačítku **Další úloha** pro pokračování.

## Testy

Testy používají vestavěný testovací nástroj Node.js (`node:test`) a nevyžadují instalaci dalších balíčků. Potřebuješ Node.js 18 nebo novější. V kořenové složce projektu spusť v prostředí PowerShell na Windows:

```powershell
npm.cmd test
```

V ostatních shellech použij `npm test`.

Testy ověřují generování úloh v rozsahu a se správným zastoupením převodů, validaci odpovědí, vysvětlení obou typů převodu i ukládání a mazání historie včetně chyb úložiště. Vysvětlení BIN → DEC řadí mocniny od nejvyššího řádu a ukazuje také součet hodnot jednotlivých členů.

## Soubory

- `index.html` — struktura stránky a ovládací prvky.
- `styles.css` — vzhled aplikace a přizpůsobení menším obrazovkám.
- `app.js` — práce s rozhraním, průchod testem, skóre a výsledky.
- `questions.js` — generování úloh, formát zadání, kontrola odpovědí a vysvětlení převodů.
- `storage.js` — načítání, ukládání a mazání historie výsledků v `localStorage`.
- `tests/questions.test.js` — automatizované testy funkcí pro generování, kontrolu a vysvětlení úloh.
- `tests/storage.test.js` — automatizované testy historie a ošetření chyb úložiště.
- `package.json` — nastavení ES modulů pro Node.js a příkaz `npm test`; aplikace nemá žádné externí závislosti.
